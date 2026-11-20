import React from 'react';
import { interpolate } from 'remotion';
import { C, FONT } from '../brand/tokens';

interface RadarChartProps {
  frame: number;
  startFrame: number;
  size?: number;
}

const STATS = [
  { label: '武力', value: 100 },
  { label: '统率', value: 97 },
  { label: '智谋', value: 79 },
  { label: '政治', value: 62 },
  { label: '魅力', value: 98 },
];

export const RadarChart: React.FC<RadarChartProps> = ({
  frame,
  startFrame,
  size = 280,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;

  // Animation expansion: 0 to 1 over 24 frames
  const expand = interpolate(frame, [startFrame, startFrame + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const numSides = STATS.length;
  const angleStep = (Math.PI * 2) / numSides;
  const startAngle = -Math.PI / 2; // top

  // Background concentric polygons (rings at 0.25, 0.5, 0.75, 1.0)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Data polygon points
  const points = STATS.map((s, i) => {
    const angle = startAngle + i * angleStep;
    const r = (s.value / 100) * maxR * expand;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (maxR + 26),
      labelY: cy + Math.sin(angle) * (maxR + 24),
      label: s.label,
      value: s.value,
    };
  });

  const polyStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background rings */}
        {rings.map((lvl) => {
          const ringPts = STATS.map((_, i) => {
            const angle = startAngle + i * angleStep;
            const r = lvl * maxR;
            return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
          }).join(' ');

          return (
            <polygon
              key={lvl}
              points={ringPts}
              fill="none"
              stroke={lvl === 1.0 ? C.lineBright : C.line}
              strokeWidth={lvl === 1.0 ? 1.5 : 1}
              strokeDasharray={lvl === 1.0 ? undefined : '2,2'}
            />
          );
        })}

        {/* Spokes */}
        {STATS.map((_, i) => {
          const angle = startAngle + i * angleStep;
          const ex = cx + Math.cos(angle) * maxR;
          const ey = cy + Math.sin(angle) * maxR;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={ex}
              y2={ey}
              stroke={C.line}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon filled */}
        {expand > 0.01 && (
          <polygon
            points={polyStr}
            fill={C.radarFill}
            stroke={C.accent}
            strokeWidth={2}
          />
        )}

        {/* Vertex markers & labels */}
        {points.map((p, i) => (
          <g key={i}>
            {expand > 0.1 && (
              <circle
                cx={p.x}
                cy={p.y}
                r={3}
                fill={C.accent}
                stroke={C.paper}
                strokeWidth={1}
              />
            )}
            <text
              x={p.labelX}
              y={p.labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={p.value >= 90 ? C.accent2 : C.mute}
              fontSize={14}
              fontFamily={FONT.text}
              fontWeight={p.value >= 90 ? 700 : 500}
            >
              {p.label} {p.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
