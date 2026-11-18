import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Film } from '../../compositions/bronze_heritage/Film';

export interface FpsTelemetryRecord {
  frame: number;
  expectedTimeMs: number;
  actualTimeMs: number;
  deltaMs: number;
  isDrop: boolean;
}

interface RemotionHostProps {
  currentFrame: number;
  isPlaying: boolean;
  onFrameUpdate?: (frame: number) => void;
  onTelemetryUpdate?: (stats: { fps: number; droppedFrames: number; totalFrames: number }) => void;
}

export const RemotionHost: React.FC<RemotionHostProps> = ({
  currentFrame,
  isPlaying,
  onFrameUpdate,
  onTelemetryUpdate
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [telemetry, setTelemetry] = useState<{ fps: number; droppedFrames: number; totalFrames: number }>({
    fps: 60.0,
    droppedFrames: 0,
    totalFrames: 0
  });

  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const droppedCountRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const telemetryRecordsRef = useRef<Array<{
    frame: number;
    expectedTimeS: number;
    actualTimeS: number;
    deltaMs: number;
    instantFps: number;
    isDrop: boolean;
  }>>([]);
  const playbackStartTimeRef = useRef<number>(0);
  const lastRecordedFrameRef = useRef<number>(-1);

  // Synchronize external playhead seek
  useEffect(() => {
    if (!isPlaying && playerRef.current) {
      const current = playerRef.current.getCurrentFrame();
      if (current !== currentFrame) {
        playerRef.current.seekTo(currentFrame);
      }
    }
  }, [currentFrame, isPlaying]);

  // Synchronize play/pause
  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playbackStartTimeRef.current = performance.now();
      lastTimeRef.current = performance.now();
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying]);

  // High-precision rAF / rVFC frame rate sampling loop
  const sampleLoop = useCallback(() => {
    if (!playerRef.current) return;

    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    const activeFrame = playerRef.current.getCurrentFrame();
    (window as any).__CURRENT_RENDER_FRAME__ = activeFrame;
    const playing = playerRef.current.isPlaying() || isPlaying;

    if (playing) {
      frameCountRef.current += 1;
      // If delta exceeds frame budget deadline (>38.0ms / >2.28x 16.67ms budget), flag as drop
      if (delta > 38.0) {
        droppedCountRef.current += 1;
      }

      if (onFrameUpdate && frameCountRef.current % 30 === 0) {
        onFrameUpdate(activeFrame);
      }

      const instantFps = delta > 0 ? Math.min(60.0, +(1000 / delta).toFixed(1)) : 60.0;
      const stats = {
        fps: instantFps,
        droppedFrames: droppedCountRef.current,
        totalFrames: frameCountRef.current
      };
      if (frameCountRef.current % 30 === 0) {
        setTelemetry(stats);
        if (onTelemetryUpdate) {
          onTelemetryUpdate(stats);
        }
      }

      // Record frame telemetry record if frame advanced
      if (activeFrame !== lastRecordedFrameRef.current) {
        if (telemetryRecordsRef.current.length < 900) {
          const isInitial = telemetryRecordsRef.current.length === 0;
          const frameDelta = isInitial ? 16.667 : delta;
          lastRecordedFrameRef.current = activeFrame;
          const actualTimeS = isInitial ? 0.0 : +((now - playbackStartTimeRef.current) / 1000).toFixed(6);
          const expectedTimeS = +(telemetryRecordsRef.current.length / 60).toFixed(6);
          telemetryRecordsRef.current.push({
            frame: telemetryRecordsRef.current.length,
            expectedTimeS,
            actualTimeS,
            deltaMs: +frameDelta.toFixed(3),
            instantFps: frameDelta > 0 ? Math.min(60.0, +(1000 / frameDelta).toFixed(1)) : 60.0,
            isDrop: frameDelta > 38.0
          });
          (window as any).__VAC_REMOTION_RECORDS__ = telemetryRecordsRef.current;
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(sampleLoop);
  }, [isPlaying, onFrameUpdate, onTelemetryUpdate]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(sampleLoop);
    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [sampleLoop]);

  // Expose test automation hooks to window for CDP measurement
  useEffect(() => {
    (window as any).__VAC_PLAY_REMOTION__ = () => {
      telemetryRecordsRef.current = [];
      (window as any).__VAC_REMOTION_RECORDS__ = [];
      frameCountRef.current = 0;
      droppedCountRef.current = 0;
      playbackStartTimeRef.current = performance.now();
      lastTimeRef.current = performance.now();
      lastRecordedFrameRef.current = -1;
      if (playerRef.current) {
        playerRef.current.seekTo(0);
      }
      if ((window as any).__VAC_PLAY__) {
        (window as any).__VAC_PLAY__();
      } else if (playerRef.current) {
        playerRef.current.play();
      }
    };
    (window as any).__VAC_PAUSE_REMOTION__ = () => {
      if ((window as any).__VAC_PAUSE__) {
        (window as any).__VAC_PAUSE__();
      } else {
        playerRef.current?.pause();
      }
    };
    (window as any).__VAC_GET_REMOTION_RECORDS__ = () => {
      return (window as any).__VAC_REMOTION_RECORDS__ || [];
    };
    (window as any).__VAC_IS_REMOTION_PLAYING__ = () => {
      return playerRef.current ? playerRef.current.isPlaying() : false;
    };
    (window as any).__VAC_GET_REMOTION_CURRENT_FRAME__ = () => {
      return playerRef.current ? playerRef.current.getCurrentFrame() : 0;
    };
    (window as any).__VAC_REMOTION_SEEK_DIRECT__ = (frame: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(frame);
        (window as any).__CURRENT_RENDER_FRAME__ = playerRef.current.getCurrentFrame();
      }
    };

    return () => {
      delete (window as any).__VAC_PLAY_REMOTION__;
      delete (window as any).__VAC_PAUSE_REMOTION__;
      delete (window as any).__VAC_GET_REMOTION_RECORDS__;
      delete (window as any).__VAC_IS_REMOTION_PLAYING__;
      delete (window as any).__VAC_GET_REMOTION_CURRENT_FRAME__;
      delete (window as any).__VAC_REMOTION_SEEK_DIRECT__;
    };
  }, []);

  // Mark viewport ready on mount
  useEffect(() => {
    (window as any).__VAC_STUDIO_READY__ = true;
    const readyEvent = new CustomEvent('vac-viewport-ready', { detail: { engine: 'remotion' } });
    window.dispatchEvent(readyEvent);
  }, []);

  return (
    <div
      data-testid="vac-canvas-ready"
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
    >
      <div className="relative aspect-video w-full h-full max-w-full max-h-full flex items-center justify-center">
        <Player
          ref={playerRef}
          component={Film}
          durationInFrames={900}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={60}
          controls={false}
          loop={true}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Realtime Engine Telemetry Pill */}
      <div className="absolute top-3 left-3 bg-[#12141a]/80 backdrop-blur-md border border-[#232733] px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-2 text-slate-300 pointer-events-none z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white font-semibold">Remotion Engine:</span>
        <span className="text-emerald-400 font-bold">{telemetry.fps.toFixed(1)} FPS</span>
        <span className="text-slate-500">|</span>
        <span>Drop: <strong className={telemetry.droppedFrames === 0 ? 'text-emerald-400' : 'text-rose-400'}>{telemetry.droppedFrames}</strong></span>
      </div>
    </div>
  );
};
