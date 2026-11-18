/**
 * Video-as-Code Studio - MotionIR 语义中间表示模型规范 (PRD v2.1.2 §3.2 & WBS-2.1)
 * 遵循 ISO/IEC/IEEE 29148:2018 规范
 *
 * 规范更新说明 (Auditor Eve 审查对齐):
 * - 修正传统 NLE 轨道漂移，回归 PRD v2.1.2 原生五轨规范：
 *   1. 时钟标尺轨 (meta.totalDurationFrames / fps)
 *   2. 分镜轨 (tracks.scenes[])
 *   3. 碎词排版轨 (tracks.fragments[])
 *   4. 音效轨 (tracks.audioCues[])
 *   5. 遥测监控轨 (tracks.telemetry[]) -> 补齐 PRD v2.1.2 数据模型缺失
 */

export interface SceneTrackItem {
  id: string;              // 场景标识 (如 scene-01)
  name: string;            // 场景名称 (如 鸿蒙未判，以铜铸礼)
  sourceFile: string;      // 源码物理相对路径 (如 src/compositions/bronze_heritage/acts/Act1.tsx)
  startFrame: number;
  durationFrames: number;
  transitionIn?: {
    type: 'waterfall' | 'rack_focus' | 'zoom_through';
    durationFrames: number;
  };
  ownership: 'MANAGED_DECLARATIVE' | 'OPAQUE_USER_CODE';
}

export interface FragmentTrackItem {
  id: string;
  text: string;
  sceneId: string;
  startFrame: number;
  holdFrames: number;
  wordCount: number;       // 单词/字符计数，受碎词流规则校验
}

export interface AudioCueTrackItem {
  id: string;
  soundId: string;         // 对应 Earshot 252 资产库唯一标识 (如 bronze_strike_heavy)
  triggerFrame: number;
  offsetMs: number;        // 心理声学时滞偏置 (-60ms ~ +42ms, 依 ITU-R BS.1770-4)
  bedDb: number;           // 背景声避让基线分贝 (如 -9.0dB)
}

/**
 * 补齐提案：MotionIR TelemetryTrackItem (遥测数据项模型)
 * 解决 PRD v2.1.2 中 Track 5 遥测轨缺失底层数据源定义的规格缺陷。
 */
export interface TelemetryTrackItem {
  frame: number;
  instantFps: number;
  deltaMs: number;
  isDrop: boolean;
  audioDriftMs: number;    // Web Audio 硬件时钟 vs 视频播放头漂移绝对值
  astSyncStatus: 'CLEAN' | 'DIRTY' | 'SYNCING' | 'LOCKED';
  hardBanAlerts?: Array<{
    ruleId: 'HB1' | 'HB2' | 'HB4' | 'HB12' | 'HB18' | 'HB19';
    message: string;
    severity: 'WARNING' | 'BLOCKER';
  }>;
}

export interface MotionIR {
  version: '2.1.1';
  meta: {
    projectId: string;
    compositionName: string;
    fps: 60;
    bpm: number;
    totalDurationFrames: number;
    totalDurationSeconds: number;
  };
  designTokens: {
    groundColor: string;       // 背景基底色 (十六进制)
    accentColor: string;       // 核心强调色 (受 HB5 8% 面积约束)
    fontDisplay: string;       // 标题排版字体
    fontMono: string;          // 动态数据等宽字体
  };
  tracks: {
    scenes: SceneTrackItem[];
    fragments: FragmentTrackItem[];
    audioCues: AudioCueTrackItem[];
    telemetry: TelemetryTrackItem[]; // 官方补齐：支持五轨遥测渲染与回放度量
  };
}

/**
 * 青铜纪 (Bronze Heritage) 15s 1080p60 Canonical MotionIR 默认实例
 */
export const BRONZE_HERITAGE_MOTION_IR: MotionIR = {
  version: '2.1.1',
  meta: {
    projectId: 'bronze-heritage-15s',
    compositionName: 'BronzeHeritageFilm',
    fps: 60,
    bpm: 120,
    totalDurationFrames: 900,
    totalDurationSeconds: 15.0
  },
  designTokens: {
    groundColor: '#07080a',
    accentColor: '#d4af37',
    fontDisplay: 'Playfair Display, Songti SC, serif',
    fontMono: 'JetBrains Mono, SF Mono, monospace'
  },
  tracks: {
    scenes: [
      {
        id: 'scene-01',
        name: 'Act 1: 鸿蒙未判，以铜铸礼',
        sourceFile: 'src/compositions/bronze_heritage/acts/Act1.tsx',
        startFrame: 0,
        durationFrames: 270,
        transitionIn: { type: 'waterfall', durationFrames: 20 },
        ownership: 'MANAGED_DECLARATIVE'
      },
      {
        id: 'scene-02',
        name: 'Act 2: 吉金铭文，天地神序',
        sourceFile: 'src/compositions/bronze_heritage/acts/Act2.tsx',
        startFrame: 270,
        durationFrames: 360,
        transitionIn: { type: 'rack_focus', durationFrames: 25 },
        ownership: 'MANAGED_DECLARATIVE'
      },
      {
        id: 'scene-03',
        name: 'Act 3: 国之重器，鼎立千秋',
        sourceFile: 'src/compositions/bronze_heritage/acts/Act3.tsx',
        startFrame: 630,
        durationFrames: 270,
        transitionIn: { type: 'zoom_through', durationFrames: 30 },
        ownership: 'MANAGED_DECLARATIVE'
      }
    ],
    fragments: [
      { id: 'frag-1', text: 'Three thousand years.', sceneId: 'scene-01', startFrame: 25, holdFrames: 95, wordCount: 3 },
      { id: 'frag-2', text: 'Cast in bronze.', sceneId: 'scene-01', startFrame: 135, holdFrames: 110, wordCount: 3 },
      { id: 'frag-3', text: 'Heaven and earth.', sceneId: 'scene-02', startFrame: 300, holdFrames: 130, wordCount: 3 },
      { id: 'frag-4', text: 'Etched in eternity.', sceneId: 'scene-02', startFrame: 450, holdFrames: 130, wordCount: 3 },
      { id: 'frag-5', text: 'Ritual vessel standing forever.', sceneId: 'scene-03', startFrame: 660, holdFrames: 180, wordCount: 4 }
    ],
    audioCues: [
      { id: 'cue-1', soundId: 'earshot_ancient_bell_strike', triggerFrame: 25, offsetMs: -33, bedDb: -9.0 },
      { id: 'cue-2', soundId: 'earshot_bronze_resonance_sub', triggerFrame: 135, offsetMs: -25, bedDb: -12.0 },
      { id: 'cue-3', soundId: 'earshot_sacred_chime_low', triggerFrame: 270, offsetMs: -40, bedDb: -9.0 },
      { id: 'cue-4', soundId: 'earshot_inscription_scrape', triggerFrame: 450, offsetMs: 0, bedDb: -6.0 },
      { id: 'cue-5', soundId: 'earshot_climax_gong_deep', triggerFrame: 630, offsetMs: -50, bedDb: -14.0 }
    ],
    telemetry: [
      { frame: 0, instantFps: 60.0, deltaMs: 16.667, isDrop: false, audioDriftMs: 0.12, astSyncStatus: 'CLEAN' },
      { frame: 270, instantFps: 60.0, deltaMs: 16.612, isDrop: false, audioDriftMs: 0.18, astSyncStatus: 'CLEAN' },
      { frame: 630, instantFps: 60.0, deltaMs: 16.625, isDrop: false, audioDriftMs: 0.22, astSyncStatus: 'CLEAN' }
    ]
  }
};
