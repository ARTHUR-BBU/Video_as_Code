import React, { useMemo } from 'react';

interface MarkerTrackProps {
  totalFrames: number;
  fps?: number;
  width?: number;
}

export const MarkerTrack: React.FC<MarkerTrackProps> = ({
  totalFrames = 900,
  fps = 60,
  width: _width
}) => {
  const markers = useMemo(() => {
    const list: Array<{ frame: number; timeS: number; isMajor: boolean; label: string }> = [];
    const step = 60; // 1 second intervals
    for (let f = 0; f < totalFrames; f += step) {
      const timeS = f / fps;
      list.push({
        frame: f,
        timeS,
        isMajor: f % (fps * 5) === 0,
        label: `${timeS}s (f${f})`
      });
    }
    return list;
  }, [totalFrames, fps]);

  return (
    <div className="relative h-6 bg-[#0f1117] border-b border-[#232733] select-none overflow-hidden font-mono text-[10px] text-slate-400">
      {markers.map((m) => {
        const leftPercent = (m.frame / (totalFrames - 1)) * 100;
        return (
          <div
            key={m.frame}
            className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-[9px] text-slate-400 leading-tight">
              {m.isMajor ? m.label : `${m.timeS}s`}
            </span>
            <div
              className={`w-px flex-1 ${
                m.isMajor ? 'bg-blue-500/60' : 'bg-slate-700/50'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};
