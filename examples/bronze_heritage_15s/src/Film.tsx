import React from 'react';
import { Sequence } from 'remotion';
import { Act1 } from './acts/Act1';
import { Act2 } from './acts/Act2';
import { Act3 } from './acts/Act3';

export const Film: React.FC = () => {
  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', backgroundColor: '#07080a' }}>
      {/* Act 1: 鸿蒙未判，以铜铸礼 (0s - 4.5s / f0 - f270) */}
      <Sequence from={0} durationInFrames={270}>
        <Act1 />
      </Sequence>

      {/* Act 2: 吉金铭文，天地神序 (4.5s - 10.5s / f270 - f630) */}
      <Sequence from={270} durationInFrames={360}>
        <Act2 />
      </Sequence>

      {/* Act 3: 国之重器，鼎立千秋 (10.5s - 15.0s / f630 - f900) */}
      <Sequence from={630} durationInFrames={270}>
        <Act3 />
      </Sequence>
    </div>
  );
};
