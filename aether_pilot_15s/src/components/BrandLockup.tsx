import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TOKENS } from '../theme/tokens';

export const BrandLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 120, mass: 1 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [10, 35], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0a0d10',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: TOKENS.fontDisplay,
        opacity,
      }}
    >
      {/* Precision Geometric Double-Ring Mark */}
      <div style={{ transform: `scale(${scale})`, marginBottom: 36 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <circle cx="60" cy="60" r="38" fill="none" stroke={TOKENS.accent} strokeWidth="2.5" />
          <circle cx="60" cy="60" r="26" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="60" cy="60" r="6" fill={TOKENS.accent} />
          {/* 4 Cardinal Tick Marks */}
          <line x1="60" y1="2" x2="60" y2="12" stroke="#ffffff" strokeWidth="2" />
          <line x1="60" y1="108" x2="60" y2="118" stroke="#ffffff" strokeWidth="2" />
          <line x1="2" y1="60" x2="12" y2="60" stroke="#ffffff" strokeWidth="2" />
          <line x1="108" y1="60" x2="118" y2="60" stroke="#ffffff" strokeWidth="2" />
        </svg>
      </div>

      {/* Main Title Wordmark (90px high-contrast typography) */}
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          transform: `translateY(${textY}px)`,
          textAlign: 'center',
        }}
      >
        AETHER EDGE
      </div>

      {/* Core Proposition */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.02em',
          marginTop: 18,
          transform: `translateY(${textY * 0.7}px)`,
        }}
      >
        Global Traffic. Zero Indirection.
      </div>

      {/* Specimen Telemetry Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 64,
          display: 'flex',
          gap: 32,
          fontSize: 12,
          fontFamily: TOKENS.fontMono,
          color: 'rgba(255,255,255,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 16,
          width: 800,
          justifyContent: 'space-between',
        }}
      >
        <span>P99: 1.8MS</span>
        <span>MESH: 320 GLOBAL POPS</span>
        <span>CORE: OPTIC-ANYCAST</span>
        <span>CERTIFIED: ISO/IEC 27001</span>
      </div>
    </div>
  );
};
