// Timeline for Earshot v0.3.0 Feature Showcase Film
// Single source of truth for time, beats, cues, and copy budgets.
import { holdFor, PACE, readingWindows, revealFor, wordCount, type PaceName } from './lib/pace';

export { PACE } from './lib/pace';

export const FPS = 60;
export const BPM = 120; // Crisp launch tempo
export const W = 1920;
export const H = 1080;
export const PACE_NAME: PaceName = 'crisp';

/** Frames per beat. At 60 fps & 120 BPM: exactly 30 frames */
export const BEAT = (60 / BPM) * FPS;
export const BAR = BEAT * 4; // 120 frames = 2.0s

/** Grid position helper: bar (1-based), beat (0-3), sub (16ths: 0-3) */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + sub * (BEAT / 4));

export const f60 = (frames: number) => Math.round((frames * FPS) / 60);

/** Tail for audio decay to digital silence */
export const TAIL = 60;

/** Acts: contiguous, bar-aligned */
export const ACT = {
  statement: { from: b(1), dur: b(2) - b(1) }, // Bar 1: f0 - f120
  telemetry: { from: b(2), dur: b(4) - b(2) }, // Bar 2-3: f120 - f360
  payoff: { from: b(4), dur: b(6) + TAIL - b(4) }, // Bar 4-6: f360 - f660
};

export const TOTAL = b(6) + TAIL; // 660 frames = 11.000s

/** Named sync points on the 16th grid */
export const CUE = {
  ignite: b(1), // f0: cursor ignition tick
  fragA: b(1), // f0: "AUDIO AS CODE" reveals
  axis: b(1, 0, 2), // f15: laser axis draw zip
  pulse: b(1, 2), // f60: carrier beacon pulse
  exit1: b(1, 3, 2), // f105: statement leaves
  depart: b(1, 3, 2), // f105: beacon departs for bento
  handoff: b(2), // f120: act 2 boundary / bento arrives
  bento: b(2, 1), // f150: bento container expands
  countStart: b(2, 2), // f180: counter starts rolling with mechanical keys
  badgeLock: b(2, 3), // f210: "0-MODEL CPU" badge locks
  waveApex: b(3), // f240: whoosh apex on waveform sweep
  waveSnap: b(3, 1), // f270: "0.00ms JITTER" indicator snaps
  exit2: b(3, 3), // f330: bento collapses inwards
  collapse: b(4), // f360: act 3 boundary / inward rush
  inward: b(4, 1), // f390: prism acceleration
  impact: b(4, 2), // f420: seismic sub-drop impact & hero mark lock
  wordmark: b(4, 2), // f420: "EARSHOT 0.3" locks
  prismPulse: b(5, 1), // f510: picture beat (prism beacon pulses between fragments)
  subword: b(5, 1, 2), // f525: "PURE CODE SOUND" settles after 25f picture beat
  end: b(6), // f600: living hold until tail
};

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

const pace = PACE[PACE_NAME];

export const line = (id: string, text: string, inF: number, out?: number): Copy => {
  const n = wordCount(text);
  const resolved = inF + f60(revealFor(n, pace));
  return { id, text, in: inF, resolved, out: out ?? resolved + f60(holdFor(n, pace)) };
};

export const chain = (id: string, mode: 'build' | 'replace', fragments: [text: string, inF: number][], o: { out?: number } = {}): Copy[] => {
  const base = fragments.map(([text, inF], i) => ({
    id: `${id}.${i + 1}`,
    text,
    in: inF,
    resolved: inF + f60(revealFor(wordCount(text), pace)),
    chain: id,
    mode,
  }));
  const last = base[base.length - 1];
  if (!last) throw new Error(`timeline: chain "${id}" has no fragments`);
  const words = (list: { text: string }[]) => list.reduce((n, c) => n + wordCount(c.text), 0);
  if (mode === 'build') {
    const out = o.out ?? last.resolved + f60(holdFor(words(base), pace));
    return base.map((c) => ({ ...c, out }));
  }
  const leave = f60(pace.exitDur) + f60(6);
  return base.map((c, i) => ({ ...c, out: base[i + 1] ? base[i + 1].in - leave : (o.out ?? c.resolved + f60(holdFor(wordCount(c.text), pace))) }));
};

export const COPY: Copy[] = [
  ...chain('statement', 'build', [['AUDIO AS CODE', CUE.fragA]], { out: CUE.exit1 }),
  { id: 'bento-title', text: '201 PROCEDURAL VOICES', in: CUE.countStart, resolved: CUE.badgeLock, out: CUE.exit2, kind: 'ui' },
  { id: 'bento-badge', text: '0-MODEL CPU', in: CUE.badgeLock, resolved: CUE.waveApex, out: CUE.exit2, kind: 'ui' },
  { id: 'bento-stat', text: '0.00ms JITTER', in: CUE.waveSnap, resolved: CUE.waveSnap + f60(8), out: CUE.exit2, kind: 'ui' },
  ...chain('lockup', 'build', [['EARSHOT 0.3', CUE.wordmark], ['PURE CODE SOUND', CUE.subword]], { out: TOTAL }),
];

export const READ = readingWindows(COPY, pace, FPS, TOTAL);

export const copy = (id: string): Copy => {
  const c = COPY.find((x) => x.id === id);
  if (!c) throw new Error(`timeline: no COPY entry "${id}"`);
  return c;
};

export const chainOf = (id: string): Copy[] => {
  const list = COPY.filter((x) => x.chain === id).sort((p, q) => p.in - q.in);
  if (!list.length) throw new Error(`timeline: no COPY chain "${id}"`);
  return list;
};
