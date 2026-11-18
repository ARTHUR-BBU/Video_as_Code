/**
 * Video-as-Code Studio - Track 4: Physical Sound & Earshot Cues Track (物理音效轨)
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2 Module 2 & Earshot 0.4
 *
 * 绑定底层数据: MotionIR.tracks.audioCues[]
 * 功能规范:
 * 1. 结构化呈现 Earshot 252 资产标识 (如 ancient_bell_strike, bronze_resonance);
 * 2. 标出 offsetMs 心理声学时滞偏置 (-60ms ~ +42ms, 依据 ITU-R BS.1770-4);
 * 3. 展示 Stop-Down 瞬态避让槽与背景声避让基线分贝 (bedDb);
 * 4. 模拟绘制全片声谱波形背景。
 */

import React from 'react';
import { AudioCueTrackItem } from '../../../models/motion_ir';

interface AudioCuesTrackProps {
  audioCues: AudioCueTrackItem[];
  totalFrames: number;
  zoom?: number;
}

export const AudioCuesTrack: React.FC<AudioCuesTrackProps> = ({
  audioCues,
  totalFrames = 900,
  zoom: _zoom
}) => {
  return (
    <div
      data-testid="vac-audio-cues-track"
      className="relative h-8 bg-[#090b0e] border-b border-[#232733] select-none overflow-hidden flex items-center px-1 font-mono text-[9px]"
    >
      {/* Track Label */}
      <div className="absolute left-1 top-1 z-10 px-1 py-0.5 rounded bg-[#171922] text-[#8e98ac] text-[8px] font-bold tracking-wider uppercase border border-[#272d3f]">
        Track 4: Earshot Audio
      </div>

      {/* Simulated Audio Waveform Bed */}
      <div className="w-full h-full absolute inset-0 opacity-20 pointer-events-none flex items-center px-2">
        <div className="w-full h-2 bg-gradient-to-r from-emerald-600/30 via-emerald-400/40 to-emerald-600/30 rounded" />
      </div>

      {/* Render Audio Cue Trigger Points and Stop-Down Ducking Slots */}
      <div className="w-full h-5 relative mt-1 z-10">
        {audioCues.map((cue) => {
          const leftPercent = (cue.triggerFrame / totalFrames) * 100;
          const isLeadOffset = cue.offsetMs < 0;

          return (
            <div
              key={cue.id}
              className="absolute top-0 bottom-0 flex items-center"
              style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
              title={`Earshot Cue: ${cue.soundId} | Trigger: f${cue.triggerFrame} | Offset: ${cue.offsetMs}ms | Ducking: ${cue.bedDb}dB`}
            >
              {/* Stop-Down Ducking Slot Preview (Lead Micro-slot) */}
              <div className="w-3 h-full bg-amber-500/20 border-l border-r border-amber-500/40 mr-0.5" />

              {/* Cue Trigger Pin */}
              <div className="px-1.5 py-0.5 rounded bg-emerald-900/90 border border-emerald-400/70 text-emerald-200 text-[8px] font-mono flex items-center space-x-1 shadow-sm whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-bold truncate max-w-[90px]">{cue.soundId}</span>
                <span
                  className={`text-[7px] px-1 rounded ${
                    isLeadOffset ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {cue.offsetMs > 0 ? `+${cue.offsetMs}` : cue.offsetMs}ms
                </span>
                <span className="text-[7px] text-emerald-400/70">{cue.bedDb}dB</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
