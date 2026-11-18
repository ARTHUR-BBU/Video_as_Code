/**
 * Video-as-Code Studio - Track 1: Clock & BPM Grid Ruler (时钟标尺与 BPM 磁吸栅格轨)
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2 Module 2
 *
 * 功能规范:
 * 1. 60fps 高精度时间码标尺，随 zoom 缩放动态展开；
 * 2. 支持 100/120 BPM 节拍点磁吸栅格；
 * 3. 放大至 1 帧时（zoom >= 300%）单帧刻度清晰可辨；
 * 4. 显示绝对秒数 (07.50s) 与绝对帧号 (f450)。
 */

import React, { useMemo } from 'react';

interface ClockRulerTrackProps {
  totalFrames: number;
  fps?: number;
  bpm?: number;
  zoom?: number; // 50% - 500%
  width?: number;
}

export const ClockRulerTrack: React.FC<ClockRulerTrackProps> = ({
  totalFrames = 900,
  fps = 60,
  bpm = 120,
  zoom = 100,
  width: _width
}) => {
  // Calculate beat frame interval: (60s / bpm) * fps
  const beatIntervalFrames = useMemo(() => {
    return Math.round((60 / bpm) * fps); // 120 bpm @ 60fps -> 30 frames
  }, [bpm, fps]);

  const tickSteps = useMemo(() => {
    // Adaptive tick density based on zoom factor
    let step = 60; // default 1 second (60 frames)
    if (zoom >= 300) {
      step = 1; // 1-frame precision
    } else if (zoom >= 150) {
      step = 10; // 10-frame precision
    } else if (zoom >= 80) {
      step = 30; // 0.5s / 1 beat
    } else {
      step = 60; // 1s
    }

    const ticks: Array<{
      frame: number;
      timeS: string;
      isMajor: boolean;
      isBeat: boolean;
      label: string;
    }> = [];

    for (let f = 0; f < totalFrames; f += step) {
      const isSecond = f % fps === 0;
      const isBeat = f % beatIntervalFrames === 0;
      const isMajor = isSecond || (zoom >= 250 && f % 10 === 0) || f === 0;
      const timeS = (f / fps).toFixed(2);

      let label = '';
      if (isSecond) {
        label = `${timeS}s (f${f})`;
      } else if (zoom >= 300) {
        label = `f${f}`;
      } else if (isBeat && zoom >= 120) {
        label = `♩`;
      }

      ticks.push({
        frame: f,
        timeS,
        isMajor,
        isBeat,
        label
      });
    }

    return ticks;
  }, [totalFrames, fps, beatIntervalFrames, zoom]);

  return (
    <div
      data-testid="vac-clock-ruler-track"
      className="relative h-7 bg-[#0d0f15] border-b border-[#232733] select-none overflow-hidden font-mono text-[9px] text-slate-400"
    >
      {/* Track Label Tag */}
      <div className="absolute left-1 top-1 z-10 px-1 py-0.5 rounded bg-[#161922] text-[#8e98ac] text-[8px] font-bold tracking-wider uppercase border border-[#262c3d]">
        Track 1: Clock &amp; BPM ({bpm} BPM)
      </div>

      {/* Graduation Marks */}
      <div className="w-full h-full relative">
        {tickSteps.map((tick) => {
          const leftPercent = (tick.frame / (totalFrames - 1)) * 100;
          return (
            <div
              key={tick.frame}
              className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
              style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
            >
              {tick.label && (
                <span
                  className={`text-[8px] leading-tight select-none mt-0.5 ${
                    tick.isMajor
                      ? 'text-blue-300 font-semibold'
                      : tick.isBeat
                      ? 'text-amber-400/80 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {tick.label}
                </span>
              )}
              <div
                className={`w-px mt-auto ${
                  tick.isMajor
                    ? 'h-3 bg-blue-500/80'
                    : tick.isBeat
                    ? 'h-2.5 bg-amber-500/70'
                    : 'h-1.5 bg-slate-700/60'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
