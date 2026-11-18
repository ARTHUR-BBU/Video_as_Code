// The sound events of the Earshot 0.3 Showcase film, computed from picture code.
import { DOT_TRAVEL, STATEMENT_SIZE } from './acts/Act1';
import { chainResolves } from './fx/Chain';
import { peak } from './lib/sync';
import { ACT, CUE, FPS, TOTAL } from './timeline';

export type Kind =
  | 'tick' | 'tock' | 'hit' | 'land' | 'pop' | 'whoosh' | 'riser'
  | 'drop' | 'key' | 'click' | 'snap' | 'swell' | 'bell' | 'suck' | 'text';

export type SoundEvent = {
  f: number;
  kind: Kind;
  weight?: number;
  pan?: number;
  pitch?: number | string;
  apexFrac?: number;
  dur?: number;
  variant?: string;
  id?: string;
};

const sec = (s: number) => Math.round(s * FPS);

const actOf = (f: number) => Object.entries(ACT).find(([, a]) => f >= a.from && f < a.from + a.dur)?.[0] ?? 'tail';

const move = (m: { from: number; to: number; ease: (t: number) => number }, weight: number, pan: number, id: string): SoundEvent => {
  const apex = peak(m.from, m.to, m.ease);
  const dur = Math.max(sec(0.25), m.to - m.from);
  return { f: apex, kind: 'whoosh', weight, pan, dur, apexFrac: (apex - m.from) / (m.to - m.from), id };
};

export default function cues(): SoundEvent[] {
  const ev: SoundEvent[] = [];

  // Act 1: Statement & Ignition
  ev.push({ f: CUE.ignite, kind: 'tick', variant: 'crisp', weight: 0.9, pan: 0, id: 'ignite' });
  ev.push({ f: CUE.axis, kind: 'key', variant: 'return', weight: 0.8, pan: 0, id: 'axis-draw' });
  chainResolves('statement', { size: STATEMENT_SIZE }).forEach((f, i) =>
    ev.push({ f, kind: 'text', weight: 0.8, pan: -0.1 + 0.2 * i, id: `fragment${i + 1}` })
  );
  ev.push({ f: CUE.pulse, kind: 'bell', pitch: 'D5', weight: 0.8, pan: 0.2, id: 'beacon-pulse' });
  ev.push(move(DOT_TRAVEL, 0.9, 0.1, 'beacon-flight'));

  // Act 2: Bento Telemetry & Procedural Sound Bank
  ev.push({ f: CUE.handoff, kind: 'tock', weight: 0.8, pan: 0, id: 'bento-arrive' });
  ev.push({ f: CUE.countStart, kind: 'key', variant: 'space', weight: 0.8, pan: -0.2, id: 'count-start' });
  ev.push({ f: CUE.countStart + 10, kind: 'key', weight: 0.7, pan: -0.2, id: 'count-mid1' });
  ev.push({ f: CUE.countStart + 20, kind: 'key', weight: 0.7, pan: -0.2, id: 'count-mid2' });
  ev.push({ f: CUE.badgeLock, kind: 'snap', weight: 1.0, pan: -0.25, id: 'badge-lock' });
  ev.push({ f: CUE.waveSnap, kind: 'click', variant: 'confirm', weight: 0.9, pan: 0.25, id: 'latency-snap' });
  ev.push({
    f: CUE.waveApex,
    kind: 'whoosh',
    weight: 0.9,
    pan: 0.2,
    dur: sec(0.4),
    apexFrac: 0.5,
    id: 'wave-sweep',
  });

  // Act 3: Inward Collapse & Climax
  ev.push({ f: CUE.impact, kind: 'hit', weight: 1.2, pan: 0, id: 'impact' });
  ev.push({ f: CUE.prismPulse, kind: 'bell', pitch: 'E5', weight: 0.7, pan: 0, id: 'prism-pulse' });
  ev.push({ f: CUE.subword, kind: 'bell', pitch: 'A5', weight: 0.9, pan: 0.3, id: 'subword-chime' });

  for (const e of ev) {
    if (!(e.f >= 0 && e.f < TOTAL)) throw new Error(`sync: ${e.id} at f=${e.f} is outside the film (0..${TOTAL - 1})`);
    e.id = `${actOf(e.f)}:${e.id}`;
  }
  return ev;
}
