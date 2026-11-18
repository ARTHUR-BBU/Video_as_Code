import React from 'react';
import { staticFile } from 'remotion';

interface BronzeVesselHeroProps {
  scale: number;
  panX: number;
  panY: number;
  opacity?: number;
}

export const BronzeVesselHero: React.FC<BronzeVesselHeroProps> = ({
  scale,
  panX,
  panY,
  opacity = 1,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      {/* Real 4000x3001 Authentic Met Museum Photograph */}
      <img
        src={staticFile('assets/ritual-tripod-cauldron-with-cover-ding.jpg')}
        alt="Ritual Tripod Cauldron with Cover (Ding), 5th-4th century BCE, The Metropolitan Museum of Art"
        decoding="async"
        loading="eager"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      />
    </div>
  );
};
