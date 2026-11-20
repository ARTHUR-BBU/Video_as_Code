/**
 * Video-as-Code Studio - MotionIR Semantic Intermediate Representation
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2 (MotionIR Model Specification)
 *
 * MotionIR serves as the canonical, strongly-typed semantic intermediate layer
 * decoupling the Studio GUI timeline from the underlying AST/CST source code.
 */

export type CodeOwnership = 'MANAGED_DECLARATIVE' | 'OPAQUE_USER_CODE';

export interface SceneTrackNode {
  id: string;
  name?: string;
  sourceFile: string;
  startFrame: number;
  durationFrames: number;
  transitionIn?: {
    type: 'waterfall' | 'rack_focus' | 'zoom_through';
    durationFrames: number;
  };
  ownership: CodeOwnership;
  isReadOnly?: boolean;
  lockReason?: 'DYNAMIC_EXPRESSION' | 'UNMANAGED_CODE' | 'EXPRESSION_EVALUATION_FAILED';
}

export interface FragmentTrackNode {
  id: string;
  text: string;
  sceneId: string;
  startFrame: number;
  holdFrames: number;
  wordCount: number;
}

export interface AudioCueTrackNode {
  id: string;
  soundId: string;
  sceneId?: string;
  triggerFrame: number;
  offsetMs: number;
  bedDb: number;
}

export interface DesignTokens {
  groundColor: string;
  accentColor: string;
  fontDisplay: string;
  fontMono: string;
}

export interface MotionIR {
  version: '2.1.0';
  meta: {
    projectId: string;
    fps: 60;
    sourceFps?: number;
    bpm: number;
    totalDurationFrames: number;
  };
  designTokens: DesignTokens;
  tracks: {
    scenes: SceneTrackNode[];
    fragments: FragmentTrackNode[];
    audioCues: AudioCueTrackNode[];
  };
}
