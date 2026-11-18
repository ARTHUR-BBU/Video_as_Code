import React from 'react';
import { interpolate, staticFile } from 'remotion';
import { C, FONT } from '../brand/tokens';

interface ActProps {
  frame: number;
}

export const Act4: React.FC<ActProps> = ({ frame }) => {
  // Act 4 runs from f750 to f900
  const f = frame;

  // Background portrait continuous living push (1.00 to 1.04)
  const portraitScale = interpolate(f, [750, 900], [1.0, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Imperial Seal slam down at f810
  const isSealLanded = f >= 810;
  const sealScale = interpolate(f, [805, 810, 815], [2.2, 0.95, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sealAlpha = interpolate(f, [805, 810], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Seal shockwave ring at f810
  const ringScale = interpolate(f, [810, 835], [20, 240], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringAlpha = interpolate(f, [810, 815, 835], [0, 0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // CTA Card reveal: f820 to f850
  const ctaY = interpolate(f, [820, 850], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const ctaAlpha = interpolate(f, [820, 850], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        overflow: 'hidden',
      }}
    >
      {/* 1. Background Settle Portrait */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          transform: `scale(${portraitScale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <img
          src={staticFile('images/guanyu_portrait.jpg')}
          alt="Guan Yu Settlement"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(circle at 60% 45%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.96) 100%)',
          }}
        />
      </div>

      {/* 2. Imperial Seal Shockwave Ring */}
      {ringAlpha > 0.01 && (
        <div
          style={{
            position: 'absolute',
            top: 420,
            right: 420,
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `2px solid ${C.accent2}`,
            transform: `translate(50px, -50px) scale(${ringScale / 100})`,
            opacity: ringAlpha,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 3. The Imperial Seal (汉寿亭侯之印) */}
      {isSealLanded && (
        <div
          style={{
            position: 'absolute',
            top: 320,
            right: 320,
            opacity: sealAlpha,
            transform: `scale(${sealScale})`,
            transformOrigin: '50% 50%',
            backgroundColor: C.sealBg,
            border: `4px solid ${C.accent2}`,
            borderRadius: 6,
            padding: '24px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.85)',
          }}
        >
          <div
            style={{
              fontFamily: FONT.text,
              fontSize: 42,
              fontWeight: 900,
              color: C.accent2,
              letterSpacing: '0.15em',
              lineHeight: 1.2,
            }}
          >
            汉寿亭侯
          </div>
          <div
            style={{
              fontFamily: FONT.text,
              fontSize: 28,
              fontWeight: 800,
              color: C.ink,
              letterSpacing: '0.3em',
              marginTop: 4,
            }}
          >
            之印
          </div>
        </div>
      )}

      {/* 4. Limited Summon CTA Card */}
      <div
        style={{
          position: 'absolute',
          bottom: 160,
          left: 140,
          opacity: ctaAlpha,
          transform: `translate(0px, ${ctaY}px)`,
          backgroundColor: C.ink2,
          border: `1px solid ${C.lineBright}`,
          borderRadius: 6,
          padding: '36px 48px',
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 16,
              fontWeight: 700,
              color: C.accent,
              letterSpacing: '0.12em',
              marginBottom: 6,
            }}
          >
            LIMITED TIME WARLORD RECRUITMENT //
          </div>
          <div
            style={{
              fontFamily: FONT.text,
              fontSize: 48,
              fontWeight: 800,
              color: C.ink,
              letterSpacing: '0.04em',
            }}
          >
            武圣降临 · 限时招募
          </div>
        </div>

        <div
          style={{
            backgroundColor: C.badgeBg,
            border: `2px solid ${C.accent}`,
            borderRadius: 4,
            padding: '16px 36px',
            fontFamily: FONT.text,
            fontSize: 26,
            fontWeight: 800,
            color: C.accent,
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          立即征召
        </div>
      </div>
    </div>
  );
};
