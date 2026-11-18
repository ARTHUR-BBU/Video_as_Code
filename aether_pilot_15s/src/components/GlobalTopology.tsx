import React from 'react';
import { useCurrentFrame } from 'remotion';
import { TOKENS } from '../theme/tokens';

interface GlobalTopologyProps {
  progress?: number;
  jitter: boolean;
}

export const GlobalTopology: React.FC<GlobalTopologyProps> = ({ jitter }) => {
  const frame = useCurrentFrame();

  // Subtle coordinate drift
  const driftX = Math.sin(frame * 0.08) * (jitter ? 4 : 0.5);
  const driftY = Math.cos(frame * 0.08) * (jitter ? 4 : 0.5);

  const nodes = [
    { x: 380, y: 320, name: 'SFO-01', lat: jitter ? '82ms' : '1.9ms' },
    { x: 560, y: 280, name: 'NYC-04', lat: jitter ? '79ms' : '2.0ms' },
    { x: 840, y: 260, name: 'LHR-02', lat: jitter ? '91ms' : '1.7ms' },
    { x: 960, y: 290, name: 'FRA-03', lat: jitter ? '88ms' : '2.1ms' },
    { x: 1320, y: 360, name: 'NRT-01', lat: jitter ? '94ms' : '1.8ms' },
    { x: 1240, y: 520, name: 'SIN-01', lat: jitter ? '86ms' : '2.4ms' },
    { x: 1420, y: 640, name: 'SYD-02', lat: jitter ? '108ms' : '3.1ms' },
    { x: 620, y: 620, name: 'GRU-01', lat: jitter ? '124ms' : '3.8ms' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0a0d10',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Precision Grid Matrix */}
      <svg
        viewBox="0 0 1920 1080"
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${driftX}px, ${driftY}px)`,
        }}
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle cx="80" cy="80" r="1.5" fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>

        <rect width="1920" height="1080" fill="url(#grid)" />

        {/* Global Connection Links */}
        <g stroke={jitter ? 'rgba(196,36,42,0.35)' : 'rgba(27,108,128,0.45)'} strokeWidth="1.5" strokeDasharray={jitter ? '4 4' : 'none'}>
          <line x1={380} y1={320} x2={560} y2={280} />
          <line x1={560} y1={280} x2={840} y2={260} />
          <line x1={840} y1={260} x2={960} y2={290} />
          <line x1={960} y1={290} x2={1320} y2={360} />
          <line x1={1320} y1={360} x2={1240} y2={520} />
          <line x1={1240} y1={520} x2={1420} y2={640} />
          <line x1={380} y1={320} x2={620} y2={620} />
        </g>

        {/* Active Nodes */}
        {nodes.map((node, i) => {
          const pulse = (Math.sin(frame * 0.15 + i) + 1) / 2;
          const nodeColor = jitter ? TOKENS.negative : TOKENS.accent;

          return (
            <g key={i} transform={`translate(${node.x}, ${node.y})`}>
              <circle r={jitter ? 4 + pulse * 4 : 4} fill={nodeColor} />
              <circle r={12 + pulse * 6} fill="none" stroke={nodeColor} strokeWidth={1} opacity={0.4} />
              <text x={18} y={-4} fill="#ffffff" fontSize={12} fontFamily={TOKENS.fontMono} fontWeight={600}>
                {node.name}
              </text>
              <text x={18} y={12} fill={jitter ? TOKENS.negative : TOKENS.positive} fontSize={11} fontFamily={TOKENS.fontMono}>
                {node.lat}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
