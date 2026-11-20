/**
 * Video-as-Code Studio - MotionIR <-> motion_blueprint.json Semantic Bridge
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2
 *
 * Bidirectionally maps `motion_blueprint.json` (produced by `skills/motion-video-deconstruct`)
 * into VAC Studio's canonical 60fps `MotionIR` model across all 3 core tracks:
 *   1. `tracks.scenes` (with source-fps -> 60fps frame rescaling & `name` preservation)
 *   2. `tracks.fragments` (from blueprint `concurrent_tracks.copy` or top-level `fragments`)
 *   3. `tracks.audioCues` (from blueprint `audio_cues`)
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
  // Normalize arbitrary source frame rates (e.g. 24/25/30fps) onto the rigid 60fps MotionIR clock
  const srcFps = bp.meta?.fps && bp.meta.fps > 0 ? bp.meta.fps : 60;
  const to60 = (f: number) => Math.round((f * 60) / srcFps);

  const scenes: SceneTrackNode[] = [];
  const fragments: FragmentTrackNode[] = [];
  const audioCues: AudioCueTrackNode[] = [];

  (bp.scenes ?? []).forEach((s, idx) => {
    const sceneId = s.id || s.name || `scene-${String(idx + 1).padStart(2, '0')}`;
    const startFrame = to60(s.timeline?.start_frame ?? 0);
    const durationFrames = to60(s.timeline?.duration_frames ?? Math.round(3 * srcFps));

    scenes.push({
      id: sceneId,
      name: s.name ?? sceneId,
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
        startFrame: c.start_frame !== undefined ? to60(c.start_frame) : startFrame,
        holdFrames: c.hold_frames !== undefined ? to60(c.hold_frames) : 60,
        wordCount: countWords(c.text)
      });
    });

    (s.audio_cues ?? []).forEach((a, aIdx) => {
      audioCues.push({
        id: a.id ?? `${sceneId}-cue-${aIdx + 1}`,
        soundId: a.sound_id,
        sceneId,
        triggerFrame: a.trigger_frame !== undefined ? to60(a.trigger_frame) : startFrame,
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
      startFrame: to60(f.start_frame ?? 0),
      holdFrames: f.hold_frames !== undefined ? to60(f.hold_frames) : 60,
      wordCount: countWords(f.text)
    });
  });

  (bp.audio_cues ?? []).forEach((a, idx) => {
    audioCues.push({
      id: a.id ?? `cue-${idx + 1}`,
      soundId: a.sound_id,
      triggerFrame: to60(a.trigger_frame ?? 0),
      offsetMs: a.offset_ms ?? 0,
      bedDb: a.bed_db ?? 6.0
    });
  });

  const totalFrames =
    bp.meta?.total_frames !== undefined
      ? to60(bp.meta.total_frames)
      : scenes.reduce((acc, s) => Math.max(acc, s.startFrame + s.durationFrames), 0);

  return {
    version: '2.1.0',
    meta: {
      projectId,
      fps: 60, // PRD §3.2 rigid 60fps master clock contract (rescaled from srcFps above)
      sourceFps: srcFps,
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

export function motionIRToBlueprint(ir: MotionIR, targetFps?: number): BlueprintJson {
  const requestedFps = targetFps ?? ir.meta.sourceFps ?? 60;
  const outFps = requestedFps > 0 ? requestedFps : 60;
  const from60 = (f: number) => Math.round((f * outFps) / 60);

  const topLevelAudioCues = ir.tracks.audioCues.filter((a) => !a.sceneId);

  return {
    meta: {
      source_file: ir.tracks.scenes[0]?.sourceFile ?? 'src/acts/Act1.tsx',
      fps: outFps,
      total_frames: from60(ir.meta.totalDurationFrames),
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
      const sceneCues = ir.tracks.audioCues.filter((a) => a.sceneId === s.id);
      return {
        id: s.id,
        name: s.name ?? s.id,
        timeline: {
          start_frame: from60(s.startFrame),
          duration_frames: from60(s.durationFrames)
        },
        concurrent_tracks: sceneFrags.length
          ? {
              copy: sceneFrags.map((f) => ({
                id: f.id,
                text: f.text,
                start_frame: from60(f.startFrame),
                hold_frames: from60(f.holdFrames)
              }))
            }
          : undefined,
        audio_cues: sceneCues.length
          ? sceneCues.map((a) => ({
              id: a.id,
              sound_id: a.soundId,
              trigger_frame: from60(a.triggerFrame),
              offset_ms: a.offsetMs,
              bed_db: a.bedDb
            }))
          : undefined
      };
    }),
    audio_cues: topLevelAudioCues.length
      ? topLevelAudioCues.map((a) => ({
          id: a.id,
          sound_id: a.soundId,
          trigger_frame: from60(a.triggerFrame),
          offset_ms: a.offsetMs,
          bed_db: a.bedDb
        }))
      : undefined
  };
}
