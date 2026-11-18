import React from 'react';
import { TOKENS } from '../theme/tokens';

interface LaserCursorProps {
  x: number;
  y: number;
  active?: boolean;
  label?: string;
}

export const LaserCursor: React.FC<LaserCursorProps> = ({ x, y, label = 'TARGET LOCK' }) => {

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Precision Crosshair Target */}
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
        {/* Infinite crosshair guides */}
        <line x1="-1920" y1="60" x2="1920" y2="60" stroke={TOKENS.accent} strokeWidth="1" strokeDasharray="3 6" opacity={0.35} />
        <line x1="60" y1="-1080" x2="60" y2="1080" stroke={TOKENS.accent} strokeWidth="1" strokeDasharray="3 6" opacity={0.35} />

        {/* Center reticle */}
        <circle cx="60" cy="60" r="16" fill="none" stroke={TOKENS.accent} strokeWidth="1.5" />
        <circle cx="60" cy="60" r="3" fill={TOKENS.accent} />

        {/* Corner ticks */}
        <path d="M 40 48 L 40 40 L 48 40" fill="none" stroke={TOKENS.accent} strokeWidth="1.5" />
        <path d="M 80 48 L 80 40 L 72 40" fill="none" stroke={TOKENS.accent} strokeWidth="1.5" />
        <path d="M 40 72 L 40 80 L 48 80" fill="none" stroke={TOKENS.accent} strokeWidth="1.5" />
        <path d="M 80 72 L 80 80 L 72 80" fill="none" stroke={TOKENS.accent} strokeWidth="1.5" />

        {/* Dynamic Telemetry Box */}
        <g transform="translate(76, 28)">
          <rect x="0" y="0" width="110" height="34" rx="4" fill="#000000" stroke={TOKENS.accent} strokeWidth="1" />
          <text x="8" y="14" fill={TOKENS.accent} fontSize="9" fontFamily={TOKENS.fontMono} fontWeight={700}>
            {label}
          </text>
          <text x="8" y="27" fill="#ffffff" fontSize="10" fontFamily={TOKENS.fontMono}>
            X:{Math.round(x)} Y:{Math.round(y)}
          </text>
        </g>
      </svg>
    </div>
  );
};
