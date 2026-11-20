import { type PaceName } from './lib/pace';

export { PACE } from './lib/pace';

export const FPS = 60;
export const BPM = 120; // 1拍 = 30帧 (0.500s)
export const W = 1920;
export const H = 1080;
export const PACE_NAME: PaceName = 'crisp';

export const BEAT = (60 / BPM) * FPS; // 30 frames
export const BAR = BEAT * 4; // 120 frames = 2.0s

/** Grid position helper: bar (1-based), beat (0-3), sub (16ths: 0-3) */
export const b = (bar: number, beat = 0, sub = 0) =>
  Math.round(((bar - 1) * 4 + beat) * BEAT + sub * (BEAT / 4));

export const f60 = (frames: number) => Math.round((frames * FPS) / 60);

export const TAIL = 60;
export const DURATION = 900; // 15.000s @ 60fps
export const TOTAL = DURATION;

// 幕次节奏切分 (严格对齐 120 BPM 刚性节拍)
export const ACT = {
  act1: { from: 0, dur: 180 }, // 0.0s - 3.0s (神将降世)
  act2: { from: 180, dur: 240 }, // 3.0s - 7.0s (战神遥测)
  act3: { from: 420, dur: 330 }, // 7.0s - 12.5s (沙场狂斩)
  act4: { from: 750, dur: 150 }, // 12.5s - 15.0s (武圣定岳)
} as const;

// 声画同步关键音画帧 (16th-note Grid Alignment)
export const CUE = {
  // Bar 1 (f0 - f120): Act 1
  intro_beat: b(1), // 0
  ignite: b(1, 0, 2), // 15
  blade_strike: b(1, 1), // 30
  portrait_lock: b(1, 2), // 60
  camera_drift: b(1, 3), // 90

  // Bar 2 (f120 - f240): Act 1 transition & Act 2 telemetry open
  telemetry_open: b(2, 2), // 180
  counter_start: b(2, 2, 2), // 195
  radar_expand: b(2, 3, 2), // 225

  // Bar 3 (f240 - f360): Telemetry peaks
  counter_apex: b(3, 1), // 270
  perk_lock: b(3, 2), // 300
  perk2_lock: b(3, 3), // 330
  rage_max: b(4), // 360

  // Bar 4 (f360 - f480): Act 3 charge
  energy_surge: b(4, 1), // 390
  battle_charge: b(4, 2), // 420
  horse_gallop: b(4, 3), // 450
  slash_1: b(5), // 480

  // Bar 5 (f480 - f600): Slashing & Ground impact
  slash_apex: b(5, 1), // 510
  ground_smash: b(5, 2), // 540
  crit_hit: b(5, 3), // 570

  // Bar 6 (f600 - f720): Cutin & Dragon cleave
  crit_hold: b(6), // 600
  cutin_burst: b(6, 1), // 630
  dragon_slash: b(6, 2), // 660
  skill_hold: b(6, 3), // 690

  // Bar 7 (f720 - f840): Act 4 settlement & Imperial seal
  slash_fade: b(7), // 720
  settle: b(7, 1), // 750
  sunset_drift: b(7, 2), // 780
  seal_slam: b(7, 3), // 810
  cta_reveal: b(7, 3, 2), // 825

  // Bar 8 (f840 - f900): Living finish
  cta_hold: b(8), // 840
  triumphant: b(8, 1), // 870
  end: 899, // offgrid: film boundary
} as const;

export const beatToFrame = (beat: number) => Math.round((beat * 60 * FPS) / BPM);

export type Copy = {
  id: string;
  text: string;
  in: number;
  resolved: number;
  out: number;
  kind?: 'copy' | 'ui';
  chain?: string;
  mode?: 'build' | 'replace';
};

// 文案预算与界面标识体系 (Cinetic Copy Registry)
export const COPY: Copy[] = [
  // Act 1
  { id: 'act1_title', text: '武圣降临', in: 30, resolved: 60, out: 120, kind: 'ui', mode: 'build' },
  { id: 'act1_name', text: '汉寿亭侯·关云长', in: 60, resolved: 90, out: 120, kind: 'ui', mode: 'build' },
  { id: 'act1_faction', text: '蜀汉·神将', in: 0, resolved: 30, out: 899, kind: 'ui', mode: 'build' },

  // Act 2 UI Telemetry
  { id: 'power_label', text: '总战斗力', in: 180, resolved: 210, out: 400, kind: 'ui', mode: 'build' },
  { id: 'power_val', text: '99,999', in: 195, resolved: 270, out: 400, kind: 'ui', mode: 'build' },
  { id: 'stat_wuli', text: '武力 100', in: 225, resolved: 255, out: 400, kind: 'ui', mode: 'build' },
  { id: 'stat_tongshuai', text: '统率 97', in: 225, resolved: 255, out: 400, kind: 'ui', mode: 'build' },
  { id: 'perk_wusheng', text: '【武圣】', in: 270, resolved: 300, out: 400, kind: 'ui', mode: 'build' },
  { id: 'perk_weizhen', text: '【威震华夏】', in: 300, resolved: 330, out: 400, kind: 'ui', mode: 'build' },
  { id: 'rage_label', text: '奥义怒气', in: 180, resolved: 210, out: 400, kind: 'ui', mode: 'build' },
  { id: 'rage_val', text: '100% 充能就绪', in: 360, resolved: 390, out: 420, kind: 'ui', mode: 'build' },

  // Act 3 Combat
  { id: 'combo_count', text: 'COMBO x99', in: 420, resolved: 600, out: 720, kind: 'ui', mode: 'build' },
  { id: 'crit_damage', text: 'CRITICAL 88,480', in: 570, resolved: 576, out: 630, kind: 'ui', mode: 'build' },
  { id: 'skill_name', text: '青龙偃月·绝空斩', in: 645, resolved: 665, out: 730, kind: 'ui', mode: 'build' },

  // Act 4 Settlement
  { id: 'seal_text', text: '汉寿亭侯', in: 810, resolved: 815, out: 899, kind: 'ui', mode: 'build' },
  { id: 'cta_title', text: '武圣降临 · 限时招募', in: 825, resolved: 835, out: 899, kind: 'ui', mode: 'build' },
  { id: 'cta_btn', text: '立即征召', in: 825, resolved: 840, out: 899, kind: 'ui', mode: 'build' },
];
