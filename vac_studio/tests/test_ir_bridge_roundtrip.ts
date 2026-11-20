/**
 * Video-as-Code Studio - MotionIR <-> motion_blueprint.json Lossless Round-Trip Regression Test
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2 | Evolution Lesson A5
 *
 * Verifies:
 *  1. 30fps -> 60fps -> 30fps (no-arg targetFps auto-recovery via sourceFps)
 *  2. 24fps -> 60fps -> 24fps (exact cinema rate rescaling)
 *  3. 25fps -> 60fps -> 25fps (PAL non-integer 2.4x ratio rounding boundary)
 *  4. Scene `name` preservation, `offsetMs` millisecond invariance, and scene-level vs top-level `audio_cues` ownership
 */

import assert from 'node:assert/strict';
import { blueprintToMotionIR, motionIRToBlueprint, BlueprintJson } from '../server/ast_engine/ir_bridge.js';

function test30fpsRoundTrip() {
  const bp: BlueprintJson = {
    meta: { source_file: 'src/acts/Act1.tsx', fps: 30, total_frames: 600, bpm: 120 },
    design_tokens: {
      palette: { background: '#0b0c10', accent: '#00f0ff' },
      typography: { headline_font: 'Inter', mono_font: 'JetBrains Mono' }
    },
    scenes: [
      {
        id: 'scene-01',
        name: 'Hook_Promise',
        timeline: { start_frame: 300, duration_frames: 150 },
        concurrent_tracks: {
          copy: [{ id: 'f1', text: 'Zero slop', start_frame: 315, hold_frames: 45 }]
        },
        audio_cues: [{ id: 'c1', sound_id: 'cut_hit/sub', trigger_frame: 300, offset_ms: -20, bed_db: 7.5 }]
      }
    ],
    audio_cues: [{ id: 'top-c1', sound_id: 'riser/dark', trigger_frame: 270, offset_ms: 35, bed_db: 5.0 }]
  };

  const ir = blueprintToMotionIR(bp, 'test_30fps');
  assert.equal(ir.meta.fps, 60);
  assert.equal(ir.meta.sourceFps, 30);
  assert.equal(ir.meta.totalDurationFrames, 1200);
  assert.equal(ir.tracks.scenes[0].startFrame, 600);
  assert.equal(ir.tracks.scenes[0].durationFrames, 300);
  assert.equal(ir.tracks.scenes[0].name, 'Hook_Promise');
  assert.equal(ir.tracks.fragments[0].startFrame, 630);
  assert.equal(ir.tracks.fragments[0].holdFrames, 90);
  assert.equal(ir.tracks.fragments[0].wordCount, 2);
  assert.equal(ir.tracks.audioCues[0].triggerFrame, 600);
  assert.equal(ir.tracks.audioCues[0].offsetMs, -20, 'offsetMs must NOT be rescaled by fps');
  assert.equal(ir.tracks.audioCues[0].sceneId, 'scene-01');
  assert.equal(ir.tracks.audioCues[1].triggerFrame, 540);
  assert.equal(ir.tracks.audioCues[1].sceneId, undefined);

  // No-arg reverse conversion must automatically restore 30fps via sourceFps
  const back = motionIRToBlueprint(ir);
  assert.equal(back.meta?.fps, 30);
  assert.equal(back.meta?.total_frames, 600);
  assert.equal(back.scenes?.[0].name, 'Hook_Promise');
  assert.equal(back.scenes?.[0].timeline?.start_frame, 300);
  assert.equal(back.scenes?.[0].timeline?.duration_frames, 150);
  assert.equal(back.scenes?.[0].concurrent_tracks?.copy?.[0].start_frame, 315);
  assert.equal(back.scenes?.[0].audio_cues?.[0].sound_id, 'cut_hit/sub');
  assert.equal(back.scenes?.[0].audio_cues?.[0].trigger_frame, 300);
  assert.equal(back.scenes?.[0].audio_cues?.[0].offset_ms, -20);
  assert.equal(back.audio_cues?.length, 1);
  assert.equal(back.audio_cues?.[0].sound_id, 'riser/dark');
  assert.equal(back.audio_cues?.[0].trigger_frame, 270);
}

function test24fpsCinemaRoundTrip() {
  const bp: BlueprintJson = {
    meta: { fps: 24, total_frames: 480, bpm: 100 },
    scenes: [
      {
        id: 's1',
        name: 'Cinema_Intro',
        timeline: { start_frame: 120, duration_frames: 72 },
        audio_cues: [{ sound_id: 'knock/wood', trigger_frame: 120, offset_ms: -15 }]
      }
    ]
  };

  const ir = blueprintToMotionIR(bp, 'test_24fps');
  assert.equal(ir.meta.sourceFps, 24);
  assert.equal(ir.meta.totalDurationFrames, 1200);
  assert.equal(ir.tracks.scenes[0].startFrame, 300);
  assert.equal(ir.tracks.scenes[0].durationFrames, 180);
  assert.equal(ir.tracks.audioCues[0].offsetMs, -15);

  const back = motionIRToBlueprint(ir);
  assert.equal(back.meta?.fps, 24);
  assert.equal(back.scenes?.[0].name, 'Cinema_Intro');
  assert.equal(back.scenes?.[0].timeline?.start_frame, 120);
  assert.equal(back.scenes?.[0].timeline?.duration_frames, 72);
  assert.equal(back.scenes?.[0].audio_cues?.[0].trigger_frame, 120);
}

function test25fpsPalRoundingBoundary() {
  // 60 / 25 = 2.4x non-integer ratio; verify rounding stability within <= 1 frame
  const bp: BlueprintJson = {
    meta: { fps: 25, total_frames: 250, bpm: 120 },
    scenes: [
      {
        id: 'pal-01',
        name: 'PAL_Boundary',
        timeline: { start_frame: 13, duration_frames: 37 },
        audio_cues: [{ sound_id: 'ui_pop/soft', trigger_frame: 13, offset_ms: 40 }]
      }
    ]
  };

  const ir = blueprintToMotionIR(bp, 'test_25fps');
  assert.equal(ir.meta.sourceFps, 25);
  assert.equal(ir.tracks.scenes[0].startFrame, Math.round((13 * 60) / 25)); // 31
  assert.equal(ir.tracks.scenes[0].durationFrames, Math.round((37 * 60) / 25)); // 89
  assert.equal(ir.tracks.audioCues[0].offsetMs, 40);

  const back = motionIRToBlueprint(ir);
  assert.equal(back.meta?.fps, 25);
  assert.ok(Math.abs((back.scenes?.[0].timeline?.start_frame ?? 0) - 13) <= 1);
  assert.ok(Math.abs((back.scenes?.[0].timeline?.duration_frames ?? 0) - 37) <= 1);
  assert.equal(back.scenes?.[0].audio_cues?.[0].offset_ms, 40);
}

console.log('\n' + '='.repeat(76));
console.log('MOTION-IR <-> BLUEPRINT LOSSLESS ROUND-TRIP REGRESSION SUITE (Lesson A5)');
console.log('='.repeat(76));

test30fpsRoundTrip();
console.log('  [PASS] 30fps -> 60fps -> 30fps (auto sourceFps, name, offsetMs, sceneId)');

test24fpsCinemaRoundTrip();
console.log('  [PASS] 24fps -> 60fps -> 24fps (cinema timebase & scene audio cue)');

test25fpsPalRoundingBoundary();
console.log('  [PASS] 25fps -> 60fps -> 25fps (non-integer 2.4x rounding boundary)');

console.log('='.repeat(76));
console.log('OVERALL VERDICT: IR_BRIDGE_ROUNDTRIP_PASSED (3/3)\n');
