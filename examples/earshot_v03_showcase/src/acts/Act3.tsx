import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Mark } from '../brand/Mark';
import { C, FONT, TYPE, U } from '../brand/tokens';
import { E, mix, prog, squash } from '../lib/anim';
import { ACT, chainOf, CUE, f60, H, W } from '../timeline';

const L = (abs: number) => abs - ACT.payoff.from;

export const Act3: React.FC = () => {
  const f = useCurrentFrame();

  const impactF = L(CUE.impact); // f60 local (f300 absolute)
  const subwordF = L(CUE.subword); // f90 local (f330 absolute)

  // Inward energy pull before impact
  const pull = prog(f, 0, impactF, E.contact);

  // Chevron assembly on impact
  const aSlide = prog(f, impactF - f60(14), impactF, E.contact);
  const bSlide = prog(f, impactF - f60(14), impactF, E.contact);

  // Contact squash
  const sq = squash(f - impactF);

  // Shockwave expansion
  const shockP = prog(f, impactF, impactF + f60(24), E.outSoft);

  // Slide left to make room for wordmark
  const lockupSlide = prog(f, impactF + f60(8), impactF + f60(32), E.inOut);

  const heroSize = 180 * U;
  const startX = W / 2 - heroSize / 2;
  const targetX = W / 2 - 280 * U;
  const markX = mix(startX, targetX, lockupSlide);
  const markY = H / 2 - heroSize / 2;

  // Wordmark appearance
  const wmProg = prog(f, impactF + f60(12), impactF + f60(32), E.outSoft);
  const subProg = prog(f, subwordF, subwordF + f60(20), E.outSoft);

  // Living hold camera push (HB18 compliance)
  const push = mix(1.0, 1.025, prog(f, L(CUE.end), ACT.payoff.dur, E.linear));

  const lockupFrags = chainOf('lockup');
  const wm = lockupFrags[0];
  const sub = lockupFrags[1];

  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        overflow: 'hidden',
        transform: `scale(${push})`,
        transformOrigin: '50% 50%',
      }}
    >
      {/* Shockwave ring on impact */}
      {f >= impactF && shockP < 1 && (
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: H / 2,
            width: shockP * 600 * U,
            height: shockP * 600 * U,
            borderRadius: '50%',
            border: `2px solid ${C.accent}`,
            transform: 'translate(-50%, -50%)',
            opacity: (1 - shockP) * 0.8,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Hero Mark */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${markX}px, ${markY}px)`,
        }}
      >
        <Mark
          size={heroSize}
          ink={C.ink}
          dot={C.accent}
          a={{
            y: (1 - aSlide) * -120,
            o: aSlide,
            sy: sq.along,
            sx: sq.across,
          }}
          b={{
            y: (1 - bSlide) * 120,
            o: bSlide,
            sy: sq.along,
            sx: sq.across,
          }}
          d={{
            s: f < impactF ? mix(0.4, 1.0, pull) : sq.across,
            o: 1,
          }}
        />
      </div>

      {/* Wordmark and Subtitle */}
      {wmProg > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate(${markX + heroSize + 40 * U}px, ${H / 2}px) translateY(-50%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            data-text={wm.id}
            style={{
              fontFamily: FONT.text,
              fontSize: TYPE.display.size * U * 0.8,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              transform: `translateX(${(1 - wmProg) * 30}px)`,
              opacity: wmProg,
            }}
          >
            {wm.text}
          </div>

          {subProg > 0 && (
            <div
              data-text={sub.id}
              style={{
                fontFamily: FONT.mono,
                fontSize: 22 * U,
                fontWeight: 600,
                color: C.accent,
                letterSpacing: '0.14em',
                marginTop: 14 * U,
                textTransform: 'uppercase',
                transform: `translateX(${(1 - subProg) * 20}px)`,
                opacity: subProg,
              }}
            >
              {sub.text}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
