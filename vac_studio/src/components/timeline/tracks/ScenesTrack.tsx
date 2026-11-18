/**
 * Video-as-Code Studio - Track 2: Scenes & Cuts Track (镜头分镜轨)
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.2 Module 2
 *
 * 绑定底层数据: MotionIR.tracks.scenes[]
 * 功能规范:
 * 1. 结构化呈现 Act 1 / Act 2 / Act 3 分镜色块；
 * 2. 标注转场类型 (waterfall, rack_focus, zoom_through) 与持续帧数；
 * 3. 标注代码托管权状态 (MANAGED_DECLARATIVE vs OPAQUE_USER_CODE)；
 * 4. 标识源码映射路径 (如 src/compositions/bronze_heritage/acts/Act1.tsx)。
 */

import React from 'react';
import { SceneTrackItem } from '../../../models/motion_ir';

interface ScenesTrackProps {
  scenes: SceneTrackItem[];
  totalFrames: number;
  zoom?: number;
  selectedSceneId?: string | null;
  onSelectScene?: (sceneId: string) => void;
}

export const ScenesTrack: React.FC<ScenesTrackProps> = ({
  scenes,
  totalFrames = 900,
  zoom: _zoom,
  selectedSceneId,
  onSelectScene
}) => {
  return (
    <div
      data-testid="vac-scenes-track"
      className="relative h-9 bg-[#0b0c10] border-b border-[#232733] select-none overflow-hidden flex items-center px-1 font-mono text-[10px]"
    >
      {/* Track Label */}
      <div className="absolute left-1 top-1 z-10 px-1 py-0.5 rounded bg-[#181a24] text-[#8e98ac] text-[8px] font-bold tracking-wider uppercase border border-[#272d3f]">
        Track 2: Scenes
      </div>

      {/* Render Scenes */}
      <div className="w-full h-7 relative mt-1">
        {scenes.map((scene, idx) => {
          const leftPercent = (scene.startFrame / totalFrames) * 100;
          const widthPercent = (scene.durationFrames / totalFrames) * 100;
          const isSelected = selectedSceneId === scene.id;

          // Color palette per act
          const actThemes = [
            'from-amber-950/60 to-amber-900/30 border-amber-600/50 text-amber-200',
            'from-emerald-950/60 to-emerald-900/30 border-emerald-600/50 text-emerald-200',
            'from-blue-950/60 to-blue-900/30 border-blue-600/50 text-blue-200'
          ];
          const theme = actThemes[idx % actThemes.length];

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene?.(scene.id)}
              className={`absolute top-0 bottom-0 rounded-sm border px-2 py-0.5 bg-gradient-to-r flex items-center justify-between cursor-pointer transition-all ${theme} ${
                isSelected ? 'ring-2 ring-white/60 brightness-125' : 'hover:brightness-110'
              }`}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`
              }}
              title={`${scene.name} (${scene.durationFrames}f) | Source: ${scene.sourceFile}`}
            >
              <div className="flex items-center space-x-1.5 truncate">
                <span className="font-bold text-[9px] text-white truncate">
                  {scene.name}
                </span>
                <span className="text-[8px] text-slate-400">
                  [{scene.durationFrames}f]
                </span>
              </div>

              {/* Transition Badge */}
              {scene.transitionIn && (
                <div className="hidden sm:flex items-center space-x-1 px-1 py-0.2 rounded bg-black/40 border border-white/10 text-[8px] text-cyan-300">
                  <span>⇄ {scene.transitionIn.type}</span>
                  <span className="text-slate-400 font-mono">
                    ({scene.transitionIn.durationFrames}f)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
