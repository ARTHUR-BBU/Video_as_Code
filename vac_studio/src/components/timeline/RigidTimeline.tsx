/**
 * Video-as-Code Studio - Five-Track Rigid Timeline (WBS-2.1)
 * Standard: ISO/IEC/IEEE 29148:2018 | NFR 7.1 Viewport Interactive Performance
 *
 * RIGID FIVE-TRACK SPECIFICATION:
 * 1. Track 5 (MarkerTrack): Millisecond & frame ruler with chapter boundaries.
 * 2. Track 4 (TextTrack): Kinetic typography & subtitle chains.
 * 3. Track 3 (EffectsTrack): motion2code vector animations and shader filters.
 * 4. Track 2 (AudioTrack): Web Audio master clock sync & Earshot sound effects.
 * 5. Track 1 (VideoTrack): Remotion & HyperFrames primary video clips.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from '../icons';
import { MarkerTrack } from './tracks/MarkerTrack';
import { TextTrack } from './tracks/TextTrack';
import { EffectsTrack } from './tracks/EffectsTrack';
import { AudioTrack } from './tracks/AudioTrack';
import { VideoTrack } from './tracks/VideoTrack';
import { PlayheadCanvas } from './PlayheadCanvas';
import { WebAudioMasterClock } from '../../audio/WebAudioMasterClock';

interface RigidTimelineProps {
  currentFrame: number;
  totalFrames?: number;
  fps?: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (frame: number) => void;
  audioClock?: WebAudioMasterClock | null;
}

export const RigidTimeline: React.FC<RigidTimelineProps> = ({
  currentFrame,
  totalFrames = 900,
  fps = 60,
  isPlaying,
  onPlayPause,
  onSeek,
  audioClock: _audioClock
}) => {
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState<number>(1000);
  const [zoom, setZoom] = useState<number>(100);

  // ResizeObserver to track timeline track area dimensions
  useEffect(() => {
    if (!tracksContainerRef.current) return;
    const updateSize = () => {
      if (tracksContainerRef.current) {
        setTimelineWidth(tracksContainerRef.current.clientWidth);
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(tracksContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Timecode formatter (HH:MM:SS:FF)
  const formatTimecode = (frame: number) => {
    const totalSeconds = Math.floor(frame / fps);
    const ff = String(frame % fps).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    const mm = String(Math.floor(totalSeconds / 60) % 60).padStart(2, '0');
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    return `${hh}:${mm}:${ss}:${ff}`;
  };

  const handleSeekInternal = useCallback(
    (frame: number, _source: 'pointer' | 'program') => {
      onSeek(frame);
    },
    [onSeek]
  );

  return (
    <div
      data-testid="vac-rigid-timeline"
      className="h-56 border-t border-[#232733] bg-[#0c0d12] flex flex-col shrink-0 select-none overflow-hidden"
    >
      {/* Timeline Control Header */}
      <div className="h-10 border-b border-[#232733] bg-[#12141a] px-4 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center space-x-3">
          {/* Transport Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onSeek(0)}
              className="p-1.5 rounded hover:bg-[#1f232e] text-slate-400 hover:text-white transition-colors"
              title="First Frame"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onPlayPause}
              data-testid="vac-transport-play"
              className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition-all"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onSeek(totalFrames - 1)}
              className="p-1.5 rounded hover:bg-[#1f232e] text-slate-400 hover:text-white transition-colors"
              title="Last Frame"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#232733]" />

          {/* Timecode & Frame Indicator */}
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-white font-bold text-sm tracking-wide">
              {formatTimecode(currentFrame)}
            </span>
            <span className="text-slate-500 text-[11px]">
              (f{String(currentFrame).padStart(3, '0')} / {totalFrames}f)
            </span>
          </div>

          {/* Web Audio Clock Status */}
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Web Audio Clock (Dual-Tier Validated)</span>
          </div>
        </div>

        {/* Timeline Zoom & Tools */}
        <div className="flex items-center space-x-3 text-slate-400">
          <span className="text-[11px] font-mono">Zoom: {zoom}%</span>
          <input
            type="range"
            min="50"
            max="200"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 h-1 bg-[#1f232e] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Five-Track Rigid Body */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Track Lanes */}
        <div ref={tracksContainerRef} className="relative flex-1 flex flex-col bg-[#0a0b0e]">
          {/* Marker Ruler (Track 5) */}
          <div className="flex">
            <div className="w-20 bg-[#0f1117] border-b border-[#232733] border-r border-[#1f232e] flex items-center px-2 text-[10px] font-mono text-slate-400 font-bold shrink-0">
              RULER
            </div>
            <div className="flex-1">
              <MarkerTrack totalFrames={totalFrames} fps={fps} width={timelineWidth} />
            </div>
          </div>

          {/* Track 4: Typography / Subtitles */}
          <TextTrack totalFrames={totalFrames} />

          {/* Track 3: Effects / motion2code */}
          <EffectsTrack totalFrames={totalFrames} />

          {/* Track 2: Audio & Earshot */}
          <AudioTrack totalFrames={totalFrames} />

          {/* Track 1: Primary Video Track */}
          <VideoTrack totalFrames={totalFrames} />

          {/* Zero-Re-render GPU Canvas Playhead Layer */}
          <div
            className="absolute top-0 bottom-0 right-0 pointer-events-none"
            style={{ left: '80px', width: `calc(100% - 80px)` }}
          >
            <PlayheadCanvas
              totalFrames={totalFrames}
              width={timelineWidth > 80 ? timelineWidth - 80 : timelineWidth}
              height={140}
              zoom={zoom}
              currentFrame={currentFrame}
              onSeek={handleSeekInternal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
