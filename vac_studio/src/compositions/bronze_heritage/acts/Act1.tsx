import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BronzeVesselHero } from '../components/BronzeVesselHero';
import { TOKENS } from '../theme/tokens';

export const Act1: React.FC<{ frameProp?: number }> = ({ frameProp }) => {
  const remotionFrame = useCurrentFrame();
  const frame = frameProp !== undefined ? frameProp : remotionFrame;

  // Macro camera pan across the intricate dragon relief on the lid
  const scale = interpolate(frame, [0, 270], [2.4, 1.85], { extrapolateRight: 'clamp' });
  const panX = interpolate(frame, [0, 270], [180, -80], { extrapolateRight: 'clamp' });
  const panY = interpolate(frame, [0, 270], [240, 120], { extrapolateRight: 'clamp' });

  // Fragment 1: "Three thousand years." (f25 to f120)
  const frag1Opacity = interpolate(frame, [25, 45, 105, 125], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag1Y = interpolate(frame, [25, 45], [16, 0], { extrapolateRight: 'clamp' });

  // Fragment 2: "Cast in bronze." (f135 to f245)
  const frag2Opacity = interpolate(frame, [135, 155, 230, 250], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag2Y = interpolate(frame, [135, 155], [16, 0], { extrapolateRight: 'clamp' });

  // Exit transition
  const exitOpacity = interpolate(frame, [250, 270], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: exitOpacity, willChange: 'opacity' }}>
      {/* Subtle Museum Scrim (taste-skill rule: neutral scrim over photo is permitted) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(7, 8, 10, 0.45)',
          pointerEvents: 'none',
        }}
      />

      {/* Typography Overlay (Fragment Chains) */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 120,
          fontFamily: TOKENS.fontDisplay,
          color: TOKENS.text,
          pointerEvents: 'none',
        }}
      >
        {frame >= 25 && frame < 130 && (
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              opacity: frag1Opacity,
              transform: `translateY(${frag1Y}px)`,
              willChange: 'opacity, transform',
            }}
          >
            Three thousand years.
          </div>
        )}

        {frame >= 135 && (
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              opacity: frag2Opacity,
              transform: `translateY(${frag2Y}px)`,
              color: TOKENS.gold,
              willChange: 'opacity, transform',
            }}
          >
            Cast in bronze.
          </div>
        )}
      </div>

      {/* Museum Specimen Corner Telemetry */}
      <div
        style={{
          position: 'absolute',
          right: 80,
          top: 60,
          fontFamily: TOKENS.fontMono,
          fontSize: 11,
          color: TOKENS.muted,
          textAlign: 'right',
        }}
      >
        <div style={{ color: TOKENS.gold, fontWeight: 700 }}>THE METROPOLITAN MUSEUM OF ART</div>
        <div style={{ marginTop: 4 }}>OBJECT: CHINESE TRIPOD CAULDRON (DING)</div>
        <div style={{ marginTop: 2, color: TOKENS.faint }}>DATE: 5TH–4TH CENTURY BCE</div>
      </div>
    </div>
  );
};
