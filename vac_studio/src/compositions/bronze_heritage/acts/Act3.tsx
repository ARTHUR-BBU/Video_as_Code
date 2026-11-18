import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BronzeVesselHero } from '../components/BronzeVesselHero';
import { TOKENS } from '../theme/tokens';

export const Act3: React.FC<{ frameProp?: number }> = ({ frameProp }) => {
  const remotionFrame = useCurrentFrame();
  const frame = frameProp !== undefined ? frameProp : remotionFrame;
  const { fps } = useVideoConfig();

  // Wide camera view with subtle living hold micro-drift (0.35px/f, strictly obeying HB18)
  const scale = interpolate(frame, [0, 270], [0.94, 0.98], { extrapolateRight: 'clamp' });
  const panY = interpolate(frame, [0, 270], [30, 15], { extrapolateRight: 'clamp' });

  // Spring entrance for title
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 100, mass: 1 },
  });

  const enterOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [0, 30], [24, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: enterOpacity,
        overflow: 'hidden',
        willChange: 'opacity',
      }}
    >
      {/* Subtle Dark Vignette & Floor Grounding */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(7, 8, 10, 0.52)',
          pointerEvents: 'none',
        }}
      />

      {/* Central Monumental Brand / Cultural Lockup */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: TOKENS.text,
          fontFamily: TOKENS.fontDisplay,
          pointerEvents: 'none',
          transform: `translateY(${textY}px)`,
        }}
      >
        {/* Ancient Chinese Seal Title */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: TOKENS.gold,
            marginBottom: 8,
            transform: `scale(${titleScale})`,
          }}
        >
          吉金永固
        </div>

        {/* English Academic Title */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '0.35em',
            color: 'rgba(242, 239, 233, 0.85)',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          BRONZE & ETERNITY
        </div>

        {/* Core Cultural Proposition */}
        <div
          style={{
            fontSize: 13,
            fontFamily: TOKENS.fontMono,
            color: TOKENS.muted,
            letterSpacing: '0.1em',
          }}
        >
          SACRED ORDER OF HEAVEN · CAST IN 500 BCE
        </div>
      </div>

      {/* Specimen Ledger Footer (Academic Citation) */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          fontFamily: TOKENS.fontMono,
          color: 'rgba(255, 255, 255, 0.45)',
          borderTop: `1px solid ${TOKENS.rule}`,
          paddingTop: 14,
        }}
      >
        <span>COLLECTION: THE METROPOLITAN MUSEUM OF ART</span>
        <span>ACCESSION: MET 61.234</span>
        <span>LICENSE: PUBLIC DOMAIN (CC0)</span>
      </div>
    </div>
  );
};
