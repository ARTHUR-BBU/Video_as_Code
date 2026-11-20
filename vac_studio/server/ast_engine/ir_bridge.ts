/**
 * Video-as-Code Studio - MotionIR <-> motion_blueprint.json Semantic Bridge
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2
 *
 * Bidirectionally maps `motion_blueprint.json` (produced by `skills/motion-video-deconstruct`)
 * into VAC Studio's canonical `MotionIR` model across all 3 core tracks:
 *   1. `tracks.scenes`
 *   2. `tracks.fragments` (from blueprint `concurrent_tracks.copy` or top-level `fragments`)
 *   3. `tracks.audioCues` (from blueprint `audio_cues` / `sound_cues`)
 */

import { AudioCueTrackNode, FragmentTrackNode, MotionIR, SceneTrackNode } from './motion_ir.js';

export interface BlueprintScene {
  id: string;
  name?: string;
  timeline?: {
    start_frame?: number;
    duration_frames?: number;
  };
  concurrent_tracks?: {
    copy?: Array<{
      id?: string;
      text: string;
      start_frame?: number;
      hold_frames?: number;
    }>;
  };
  audio_cues?: Array<{
    id?: string;
    sound_id: string;
    trigger_frame?: number;
    offset_ms?: number;
    bed_db?: number;
  }>;
}

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
  scenes?: BlueprintScene[];
  fragments?: Array<{
    id?: string;
    text: string;
    scene_id?: string;
    start_frame?: number;
    hold_frames?: number;
  }>;
  audio_cues?: Array<{
    id?: string;
    sound_id: string;
    trigger_frame?: number;
    offset_ms?: number;
    bed_db?: number;
  }>;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Support both whitespace-delimited English words and CJK characters
  const cjk = trimmed.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const nonCjk = trimmed.replace(/[\u4e00-\u9fff]/g, ' ').trim();
  const words = nonCjk ? nonCjk.split(/\s+/).length : 0;
  return words + cjk;
}

export function blueprintToMotionIR(bp: BlueprintJson, projectId = 'deconstructed_project'): MotionIR {
  const scenes: SceneTrackNode[] = [];
  const fragments: FragmentTrackNode[] = [];
  const audioCues: AudioCueTrackNode[] = [];

  (bp.scenes ?? []).forEach((s, idx) => {
    const sceneId = s.id || s.name || `scene-${String(idx + 1).padStart(2, '0')}`;
    const startFrame = s.timeline?.start_frame ?? 0;
    const durationFrames = s.timeline?.duration_frames ?? 180;

    scenes.push({
      id: sceneId,
      sourceFile: bp.meta?.source_file ?? 'src/acts/Act1.tsx',
      startFrame,
      durationFrames,
      ownership: 'MANAGED_DECLARATIVE',
      isReadOnly: false
    });

    (s.concurrent_tracks?.copy ?? []).forEach((c, cIdx) => {
      fragments.push({
        id: c.id ?? `${sceneId}-frag-${cIdx + 1}`,
        text: c.text,
        sceneId,
        startFrame: c.start_frame ?? startFrame,
        holdFrames: c.hold_frames ?? 60,
        wordCount: countWords(c.text)
      });
    });

    (s.audio_cues ?? []).forEach((a, aIdx) => {
      audioCues.push({
        id: a.id ?? `${sceneId}-cue-${aIdx + 1}`,
        soundId: a.sound_id,
        triggerFrame: a.trigger_frame ?? startFrame,
        offsetMs: a.offset_ms ?? 0,
        bedDb: a.bed_db ?? 6.0
      });
    });
  });

  // Also absorb top-level fragments and audio_cues if provided
  (bp.fragments ?? []).forEach((f, idx) => {
    fragments.push({
      id: f.id ?? `frag-${idx + 1}`,
      text: f.text,
      sceneId: f.scene_id ?? scenes[0]?.id ?? 'scene-01',
      startFrame: f.start_frame ?? 0,
      holdFrames: f.hold_frames ?? 60,
      wordCount: countWords(f.text)
    });
  });

  (bp.audio_cues ?? []).forEach((a, idx) => {
    audioCues.push({
      id: a.id ?? `cue-${idx + 1}`,
      soundId: a.sound_id,
      triggerFrame: a.trigger_frame ?? 0,
      offsetMs: a.offset_ms ?? 0,
      bedDb: a.bed_db ?? 6.0
    });
  });

  const totalFrames =
    bp.meta?.total_frames ??
    scenes.reduce((acc, s) => Math.max(acc, s.startFrame + s.durationFrames), 0);

  return {
    version: '2.1.0',
    meta: {
      projectId,
      fps: 60, // PRD §3.2 rigid 60fps master clock contract
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
      fragments,
      audioCues
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
    scenes: ir.tracks.scenes.map((s) => {
      const sceneFrags = ir.tracks.fragments.filter((f) => f.sceneId === s.id);
      return {
        id: s.id,
        name: s.id,
        timeline: {
          start_frame: s.startFrame,
          duration_frames: s.durationFrames
        },
        concurrent_tracks: sceneFrags.length
          ? {
              copy: sceneFrags.map((f) => ({
                id: f.id,
                text: f.text,
                start_frame: f.startFrame,
                hold_frames: f.holdFrames
              }))
            }
          : undefined
      };
    }),
    audio_cues: ir.tracks.audioCues.map((a) => ({
      id: a.id,
      sound_id: a.soundId,
      trigger_frame: a.triggerFrame,
      offset_ms: a.offsetMs,
      bed_db: a.bedDb
    }))
  };
}
