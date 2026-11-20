import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { GlobalTopology } from '../components/GlobalTopology';
import { LaserCursor } from '../components/LaserCursor';
import { TOKENS } from '../theme/tokens';

export const Act1: React.FC = () => {
  const frame = useCurrentFrame();

  // Progress within Act 1 (240 frames total)
  const cursorX = interpolate(frame, [0, 80, 160, 240], [380, 840, 1320, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [0, 80, 160, 240], [320, 260, 360, 540], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fragment 1: "Packets drift." (f20 to f110)
  const frag1Opacity = interpolate(frame, [20, 35, 95, 110], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag1Y = interpolate(frame, [20, 35], [20, 0], { extrapolateRight: 'clamp' });

  // Fragment 2: "Latency bites." (f120 to f220)
  const frag2Opacity = interpolate(frame, [120, 135, 205, 220], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag2Y = interpolate(frame, [120, 135], [20, 0], { extrapolateRight: 'clamp' });

  // Outward exit transition (f220 - f240)
  const exitOpacity = interpolate(frame, [220, 240], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: exitOpacity }}>
      {/* Background Topo */}
      <GlobalTopology progress={frame / 240} jitter={true} />

      {/* Carrier Object: Laser Cursor */}
      <LaserCursor x={cursorX} y={cursorY} active={true} label={frame > 120 ? 'JITTER DETECTED' : 'TRACING HOPS'} />

      {/* Typography Overlay (Swiss Fragment Chains) */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 120,
          fontFamily: TOKENS.fontDisplay,
          color: '#ffffff',
          pointerEvents: 'none',
        }}
      >
        {frame >= 20 && frame < 115 && (
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              opacity: frag1Opacity,
              transform: `translateY(${frag1Y}px)`,
            }}
          >
            Packets drift.
          </div>
        )}

        {frame >= 120 && (
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              opacity: frag2Opacity,
              transform: `translateY(${frag2Y}px)`,
              color: TOKENS.negative,
            }}
          >
            Latency bites.
          </div>
        )}
      </div>

      {/* Telemetry Index Stamp */}
      <div
        style={{
          position: 'absolute',
          right: 80,
          top: 60,
          fontFamily: TOKENS.fontMono,
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'right',
        }}
      >
        <div>PROT: BGP-ANYCAST-LEGACY</div>
        <div style={{ color: TOKENS.negative, marginTop: 4 }}>HOPS: 18 · JITTER: +48MS</div>
      </div>
    </div>
  );
};
