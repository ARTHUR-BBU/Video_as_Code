import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT, U } from '../brand/tokens';
import { E, mix, prog } from '../lib/anim';
import { ACT, copy, CUE, f60, H, W } from '../timeline';
import { BENTO_CORE } from './Act1';

const L = (abs: number) => abs - ACT.telemetry.from;

export const Act2: React.FC = () => {
  const f = useCurrentFrame();

  // Expansion of Bento card from core
  const expand = prog(f, L(CUE.handoff), L(CUE.bento) + f60(10), E.expo);
  // Implosion at the end of Act 2
  const collapse = prog(f, L(CUE.exit2), L(CUE.collapse), E.inOut);

  // Card dimensions
  const cardW = 1080 * U;
  const cardH = 460 * U;
  const currentW = mix(BENTO_CORE.d, cardW, expand) * (1 - collapse);
  const currentH = mix(BENTO_CORE.d, cardH, expand) * (1 - collapse);

  // Counter: 0 to 201
  const countP = prog(f, L(CUE.countStart), L(CUE.badgeLock), E.outSoft);
  const countVal = Math.min(201, Math.floor(countP * 201));

  // Badge arrival
  const badgeP = prog(f, L(CUE.badgeLock), L(CUE.badgeLock) + f60(10), E.outSoft);

  // Waveform telemetry arrival
  const waveP = prog(f, L(CUE.countStart), L(CUE.badgeLock) + f60(15), E.smooth);
  const snapP = prog(f, L(CUE.waveSnap), L(CUE.waveSnap) + f60(8), E.outSoft);

  // 16 animated waveform bars (driven purely from render clock)
  const bars = Array.from({ length: 16 }).map((_, i) => {
    const freq = 0.35;
    const wave = Math.sin(f * freq + i * 0.7) * 0.5 + 0.5;
    const wave2 = Math.cos(f * freq * 0.5 + i * 0.3) * 0.3 + 0.3;
    return Math.max(0.1, Math.min(1.0, (wave + wave2) * 0.7));
  });

  const titleCopy = copy('bento-title');
  const badgeCopy = copy('bento-badge');
  const statCopy = copy('bento-stat');

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      {/* Central Bento Grid Container */}
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: H / 2,
          width: currentW,
          height: currentH,
          transform: 'translate(-50%, -50%)',
          background: C.mist,
          border: `1.5px solid ${C.line}`,
          borderRadius: 16 * U,
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 28px 90px rgba(0,0,0,0.4)',
          opacity: expand,
        }}
      >
        {expand > 0.8 && (
          <>
            {/* Left Column: Procedural Voices Counter */}
            <div
              style={{
                flex: 1,
                padding: '40px 48px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRight: `1px solid ${C.line}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 84 * U,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.0,
                  }}
                >
                  {String(countVal).padStart(3, '0')}
                </div>
                <div
                  data-text={titleCopy.id}
                  style={{
                    fontFamily: FONT.text,
                    fontSize: 20 * U,
                    color: C.accent,
                    marginTop: 6,
                    fontWeight: 500,
                  }}
                >
                  {titleCopy.text}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: C.badgeBg,
                  border: `1px solid ${C.accent2}`,
                  borderRadius: 6,
                  alignSelf: 'flex-start',
                  transform: `scale(${badgeP})`,
                  opacity: badgeP,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent2 }} />
                <span
                  data-text={badgeCopy.id}
                  style={{ fontFamily: FONT.mono, fontSize: 14 * U, color: C.accent2, fontWeight: 600 }}
                >
                  {badgeCopy.text}
                </span>
              </div>
            </div>

            {/* Right Column: Waveform Visualizer & Latency */}
            <div
              style={{
                flex: 1.1,
                padding: '40px 48px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>

                {/* Equalizer Bars */}
                <div
                  style={{
                    height: 80 * U,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 6 * U,
                    opacity: waveP,
                  }}
                >
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h * 100}%`,
                        background: i % 2 === 0 ? C.accent : C.ink,
                        borderRadius: 3 * U,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Telemetry Indicator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: C.telemetryBg,
                  border: `1px solid ${C.accent}`,
                  padding: '10px 18px',
                  borderRadius: 8 * U,
                  transform: `translateY(${(1 - snapP) * 10}px)`,
                  opacity: snapP,
                }}
              >
                <span
                  data-text={statCopy.id}
                  style={{ fontFamily: FONT.mono, fontSize: 18 * U, color: C.accent, fontWeight: 700 }}
                >
                  {statCopy.text}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* When collapsed or expanding: show central core */}
      {(expand < 0.8 || collapse > 0) && (
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: H / 2,
            transform: 'translate(-50%, -50%)',
            width: BENTO_CORE.d,
            height: BENTO_CORE.d,
            borderRadius: '50%',
            background: C.accent,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
