import React from 'react';
import { interpolate, staticFile } from 'remotion';
import { C, FONT } from '../brand/tokens';
import { ThreeSlash } from '../ThreeSlash';

interface ActProps {
  frame: number;
}

export const Act3: React.FC<ActProps> = ({ frame }) => {
  // Act 3 runs from f420 to f750
  const f = frame;

  // Phase selection:
  // Phase 1: Charge (f420 - f540)
  // Phase 2: Ground Slash (f540 - f630)
  // Phase 3: Skill Cut-in & Ultimate (f630 - f750)

  // Camera Shake on heavy strikes
  const isStrike1 = f >= 480 && f <= 500;
  const isStrike2 = f >= 570 && f <= 590;
  const isStrike3 = f >= 660 && f <= 685;

  let shakeX = 0;
  let shakeY = 0;
  if (isStrike1) {
    shakeX = Math.sin((f - 480) * 1.5) * 8 * (1 - (f - 480) / 20);
    shakeY = Math.cos((f - 480) * 1.8) * 8 * (1 - (f - 480) / 20);
  } else if (isStrike2) {
    shakeX = Math.sin((f - 570) * 2.0) * 14 * (1 - (f - 570) / 20);
    shakeY = Math.cos((f - 570) * 2.2) * 14 * (1 - (f - 570) / 20);
  } else if (isStrike3) {
    shakeX = Math.sin((f - 660) * 2.2) * 20 * (1 - (f - 660) / 25);
    shakeY = Math.cos((f - 660) * 2.5) * 20 * (1 - (f - 660) / 25);
  }

  // Phase 1: Charge camera push
  const p1Scale = interpolate(f, [420, 540], [1.02, 1.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 2: Ground slash camera push
  const p2Scale = interpolate(f, [540, 630], [1.05, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 3: Cutin camera push
  const p3Scale = interpolate(f, [630, 750], [1.02, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Flash at start of Cutin (f630 - f636)
  const flashAlpha = interpolate(f, [630, 633, 638], [0, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Combo count animation
  const comboVal = Math.round(
    interpolate(f, [430, 600], [32, 99], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Critical text pop at f570 to f620
  const isCritVisible = f >= 570 && f <= 630;
  const critScale = interpolate(f, [570, 580, 590], [0.6, 1.25, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Ultimate Skill Name reveal (f645 to f730)
  const skillTitleAlpha = interpolate(f, [645, 665], [0, 1], {
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
        transform: `translate(${shakeX}px, ${shakeY}px)`,
        overflow: 'hidden',
      }}
    >
      {/* 1. Background Visual Layers based on Phase */}
      {f < 540 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            transform: `scale(${p1Scale})`,
            transformOrigin: '50% 50%',
          }}
        >
          <img
            src={staticFile('images/guanyu_battle.jpg')}
            alt="Battle Charge"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {f >= 540 && f < 630 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            transform: `scale(${p2Scale})`,
            transformOrigin: '50% 50%',
          }}
        >
          <img
            src={staticFile('images/guanyu_slash.jpg')}
            alt="Ground Slash"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {f >= 630 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            transform: `scale(${p3Scale})`,
            transformOrigin: '50% 50%',
          }}
        >
          <img
            src={staticFile('images/guanyu_cutin.jpg')}
            alt="Skill Cutin"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* 2. Three.js 3D Blade Slash Layers */}
      {/* Slash 1 in Phase 1 (f480) */}
      {f >= 480 && f <= 515 && (
        <ThreeSlash
          frame={f}
          startFrame={480}
          durationFrames={26}
          colorHex={0x00ffa3}
          accentHex={0xffd700}
          scale={1.1}
        />
      )}

      {/* Slash 2 in Phase 2 (f570) */}
      {f >= 570 && f <= 605 && (
        <ThreeSlash
          frame={f}
          startFrame={570}
          durationFrames={26}
          colorHex={0x00ffa3}
          accentHex={0xff2a4d}
          scale={1.25}
        />
      )}

      {/* Slash 3 (Dragon Cleave) in Phase 3 (f660) */}
      {f >= 660 && f <= 700 && (
        <ThreeSlash
          frame={f}
          startFrame={660}
          durationFrames={32}
          colorHex={0x00ffa3}
          accentHex={0xffd700}
          scale={1.55}
        />
      )}

      {/* 3. Screen Flash */}
      {flashAlpha > 0.01 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            backgroundColor: C.white,
            opacity: flashAlpha,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 4. Action Game HUD Overlays */}
      {/* Combo Counter (Top Right) */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          right: 120,
          fontFamily: FONT.mono,
          textAlign: 'right',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: C.accent2,
            letterSpacing: '0.12em',
          }}
        >
          HITS CHAIN //
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textShadow: '0 4px 16px rgba(0,0,0,0.8)',
          }}
        >
          COMBO <span style={{ color: C.accent }}>x{comboVal}</span>
        </div>
      </div>

      {/* Critical Strike Jump Number (Center Screen in Phase 2) */}
      {isCritVisible && (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '30%',
            transform: `scale(${critScale})`,
            fontFamily: FONT.mono,
            textAlign: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: C.accent2,
              letterSpacing: '0.15em',
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}
          >
            CRITICAL HIT!
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 900,
              color: C.accentRed,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textShadow: '0 4px 24px rgba(0,0,0,0.95)',
            }}
          >
            88,480
          </div>
        </div>
      )}

      {/* Ultimate Skill Banner (Phase 3) */}
      {f >= 645 && (
        <div
          style={{
            position: 'absolute',
            bottom: 150,
            left: 120,
            opacity: skillTitleAlpha,
            fontFamily: FONT.text,
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: C.accent,
              letterSpacing: '0.18em',
              marginBottom: 8,
            }}
          >
            // AWAKENED ULTIMATE //
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: C.ink,
              letterSpacing: '0.05em',
              lineHeight: 1.1,
              textShadow: '0 4px 20px rgba(0,0,0,0.85)',
            }}
          >
            青龙偃月 · 绝空斩
          </div>
        </div>
      )}
    </div>
  );
};
