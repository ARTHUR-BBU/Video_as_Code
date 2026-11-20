import type React from 'react';
import { safeInsets } from '../lib/safe';
import { H, W } from '../timeline';

// Xianyu (Goofish) Brand tokens
export const C = {
  ink: '#FFFFFF', // primary white type on dark stage
  ink2: '#202228', // raised dark cards / panels
  paper: '#111216', // deep dark charcoal stage
  mist: '#181A20', // subtle background card panels
  line: '#2B2F38', // hairlines, >= 1.5 px on screen
  mute: '#8D93A0', // secondary text: readable on dark stage
  white: '#FFFFFF',
  // Xianyu iconic yellow accent: means "unlocked value / second-hand trade"
  accent: '#FED000', // cinetic:brand-supplied xianyu-official-yellow
};

export const FONT = {
  text: '"Geist Variable", "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif',
  mono: '"Consolas", "Courier New", monospace',
};

/** Faces the FontGate waits for before anything renders or measures (empty for native system fonts) */
export const FACES: string[] = [];

/** Layout unit: 1 at 1080p, scales every size with the short side of the frame */
export const U = Math.min(W, H) / 1080;

// One token per role, reused everywhere, so nothing is "almost matched" (size in px at 1080p).
export const TYPE = {
  display: { size: 120, weight: 600, track: -0.045, lead: 1.0 }, // statements and the wordmark
  line: { size: 64, weight: 500, track: -0.025, lead: 1.1 }, // fragment chains (fx/Chain)
  secondary: { size: 48, weight: 450, track: -0.02, lead: 1.15 }, // descriptor lines, URLs
  ui: { size: 24, weight: 500, track: -0.01, lead: 1.3 }, // smallest readable size on screen
};

/** CSS for a type role at a size (px). Tabular figures always, so numbers never jitter in width. */
export const typeStyle = (role: keyof typeof TYPE, size = TYPE[role].size * U): React.CSSProperties => ({
  fontFamily: FONT.text,
  fontSize: size,
  fontWeight: TYPE[role].weight,
  letterSpacing: `${TYPE[role].track}em`,
  lineHeight: TYPE[role].lead,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'pre',
});

/**
 * Safe margins for a w x h frame as a symmetric envelope
 */
export const safeArea = (w: number, h: number) => {
  const i = safeInsets(undefined, w, h);
  return { x: Math.max(i.left, i.right), y: Math.max(i.top, i.bottom) };
};
export const SAFE = safeArea(W, H);
