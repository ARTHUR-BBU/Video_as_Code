import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { AetherConsole } from '../components/AetherConsole';
import { LaserCursor } from '../components/LaserCursor';
import { TOKENS } from '../theme/tokens';

export const Act2: React.FC = () => {
  const frame = useCurrentFrame(); // 0 to 360 (corresponds to f240 - f600 in Film)

  // Smooth entrance: slides in smoothly from right with deceleration
  const enterX = interpolate(frame, [0, 25], [120, 0], { extrapolateRight: 'clamp' });
  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Console progress drives the latency drop & chart reveal
  const consoleProgress = interpolate(frame, [15, 260], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fragment 1: "Aether routes." (f30 to f160)
  const frag1Opacity = interpolate(frame, [30, 45, 145, 160], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag1Y = interpolate(frame, [30, 45], [16, 0], { extrapolateRight: 'clamp' });

  // Fragment 2: "Zero indirection." (f180 to f310)
  const frag2Opacity = interpolate(frame, [180, 195, 295, 310], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag2Y = interpolate(frame, [180, 195], [16, 0], { extrapolateRight: 'clamp' });

  // Laser Cursor tracks to the Tokyo PoP pin inside console at f180-f280
  const cursorTargetX = 680 + (1920 - 1560) / 2 + 240; // Pin position mapped to screen coords
  const cursorTargetY = 156 + (1080 - 880) / 2 + 220;
  const cursorX = interpolate(frame, [140, 210], [200, cursorTargetX], { extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [140, 210], [180, cursorTargetY], { extrapolateRight: 'clamp' });

  // Outward exit transition (f330 - f360)
  const exitScale = interpolate(frame, [330, 360], [1, 0.88], { extrapolateLeft: 'clamp' });
  const exitOpacity = interpolate(frame, [335, 360], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: TOKENS.ground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: enterOpacity * exitOpacity,
        transform: `translateX(${enterX}px) scale(${exitScale})`,
      }}
    >
      {/* Background Subtle SVG Grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }}>
        <defs>
          <pattern id="act2-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={TOKENS.rule} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#act2-grid)" />
      </svg>

      {/* Real App Screen Console (taste-skill v2.1) */}
      <AetherConsole progress={consoleProgress} />

      {/* Typography Overlay (Fragment Chains) */}
      <div
        style={{
          position: 'absolute',
          left: 180,
          top: 48,
          fontFamily: TOKENS.fontDisplay,
          color: TOKENS.text,
          pointerEvents: 'none',
        }}
      >
        {frame >= 30 && frame < 170 && (
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              opacity: frag1Opacity,
              transform: `translateY(${frag1Y}px)`,
              color: TOKENS.accent,
            }}
          >
            Aether routes.
          </div>
        )}

        {frame >= 180 && (
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              opacity: frag2Opacity,
              transform: `translateY(${frag2Y}px)`,
              color: TOKENS.text,
            }}
          >
            Zero indirection.
          </div>
        )}
      </div>

      {/* Carrier Object: Laser Cursor locking onto 1.8ms node */}
      {frame >= 140 && (
        <LaserCursor x={cursorX} y={cursorY} active={true} label="1.8MS LOCKED" />
      )}
    </div>
  );
};
