import React from 'react';
import { Sequence, interpolate } from 'remotion';

// ============================================================================
// UZ (Unmanaged User-Code Zone): Non-declarative custom hooks & physics logic
// NOTE: Critical complex hook - DO NOT TOUCH OR REFORMAT
// Preserves exact comments, indentation, blank lines, and AST node integrity
// ============================================================================
export const useComplexPhysics = (factor: number) => {
  // Custom bitwise shader math & lambda closure
  const computeVector = (x: number, y: number) => {
    return ((x << 2) ^ (y >> 1)) * factor;
  };
  return { computeVector };
};

const PACE = {
  calm: 1.0,
  dramatic: 1.5,
};

function Act1({ enterPace }: { enterPace: number }) {
  return <div>Act 1 Content (Pace: {enterPace})</div>;
}

function Act2() {
  return <div>Act 2 Dynamic Content</div>;
}

function calcDynamicDuration(_props: any): number {
  return 360;
}

// Composition Component with both MDZ and UZ zones
export const SampleFilmComposition: React.FC<{ props?: any }> = ({ props }) => {
  const { computeVector } = useComplexPhysics(0.42);

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#07080a' }}>
      {/* ================================================================= */}
      {/* MDZ: Managed Declarative Zone (Static literal attributes, editable) */}
      {/* ================================================================= */}
      {/* @vac:managed:scene-01:start */}
      <Sequence from={0} durationInFrames={270} name="Scene01">
        <Act1 enterPace={PACE.calm} />
      </Sequence>
      {/* @vac:managed:scene-01:end */}

      {/* ================================================================= */}
      {/* OPAQUE: Dynamic Expression Zone (Read-only, GUI mutation blocked)  */}
      {/* ================================================================= */}
      <Sequence from={270} durationInFrames={calcDynamicDuration(props)} name="Scene02_Dynamic">
        <Act2 />
      </Sequence>
    </div>
  );
};
