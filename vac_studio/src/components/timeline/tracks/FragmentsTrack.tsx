/**
 * Video-as-Code Studio - Track 3: Fragment Chains Track (碎词排版轨)
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2 Module 2
 *
 * 绑定底层数据: MotionIR.tracks.fragments[]
 * 功能规范:
 * 1. 结构化呈现 1~4 词碎词链条 (如 "Three thousand years.");
 * 2. 标注文案字数/单词计数 (wordCount)，校验碎词流规则；
 * 3. 明确标识 30~90 帧的 Picture Beat 独立呼吸期 (无文字覆盖的纯画面呼吸窗口)；
 * 4. 标识关联分镜归属 (sceneId)。
 */

import React from 'react';
import { FragmentTrackItem } from '../../../models/motion_ir';

interface FragmentsTrackProps {
  fragments: FragmentTrackItem[];
  totalFrames: number;
  zoom?: number;
}

export const FragmentsTrack: React.FC<FragmentsTrackProps> = React.memo(({
  fragments,
  totalFrames = 900,
  zoom: _zoom
}) => {
  return (
    <div
      data-testid="vac-fragments-track"
      className="relative h-8 bg-[#0a0b0e] border-b border-[#232733] select-none overflow-hidden flex items-center px-1 font-mono text-[9px]"
    >
      {/* Track Label */}
      <div className="absolute left-1 top-1 z-10 px-1 py-0.5 rounded bg-[#171922] text-[#8e98ac] text-[8px] font-bold tracking-wider uppercase border border-[#272d3f]">
        Track 3: Fragments
      </div>

      {/* Render Fragment Blocks and Breathing Periods */}
      <div className="w-full h-5 relative mt-1">
        {fragments.map((frag, idx) => {
          const leftPercent = (frag.startFrame / totalFrames) * 100;
          const widthPercent = (frag.holdFrames / totalFrames) * 100;

          // Next fragment for breathing period calculation
          const nextFrag = fragments[idx + 1];
          const hasBreathingGap = nextFrag && nextFrag.startFrame > frag.startFrame + frag.holdFrames;
          const gapFrames = hasBreathingGap ? nextFrag.startFrame - (frag.startFrame + frag.holdFrames) : 0;
          const gapLeftPercent = ((frag.startFrame + frag.holdFrames) / totalFrames) * 100;
          const gapWidthPercent = (gapFrames / totalFrames) * 100;

          return (
            <React.Fragment key={frag.id}>
              {/* Fragment Box */}
              <div
                className="absolute top-0 bottom-0 rounded-sm bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 px-1.5 flex items-center justify-between overflow-hidden shadow-sm hover:border-indigo-400 transition-colors"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`
                }}
                title={`Fragment: "${frag.text}" | Start: f${frag.startFrame} | Hold: ${frag.holdFrames}f | Words: ${frag.wordCount}`}
              >
                <span className="truncate font-sans font-medium text-[9px] text-white">
                  "{frag.text}"
                </span>
                <span className="text-[8px] text-indigo-400/80 font-mono shrink-0 ml-1">
                  {frag.wordCount}w/{frag.holdFrames}f
                </span>
              </div>

              {/* Picture Beat Breathing Period (30~90f Gap) */}
              {hasBreathingGap && gapFrames >= 20 && (
                <div
                  className="absolute top-0 bottom-0 border-t border-b border-dashed border-cyan-800/40 bg-cyan-950/20 flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${gapLeftPercent}%`,
                    width: `${gapWidthPercent}%`
                  }}
                  title={`Picture Beat Breathing Period: ${gapFrames} frames (No Text Overlap)`}
                >
                  <span className="text-[7px] text-cyan-400/70 font-mono">
                    BREATH ({gapFrames}f)
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});
