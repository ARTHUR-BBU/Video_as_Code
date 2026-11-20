import React from 'react';
import { interpolate } from 'remotion';
import { TOKENS } from '../theme/tokens';

interface AetherConsoleProps {
  progress: number; // 0 to 1
}

export const AetherConsole: React.FC<AetherConsoleProps> = ({ progress }) => {

  // Latency counter drops from 84.6 down to 1.8 ms
  const latencyDrop = interpolate(progress, [0, 0.45], [84.6, 1.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Chart reveal animation
  const chartReveal = interpolate(progress, [0.1, 0.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Row appearances staggered
  const row1Opacity = interpolate(progress, [0.2, 0.35], [0, 1], { extrapolateRight: 'clamp' });
  const row2Opacity = interpolate(progress, [0.3, 0.45], [0, 1], { extrapolateRight: 'clamp' });
  const row3Opacity = interpolate(progress, [0.4, 0.55], [0, 1], { extrapolateRight: 'clamp' });
  const row4Opacity = interpolate(progress, [0.5, 0.65], [0, 1], { extrapolateRight: 'clamp' });

  // Format latency string
  const latencyStr = latencyDrop > 2 ? latencyDrop.toFixed(1) : '1.8';

  return (
    <div
      style={{
        width: 1560,
        height: 880,
        backgroundColor: TOKENS.surface,
        borderRadius: TOKENS.radiusSheet,
        border: `1px solid ${TOKENS.border}`,
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        fontFamily: TOKENS.fontDisplay,
        color: TOKENS.text,
        overflow: 'hidden',
        boxShadow: 'none', // taste-skill rule: surfaces at rest carry 0 shadow
      }}
    >
      {/* L-Shaped Sidebar */}
      <div
        style={{
          backgroundColor: TOKENS.ground,
          borderRight: `1px solid ${TOKENS.border}`,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Brand Monogram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: TOKENS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: TOKENS.fontMono,
            }}
          >
            AE
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Aether Edge</div>
            <div style={{ fontSize: 11, color: TOKENS.faint, fontFamily: TOKENS.fontMono }}>v2.4-prod</div>
          </div>
        </div>

        {/* Sidebar Nav Items (quiet pills) */}
        <div style={{ fontSize: 11, color: TOKENS.faint, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px', marginBottom: 4 }}>
          Control Plane
        </div>
        {[
          { label: 'Overview', active: true },
          { label: 'PoP Nodes (320)', active: false },
          { label: 'Traffic Matrix', active: false },
          { label: 'SLO Telemetry', active: false },
          { label: 'Failover Policies', active: false },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: item.active ? 600 : 400,
              backgroundColor: item.active ? TOKENS.active : 'transparent',
              color: item.active ? TOKENS.text : TOKENS.muted,
            }}
          >
            {item.label}
          </div>
        ))}

        <div style={{ marginTop: 'auto', borderTop: `1px solid ${TOKENS.border}`, paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: TOKENS.faint, fontFamily: TOKENS.fontMono }}>Mesh: 320/320 Synced</div>
          <div style={{ fontSize: 11, color: TOKENS.positive, marginTop: 2 }}>● 0 Alerts</div>
        </div>
      </div>

      {/* Main Canvas */}
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, backgroundColor: TOKENS.surface }}>
        {/* Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                Global Mesh / Live Ingress Telemetry
              </h1>
              <div
                style={{
                  backgroundColor: TOKENS.pillPosBg,
                  color: TOKENS.pillPosInk,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: TOKENS.fontMono,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: TOKENS.positive }} />
                MESH STABLE
              </div>
            </div>
            <div style={{ fontSize: 13, color: TOKENS.muted, marginTop: 4, fontFamily: TOKENS.fontMono }}>
              Cluster: <span style={{ color: TOKENS.text }}>global-anycast-core</span> · Updated: just now · Commit <span style={{ color: TOKENS.accent }}>sha-8b20d1e</span>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: TOKENS.radiusControl,
              border: `1px solid ${TOKENS.control}`,
              fontSize: 12,
              fontWeight: 500,
              color: TOKENS.text,
              backgroundColor: TOKENS.surface,
            }}
          >
            Export Trace
          </div>
        </div>

        {/* Divided KPI Container (taste-skill rule: a label above a number, no icons, no tiles, divided cells) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            backgroundColor: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: TOKENS.radiusCard,
            overflow: 'hidden',
          }}
        >
          {/* KPI 1: P99 Global Latency */}
          <div style={{ padding: '16px 20px', borderRight: `1px solid ${TOKENS.border}` }}>
            <div style={{ fontSize: 12, color: TOKENS.muted }}>P99 Global Latency</div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                marginTop: 6,
                fontFamily: TOKENS.fontMono,
                fontVariantNumeric: 'tabular-nums',
                color: latencyDrop > 10 ? TOKENS.negative : TOKENS.accent,
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
              }}
            >
              {latencyStr}
              <span style={{ fontSize: 14, fontWeight: 400, color: TOKENS.muted }}>ms</span>
            </div>
            <div style={{ fontSize: 11, color: TOKENS.positive, marginTop: 4, fontFamily: TOKENS.fontMono }}>
              ↓ 97.8% vs Standard BGP
            </div>
          </div>

          {/* KPI 2: Live Edge Throughput */}
          <div style={{ padding: '16px 20px', borderRight: `1px solid ${TOKENS.border}` }}>
            <div style={{ fontSize: 12, color: TOKENS.muted }}>Ingress Throughput</div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                marginTop: 6,
                fontFamily: TOKENS.fontMono,
                fontVariantNumeric: 'tabular-nums',
                color: TOKENS.text,
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
              }}
            >
              4.82
              <span style={{ fontSize: 14, fontWeight: 400, color: TOKENS.muted }}>TB/s</span>
            </div>
            <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 4, fontFamily: TOKENS.fontMono }}>
              +18.4% above baseline
            </div>
          </div>

          {/* KPI 3: Edge PoP Coverage */}
          <div style={{ padding: '16px 20px', borderRight: `1px solid ${TOKENS.border}` }}>
            <div style={{ fontSize: 12, color: TOKENS.muted }}>PoP Nodes Active</div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                marginTop: 6,
                fontFamily: TOKENS.fontMono,
                fontVariantNumeric: 'tabular-nums',
                color: TOKENS.text,
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
              }}
            >
              320
              <span style={{ fontSize: 14, fontWeight: 400, color: TOKENS.muted }}>/ 320</span>
            </div>
            <div style={{ fontSize: 11, color: TOKENS.positive, marginTop: 4, fontFamily: TOKENS.fontMono }}>
              100% Mesh Health
            </div>
          </div>

          {/* KPI 4: SLO Compliance */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: TOKENS.muted }}>SLO Budget Met</div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                marginTop: 6,
                fontFamily: TOKENS.fontMono,
                fontVariantNumeric: 'tabular-nums',
                color: TOKENS.text,
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
              }}
            >
              99.999
              <span style={{ fontSize: 14, fontWeight: 400, color: TOKENS.muted }}>%</span>
            </div>
            <div style={{ fontSize: 11, color: TOKENS.positive, marginTop: 4, fontFamily: TOKENS.fontMono }}>
              0 breaches in 30d
            </div>
          </div>
        </div>

        {/* Charts.js SVG Latency Curve Panel */}
        <div
          style={{
            border: `1px solid ${TOKENS.border}`,
            borderRadius: TOKENS.radiusCard,
            padding: '16px 20px',
            backgroundColor: TOKENS.surface,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.text }}>
              24-Hour Latency Transition Curve (BGP vs Aether Edge)
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: TOKENS.fontMono, color: TOKENS.muted }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 2, backgroundColor: TOKENS.chart1 }} /> Aether P99 (1.8ms)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 1, borderTop: `1px dashed ${TOKENS.chart3}` }} /> SLO Target (5.0ms)
              </span>
            </div>
          </div>

          {/* SVG Canvas adhering strictly to taste-skill charts.js rules: 3 hairline rules, tabular ticks, straight polyline */}
          <svg viewBox="0 0 1180 180" style={{ width: '100%', height: 180, display: 'block', overflow: 'visible' }}>
            {/* Gridlines */}
            {[
              { y: 20, label: '100 ms' },
              { y: 70, label: '50 ms' },
              { y: 120, label: '20 ms' },
              { y: 160, label: '0 ms' },
            ].map((grid, i) => (
              <g key={i}>
                <line x1={60} y1={grid.y} x2={1180} y2={grid.y} stroke={TOKENS.grid} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={50} y={grid.y + 4} textAnchor="end" fontSize={11} fill={TOKENS.axisInk} fontFamily={TOKENS.fontMono}>
                  {grid.label}
                </text>
              </g>
            ))}

            {/* SLO Target Reference Line (Dashed) */}
            <line x1={60} y1={148} x2={1180} y2={148} stroke={TOKENS.chart3} strokeWidth={1} strokeDasharray="4 4" />
            <text x={1170} y={142} textAnchor="end" fontSize={10} fill={TOKENS.chart3} fontFamily={TOKENS.fontMono}>
              SLO Threshold: 5.0ms
            </text>

            {/* Latency Transition Curve */}
            {/* Starts high (y: 35 = ~85ms), drops sharply at x: 420 down to y: 156 (~1.8ms), then flat */}
            <path
              d="M 60 38 L 160 40 L 260 36 L 360 42 L 440 156 L 600 156 L 800 155 L 1000 156 L 1180 156"
              fill="none"
              stroke={TOKENS.chart1}
              strokeWidth={2.5}
              strokeDasharray={1200}
              strokeDashoffset={1200 * (1 - chartReveal)}
            />

            {/* Live Pin Marker on Tokyo PoP */}
            {chartReveal > 0.6 && (
              <g transform="translate(680, 156)">
                <circle r={4} fill={TOKENS.chart1} />
                <line x1={0} y1={0} x2={0} y2={-32} stroke={TOKENS.chart1} strokeWidth={1} />
                <rect x={-55} y={-52} width={110} height={20} rx={4} fill={TOKENS.text} />
                <text x={0} y={-38} textAnchor="middle" fontSize={10} fill="#ffffff" fontFamily={TOKENS.fontMono} fontWeight={500}>
                  nrt-01: 1.8ms
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Live PoP Nodes Table (taste-skill table rules: 1px subtle rules, tabular numerals right-aligned, status pills) */}
        <div style={{ border: `1px solid ${TOKENS.border}`, borderRadius: TOKENS.radiusCard, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: TOKENS.ground, borderBottom: `1px solid ${TOKENS.border}` }}>
                <th style={{ padding: '8px 16px', fontWeight: 500, color: TOKENS.muted, fontSize: 11 }}>POP IDENTIFIER</th>
                <th style={{ padding: '8px 16px', fontWeight: 500, color: TOKENS.muted, fontSize: 11 }}>LOCATION</th>
                <th style={{ padding: '8px 16px', fontWeight: 500, color: TOKENS.muted, fontSize: 11, textAlign: 'right' }}>P99 LATENCY</th>
                <th style={{ padding: '8px 16px', fontWeight: 500, color: TOKENS.muted, fontSize: 11, textAlign: 'right' }}>PACKET DROP</th>
                <th style={{ padding: '8px 16px', fontWeight: 500, color: TOKENS.muted, fontSize: 11, textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'nrt-01', loc: 'Tokyo / Equinix TY8', lat: '1.8 ms', drop: '0.000%', opacity: row1Opacity },
                { id: 'fra-03', loc: 'Frankfurt / Interxion FRA1', lat: '2.1 ms', drop: '0.000%', opacity: row2Opacity },
                { id: 'sfo-02', loc: 'San Francisco / Digital Realty', lat: '1.9 ms', drop: '0.000%', opacity: row3Opacity },
                { id: 'sin-01', loc: 'Singapore / Global Switch', lat: '2.4 ms', drop: '0.000%', opacity: row4Opacity },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: idx < 3 ? `1px solid ${TOKENS.rule}` : 'none', opacity: row.opacity }}>
                  <td style={{ padding: '10px 16px', fontFamily: TOKENS.fontMono, fontWeight: 600, color: TOKENS.accent }}>{row.id}</td>
                  <td style={{ padding: '10px 16px', color: TOKENS.text }}>{row.loc}</td>
                  <td style={{ padding: '10px 16px', fontFamily: TOKENS.fontMono, textAlign: 'right', fontWeight: 500 }}>{row.lat}</td>
                  <td style={{ padding: '10px 16px', fontFamily: TOKENS.fontMono, textAlign: 'right', color: TOKENS.positive }}>{row.drop}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <span
                      style={{
                        backgroundColor: TOKENS.pillPosBg,
                        color: TOKENS.pillPosInk,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontFamily: TOKENS.fontMono,
                      }}
                    >
                      OPTIMAL
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
