/**
 * Video-as-Code Studio - MotionIR <-> motion_blueprint.json Bridge
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2
 *
 * Bridges the reverse-engineered `motion_blueprint.json` contract produced by
 * `skills/motion-video-deconstruct` into VAC Studio's canonical `MotionIR` model
 * (and exports `MotionIR` back to blueprint format).
 */

import { MotionIR, SceneTrackNode } from './motion_ir.js';

export interface BlueprintJson {
  meta?: {
    source_file?: string;
    fps?: number;
    total_frames?: number;
    bpm?: number;
  };
  design_tokens?: {
    palette?: {
      background?: string;
      accent?: string;
    };
    typography?: {
      headline_font?: string;
      mono_font?: string;
    };
  };
  scenes?: Array<{
    id: string;
    name?: string;
    timeline?: {
      start_frame?: number;
      duration_frames?: number;
    };
  }>;
}

export function blueprintToMotionIR(bp: BlueprintJson, projectId = 'deconstructed_project'): MotionIR {
  const scenes: SceneTrackNode[] = (bp.scenes ?? []).map((s, idx) => ({
    id: s.id || s.name || `scene-${String(idx + 1).padStart(2, '0')}`,
    sourceFile: bp.meta?.source_file ?? 'src/acts/Act1.tsx',
    startFrame: s.timeline?.start_frame ?? 0,
    durationFrames: s.timeline?.duration_frames ?? 180,
    ownership: 'MANAGED_DECLARATIVE',
    isReadOnly: false
  }));

  const totalFrames =
    bp.meta?.total_frames ??
    scenes.reduce((acc, s) => Math.max(acc, s.startFrame + s.durationFrames), 0);

  return {
    version: '2.1.0',
    meta: {
      projectId,
      fps: 60,
      bpm: bp.meta?.bpm ?? 120,
      totalDurationFrames: totalFrames
    },
    designTokens: {
      groundColor: bp.design_tokens?.palette?.background ?? '#0b0c10',
      accentColor: bp.design_tokens?.palette?.accent ?? '#00f0ff',
      fontDisplay: bp.design_tokens?.typography?.headline_font ?? 'Geist Sans, sans-serif',
      fontMono: bp.design_tokens?.typography?.mono_font ?? 'JetBrains Mono, monospace'
    },
    tracks: {
      scenes,
      fragments: [],
      audioCues: []
    }
  };
}

export function motionIRToBlueprint(ir: MotionIR): BlueprintJson {
  return {
    meta: {
      source_file: ir.tracks.scenes[0]?.sourceFile ?? 'src/acts/Act1.tsx',
      fps: ir.meta.fps,
      total_frames: ir.meta.totalDurationFrames,
      bpm: ir.meta.bpm
    },
    design_tokens: {
      palette: {
        background: ir.designTokens.groundColor,
        accent: ir.designTokens.accentColor
      },
      typography: {
        headline_font: ir.designTokens.fontDisplay,
        mono_font: ir.designTokens.fontMono
      }
    },
    scenes: ir.tracks.scenes.map((s) => ({
      id: s.id,
      name: s.id,
      timeline: {
        start_frame: s.startFrame,
        duration_frames: s.durationFrames
      }
    }))
  };
}
