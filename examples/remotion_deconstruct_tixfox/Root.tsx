import React from 'react';
import { Composition, Series } from 'remotion';
import { VIDEO_CONFIG } from './constants';
import { Scene01 } from './scenes/Scene01';
import { Scene02 } from './scenes/Scene02';
import { Scene03 } from './scenes/Scene03';
import { Scene04 } from './scenes/Scene04';
import { Scene05 } from './scenes/Scene05';
import { Scene06 } from './scenes/Scene06';
import { Scene07 } from './scenes/Scene07';
import { Scene08 } from './scenes/Scene08';
import { Scene09 } from './scenes/Scene09';
import { Scene10 } from './scenes/Scene10';
import { Scene11 } from './scenes/Scene11';
import { Scene12 } from './scenes/Scene12';
import { Scene13 } from './scenes/Scene13';

export const MainVideo: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={180}>
        <Scene01 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene02 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene03 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene04 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene05 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene06 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene07 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene08 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene09 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene10 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene11 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={180}>
        <Scene12 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={150}>
        <Scene13 />
      </Series.Sequence>
    </Series>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DeconstructedMotionVideo"
      component={MainVideo}
      durationInFrames={VIDEO_CONFIG.totalFrames}
      fps={VIDEO_CONFIG.fps}
      width={VIDEO_CONFIG.width}
      height={VIDEO_CONFIG.height}
    />
  );
};
