import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME, TYPOGRAPHY } from '../constants';

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring physics
  const enterSpring = spring({
    frame,
    fps,
    config: { mass: 1.0, stiffness: 140, damping: 14 },
  });

  const cardTranslateY = interpolate(enterSpring, [0, 1], [60, 0]);
  const cardOpacity = interpolate(enterSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: THEME.background,
        display: 'flex',
        padding: THEME.safeMargin,
        boxSizing: 'border-box',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main Stage Ground */}
      <div
        style={{
          flex: '7',
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          borderRadius: '16px',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transform: `translateY(${cardTranslateY}px)`,
          opacity: cardOpacity,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.monoFont,
              fontSize: '14px',
              color: THEME.accent,
              letterSpacing: '0.1em',
              marginBottom: '16px',
              textTransform: 'uppercase',
            }}
          >
            ACT // 01 — Scene_01
          </div>
          <h1
            style={{
              fontFamily: TYPOGRAPHY.headlineFont,
              fontSize: '52px',
              fontWeight: 700,
              color: THEME.textPrimary,
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Deterministic Motion Design
          </h1>
        </div>

        {/* Dynamic Telemetry Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${THEME.border}`,
            paddingTop: '20px',
            fontFamily: TYPOGRAPHY.monoFont,
            fontSize: '13px',
            color: THEME.textSecondary,
          }}
        >
          <span>FRAME: {frame.toString().padStart(4, '0')}</span>
          <span style={{ color: THEME.accent }}>STATUS: ACTIVE</span>
        </div>
      </div>

      {/* Telemetry Sidebar */}
      <div
        style={{
          flex: '3',
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontFamily: TYPOGRAPHY.monoFont, fontSize: '13px', color: THEME.textSecondary }}>
          <div>FPS: 60.0</div>
          <div style={{ marginTop: '8px' }}>DUR: 180f</div>
          <div style={{ marginTop: '8px', color: THEME.accent }}>ACCENT: #00f0ff</div>
        </div>
      </div>
    </div>
  );
};
