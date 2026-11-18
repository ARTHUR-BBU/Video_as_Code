import React from 'react';

interface TextTrackProps {
  totalFrames: number;
}

export const TextTrack: React.FC<TextTrackProps> = ({ totalFrames }) => {
  const textClips = [
    { id: 't1', start: 25, duration: 100, label: 'Three thousand years.' },
    { id: 't2', start: 135, duration: 110, label: 'Cast in bronze.' },
    { id: 't3', start: 300, duration: 130, label: 'Heaven and earth.' },
    { id: 't4', start: 450, duration: 130, label: 'Etched in eternity.' },
    { id: 't5', start: 660, duration: 180, label: 'Ritual vessel standing forever.' }
  ];

  return (
    <div className="relative h-7 bg-[#12141c] border-b border-[#1f232e] flex items-center px-1">
      <div className="w-20 text-[10px] font-mono text-purple-400 font-semibold px-2 flex items-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />
        TXT
      </div>
      <div className="relative flex-1 h-5 overflow-hidden">
        {textClips.map((c) => {
          const leftPercent = (c.start / totalFrames) * 100;
          const widthPercent = (c.duration / totalFrames) * 100;
          return (
            <div
              key={c.id}
              className="absolute top-0 bottom-0 bg-purple-900/40 border border-purple-600/60 rounded px-1.5 flex items-center text-[10px] text-purple-200 font-mono truncate"
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
