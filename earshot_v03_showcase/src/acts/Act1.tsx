import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, SAFE, TYPE, U } from '../brand/tokens';
import { Chain, chainLayout } from '../fx/Chain';
import { E, lmix, mix, prog } from '../lib/anim';
import { camera, toScreen } from '../lib/camera';
import { baselineOf, measureTracked } from '../lib/measure';
import { ACT, chainOf, CUE, f60, H, W } from '../timeline';

const L = (abs: number) => abs - ACT.statement.from;

export const STATEMENT_SIZE = TYPE.display.size * U;
const FRAGS = chainOf('statement');
const LINE = FRAGS.map((c) => c.text).join(' ');
const DOT = { d: 0.22, gap: 0.08 };

export const BENTO_CORE = { x: W / 2, y: H / 2, d: 32 };
export const DOT_TRAVEL = { from: CUE.depart, to: CUE.handoff, ease: E.smooth };

export const Act1: React.FC = () => {
  const f = useCurrentFrame();
  const disp = TYPE.display;

  const unit = measureTracked(LINE, 100, disp.weight, disp.track) / 100 - disp.track;
  const size = Math.min(STATEMENT_SIZE, (W - 2 * SAFE.x) / (unit + DOT.gap + DOT.d));
  const tail = (DOT.gap + DOT.d) * size;
  const lay = chainLayout('statement', { role: 'display', size, tail });
  const last = lay.frags.length - 1;
  const base = lay.top + baselineOf(size, disp.weight, disp.lead);
  const period = { x: lay.lineLeft[last] + lay.width[last] + (DOT.gap + DOT.d / 2) * size, y: base - (DOT.d * size) / 2 };

  // Subtle linear push from frame 0
  const cam = { ax: W / 2, ay: H / 2, sx: W / 2, sy: H / 2, k: lmix(1, 1.05, prog(f, 0, L(DOT_TRAVEL.from), E.linear)) };

  // Ignition crosshair (f0 - f25)
  const igniteProg = prog(f, L(CUE.ignite), L(CUE.ignite) + f60(16), E.outSoft);
  const axisProg = prog(f, L(CUE.axis), L(CUE.axis) + f60(20), E.expo);

  // Dot birth and flight
  const born = prog(f, L(CUE.fragA), L(CUE.fragA) + f60(10), E.smooth);
  const fly = prog(f, L(DOT_TRAVEL.from), L(DOT_TRAVEL.to), DOT_TRAVEL.ease);
  const onScreen = toScreen(cam, { x: period.x, y: period.y });
  const cx = mix(onScreen.x, BENTO_CORE.x, fly);
  const cy = mix(onScreen.y, BENTO_CORE.y, fly);
  const dotDiam = mix(DOT.d * size * cam.k, BENTO_CORE.d, fly);

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      {/* Precision Axis Grid Lines */}
      {axisProg > 0 && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: (1 - fly) * 0.4,
          }}
        >
          <line
            x1={W / 2 - axisProg * 600}
            y1={H / 2}
            x2={W / 2 + axisProg * 600}
            y2={H / 2}
            stroke={C.accent}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </svg>
      )}

      {/* Crosshair on frame 0 */}
      {igniteProg > 0 && f < L(CUE.fragA) && (
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: H / 2,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            opacity: 1 - prog(f, L(CUE.axis), L(CUE.fragA), E.smooth),
          }}
        >
          <div style={{ width: 12, height: 12, border: `1px solid ${C.accent}`, transform: `scale(${igniteProg})` }} />
        </div>
      )}

      {/* Main Fragment Line */}
      <div style={camera(cam)}>
        <Chain chain="statement" frame={f} from={ACT.statement.from} role="display" size={size} tail={tail} />
      </div>

      {/* Carrier Object (Dot / Core) */}
      {born > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: dotDiam,
            height: dotDiam,
            borderRadius: '50%',
            background: C.accent,
            transform: `translate(${cx - dotDiam / 2}px, ${cy - dotDiam / 2}px)`,
            opacity: born,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
