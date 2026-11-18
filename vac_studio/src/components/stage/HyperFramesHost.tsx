import React, { useRef, useEffect, useState } from 'react';

interface HyperFramesHostProps {
  currentFrame: number;
  isPlaying: boolean;
  onFrameUpdate?: (frame: number) => void;
}

export const HyperFramesHost: React.FC<HyperFramesHostProps> = ({
  currentFrame,
  isPlaying,
  onFrameUpdate
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [seekLatency, setSeekLatency] = useState<number>(0);
  const [lastAckFrame, setLastAckFrame] = useState<number>(0);

  // Send seek command to iframe on currentFrame change
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'VAC_SEEK',
          frame: currentFrame,
          time: currentFrame / 60,
          fps: 60
        },
        '*'
      );
    }
  }, [currentFrame]);

  // Handle incoming ACK from iframe and ready handshake
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'VAC_HYPERFRAMES_READY') {
        (window as any).__VAC_HYPERFRAMES_READY__ = true;
      }
      if (e.data && e.data.type === 'VAC_SEEK_ACK') {
        setLastAckFrame(e.data.frame);
        if (e.data.renderLatencyMs !== undefined) {
          setSeekLatency(+e.data.renderLatencyMs.toFixed(2));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Expose real postMessage seek harness to window for CDP / automated testing
  useEffect(() => {
    (window as any).__VAC_HYPERFRAMES_SEEK__ = (targetFrame: number, fps = 60) => {
      return new Promise<{
        targetFrame: number;
        expectedTimeS: number;
        ackFrame: number;
        frameDelta: number;
        renderLatencyMs: number;
        status: 'PASS' | 'FAIL';
      }>((resolve, reject) => {
        const tStart = performance.now();
        let resolved = false;

        const onAck = (e: MessageEvent) => {
          if (e.data && e.data.type === 'VAC_SEEK_ACK') {
            if (resolved) return;
            resolved = true;
            window.removeEventListener('message', onAck);
            const ackFrame = Number(e.data.frame);
            const frameDelta = Math.abs(ackFrame - targetFrame);
            const roundTripLatencyMs = performance.now() - tStart;
            resolve({
              targetFrame,
              expectedTimeS: +(targetFrame / fps).toFixed(4),
              ackFrame,
              frameDelta,
              renderLatencyMs: +(e.data.renderLatencyMs ?? roundTripLatencyMs).toFixed(2),
              status: frameDelta === 0 ? 'PASS' : 'FAIL'
            });
          }
        };

        window.addEventListener('message', onAck);

        const sendSeek = () => {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'VAC_SEEK',
                frame: targetFrame,
                time: targetFrame / fps,
                fps
              },
              '*'
            );
          }
        };

        sendSeek();

        // Retry if iframe was busy during initial handshake
        const retryTimer = setInterval(() => {
          if (resolved) {
            clearInterval(retryTimer);
            return;
          }
          sendSeek();
        }, 120);

        setTimeout(() => {
          clearInterval(retryTimer);
          if (!resolved) {
            window.removeEventListener('message', onAck);
            reject(new Error(`SEEK_TIMEOUT: No ACK for frame ${targetFrame} within 6000ms`));
          }
        }, 6000);
      });
    };
    return () => {
      delete (window as any).__VAC_HYPERFRAMES_SEEK__;
      delete (window as any).__VAC_HYPERFRAMES_READY__;
    };
  }, []);

  // Continuous playback tick when playing
  useEffect(() => {
    if (!isPlaying) return;
    let frame = currentFrame;
    const interval = setInterval(() => {
      frame = (frame + 1) % 900;
      if (onFrameUpdate) {
        onFrameUpdate(frame);
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [isPlaying, currentFrame, onFrameUpdate]);

  // Mark viewport ready on mount
  useEffect(() => {
    (window as any).__VAC_STUDIO_READY__ = true;
    const readyEvent = new CustomEvent('vac-viewport-ready', { detail: { engine: 'hyperframes' } });
    window.dispatchEvent(readyEvent);
  }, []);

  return (
    <div
      data-testid="vac-canvas-ready"
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
    >
      <iframe
        ref={iframeRef}
        src="/compositions/space_bunny/index.html"
        title="HyperFrames Space Bunny Replica"
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => {
          (window as any).__VAC_HYPERFRAMES_READY__ = true;
        }}
        className="w-full h-full border-0 pointer-events-auto"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '1920px',
          maxHeight: '1080px',
          aspectRatio: '16/9'
        }}
      />

      {/* HyperFrames Telemetry Pill */}
      <div className="absolute top-3 left-3 bg-[#12141a]/80 backdrop-blur-md border border-[#232733] px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-2 text-slate-300 pointer-events-none z-10">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-white font-semibold">HyperFrames (HTML/GSAP):</span>
        <span className="text-blue-400">f{lastAckFrame} (Δf = {Math.abs(lastAckFrame - currentFrame)})</span>
        <span className="text-slate-500">|</span>
        <span>Seek Latency: <strong className="text-emerald-400">{seekLatency}ms</strong></span>
      </div>
    </div>
  );
};
