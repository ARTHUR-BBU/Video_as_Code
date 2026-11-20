import React from 'react';
import { Composition, Folder } from 'remotion';
import { Act1 } from './acts/Act1';
import { Act2 } from './acts/Act2';
import { Act3 } from './acts/Act3';
import { C } from './brand/tokens';
import { Film, FilmProps } from './Film';
import { Audit } from './lib/Audit';
import { FontGate } from './lib/FontGate';
import { ACT, FPS, H, TOTAL, W } from './timeline';

const solo = (Act: React.FC) => {
  const Solo: React.FC<FilmProps> = ({ audit = false, safe }) => (
    <FontGate>
      <div style={{ position: 'absolute', inset: 0, background: C.paper }}>
        <Act />
        {audit && <Audit safe={safe} />}
      </div>
    </FontGate>
  );
  return Solo;
};

const Act1Solo = solo(Act1);
const Act2Solo = solo(Act2);
const Act3Solo = solo(Act3);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Film"
      component={Film}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ audit: false } as FilmProps}
    />

    <Folder name="Acts">
      <Composition
        id="Act1"
        component={Act1Solo}
        durationInFrames={ACT.statement.dur}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audit: false } as FilmProps}
      />
      <Composition
        id="Act2"
        component={Act2Solo}
        durationInFrames={ACT.telemetry.dur}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audit: false } as FilmProps}
      />
      <Composition
        id="Act3"
        component={Act3Solo}
        durationInFrames={ACT.payoff.dur}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audit: false } as FilmProps}
      />
    </Folder>
  </>
);
