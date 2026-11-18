import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BronzeVesselHero } from './components/BronzeVesselHero';
import { Act1 } from './acts/Act1';
import { Act2 } from './acts/Act2';
import { Act3 } from './acts/Act3';

export const Film: React.FC = () => {
  const frame = useCurrentFrame();

  // Unified camera timeline across all 900 frames (eliminates scene boundary remount spikes)
  let scale = 1;
  let panX = 0;
  let panY = 0;

  if (frame < 270) {
    // Act 1 (f0 - f270)
    scale = interpolate(frame, [0, 270], [2.4, 1.85], { extrapolateRight: 'clamp' });
    panX = interpolate(frame, [0, 270], [180, -80], { extrapolateRight: 'clamp' });
    panY = interpolate(frame, [0, 270], [240, 120], { extrapolateRight: 'clamp' });
  } else if (frame < 630) {
    // Act 2 (f270 - f630)
    const act2Frame = frame - 270;
    scale = interpolate(act2Frame, [0, 360], [1.7, 1.35], { extrapolateRight: 'clamp' });
    panX = interpolate(act2Frame, [0, 360], [-120, 60], { extrapolateRight: 'clamp' });
    panY = interpolate(act2Frame, [0, 360], [-80, -20], { extrapolateRight: 'clamp' });
  } else {
    // Act 3 (f630 - f900)
    const act3Frame = frame - 630;
    scale = interpolate(act3Frame, [0, 270], [0.94, 0.98], { extrapolateRight: 'clamp' });
    panX = 0;
    panY = interpolate(act3Frame, [0, 270], [30, 15], { extrapolateRight: 'clamp' });
  }

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', backgroundColor: '#07080a' }}>
      {/* Persistent Zero-Remount Hero Vessel Element */}
      <BronzeVesselHero scale={scale} panX={panX} panY={panY} />

      {/* Act 1: 鸿蒙未判，以铜铸礼 (0s - 4.5s / f0 - f270) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          visibility: frame < 270 ? 'visible' : 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Act1 frameProp={Math.min(270, frame)} />
      </div>

      {/* Act 2: 吉金铭文，天地神序 (4.5s - 10.5s / f270 - f630) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          visibility: frame >= 270 && frame < 630 ? 'visible' : 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Act2 frameProp={Math.max(0, Math.min(360, frame - 270))} />
      </div>

      {/* Act 3: 国之重器，鼎立千秋 (10.5s - 15.0s / f630 - f900) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          visibility: frame >= 630 ? 'visible' : 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Act3 frameProp={Math.max(0, Math.min(270, frame - 630))} />
      </div>
    </div>
  );
};
