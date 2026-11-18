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

    if (isPlaying) {
      frameCountRef.current += 1;
      // If delta exceeds 1.5x frame budget (25ms instead of 16.67ms), flag as drop
      if (delta > 25.0) {
        droppedCountRef.current += 1;
      }

      const activeFrame = playerRef.current.getCurrentFrame();
      if (onFrameUpdate) {
        onFrameUpdate(activeFrame);
      }

      const instantFps = delta > 0 ? Math.min(60.0, +(1000 / delta).toFixed(1)) : 60.0;
      const stats = {
        fps: instantFps,
        droppedFrames: droppedCountRef.current,
        totalFrames: frameCountRef.current
      };
      setTelemetry(stats);
      if (onTelemetryUpdate) {
        onTelemetryUpdate(stats);
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
