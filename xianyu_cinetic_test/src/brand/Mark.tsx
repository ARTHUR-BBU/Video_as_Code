import React from 'react';
import { C } from './tokens';

// Xianyu Geometric Fish Mark:
// Formed by three balanced geometric primitives on a 100-unit box:
// A: The upper streamlined fish body arch
// B: The lower agile tail fin block
// D: The iconic golden fish-eye dot (the film's story carrier object)
export const MARK = {
  A: { d: 'M0 50 A50 50 0 0 1 100 50 Z', cx: 50, cy: 25, w: 100, h: 50 },
  B: { x: 0, y: 58, w: 46, h: 42, r: 4 },
  D: { cx: 77, cy: 79, r: 21 },
};

export type Piece = 'A' | 'B' | 'D';

/** Per-piece pose in mark units. `origin` defaults to the piece centre; set it to an edge to squash against it. */
export type PieceXf = { x?: number; y?: number; rot?: number; s?: number; sx?: number; sy?: number; o?: number; origin?: [number, number] };

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
      {show('B') && <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={B.r} fill={ink} transform={xf(b, B.x + B.w / 2, B.y + B.h / 2)} opacity={b?.o ?? 1} />}
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
