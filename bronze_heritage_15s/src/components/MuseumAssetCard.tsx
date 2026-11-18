import React from 'react';
import { TOKENS } from '../theme/tokens';

interface MuseumAssetCardProps {
  accession: string;
  title: string;
  dating: string;
  medium: string;
  institution: string;
  opacity?: number;
}

export const MuseumAssetCard: React.FC<MuseumAssetCardProps> = ({
  accession,
  title,
  dating,
  medium,
  institution,
  opacity = 1,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 17, 21, 0.85)',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 6,
        padding: '16px 20px',
        color: TOKENS.text,
        fontFamily: TOKENS.fontDisplay,
        backdropFilter: 'none', // taste-skill rule: avoid fake glass
        boxShadow: 'none',
        opacity,
        maxWidth: 420,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontFamily: TOKENS.fontMono, color: TOKENS.gold, fontWeight: 700 }}>
          {accession}
        </span>
        <span style={{ fontSize: 10, fontFamily: TOKENS.fontMono, color: TOKENS.muted, letterSpacing: '0.05em' }}>
          OPEN ACCESS CC0
        </span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>
        {title}
      </div>

      <div style={{ fontSize: 12, color: TOKENS.muted, marginBottom: 8 }}>
        {dating} · {medium}
      </div>

      <div
        style={{
          borderTop: `1px solid ${TOKENS.rule}`,
          paddingTop: 8,
          fontSize: 10,
          fontFamily: TOKENS.fontMono,
          color: TOKENS.faint,
        }}
      >
        PROVENANCE: {institution}
      </div>
    </div>
  );
};
