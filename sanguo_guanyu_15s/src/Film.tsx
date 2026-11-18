import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ACT } from './timeline';
import { C } from './brand/tokens';
import { Act1 } from './acts/Act1';
import { Act2 } from './acts/Act2';
import { Act3 } from './acts/Act3';
import { Act4 } from './acts/Act4';
import { GameHUD } from './components/GameHUD';

export const Film: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        backgroundColor: C.paper,
        overflow: 'hidden',
      }}
    >
      {/* Act 1: 神将降世 (f0 - f180) */}
      {frame < ACT.act1.dur && <Act1 frame={frame} />}

      {/* Act 2: 战神遥测 (f180 - f420) */}
      {frame >= ACT.act2.from && frame < ACT.act3.from && (
        <Act2 frame={frame} />
      )}

      {/* Act 3: 沙场狂斩 (f420 - f750) */}
      {frame >= ACT.act3.from && frame < ACT.act4.from && (
        <Act3 frame={frame} />
      )}

      {/* Act 4: 武圣定岳 (f750 - f900) */}
      {frame >= ACT.act4.from && <Act4 frame={frame} />}

      {/* Persistent AAA Game HUD (Status Bars, Corner Brackets, Embers) */}
      <GameHUD frame={frame} />
    </div>
  );
};
