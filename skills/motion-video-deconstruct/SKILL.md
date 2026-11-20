---
name: motion-video-deconstruct
description: "Reverse-engineer an existing reference MP4 video into a structured motion_blueprint.json and modular Remotion TSX (or HyperFrames) project. Use ONLY when decomposing a reference video into multi-scene Remotion architecture. Do NOT use for flat single-file inline SVG+GSAP loops (`motion2code`) or creating a new video from scratch without a reference (`cinetic`)."
---

# Motion Video Deconstruct: Video-to-Code Reverse Engineering (`motion-video-deconstruct`)

> **核心使命**：
> 彻底终结把参考视频拆解成“不可控的生视频提示词 (AI Prompts)”的传统低幼模式；
> **将任何高品质参考视频，直接像素级逆向解构为“高保真、可二次编程、确定性渲染的代码视频工程 (Code-driven Motion Project)”！**

---

## 一、 战略定位：Remotion 为一等公民，兼顾 HyperFrames

在代码视频的实际效果中，**Remotion（React 4.0+ TSX）是当之无愧的视觉天花板**：
* **动力学表现力**：Remotion 的 `spring()` 弹簧动力学、`interpolate()` 连续插值、React 状态组件化能力、动态 Canvas 示波器、亚像素胶片颗粒（Subpixel Grain）远胜于基础的 HTML/GSAP 拼装。
* **开发与工程生态**：组件沙盒化（`<Series.Sequence>`）、TypeScript 强类型契约、与现代 Web 资产生态 100% 无缝融合。
* **双引擎搭档定位**：
  - **核心编译主引擎 (Tier 1)**：**Remotion TSX** —— 用于绝大多数追求极致画质、复杂交互、精细排版、高动态遥测的旗舰宣传片、MV、UI 演示片。
  - **轻量伴侣引擎 (Tier 2)**：**HyperFrames HTML/GSAP** —— 继承其分镜设计计划思想（`STORYBOARD.md` / `DESIGN.md`），用于单 HTML 静态嵌入或无 Node 环境的极速 Seek-safe 渲染。

`motion-video-deconstruct` 的中间数据契约（`motion_blueprint.json`）是**框架无关、面向动力学物理与版面的纯数学抽象**，天然原生编译为 Remotion，同时可无缝转换为 HyperFrames。

---

## 二、 核心工程数据接口规范 (`motion_blueprint.json`)

所有参考视频的逆向产物，必须严格满足以下标准工程 Schema：

```json
{
  "$schema": "https://video-as-code.org/schemas/motion-blueprint.v1.json",
  "meta": {
    "source_file": "ref_launch_video.mp4",
    "deconstructed_at": "2026-10-16T14:10:00Z",
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 60,
    "total_frames": 720,
    "duration_seconds": 12.0,
    "bpm": 120,
    "primary_target": "remotion",
    "secondary_target": "hyperframes"
  },
  "design_tokens": {
    "palette": {
      "background": "#0b0c10",
      "surface": "#141721",
      "border": "rgba(255, 255, 255, 0.08)",
      "text_primary": "#ffffff",
      "text_secondary": "#717e94",
      "accent": "#00f0ff",
      "accent_area_pct": 5.0
    },
    "typography": {
      "headline_font": "Geist Sans, -apple-system, sans-serif",
      "mono_font": "JetBrains Mono, monospace",
      "headline_size_rem": 3.5,
      "sub_size_rem": 1.25,
      "scale_ratio": 2.8
    },
    "safe_margin_px": 64
  },
  "carrier_object": {
    "id": "telemetry_scan_beam",
    "type": "laser_line",
    "color": "#00f0ff",
    "trajectory": "贯穿全片转场引力线，最终在尾幕收拢为品牌主标"
  },
  "scenes": [
    {
      "id": "scene_01",
      "name": "Hook_Promise",
      "timeline": {
        "start_frame": 0,
        "end_frame": 180,
        "duration_frames": 180,
        "start_beat": 1,
        "duration_beats": 6
  "global_layout_rules": {
    "min_occupancy_ratio": 0.72,
    "split_ratio": { "left_column_pct": 42, "right_column_pct": 50, "gutter_px": 80 },
    "headline_typography": {
      "font_size_px": 115,
      "font_weight": 900,
      "line_height": 1.08,
      "highlight_box": { "padding": "6px 20px", "border_radius": 12 }
    },
    "carrier_badge": {
      "size_px": 260,
      "position": { "bottom": 80, "left": 80 },
      "border": "3.5px solid #111216",
      "box_shadow": "8px 8px 0px #111216"
    },
    "right_card": {
      "width_px": 900,
      "min_height_px": 560,
      "position": { "top": 180, "right": 80 },
      "border": "3.5px solid #111216",
      "border_radius": 24,
      "box_shadow": "14px 14px 0px #111216"
    }
  },
  "scenes": [
    {
      "id": "scene_01",
      "name": "Hook_Promise",
      "timeline": {
        "start_frame": 0,
        "end_frame": 170,
        "duration_frames": 170,
        "start_beat": 1,
        "duration_beats": 6
      },
      "concurrent_tracks": {
        "track_left_headline": {
          "words": ["Selling", "tickets", "to your"],
          "highlight_word": "next event?",
          "font_size_px": 115,
          "stagger_frames": 6
        },
        "track_carrier_badge": {
          "size_px": 260,
          "carrier_retention_across_cut": true,
          "animation": "spring_bobbing"
        },
        "track_right_ui_card": {
          "component": "InteractiveDepletionCard",
          "dimensions": { "width": 900, "height": 580 },
          "enter_physics": { "type": "spring", "stiffness": 200, "damping": 16 },
          "intra_control_animations": [
            { "type": "progress_bar_deplete", "start_pct": 100, "end_pct": 42, "duration": 60 },
            { "type": "staggered_items", "stagger": 8, "sub_indicators": ["- 平台佣金 15%", "- 通道费 3%"] }
          ]
        },
        "track_orbiting_particles": [
          { "type": "pixel_coin", "orbit": "top_center", "rot_speed": 1.5 },
          { "type": "pixel_coin", "orbit": "bottom_center", "rot_speed": -1.2 }
        ]
      },
      "transition_out": {
        "type": "carrier_locked_color_flip",
        "duration_frames": 16,
        "retained_carrier_id": "carrier_badge"
      }
    }
  ]
}
```

---

## 三、 四阶逆向解构流水线 (The 4-Step Pipeline)

```
                       [ 目标参考视频: ref_video.mp4 ]
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 1: 时域切片与节拍探测 (Temporal & Beat Extraction)                     │
│  • FFmpeg 场景切变算法提取 Cut Points: 起止帧、各幕时长                     │
│  • 音频频段分析提取基准 BPM，将时间轴规整为 60fps 状态机卡点                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 2: 空间版面与瑞士网格逆向 (Spatial & Bento Reverse-Engineering)        │
│  • 提取原片关键帧，生成 ref_contact_sheet.png                                │
│  • 识别 Swiss Bento 区域：主视窗 (Stage)、遥测侧栏 (Telemetry)、留白安全区    │
│  • 色彩与排版采样：主色、表面色、对比色比例 (≤8%)、标题与正文字号比 (≥2:1)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 3: 动力学矢量与物理拟合 (Kinetic Curves & Audio Cues)                  │
│  • 追踪运动位移曲线，拟合 Remotion spring 常数 (mass/stiffness/damping)     │
│  • 识别出入矢量守恒 (Vector Continuity) 与五大接缝转场技法                   │
│  • 运行 earshot timeline 提取音频打击点，生成 audio_cues 列表               │
│  • 输出核心规范契约: motion_blueprint.json                                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 4: Remotion 原生工程代码脚手架编译 (Remotion Compilation)             │
│  • 自动脚手架化:                                                             │
│    - Root.tsx (注册 Composition、fps: 60、尺寸与主时间轴)                   │
│    - scenes/Scene01.tsx, Scene02.tsx (模块化 React 动效组件)                 │
│    - components/BentoGrid.tsx, KineticOdometer.tsx, ScanBeam.tsx            │
│    - constants.ts (BPM, 调色盘, spring 参数)                                │
│  • 渲染后生成双联接触印样 diff_comparison_sheet.png 校验 1:1 像素还原度      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 四、 自动化逆向工具集 (Automation Tooling)

### 1. 时域切点与关键帧提取脚本 (`scripts/deconstruct_cuts.py`)

运行以下命令对参考视频执行快速切片与代表帧提取：

```bash
python scripts/deconstruct_cuts.py --input ref_video.mp4 --threshold 0.3 --out dir/deconstruct/
```

该工具自动输出：
1. `cuts.json`：包含每个 Shot 的 `start_frame`、`end_frame`、`duration`。
2. `ref_contact_sheet.png`：原片每个分镜的静态接触印样（4×2 或动态列数）。
3. `shots/shot_01.jpg`, `shot_02.jpg`：各镜头代表帧。

### 2. 听觉事件抽取联动 (`earshot`)

直接通过 `earshot timeline` 提取原视频的全部打击点与转场音：

```bash
python -m earshot timeline ref_video.mp4 --cues dir/deconstruct/cuts.json --json --out dir/deconstruct/audio_cues.json
```

将音频事件自动对齐到分镜切点中。

### 3. Remotion 模板代码发射器 (`scripts/emit_remotion.py`)

输入 `motion_blueprint.json`，直接发射出开箱即用的 Remotion 工程骨架：

```bash
python scripts/emit_remotion.py --blueprint dir/deconstruct/motion_blueprint.json --out-dir src/
```

### 4. 高频分帧与调色板自动化提取 (`motion2code study_video.py`)

运行以下命令对参考视频执行高频 0.25s 自动分帧、转场 Cut 捕捉、调色板精准取色与首尾循环评分：

```bash
python skills/motion2code/scripts/study_video.py ref_video.mp4 -o dir/study/
```

该工具自动输出：
1. `frames/t0000.00.png` ...：每 0.25 秒的高清切片帧。
2. `cuts/`：转场切变瞬间的前后两帧。
3. `sheet.png`：按时间轴网格排列的全景接触印样。
4. `study.json`：包含视频尺寸、fps、时长、切点时间戳、主色彩 hex 调色板与循环平滑度评分。

### 5. 像素级差分对比打分排错 (`motion2code frame_diff.py`)

在完成代码构建后，直接比对原片与代码渲染帧的像素级差异：

```bash
python skills/motion2code/scripts/frame_diff.py ref_video.mp4 out.html -o dir/diff/
```

输出原片与代码渲染帧的并排比对图 (`pair_t*.png`) 和平均像素差异打分 (Difference Score)，精准揪出偏离最大的翻车瞬间。

---

## 五、 与 `motion-video-director` 的协同标准

当用户发出指令：*“参考这个视频的风格/转场/排版做一个视频”* 时：
1. **调用 `motion-video-deconstruct`**：提取该视频的 `motion_blueprint.json` 与 `ref_contact_sheet.png`。
2. **内容置换 (Content Injection)**：保留原片的网格比例、动力学节奏与转场矢量，置换为用户指定的产品文案、组件形态与品牌配色。
3. **Remotion 原生编译**：生成模块化 React 动效组件并在本地极速渲染。
4. **双联印样与定量门禁自检 (Dual Verification)**：
   - 生成重构视频的 `contact_sheet.png`，与原片印样并列审查；
   - 运行 `python skills/motion-video-director/scripts/motion_qa_gate.py <out.mp4>` 执行 HB20 定量防冻结与 AAC 后响度门禁；
   - Remotion 工程联动运行 `python skills/cinetic/scripts/forensics.py <out.mp4> --cues out/cues.json`；
   - 提取的弹簧动力学参数按闭式阻尼比 $\zeta$（UI `1.0` / 产品 `0.8` / 角色 `0.5`）编译，严禁逐帧积分。
