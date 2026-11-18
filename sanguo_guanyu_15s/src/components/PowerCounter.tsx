import React from 'react';
import { interpolate } from 'remotion';
import { C, FONT } from '../brand/tokens';

interface PowerCounterProps {
  frame: number;
  startFrame: number;
  endFrame: number;
  targetPower?: number;
}

export const PowerCounter: React.FC<PowerCounterProps> = ({
  frame,
  startFrame,
  endFrame,
  targetPower = 99999,
}) => {
  const currentVal = Math.round(
    interpolate(frame, [startFrame, endFrame], [0, targetPower], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - Math.pow(1 - t, 4), // power4 out
    })
  );

  const formatted = currentVal.toLocaleString();
  const isMax = currentVal >= targetPower;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        fontFamily: FONT.mono,
      }}
    >
      <div
        style={{
          fontSize: 54,
          fontWeight: 800,
          color: isMax ? C.accent2 : C.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {formatted}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: isMax ? C.accent : C.mute,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>▲</span>
        <span>{isMax ? 'MAX' : 'CALC'}</span>
      </div>
    </div>
  );
};
