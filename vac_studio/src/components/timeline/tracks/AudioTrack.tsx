import React from 'react';

interface AudioTrackProps {
  totalFrames: number;
}

export const AudioTrack: React.FC<AudioTrackProps> = ({ totalFrames }) => {
  const audioClips = [
    { id: 'a1', start: 0, duration: 900, label: 'Earshot BGM: Ancient Bells (-14 LUFS)' },
    { id: 'a2', start: 135, duration: 80, label: 'SFX: Bronze Strike' },
    { id: 'a3', start: 450, duration: 90, label: 'SFX: Resonant Bell Sub' }
  ];

  return (
    <div className="relative h-7 bg-[#12141c] border-b border-[#1f232e] flex items-center px-1">
      <div className="w-20 text-[10px] font-mono text-emerald-400 font-semibold px-2 flex items-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        AUD
      </div>
      <div className="relative flex-1 h-5 overflow-hidden">
        {audioClips.map((c) => {
          const leftPercent = (c.start / totalFrames) * 100;
          const widthPercent = (c.duration / totalFrames) * 100;
          return (
            <div
              key={c.id}
              className="absolute top-0 bottom-0 bg-emerald-950/40 border border-emerald-600/60 rounded px-1.5 flex items-center text-[10px] text-emerald-200 font-mono truncate"
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
