import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BronzeVesselHero } from '../components/BronzeVesselHero';
import { MuseumAssetCard } from '../components/MuseumAssetCard';
import { TOKENS } from '../theme/tokens';

export const Act2: React.FC = () => {
  const frame = useCurrentFrame(); // 0 to 360 frames (corresponds to f270 - f630 in Film)

  // Camera transition to the cauldron's body & leg
  const scale = interpolate(frame, [0, 360], [1.7, 1.35], { extrapolateRight: 'clamp' });
  const panX = interpolate(frame, [0, 360], [-120, 60], { extrapolateRight: 'clamp' });
  const panY = interpolate(frame, [0, 360], [-80, -20], { extrapolateRight: 'clamp' });

  // Entrance & Exit fades
  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const exitOpacity = interpolate(frame, [335, 360], [1, 0], { extrapolateLeft: 'clamp' });

  // Museum Card appearance
  const cardOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' });
  const cardX = interpolate(frame, [25, 45], [-30, 0], { extrapolateRight: 'clamp' });

  // Fragment 1: "Heaven and earth." (f30 to f160)
  const frag1Opacity = interpolate(frame, [30, 50, 140, 160], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag1Y = interpolate(frame, [30, 50], [16, 0], { extrapolateRight: 'clamp' });

  // Fragment 2: "Etched in eternity." (f180 to f310)
  const frag2Opacity = interpolate(frame, [180, 200, 290, 310], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frag2Y = interpolate(frame, [180, 200], [16, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: TOKENS.ground,
        opacity: enterOpacity * exitOpacity,
      }}
    >
      {/* Real Museum Artifact Macro View */}
      <BronzeVesselHero scale={scale} panX={panX} panY={panY} />

      {/* Subtle Museum Scrim */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(7, 8, 10, 0.4)',
          pointerEvents: 'none',
        }}
      />

      {/* Museum Metadata HUD Card (Swiss Bento placement, left-top) */}
      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 100,
          opacity: cardOpacity,
          transform: `translateX(${cardX}px)`,
        }}
      >
        <MuseumAssetCard
          accession="MET: 61.234"
          title="Ritual Tripod Cauldron with Cover (Ding)"
          dating="5th–4th century BCE · Eastern Zhou"
          medium="Cast Bronze with Interlocking Dragon Relief"
          institution="The Metropolitan Museum of Art"
        />
      </div>

      {/* Typography Overlay (Fragment Chains, bottom-left) */}
      <div
        style={{
          position: 'absolute',
          left: 100,
          bottom: 120,
          fontFamily: TOKENS.fontDisplay,
          color: TOKENS.text,
          pointerEvents: 'none',
        }}
      >
        {frame >= 30 && frame < 170 && (
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              opacity: frag1Opacity,
              transform: `translateY(${frag1Y}px)`,
              color: TOKENS.text,
            }}
          >
            Heaven and earth.
          </div>
        )}

        {frame >= 180 && (
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              opacity: frag2Opacity,
              transform: `translateY(${frag2Y}px)`,
              color: TOKENS.gold,
            }}
          >
            Etched in eternity.
          </div>
        )}
      </div>

      {/* Precision Micro Inspection Grid (taste-skill rule: delicate 1px reference line) */}
      <div
        style={{
          position: 'absolute',
          right: 120,
          bottom: 120,
          fontFamily: TOKENS.fontMono,
          fontSize: 11,
          color: TOKENS.muted,
          borderLeft: `2px solid ${TOKENS.gold}`,
          paddingLeft: 14,
        }}
      >
        <div>CASTING: SECTION-MOLD TECHNIQUE</div>
        <div style={{ marginTop: 4, color: TOKENS.patina }}>PATINA: MALACHITE / AZURITE CRUST</div>
        <div style={{ marginTop: 4, color: TOKENS.faint }}>RESOLUTION: 4000 × 3001 RAW CRAWL</div>
      </div>
    </div>
  );
};
