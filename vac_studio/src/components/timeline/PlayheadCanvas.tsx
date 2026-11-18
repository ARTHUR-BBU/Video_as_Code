/**
 * Video-as-Code Studio - High-Performance Playhead Canvas (WBS-2.3)
 * Standard: ISO/IEC/IEEE 29148:2018 | Zero-React-Rerender GPU Canvas
 *
 * SPECIFICATION & OPTIMIZATIONS:
 * 1. Independent Canvas Layer: Playhead cursor & hairline rendered directly via HTML5 2D Canvas.
 * 2. React 0 Re-render: Scrubbing moves only canvas pixels; React component tree is NOT touched.
 * 3. coalescedEvents: Uses pointer events coalescing to drop stale frames and dispatch only latest.
 * 4. Sub-frame precision: Frame bounds clamped and snapped to integer frame grid.
 */

import React, { useRef, useEffect, useCallback } from 'react';

interface PlayheadCanvasProps {
  totalFrames: number;
  width: number;
  height: number;
  zoom?: number;
  currentFrame: number;
  onSeek: (frame: number, source: 'pointer' | 'program') => void;
}

export const PlayheadCanvas: React.FC<PlayheadCanvasProps> = ({
  totalFrames = 900,
  width,
  height,
  zoom = 100,
  currentFrame,
  onSeek
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const activeFrameRef = useRef(currentFrame);
  const pendingSeekFrameRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Sync prop changes when not actively dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      activeFrameRef.current = currentFrame;
      renderPlayhead();
    }
  }, [currentFrame, width, height, zoom]);

  const frameToX = useCallback(
    (frame: number) => {
      if (totalFrames <= 0) return 0;
      const progress = frame / (totalFrames - 1);
      return progress * width;
    },
    [totalFrames, width]
  );

  const xToFrame = useCallback(
    (x: number) => {
      if (width <= 0) return 0;
      const boundedX = Math.max(0, Math.min(width, x));
      const progress = boundedX / width;
      return Math.round(progress * (totalFrames - 1));
    },
    [totalFrames, width]
  );

  const renderPlayhead = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = width;
    const displayHeight = height;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const x = frameToX(activeFrameRef.current);

    // 1. Playhead Vertical Hairline
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // Bright blue
    ctx.lineWidth = 1.5;
    ctx.moveTo(x, 16);
    ctx.lineTo(x, displayHeight);
    ctx.stroke();

    // Subtle glow behind hairline
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.lineWidth = 4;
    ctx.moveTo(x, 16);
    ctx.lineTo(x, displayHeight);
    ctx.stroke();

    // 2. Playhead Top Marker (Inverted Triangle/Badge)
    const markerWidth = 14;
    const markerHeight = 16;
    ctx.beginPath();
    ctx.fillStyle = '#60a5fa'; // Blue-400
    ctx.moveTo(x - markerWidth / 2, 0);
    ctx.lineTo(x + markerWidth / 2, 0);
    ctx.lineTo(x + markerWidth / 2, 8);
    ctx.lineTo(x, markerHeight);
    ctx.lineTo(x - markerWidth / 2, 8);
    ctx.closePath();
    ctx.fill();

    // Inner highlight dot
    ctx.beginPath();
    ctx.arc(x, 5, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }, [width, height, frameToX]);

  // Pointer event handlers with getCoalescedEvents for coalesced scrub latency
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frame = xToFrame(x);

    activeFrameRef.current = frame;
    renderPlayhead();
    onSeek(frame, 'pointer');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    // Utilize pointer event coalescing if supported by browser
    let targetX = e.clientX;
    if (typeof (e as any).getCoalescedEvents === 'function') {
      const coalesced = (e as any).getCoalescedEvents();
      if (coalesced.length > 0) {
        targetX = coalesced[coalesced.length - 1].clientX;
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = targetX - rect.left;
    const frame = xToFrame(x);

    if (frame !== activeFrameRef.current) {
      activeFrameRef.current = frame;
      renderPlayhead();

      // Dispatch seek without React re-render churn
      pendingSeekFrameRef.current = frame;
      if (animFrameIdRef.current === null) {
        animFrameIdRef.current = requestAnimationFrame(() => {
          if (pendingSeekFrameRef.current !== null) {
            onSeek(pendingSeekFrameRef.current, 'pointer');
            pendingSeekFrameRef.current = null;
          }
          animFrameIdRef.current = null;
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frame = xToFrame(x);
    activeFrameRef.current = frame;
    renderPlayhead();
    onSeek(frame, 'pointer');
  };

  // Expose direct imperative seek API to window for automated testing
  useEffect(() => {
    (window as any).__VAC_SET_PLAYHEAD_FRAME__ = (frame: number) => {
      activeFrameRef.current = Math.max(0, Math.min(totalFrames - 1, frame));
      renderPlayhead();
    };
    return () => {
      delete (window as any).__VAC_SET_PLAYHEAD_FRAME__;
    };
  }, [totalFrames, renderPlayhead]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      data-testid="vac-playhead-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        cursor: 'ew-resize',
        pointerEvents: 'auto',
        zIndex: 30
      }}
    />
  );
};
