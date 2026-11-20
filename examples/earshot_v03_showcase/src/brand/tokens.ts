import type React from 'react';
import { safeInsets } from '../lib/safe';
import { H, W } from '../timeline';

// Earshot 0.3 Tech Brand Tokens
export const C = {
  ink: '#F8FAFC', // pure crisp white text
  ink2: '#1E2536', // raised dark cards / panels
  paper: '#0B0D13', // deep obsidian background
  mist: '#121622', // subtle dark panels
  line: '#242D40', // precision hairlines
  mute: '#7E8B9F', // telemetry labels & secondary text
  white: '#FFFFFF',
  accent: '#00F0FF', // cinetic:brand-supplied earshot-cyan
  accent2: '#10B981', // cinetic:brand-supplied neon-green
  badgeBg: '#0D2B24', // dark emerald badge ground
  telemetryBg: '#0C2830', // dark cyan telemetry box ground
};

export const FONT = {
  text: '"Geist Variable", "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif',
  mono: '"Consolas", "Courier New", monospace',
};

export const FACES: string[] = [];

export const U = Math.min(W, H) / 1080;

export const TYPE = {
  display: { size: 104, weight: 600, track: -0.04, lead: 1.0 },
  line: { size: 68, weight: 500, track: -0.025, lead: 1.1 },
  secondary: { size: 40, weight: 450, track: -0.015, lead: 1.2 },
  ui: { size: 24, weight: 600, track: 0.04, lead: 1.3 },
};

export const typeStyle = (role: keyof typeof TYPE, size = TYPE[role].size * U): React.CSSProperties => ({
  fontFamily: role === 'ui' ? FONT.mono : FONT.text,
  fontSize: size,
  fontWeight: TYPE[role].weight,
  letterSpacing: `${TYPE[role].track}em`,
  lineHeight: TYPE[role].lead,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'pre',
});

export const safeArea = (w: number, h: number) => {
  const i = safeInsets(undefined, w, h);
  return { x: Math.max(i.left, i.right), y: Math.max(i.top, i.bottom) };
};
export const SAFE = safeArea(W, H);
