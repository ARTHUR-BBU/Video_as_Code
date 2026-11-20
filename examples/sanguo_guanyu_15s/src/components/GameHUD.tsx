import React from 'react';
import { interpolate } from 'remotion';
import { C, FONT } from '../brand/tokens';

interface GameHUDProps {
  frame: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({ frame }) => {
  // Ambient particle drift (20 particles)
  const particles = Array.from({ length: 24 }).map((_, i) => {
    const xBase = (i * 80 + 30) % 1920;
    const yBase = (i * 45 + 50) % 1080;
    const speed = 0.4 + (i % 5) * 0.2;
    const y = (yBase - frame * speed + 1080) % 1080;
    const x = xBase + Math.sin((frame + i * 20) * 0.03) * 15;
    const op = 0.15 + Math.sin((frame + i * 15) * 0.05) * 0.15;
    return { x, y, op };
  });

  // Top/bottom reveal progress: frame 0 to 30
  const hudAlpha = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Rage bar pulse
  const rageFill = interpolate(frame, [180, 360], [20, 100], {
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
        pointerEvents: 'none',
        opacity: hudAlpha,
      }}
    >
      {/* 1. Ambient Floating Embers/Dust */}
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {particles.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i % 3 === 0 ? 2 : 1.5}
            fill={i % 2 === 0 ? C.accent2 : C.accent}
            opacity={p.op}
          />
        ))}
      </svg>

      {/* 2. Four Precision Bronze Corner Brackets */}
      {/* Top Left */}
      <svg
        width={60}
        height={60}
        style={{ position: 'absolute', top: 32, left: 32 }}
      >
        <path
          d="M 0 30 L 0 0 L 30 0"
          fill="none"
          stroke={C.lineBright}
          strokeWidth={2}
        />
        <rect x={0} y={0} width={4} height={4} fill={C.accent2} />
      </svg>
      {/* Top Right */}
      <svg
        width={60}
        height={60}
        style={{ position: 'absolute', top: 32, right: 32 }}
      >
        <path
          d="M 60 30 L 60 0 L 30 0"
          fill="none"
          stroke={C.lineBright}
          strokeWidth={2}
        />
        <rect x={56} y={0} width={4} height={4} fill={C.accent2} />
      </svg>
      {/* Bottom Left */}
      <svg
        width={60}
        height={60}
        style={{ position: 'absolute', bottom: 32, left: 32 }}
      >
        <path
          d="M 0 30 L 0 60 L 30 60"
          fill="none"
          stroke={C.lineBright}
          strokeWidth={2}
        />
        <rect x={0} y={56} width={4} height={4} fill={C.accent2} />
      </svg>
      {/* Bottom Right */}
      <svg
        width={60}
        height={60}
        style={{ position: 'absolute', bottom: 32, right: 32 }}
      >
        <path
          d="M 60 30 L 60 60 L 30 60"
          fill="none"
          stroke={C.lineBright}
          strokeWidth={2}
        />
        <rect x={56} y={56} width={4} height={4} fill={C.accent2} />
      </svg>

      {/* 3. Top Header HUD */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 64,
          right: 64,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: FONT.text,
        }}
      >
        {/* Left: Faction & Rarity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              backgroundColor: C.badgeBg,
              border: `1px solid ${C.accent}`,
              padding: '4px 14px',
              borderRadius: 2,
              fontSize: 16,
              fontWeight: 700,
              color: C.accent,
              letterSpacing: '0.05em',
            }}
          >
            蜀汉 · SHU
          </div>
          <div
            style={{
              backgroundColor: C.ink2,
              border: `1px solid ${C.line}`,
              padding: '4px 12px',
              borderRadius: 2,
              fontSize: 15,
              fontWeight: 700,
              color: C.accent2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>SSR+ 神将</span>
            <span style={{ fontSize: 13, letterSpacing: '0.1em' }}>★★★★★</span>
          </div>
        </div>

        {/* Right: Telemetry Timecode */}
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 14,
            fontWeight: 600,
            color: C.mute,
            letterSpacing: '0.08em',
          }}
        >
          SYS: AAA_ENGINE // BATTLE_FRAME: {frame.toString().padStart(4, '0')} // 60FPS
        </div>
      </div>

      {/* 4. Bottom Footer HUD (Health & Rage Bars) */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 64,
          right: 64,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        {/* Left: Character Nameplate */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontFamily: FONT.text,
              fontSize: 24,
              fontWeight: 800,
              color: C.ink,
              letterSpacing: '0.04em',
            }}
          >
            汉寿亭侯 · 关云长
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              letterSpacing: '0.06em',
            }}
          >
            CLASS: VANGUARD WARLORD // WEAPON: AZURE DRAGON BLADE
          </div>
        </div>

        {/* Right: HP & Rage Bars */}
        <div
          style={{
            width: 440,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* HP Bar */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.mute,
                marginBottom: 3,
              }}
            >
              <span>HP</span>
              <span style={{ color: C.ink }}>128,400 / 128,400</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: C.ink2,
                border: `1px solid ${C.line}`,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: C.accent,
                }}
              />
            </div>
          </div>

          {/* Rage Bar */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.mute,
                marginBottom: 3,
              }}
            >
              <span>RAGE (怒气)</span>
              <span style={{ color: rageFill >= 95 ? C.accent2 : C.accent }}>
                {Math.round(rageFill)}% {rageFill >= 95 ? '[MAX]' : ''}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: C.ink2,
                border: `1px solid ${C.line}`,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${rageFill}%`,
                  height: '100%',
                  backgroundColor: rageFill >= 95 ? C.accent2 : C.accentRed,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
