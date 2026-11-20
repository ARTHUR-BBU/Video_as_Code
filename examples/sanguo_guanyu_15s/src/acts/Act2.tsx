import React from 'react';
import { interpolate, staticFile } from 'remotion';
import { C, FONT } from '../brand/tokens';
import { RadarChart } from '../components/RadarChart';
import { PowerCounter } from '../components/PowerCounter';

interface ActProps {
  frame: number;
}

export const Act2: React.FC<ActProps> = ({ frame }) => {
  // Act 2 runs from f180 to f420
  const f = frame;

  // Background portrait breathing
  const portraitScale = interpolate(f, [180, 420], [1.05, 1.09], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Bento Box entry: f180 to f210
  const bentoX = interpolate(f, [180, 210], [120, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3), // power3 out
  });
  const bentoAlpha = interpolate(f, [180, 205], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit towards Act 3: f390 to f420
  const exitScale = interpolate(f, [390, 420], [1, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitAlpha = interpolate(f, [395, 420], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Perks activation
  const perk1Active = f >= 270;
  const perk2Active = f >= 310;
  const perk3Active = f >= 350;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        opacity: exitAlpha,
        transform: `scale(${exitScale})`,
        transformOrigin: '50% 50%',
        overflow: 'hidden',
      }}
    >
      {/* 1. Left Stage: Portrait Living Hold */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          transform: `translate(-320px, 0px) scale(${portraitScale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <img
          src={staticFile('images/guanyu_portrait.jpg')}
          alt="Guan Yu"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Shadow gradient on right side to blend with Bento HUD */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.92) 75%, rgba(0,0,0,0.98) 100%)',
          }}
        />
      </div>

      {/* 2. Right Side: High-Density Swiss Bento Grid (760px wide) */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          right: 90,
          width: 780,
          opacity: bentoAlpha,
          transform: `translate(${bentoX}px, 0px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          zIndex: 10,
        }}
      >
        {/* Top Bento Header Card: Battle Power */}
        <div
          style={{
            backgroundColor: C.ink2,
            border: `1px solid ${C.lineBright}`,
            borderRadius: 4,
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT.text,
                fontSize: 16,
                fontWeight: 700,
                color: C.mute,
                letterSpacing: '0.1em',
                marginBottom: 6,
              }}
            >
              WARLORD BATTLE POWER // 总战斗力
            </div>
            <PowerCounter frame={f} startFrame={200} endFrame={270} />
          </div>

          <div
            style={{
              backgroundColor: C.sealBg,
              border: `1px solid ${C.accent2}`,
              borderRadius: 3,
              padding: '8px 16px',
              fontFamily: FONT.text,
              fontSize: 15,
              fontWeight: 800,
              color: C.accent2,
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}
          >
            <div>神级武圣</div>
            <div style={{ fontSize: 12, color: C.ink }}>TIER: SSR+</div>
          </div>
        </div>

        {/* Middle Bento Row: Radar Chart + Perks */}
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Left Card: 5-Point Radar Polygon */}
          <div
            style={{
              flex: '1 1 360px',
              backgroundColor: C.ink2,
              border: `1px solid ${C.line}`,
              borderRadius: 4,
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 13,
                fontWeight: 700,
                color: C.accent,
                letterSpacing: '0.08em',
                marginBottom: 8,
                alignSelf: 'flex-start',
                paddingLeft: 12,
              }}
            >
              // 5-DIMENSION ATTRIBUTES
            </div>
            <RadarChart frame={f} startFrame={230} size={280} />
          </div>

          {/* Right Card: Exclusive Perks & Battle Traits */}
          <div
            style={{
              flex: '1 1 380px',
              backgroundColor: C.ink2,
              border: `1px solid ${C.line}`,
              borderRadius: 4,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 13,
                fontWeight: 700,
                color: C.accent2,
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              // EXCLUSIVE WARLORD TRAITS
            </div>

            {/* Perk 1 */}
            <div
              style={{
                backgroundColor: perk1Active ? C.badgeBg : C.paper,
                border: `1px solid ${perk1Active ? C.accent : C.line}`,
                borderRadius: 3,
                padding: '10px 14px',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: FONT.text,
                  fontSize: 16,
                  fontWeight: 700,
                  color: perk1Active ? C.accent : C.mute,
                  marginBottom: 2,
                }}
              >
                【武圣】一骑当千
              </div>
              <div style={{ fontFamily: FONT.text, fontSize: 13, color: C.ink }}>
                暴击率 +35%，暴击伤害额外提升 150%
              </div>
            </div>

            {/* Perk 2 */}
            <div
              style={{
                backgroundColor: perk2Active ? C.badgeBg : C.paper,
                border: `1px solid ${perk2Active ? C.accent : C.line}`,
                borderRadius: 3,
                padding: '10px 14px',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: FONT.text,
                  fontSize: 16,
                  fontWeight: 700,
                  color: perk2Active ? C.accent : C.mute,
                  marginBottom: 2,
                }}
              >
                【威震华夏】战场压制
              </div>
              <div style={{ fontFamily: FONT.text, fontSize: 13, color: C.ink }}>
                降低敌方全军士气与物理防御 30%
              </div>
            </div>

            {/* Perk 3 */}
            <div
              style={{
                backgroundColor: perk3Active ? C.badgeBg : C.paper,
                border: `1px solid ${perk3Active ? C.accent2 : C.line}`,
                borderRadius: 3,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontFamily: FONT.text,
                  fontSize: 16,
                  fontWeight: 700,
                  color: perk3Active ? C.accent2 : C.mute,
                  marginBottom: 2,
                }}
              >
                【义绝】无懈可击
              </div>
              <div style={{ fontFamily: FONT.text, fontSize: 13, color: C.ink }}>
                生命值低于 50% 时进入不屈霸体状态
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bento Card: Ultimate Skill Charge & Ready */}
        <div
          style={{
            backgroundColor: f >= 360 ? C.badgeBg : C.ink2,
            border: `1px solid ${f >= 360 ? C.accent2 : C.line}`,
            borderRadius: 4,
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: f >= 360 ? C.accent2 : C.accent,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: FONT.text,
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.ink,
                  letterSpacing: '0.04em',
                }}
              >
                觉醒奥义：青龙天翔 · 斩
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.mute }}>
                ENERGY FULL // TARGET ACQUIRED
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 15,
              fontWeight: 800,
              color: f >= 360 ? C.accent2 : C.accent,
              backgroundColor: C.paper,
              padding: '6px 14px',
              borderRadius: 2,
              border: `1px solid ${f >= 360 ? C.accent2 : C.accent}`,
            }}
          >
            {f >= 360 ? 'READY [释放]' : 'CHARGING'}
          </div>
        </div>
      </div>
    </div>
  );
};
