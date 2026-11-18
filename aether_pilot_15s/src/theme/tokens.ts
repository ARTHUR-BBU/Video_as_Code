// Aether Edge - Design Tokens from taste-skill v2.1 (Framed sheet style)
export const TOKENS = {
  // Colour Tokens
  ground: '#f9fbfc',        // L-shaped chrome tint
  surface: '#ffffff',       // Floating white sheet
  raised: '#f4f6f8',        // Elevated panel fill
  active: '#ebedee',        // Active tab / item
  border: '#e8eaec',        // 1px panel edge
  rule: '#f0f1f2',          // Subtle divider line
  control: '#cdced1',       // Outlined buttons & controls
  text: '#131416',          // Primary high-contrast ink
  muted: '#5d5f60',         // Secondary 4.5:1 grey text
  faint: '#8b8e90',         // Sub-labels & micro-timestamps
  
  // Single Chroma Hue (<=3% screen area budget)
  accent: '#1b6c80',        // Deep Tech Teal / Cyan
  positive: '#1e7b4f',      // Healthy status green
  negative: '#c4242a',      // Latency spike alert red
  warning: '#92400e',       // Degraded amber
  
  // Chart Colors (from taste-skill)
  chart1: '#1b6c80',        // Main latency series
  chart2: '#2f70bb',        // Secondary throughput series
  chart3: '#a86f0c',        // SLO threshold line
  grid: '#e8eaec',          // Quiet gridlines
  axisInk: '#5d5f60',       // Tick numbers
  
  // Status Pills
  pillPosBg: '#dcfae5',
  pillPosInk: '#04250e',
  pillNegBg: '#ffedea',
  pillNegInk: '#831c1e',
  
  // Radii & Metrics (Bimodal rule: 8px cards, 16px sheet, 6px controls)
  radiusCard: 8,
  radiusSheet: 16,
  radiusControl: 6,
  
  // Typography
  fontDisplay: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono: '"IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace',
};
