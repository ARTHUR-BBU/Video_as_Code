import React from 'react';
import { C } from './tokens';

// Earshot Sonic Prism / Acoustic Crystal Mark:
// Formed by 3 balanced geometric primitives on a 100-unit box:
// A: The upper acoustic chevron (high frequency shield)
// B: The lower acoustic chevron (sub-bass foundation)
// D: The central glowing cyber-core (the film's carrier object)
export const MARK = {
  A: { d: 'M 16 38 L 50 16 L 84 38 L 76 45 L 50 28 L 24 45 Z', cx: 50, cy: 30, w: 68, h: 29 },
  B: { d: 'M 16 62 L 50 84 L 84 62 L 76 55 L 50 72 L 24 55 Z', cx: 50, cy: 70, w: 68, h: 29 },
  D: { cx: 50, cy: 50, r: 15 },
};

export type Piece = 'A' | 'B' | 'D';

export type PieceXf = {
  x?: number;
  y?: number;
  rot?: number;
  s?: number;
  sx?: number;
  sy?: number;
  o?: number;
  origin?: [number, number];
};

const xf = (p: PieceXf | undefined, cx: number, cy: number) => {
  if (!p) return undefined;
  const [ox, oy] = p.origin ?? [cx, cy];
  const sx = Math.max(0, (p.s ?? 1) * (p.sx ?? 1));
  const sy = Math.max(0, (p.s ?? 1) * (p.sy ?? 1));
  return `translate(${p.x ?? 0} ${p.y ?? 0}) rotate(${p.rot ?? 0} ${ox} ${oy}) translate(${ox} ${oy}) scale(${sx} ${sy}) translate(${-ox} ${-oy})`;
};

export const Mark: React.FC<{
  size: number;
  ink?: string;
  dot?: string;
  a?: PieceXf;
  b?: PieceXf;
  d?: PieceXf;
  only?: Piece[];
  style?: React.CSSProperties;
}> = ({ size, ink = C.ink, dot = C.accent, a, b, d, only, style }) => {
  const { A, B, D } = MARK;
  const show = (p: Piece) => !only || only.includes(p);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', display: 'block', ...style }}>
      {show('A') && <path d={A.d} fill={ink} transform={xf(a, A.cx, A.cy)} opacity={a?.o ?? 1} />}
      {show('B') && <path d={B.d} fill={ink} transform={xf(b, B.cx, B.cy)} opacity={b?.o ?? 1} />}
      {show('D') && <circle cx={D.cx} cy={D.cy} r={D.r} fill={dot} transform={xf(d, D.cx, D.cy)} opacity={d?.o ?? 1} />}
    </svg>
  );
};

export const placeMark = (x: number, y: number, k = 1): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  transformOrigin: '0 0',
  transform: `translate(${x}px, ${y}px) scale(${Math.max(1e-4, k)})`,
});
