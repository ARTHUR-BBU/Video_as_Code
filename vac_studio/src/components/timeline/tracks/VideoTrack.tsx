import React from 'react';

interface VideoTrackProps {
  totalFrames: number;
}

export const VideoTrack: React.FC<VideoTrackProps> = ({ totalFrames }) => {
  const videoClips = [
    { id: 'v1', start: 0, duration: 270, label: 'Act 1: 鸿蒙未判，以铜铸礼 (Remotion)' },
    { id: 'v2', start: 270, duration: 360, label: 'Act 2: 吉金铭文，天地神序 (Remotion)' },
    { id: 'v3', start: 630, duration: 270, label: 'Act 3: 国之重器，鼎立千秋 (Remotion)' }
  ];

  return (
    <div className="relative h-7 bg-[#12141c] flex items-center px-1">
      <div className="w-20 text-[10px] font-mono text-blue-400 font-semibold px-2 flex items-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
        VID
      </div>
      <div className="relative flex-1 h-5 overflow-hidden">
        {videoClips.map((c) => {
          const leftPercent = (c.start / totalFrames) * 100;
          const widthPercent = (c.duration / totalFrames) * 100;
          return (
            <div
              key={c.id}
              className="absolute top-0 bottom-0 bg-blue-950/50 border border-blue-500/60 rounded px-1.5 flex items-center text-[10px] text-blue-200 font-mono truncate"
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
