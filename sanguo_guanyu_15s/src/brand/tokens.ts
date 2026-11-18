import type React from 'react';
import { safeInsets } from '../lib/safe';
import { H, W } from '../timeline';

// 三国志·武圣关羽 视觉设计规范 (严肃写实暗黑硬派风)
export const C = {
  ink: '#F0F6F4', // 玉石冷白文字
  ink2: '#161D24', // 深青铜卡片面板基底
  paper: '#07090C', // 深渊玄铁墨黑背景
  mist: '#0E1218', // 暗夜烽火底板
  line: '#2B3844', // 古青铜发丝线
  lineBright: '#4A6072', // 亮面金石高光边框
  mute: '#82939E', // 战史微注与次级参数
  white: '#FFFFFF',
  accent: '#00FFA3', // cinetic:brand-supplied azure-dragon-cyan
  accent2: '#FFB800', // cinetic:brand-supplied imperial-warlord-gold
  accentRed: '#FF2A4D', // 赤血暴击与怒气警报
  sealBg: '#7A0C16', // 汉代朱砂战印底色
  badgeBg: '#0B281E', // 青龙灵气勋章底
  telemetryBg: '#0A1B24', // 战力遥测深色底
  radarFill: 'rgba(0, 255, 163, 0.22)', // cinetic:brand-supplied jade-radar-glow
};

export const FONT = {
  text: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif',
  display: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  mono: '"Consolas", "Courier New", monospace',
};

export const FACES: string[] = [];

export const U = Math.min(W, H) / 1080;

export const TYPE = {
  hero: { size: 108, weight: 800, track: 0.02, lead: 1.0 },
  display: { size: 76, weight: 700, track: 0.04, lead: 1.1 },
  line: { size: 48, weight: 600, track: 0.02, lead: 1.2 },
  secondary: { size: 32, weight: 500, track: 0.01, lead: 1.3 },
  ui: { size: 22, weight: 600, track: 0.05, lead: 1.4 },
  micro: { size: 16, weight: 500, track: 0.08, lead: 1.4 },
};

export const typeStyle = (
  role: keyof typeof TYPE,
  size = TYPE[role].size * U
): React.CSSProperties => ({
  fontFamily: role === 'ui' || role === 'micro' ? FONT.mono : FONT.text,
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
