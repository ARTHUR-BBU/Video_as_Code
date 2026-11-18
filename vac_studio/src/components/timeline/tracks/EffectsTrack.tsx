import React from 'react';

interface EffectsTrackProps {
  totalFrames: number;
}

export const EffectsTrack: React.FC<EffectsTrackProps> = ({ totalFrames }) => {
  const fxClips = [
    { id: 'fx1', start: 0, duration: 270, label: 'GLSL: Macro Dragon Grain' },
    { id: 'fx2', start: 270, duration: 360, label: 'Shader: Archaic Inscription Glow' },
    { id: 'fx3', start: 630, duration: 270, label: 'motion2code: Gold Ritual Aura' }
  ];

  return (
    <div className="relative h-7 bg-[#12141c] border-b border-[#1f232e] flex items-center px-1">
      <div className="w-20 text-[10px] font-mono text-amber-400 font-semibold px-2 flex items-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        VFX
      </div>
      <div className="relative flex-1 h-5 overflow-hidden">
        {fxClips.map((c) => {
          const leftPercent = (c.start / totalFrames) * 100;
          const widthPercent = (c.duration / totalFrames) * 100;
          return (
            <div
              key={c.id}
              className="absolute top-0 bottom-0 bg-amber-950/40 border border-amber-600/60 rounded px-1.5 flex items-center text-[10px] text-amber-200 font-mono truncate"
              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
              title={c.label}
            >
              <span className="truncate">{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
