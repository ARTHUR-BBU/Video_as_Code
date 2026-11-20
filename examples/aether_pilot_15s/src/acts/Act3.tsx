import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BrandLockup } from '../components/BrandLockup';
import { TOKENS } from '../theme/tokens';

export const Act3: React.FC = () => {
  const frame = useCurrentFrame(); // 0 to 300 (corresponds to f600 - f900 in Film)

  // Subtle living hold micro-drift (0.4 px/frame, strictly obeying HB18)
  const driftY = interpolate(frame, [0, 300], [0, -10], { extrapolateRight: 'clamp' });
  const subtleScale = interpolate(frame, [0, 300], [1, 1.02], { extrapolateRight: 'clamp' });

  // Tagline fragment "Speed of light."
  const tagOpacity = interpolate(frame, [30, 45, 140, 160], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tagY = interpolate(frame, [30, 45], [16, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0a0d10',
        transform: `translateY(${driftY}px) scale(${subtleScale})`,
      }}
    >
      <BrandLockup />

      {/* Ephemeral Climax Callout */}
      {frame >= 30 && frame < 170 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 150,
            transform: `translateX(-50%) translateY(${tagY}px)`,
            fontSize: 32,
            fontWeight: 600,
            fontFamily: TOKENS.fontDisplay,
            color: TOKENS.accent,
            opacity: tagOpacity,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Speed of light.
        </div>
      )}
    </div>
  );
};
