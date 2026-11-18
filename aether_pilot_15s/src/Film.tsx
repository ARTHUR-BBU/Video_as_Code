import React from 'react';
import { Sequence } from 'remotion';
import { Act1 } from './acts/Act1';
import { Act2 } from './acts/Act2';
import { Act3 } from './acts/Act3';

export const Film: React.FC = () => {
  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      {/* Act 1: The Global Jitter & Latency Pain (0s - 4.0s / f0 - f240) */}
      <Sequence from={0} durationInFrames={240}>
        <Act1 />
      </Sequence>

      {/* Act 2: Aether Routes - taste-skill v2.1 Real App Console (4.0s - 10.0s / f240 - f600) */}
      <Sequence from={240} durationInFrames={360}>
        <Act2 />
      </Sequence>

      {/* Act 3: Value Payoff - Brand Geometric Lockup (10.0s - 15.0s / f600 - f900) */}
      <Sequence from={600} durationInFrames={300}>
        <Act3 />
      </Sequence>
    </div>
  );
};
