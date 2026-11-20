import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BronzeHeritageFilm"
      component={Film}
      durationInFrames={900}
      fps={60}
      width={1920}
      height={1080}
    />
  );
};
