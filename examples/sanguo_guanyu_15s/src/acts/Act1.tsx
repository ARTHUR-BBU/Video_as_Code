import React from 'react';
import { interpolate, staticFile } from 'remotion';
import { C, FONT } from '../brand/tokens';

interface ActProps {
  frame: number;
}

export const Act1: React.FC<ActProps> = ({ frame }) => {
  // Act1 runs from f0 to f180
  const f = frame;

  // Background portrait fade-in and scale drift (Living Hold)
  const portraitAlpha = interpolate(f, [15, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const portraitScale = interpolate(f, [0, 180], [1.0, 1.05], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Camera pan left towards end of Act 1 (f120 to f180) to make room for Bento HUD
  const panX = interpolate(f, [120, 180], [0, -320], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => t * t * (3 - 2 * t), // smooth step
  });

  // Laser axis draw at f15 - f40
  const laserWidth = interpolate(f, [15, 40], [0, 1920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const laserAlpha = interpolate(f, [15, 25, 55], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Typography entrance: f30 to f60
  const titleY = interpolate(f, [30, 60], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3), // power3 out
  });
  const titleAlpha = interpolate(f, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        overflow: 'hidden',
      }}
    >
      {/* 1. Portrait Layer with Parallax Pan */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          opacity: portraitAlpha,
          transform: `translate(${panX}px, 0px) scale(${portraitScale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <img
          src={staticFile('images/guanyu_portrait.jpg')}
          alt="Guan Yu Portrait"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Dark Vignette Overlay to ensure text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)',
          }}
        />
      </div>

      {/* 2. Horizontal Azure Laser Axis */}
      {laserAlpha > 0.01 && (
        <div
          style={{
            position: 'absolute',
            top: 540,
            left: 0,
            width: laserWidth,
            height: 2,
            backgroundColor: C.accent,
            opacity: laserAlpha,
          }}
        />
      )}

      {/* 3. Hero Titles */}
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 140,
          opacity: titleAlpha,
          transform: `translate(0px, ${titleY}px)`,
          fontFamily: FONT.text,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: C.accent,
            letterSpacing: '0.2em',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          // GOD OF WAR //
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: '0.04em',
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          武圣降临
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 600,
            color: C.accent2,
            letterSpacing: '0.06em',
          }}
        >
          汉寿亭侯 · 关云长
        </div>
      </div>
    </div>
  );
};
