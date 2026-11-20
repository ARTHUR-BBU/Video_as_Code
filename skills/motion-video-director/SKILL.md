---
name: motion-video-director
description: "Orchestration policy and quantitative QA gate (`scripts/motion_qa_gate.py`, HB1–HB20) for code-driven video production. Do NOT select as the primary leaf generator when `cinetic` (new Remotion/HyperFrames film), `motion2code` (flat SVG+GSAP rebuild), `motion-video-deconstruct` (MP4 to Remotion blueprint), or `taste-skill` (web/app UI) directly matches. Load alongside the chosen leaf skill to enforce M.O.T.I.O.N. standards, closed-form kinematics, and post-render Freeze/Motion-Curve/Seek/LUFS QA."
---

# Motion Video as Code: Master Director & Architect (`motion-video-director`)

> **最高宪章**：
> 视频不是静态图片的位移翻页，更不是粗制滥造的 PPT 相册；
> 视频是一部由**概念隐喻驱动、分段碎词流编排、严格卡点、动力学矢量守恒、纯代码物理音效共振，且经过视听双模态严苛审查的动态微型电影 (Cinematic Motion Video)**。

---

## 一、 思想演进与根本分水岭 (The Paradigm Shift)

### 1. 动效视频 (Motion Video) vs 幻灯片切片 (Slideshow Slop) 的生死红线

在过去的代码生成视频中，极易滑向低廉的“相册剪辑模式”（一张静态壁纸 + 缓慢放大 Zoom In + 底部单行字幕），这在专业视听标准中被判为**绝对劣质（Slop）**。

`motion-video-director` 确立了不可逾越的动效基准：

| 维度 | 幻灯片廉价切片 (Slideshow Slop - 严厉禁止) | 真正的动效视频 (Motion Video - 必须执行) |
| :--- | :--- | :--- |
| **画面状态** | 单一静态全屏背景，仅做机械缓慢放大 | **模块化瑞士 Bento 网格**，多层次景深与功能分窗，充实度 ≥ 70% |
| **文案排版** | 大段整句倾倒 (Sentence Dump)，字幕机式出字 | **Fragment Chains (分段碎词流)**：1–4 词链式推进，字画交替呼吸 |
| **动态信息** | 画面元素静止不动，全靠文字变化 | **动态实时遥测**（自增里程表、动态音频波形、时间轴扫描光束、实时参数跳变） |
| **镜头运镜** | 孤立割裂的淡入淡出 (Fade-in/out) | **严格顺应洋流与矢量连续**（前一幕向右冲出，后一幕顺势同向切入） |
| **信物与母题** | 无贯穿元素，每张图割裂独立 | **全片贯穿信物 (Carrier Object)** 跨转场承载视觉焦点，终局收敛为品牌主标 |
| **听觉感知** | 哑巴 Agent 闭眼对齐，声音慢半拍或全片廉价白噪音 | **`earshot` 0.4+ Sound Kit (252 种音效 + launch 配乐相对混音 + 心理声学毫秒时滞律) + `listen.py` 频谱印样 + 23 项发布片声学打分** |

### 2. 交互汇报铁律 (Zero-Silence Communication Rule)

Agent 严禁在后台执行长阻塞任务而保持沉默：
- **前置预告**：凡涉及全帧渲染、依赖拉取、声学模型加载等重型操作，必须在执行前明确告知用户动作意图与预期耗时。
- **即时汇报**：关键节点完成或异常中断时，必须第一时间输出结构化简报与客观证据。

### 3. 无头浏览器防死锁安全法则 (Headless Chromium Safety Guard)

- 在 Remotion 或 HyperFrames 离屏渲染中，**严禁使用全屏动态 SVG `feTurbulence` 等重度 CPU 滤镜**（容易导致 Chromium 在 1080p/4K 渲染数十帧后陷入内存泄漏与线程死锁）。
- 质感噪点统一采用 **CSS 亚像素轻量平铺噪点 (Subpixel Grain Canvas / Pre-baked Noise)**，确保 800+ 帧在数十秒内高效、稳定渲染出片。

---

## 二、 M.O.T.I.O.N. 导演六大宪章 (The 6 M.O.T.I.O.N. Pillars)

本技能的一切推演、代码编写与审查，必须遵循六大核心支柱：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       M.O.T.I.O.N. 导演六大宪章                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  M - Metaphor Made Literal      核心隐喻实体化，锚定不可替代的贯穿信物       │
│  O - Optics & Swiss Bento Grid  瑞士模块化排版，≥70% 充实度，≤8% 单色强调    │
│  T - Timing & Fragment Chains   分段碎词流，字画交替，BPM 刚性时钟，鲜活驻留 │
│  I - Inertia & Kinematics       出入矢量守恒，入场衰减出场加速，严禁文字弹跳 │
│  O - Organic Audio & Earshot    earshot 0.4+ 动态配乐混音与毫秒时钟，-14LUFS  │
│  N - No-Slop Dual Gate          双模态审查：4×2 视觉印样 + earshot 声谱打分卡 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. M - Metaphor Made Literal (核心隐喻实体化与贯穿信物)
- **概念三棱镜推演**：每个片子动手前，必须构思：
  - *Lens A (物理实体化)*：将产品抽象能力转化为可见的物理世界（如风洞气动测试、微距激光测量）。
  - *Lens B (矛盾戏剧化)*：将未解决的痛点放大到触目惊心，再给予定点化解。
  - *Lens C (形式母题)*：确立一个**永不消失的信物（Carrier Object）**（如激光游标、光标、流动能量线），贯穿全片转场。
- **技法库智能抽样 (Technique Draw)**：强制调用 `skills/cinetic/scripts/pick.py`，从 14 大类 273 项测定技法库中按体裁与能量进行加权抽样（约每 2.5s 抽取 1 项），严禁凭空拍脑袋收敛于相同的陈旧套路。
- **淘汰律 (The Deletion Test)**：若将片中主角替换为竞品依然成立，立刻推倒重写！

### 2. O - Optics & Swiss Bento Grid (光学质感与模块化网格)
- **拒绝 PPT 单调居中**：采用国际主义平面设计（瑞士风格）与 Bento 模块化网格：
  - **Stage Ground (主舞台 60%-70%)**：承载核心视窗或物理演进。
  - **Telemetry Data (数据遥测区 20%-30%)**：跳动的实时参数、音频柱状波形、时间码寄存器。
  - **Specimen Stamp & Index (印章与微注)**：极简工序号、环境采样参数、高精度微距卡尺。
  - **70% 充实度铁律 (Occupancy Rule)**：主标题字号必须达 **100px~130px**；右侧 UI 卡片宽度必须 ≥880px；底角载体徽章 ≥240px，搭配四角边缘微动粒子。
  - **克制色彩律**：强调色（Accent Color）单帧面积 **≤ 8%**（强调色是信号灯，绝非油漆桶）。

### 3. T - Timing & Fragment Chains (分段碎词流与刚性时钟)
- **帧率法则**：除纯静态循环动图可降为 25 fps 外，所有涉及 UI、文字或运镜的动效**必须锁定 60 fps**。
- **分段碎词流 (Fragment Chains)**：
  - 一个 Fragment 严格限制在 **1–4 个单词/词组**。
  - 长句必须分解为链条，采用 `build` 模式（行内依次叠加延续）或 `replace` 模式（上一词整块退出，下一词在原位拔起）。
  - **字画交替律 (Text and Picture Take Turns)**：Fragment 之间留出 **30–90 帧的 Picture Beat（画面独立演进呼吸期）**，在这段空白期内画面必须真正发生剧烈动作（如：文字落地 -> 画面产品飞入展开 -> 下一个关键词升起）。文字出现时画面不可有干扰性高速动作。
- **节奏配置文件 (Pace Profiles)**：
  - `PACE.calm` (默认 100 BPM)：文字入场 36f、间隔 11f、抬升 0.2em 无模糊、驻留 `max(60, 42 + 8f/word)`、整体 24f 退出。
  - `PACE.crisp` (120 BPM)：适用于极高能量的短促产品片。
- **鲜活驻留律 (Living Holds Rule)**：文字阅读驻留窗内绝对不可全屏静止僵死，必须保持 **0.3–1 px/f 缓慢微漂移**或 **1–3% 镜头微爬升**赋予画面生命感。
- **字数总预算上限**：30s 宣传片 ≤ 20~25 词（绝对上限 30 词）；产品视频 ≤ 12 词；循环动图 ≤ 6 词；定标 Sting ≤ 4 词。

### 4. I - Inertia & Kinematics (动力学与运动矢量守恒)
- **严禁文字弹跳 (No Springs on Type / F11)**：文字入场一律使用柔和贝塞尔 `outSoft` 或临界阻尼 `SPR.calm`，严禁在字句上出现震颤弹跳 (Bouncy Overshoot)。
- **出入矢量守恒 (Vector Continuity)**：
  - 场景 A 从右侧滑出，场景 B 绝不可又从右侧反向弹回；必须顺应流向切入。
- **Z轴缩放符号律 (Scale-Sign Rule)**：
  - 上一幕以推进（放大）结束，下一幕绝不可从小变大默认入场（避免视觉前后撕裂）。
- **入场衰减，出场加速 (Entrances decay, exits accelerate)**：
  - 入场：`power4.out` 或 `bezier(0.16, 1, 0.3, 1)`（高速切入，柔和刹车）。
  - 出场：`power4.in` 或 `bezier(0.6, 0, 0.9, 0.35)`（蓄力加速冲出）。
- **绝对禁止待机无动机晃动 (Ban on Idle Wobble)**：动效必须执行任务，动作完成即坚决静止驻留。
- **解析闭式弹簧与体积守恒挤压拉伸 (Closed-Form Kinematics)**（详参 `references/cinema-physics-and-qa-playbook.md`）：
  - 所有弹簧必须为时间 `t` 的**纯解析闭式函数**（严禁逐帧积分，确保冷跳转 `cold-seek` 确定性）；阻尼比 $\zeta$ 严格分级：**`1.0`**（UI/文字零回弹）、**`0.8`**（产品/Logo 单次微沉降）、**`0.5`**（角色/吉祥物 2 次弹跳）。
  - **体积守恒挤压拉伸**：下蹲 `1.20×0.75`、起跳 `0.85×1.28`、落地 `1.25×0.75`；60fps 跟随延迟：手臂滞后 `4 帧`，尾饰/领结滞后 `6 帧`。
- **真实光学镜头与动态追焦 (Lens & Depth Tracking)**：
  - 焦段规范：`35mm` 全景空间、`50mm` 主动作、`85mm` 面部特写；浅景深焦点必须**逐帧追踪主角真实深度**，且**限制主角自身运动模糊上限**以保证面部/文字锐利；1080p 下主角像素宽度 **≥ 170px**（群像 ≥ 95px），确保手机端清晰可读。

### 5. O - Organic Audio & Earshot (专属音效包、动态配乐相对混音与纯物理拟声)
- **视听因果律 (Causal Sound)**：每一个击打音必须在画面中找到发射源。
- **Earshot 0.4+ 专属音效包与 252 种程序化声音库 (`earshot kit` / `earshot sfx`)**：
  - **252 种全代码生成声音库 (`forge_v2r6+forge04r1+fit1+pluck1`)**：无需加载重型 AI 模型，纯 NumPy/SciPy 秒级程序化合成。相比 0.3 新增 51 种 recipe 原创声音及 **7 大全新音效家族**：
    - `cut_hit`：sub, kick, punch, rumble, air（电影级画面切镜硬击与次低音冲击）
    - `reverse_swell`：cymbal, ring, dark, short, breath（倒放膨胀与转场吸气垫声）
    - `ui_pop`：soft, step, boop, blip, fall, wide（柔和微拟态交互泡泡，UI最常用）
    - `knock`：wood, plastic, snap, desk, double（真实木质、桌面敲击与材质形变）
    - `mallet`：glock, pluck, celesta, marimba 与五声音阶 chime 琶音（乐音旋律质感）
    - `drip`：drop, bubble, plink, bloop, tiny（极清脆微滴与水泡动态，带上升音高豁免）
    - `shutter`：dslr, snap, mirror, film, quick（机械单反、快门咬合与变焦卡点）
    - 以及升级版 `whoosh_big/thump`, `riser/dark`, `swish/bright`, `whoosh_fast/whip`, `glitch/burst`, `notify/mid_tine`。
  - **全新第 4 预设：`launch` 配乐发布片专属套件 (`earshot kit init --preset launch`)**：
    - 专为 **带背景音乐的电影级产品发布片 (Music-Led Launch Films)** 打造！
    - 打破 0.3 盲目关闭一切 riser 的陈规：在幕间转场 (Section Change) 鸣响 `riser/dark` 或 `reverse_swell/dark`；
    - **Climax Peak 毫秒锁相对齐**：0.4 的 riser 和 swell 均在达到能量巅峰后平缓衰减，因此对齐点严格锁定在 `peak`，彻底解决“按 end 结尾对齐导致高潮过早 0.27s 闪过”的脱节硬伤！
  - **Music-Bed 相对混音引擎 (`bed_db`) & 彻底废除廉价抽吸感 Ducking**：
    - 音效电平不再写死为绝对分贝，而是**相对于背景音乐 (Music Bed) 前 1 秒中位数动态浮现 (`bed_db: 3.0 ~ 9.5 dB`)**；无论音乐高潮还是低回，音效永远清澈立于配乐之上，绝不被淹没也绝不突兀炸音；
    - **Stop-Down 瞬态微让法则**：在 `hit/drop/whoosh.long/swell` 爆发前 0.3~0.5s，背景音乐微让 6~12dB，打击落地瞬间瞬态无缝恢复，**严禁全局侧链压限抽吸 (Zero Ducking Pumping Slop)**！
  - **心理声学毫秒时差对齐律 (`offset_ms`)**：
    - **超前组 (Taps, Knocks, Clicks, Bells)**：设置 `offset_ms: -11 ~ -60` 提前切入（抵消人脑视觉中枢的识别延迟，产生“即触即发”的真实打击感）；
    - **滞后组 (Pop-in thumps, Whoosh & Swell peaks)**：设置 `offset_ms: +30 ~ +42` 滞后画面落地（模拟物理世界的质量惯性与动量冲击）；
    - **连击最小保护间距 (`min_gap_ms: 66 ~ 159`)** 与 **M/S 声场宽度 (`width`)** 协同保障干净声场。
  - **音效密度预算律 (Density Budget per 10s)**：
    - 配乐发布片 (Music-led)：严格控制在 **3 ~ 13 个音效 / 10s**，绝不搞廉价音效轰炸；
    - 口播解说片 (VO Explainer)：18 ~ 30 个 / 10s；
    - 纯音效视效片：30 ~ 38 个 / 10s。
  - **手势物理拟合模型 (`earshot fit --kind gesture`)**：引入多普勒、接近感、空间相位运动旋钮。
  - **母带标准**：全片综合集成响度严格控制在 **-14.0 LUFS (ITU-R BS.1770)**，真峰值 **True Peak ≤ -1.5 dBTP**。

### 6. N - No-Slop Dual Gate (双模态自检门禁)
- **视觉门禁**：渲染完成后，强制导出 **4×2 Contact Sheet (接触印样)**，逐项核验 HB1–HB18 十八大硬禁令。
- **听觉门禁**：运行 `skills/cinetic/scripts/audio/listen.py` 导出**听觉声谱/对齐印样 (`sound_sheet.png`)**，并运行 `earshot critique` 对照 7 部旗舰发布片从 23 项声学指标自动打分。

---

## 三、 四大阶段全景工作流 (The 4-Stage Pipeline)

```
                                [ 用户需求与输入资产 ]
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Phase 0: 总入口调度器 (Master Dispatcher)                                    │
│  • 体裁定级: Launch Film / Feature Demo / Editorial / Loop / Web-Sim         │
│  • 引擎分发:                                                                 │
│    - Engine A (Remotion TSX - Tier 1 旗舰): React 4.0+，工业级交互、组件化沙盒 │
│    - Engine B (HyperFrames - Tier 2 伴侣): HTML/GSAP 极速 Seek 批量渲染      │
│    - Engine C (Python Editorial): MoviePy + NumPy + Pillow，单脚本微纪录片   │
│    - Engine D (Web Sims): Three.js/Canvas 纯时间函数 60fps 物理演进采集      │
│    - Engine E (ChatCut Desktop): 多轨时间轴、人声隔离与语音字幕自动化        │
│    - Engine F (motion2code - 矢量无损循环): Inline SVG + GSAP 单文件，极轻量矢量 │
│    - Engine G (Manim / Blender Headless): 数学公式推演与 Blender 3D 资产脚本  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Phase 1: 动效导演层 (Motion Director Layer)                                 │
│  • 概念三棱镜推演: 实体化隐喻、冲突可视化、确立贯穿信物 (Carrier Object)      │
│  • 技法智能抽样: 运行 skills/cinetic/scripts/pick.py 从 273 项动效库加权抽样 │
│  • 瑞士网格构建: Bento Grid 模块化布局、安全留白 (≥64px)、遥测侧栏排布        │
│  • 碎词分段编排: Fragment Chains (1–4 词)、字画交替律 (30–90f Picture Beat) │
│  • 刚性时钟驱动: 60fps / BPM 状态机卡点 (PACE.calm 100 / PACE.crisp 120)     │
│  • 镜头矢量守恒: 顺应主洋流、Z轴缩放符号律、防无动机晃动                      │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Phase 2: 代码实现与视听工程 (Code Assembly & Sound Engineering)             │
│  • 核心组件原语: Remotion starter (Chain.tsx, pace.ts, Words, Morph, Iris)  │
│  • 动力学物理曲线: Easing 规范、Spring 临界阻尼、严禁文字弹跳 (HB17)          │
│  • 声音工程套件: earshot kit init --preset launch|calm 写入 audio/kit.json     │
│  • 旋钮级卡点渲染: earshot kit render (bed_db 相对配乐混音 + offset_ms 锁相) │
│  • 工业级母带压限: BS.1770 -14 LUFS 标杆、True Peak ≤ -1.5 dBTP 防削波       │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Phase 3: 视听双模态自检门禁 (Aesthetic & Auditory Verification Gate)        │
│  • 视觉像素印样: 生成 4×2 Contact Sheet (接触印样)，审查节奏、对比度与排版   │
│  • 定量防冻结与冷跳转门禁: 运行 scripts/motion_qa_gate.py (freezedetect/运动曲线)│
│  • 像素取证与音频同步: cinetic/scripts/forensics.py + av-audit.py            │
│  • 像素级差分复核: 运行 motion2code frame_diff.py 计算原片与代码帧差异评分   │
│  • 20 大 AI 廉价感死刑门禁 (Anti-Slop Hard Bans HB1–HB20) 逐条排查           │
│  • 听觉频谱印样: skills/cinetic/scripts/audio/listen.py 输出 sound_sheet.png │
│  • 旗舰发布片打分: earshot critique 23 项声学指标 & AAC 编码后 ebur128 复测  │
│  • 审查未通过 -> 自动打回修改代码 -> 通过后向用户汇报交付                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 多引擎智能分发决策矩阵 (Multi-Engine Intelligent Selection Matrix)

为确保多引擎协同作业时**各司其职、绝对无冲突**，Phase 0 总调度器严格依照以下需求特征自动匹配：

| 业务场景 / 交付需求 | 推荐选用引擎 | 核心特征与选型依据 |
| :--- | :--- | :--- |
| **SaaS/商业产品发布片、动态品牌大片** | **Engine A (Remotion TSX 旗舰)** | 追求极致画质、复杂组件沙盒、瑞士 Bento 模块化排版、碎词流排版、1080p/4K 60fps 电影级压制与 `earshot 0.4+` 专属配乐动态混音。 |
| **网页级产品展示、多场景分镜长片** | **Engine B (HyperFrames HTML/GSAP)** | 需与 Web 前端深度集成、快速 Seek-safe 渲染、跨场景 Seam 平滑拼接。 |
| **纯平面矢量轻动效、无缝循环动图 (Looping GIF/SVG)** | **Engine F (motion2code 矢量无损)** | 零位图依赖、<100KB 单文件极致轻量、4K/8K 视网膜矢量无损自适应，单 GSAP 时间轴严格闭环；严禁使用重型视频引擎。 |
| **动态矢量 Logo、品牌微动效、动态图标** | **Engine F (motion2code 矢量无损)** | 纯 SVG path 补间变形，嵌入网页即插即用，零外部播放器开销。 |
| **Web / App 界面录屏复刻为真实交互网站** | **Engine F (motion2code `site.html`)** | 将静态视效转化为 GSAP ScrollTrigger 真实滚动落地页与真实按钮点击。 |
| **3D 机械结构、粒子系统、连续物理演进仿真** | **Engine D (Web-Sims Three.js)** | 纯时间函数 `renderAt(t)` 驱动，配合 `three.quarks` 粒子、`react-postprocessing` 后期与 `Tweakpane` 实时调参。 |
| **数学公式、算法推导、几何定理演示** | **Engine G (Manim / Blender)** | Manim 公式动画或 `blender -b --factory-startup -P` 无头 3D 道具生成（导出 GLB + ES 模块）。 |
| **单脚本微纪录片、轻量自动剪辑** | **Engine C (Python Editorial)** | Python MoviePy/NumPy 批量微纪录片，或 Rust `EffectCraft` 高速合成。 |

### 跨引擎逆向工具链赋能 (Cross-Engine Reverse-Engineering Tooling)
- **前期自动解构 (`study_video.py`)**：任何参考视频（无论后续是用 Remotion 还是 SVG 重建），均可直接调用 `python skills/motion2code/scripts/study_video.py source.mp4 -o study/`，以 0.25s 间隔自动切片、捕捉转场 Cut、自动提取极简调色板 (Color Palette) 并生成 `study.json`。
- **原片对齐差分打分 (`frame_diff.py`)**：在 Phase 3 审查阶段，调用 `python skills/motion2code/scripts/frame_diff.py source.mp4 output.html -o diff/`，对原视频与生成代码进行逐帧并排差分打分（Difference Score），精准排查最不像原片的翻车瞬间。
- **代码纯度与循环质检 (`check_anim.py`)**：调用 `python skills/motion2code/scripts/check_anim.py index.html --runtime`，无头浏览器自动核验控制台报错、网络请求、`seek(t)` 确定性与循环接缝。

---

## 四、 20 大 AI 廉价感死刑门禁 (The Anti-Slop Hard Bans HB1–HB20)

凡接触印样中出现以下任何特征，直接判为“AI塑料廉价感”，必须立刻打回重写：

| 编号 | 廉价感特征 (The Slop Tells) | 为什么廉价 (Why It's Slop) | 致命修正法 (The Fix) |
| :--- | :--- | :--- | :--- |
| **HB1** | **眉批与微型指示词**<br>`"NEW FEATURE"`, `"01 / SPEED"` | 偷懒的层级划分，模板味浓 | **直接删掉**。层级靠字号比（≥2:1）与登场时差体现。 |
| **HB2** | **套话口号与 "Introducing..."**<br>`"Introducing..."`, `"Next-gen"` | 空洞陈腐，缺乏产品自信 | **直接开门见山**，从第 1 帧切入核心痛点或真实动作。 |
| **HB3** | **文字大段堆叠与假代码乱码**<br>大段段落、乱填的Lorem Ipsum | 观看者根本无法在视频中阅读 | **全片严格限词**（30秒≤25词）。单屏单行，无用文字全删。 |
| **HB4** | **无端滥用衬线体与伪斜体**<br>故意用 Serif 营造所谓的“高级感” | 产生廉价的伪奢华感，干扰识别 | **严选现代无衬线体 (Sans)**，数据用等宽 (Mono)。全片至多2套字体。 |
| **HB5** | **泥泞灰褐/脏橘色或廉价紫蓝渐变**<br>紫色到蓝色的幻彩渐变 | 最典型的 AI 生成式海报皮肤 | **选用纯正单色强调色**（如朱砂红、冷青、松绿、原色墨黑、宣纸原白）。 |
| **HB6** | **高饱和霓虹泛光与发光外描边**<br>Neon Glow, Bloom, 发光边框 | 刺眼劣质，破坏画面的平面高级感 | **彻底去除外发光**。深度靠精准阴影（如 `0 28px 90px rgba(0,0,0,.16)`）或 1px 极细发丝线。 |
| **HB7** | **无物理根据的玻璃拟态**<br>滥用毛玻璃模糊、白透边框 | 脱离场景物理逻辑的视觉垃圾 | **改用不透明实体表面**配以克制的一级微投影。 |
| **HB8** | **廉价 Emoji 与现成剪贴图标**<br>🎉, 🚀, 💡, 现成矢量小人 | 破坏专业严肃的工程与叙事质感 | **完全使用产品本身的 UI 图标**或写实几何图形。 |
| **HB9** | **全屏弹性回弹 (Bouncy Spring)**<br>卡片弹出时疯狂来回弹跳 | 玩具般的廉价幼稚感 | **使用临界阻尼**，高速滑入并在终点优雅刹车，严禁无端晃动。 |
| **HB10** | **AI 小火星、粒子雨与无休止呼吸**<br>Sparkles, Confetti, 待机浮动 | 用无意义的噪点掩饰内容空虚 | **动效必须执行明确任务**（指示、切分、测量）。完成即静止。 |
| **HB11** | **静态壁纸 + 慢速推镜 (Photo Slideshow)**<br>单张静态图片 Ken Burns 缩放 | 偷懒的相册轮播，非动效视频 | **重构为 Swiss Bento Grid**，加入动态遥测数据、波形与动力学组件。 |
| **HB12** | **画面空洞与元素缩水 (Empty Void & Diluted Controls)**<br>留白超过30%，小卡片居中浮动，字号过小 | 丧失商业级大片张力，呈现无内容的廉价感 | **严格遵守 70% 画面充实度**：主标题字号必须达 **100px~130px**；右侧 UI 卡片宽度必须 ≥880px；底角载体徽章 ≥240px，搭配四角边缘微动粒子。 |
| **HB13** | **静态卡片与假控件 (Dead UI Cards & Fake Controls)**<br>UI卡片仅作为死板文字背景，无内部状态演进 | 视觉静止，破坏代码视频生命感 | **所有 UI 控件内部必须有 ≥2 处实时微动**（进度条实时吞噬/增长、滚轮计数器实时跳升、多行条目顺序打勾、开关拨动、打字机光标）。 |
| **HB14** | **单元素等速排队入场 (Sequential Waiting Slop)**<br>文字出来后控件再慢慢出，各元素串联等待 | 节奏拖沓，丧失音乐律动感 | **四轨并发交响编排**：文字轨、卡片轨、控件微动轨、载体粒子轨在鼓点上复合并发，梯次重叠入场。 |
| **HB15** | **场景生硬硬切 (Abrupt Hard Cut Without Retention)**<br>场景切换时画面所有元素被全部摧毁重绘 | 造成观感割裂，无法形成连续镜头心流 | **转场必须贯彻载体锁定与动量连续**：底角徽章在背景翻色时保持锚定穿透，控件卡片保持矢量推挤与缩放接力。 |
| **HB16** | **大段文字倾倒与字幕电影 (Sentence Dump & Subtitle Slop)**<br>一次性贴出完整长句，像在放 PPT 幻灯片 | 违背动效视频本质，文字喧宾夺主 | **必须拆解为 Fragment Chains**（1–4 词链式推进），字画交替发生（Picture Beat 30–90f）。 |
| **HB17** | **文字滥用弹性震颤 (Springs on Type / F11)**<br>字体进入时产生弹簧 Overshoot 抖动 | 破坏字体严谨骨架，产生业余玩具感 | **文字一律使用平滑贝塞尔 `outSoft` 或临界阻尼 `SPR.calm`**，严禁弹跳与震颤。 |
| **HB18** | **死寂无动静驻留 (Frozen Static Reading Hold)**<br>文字出现后全屏所有像素绝对静止死锁 | 画面失活，被误判为卡顿假死 | **阅读驻留窗内保持 0.3–1 px/f 缓慢微漂移**或 1–3% 镜头微爬升，维持呼吸生命感。 |
| **HB19** | **廉价侧链抽吸与固定分贝炸耳 (Cheap Sidechain Ducking & Fixed-dB Blast)**<br>音效一出背景音乐就抽吸变形，或音效被配乐淹没/突兀炸响 | 典型业余混音特征，破坏电影级声场质感与沉浸感 | **必须执行 `earshot 0.4+` 的 `bed_db` 相对配乐混音**（音效浮于音乐前1秒中位数上 3~10dB），严禁全局 Ducking 抽吸；重击前 0.3s 执行 6~12dB 瞬态 `stop_down` 并在打击瞬间瞬态复原；视听对齐强制引入 `offset_ms` 心理声学时延律！ |
| **HB20** | **静帧盲审漏网冻结与冷跳转失效 (Unplanned Freeze & Non-Deterministic Seek)**<br>仅看静态 Contact Sheet 放行，实际成片大段冻结、主角缩成像素点，或直接跳转第 300 帧与顺序渲染不一致 | 静态抽帧永远抓不出“画面卡死”；逐帧积分状态机导致 Seek 错乱 | **强制执行定量运动门禁**（详参 `references/cinema-physics-and-qa-playbook.md`）：① `ffmpeg freezedetect` 0 意外冻结；② Python `frame_diff` 运动曲线核验每拍皆有波峰；③ `cold-seek` 校验 `frame(300, cold) == frame(300, seq)`；④ 主角 1080p 宽度 ≥ 170px；⑤ AAC 编码**后**复测 `ebur128`（-14 LUFS / ≤ -2 dBTP）。 |

---

## 五、 常用能力底层映射表 (Skill Capability Registry)

| 需求场景 | 调度底层 Skill | 具体承接操作 |
| :--- | :--- | :--- |
| **防同质化动效灵感抽取 `[Repo-Local]`** | `cinetic` | 运行 `skills/cinetic/scripts/pick.py` 智能抽样 273 项测定技法库及其参数 |
| **分段碎词流与阅读节拍 `[Repo-Local]`** | `cinetic` | 调度 `Chain.tsx`、`pace.ts` 计算字画交替 Picture Beat 与驻留窗口 |
| **通用防冻结与响度门禁 `[Repo-Local]`** | `motion-video-director` | 运行 `skills/motion-video-director/scripts/motion_qa_gate.py`（`freezedetect` + 运动曲线 + `cold-seek` + AAC 后 `ebur128`） |
| **Remotion 像素取证与音画同步 `[Repo-Local]`** | `cinetic` | 运行 `skills/cinetic/scripts/forensics.py` 与 `skills/cinetic/scripts/av-audit.py` |
| **专属音效包与物理拟声 `[Requires .venv]`** | `earshot` (`0.4+`) | 需本地 `./earshot` + `.venv`：`earshot kit` / `forge` / `critique`；视觉声谱印样用 `skills/cinetic/scripts/audio/listen.py` |
| **参考视频逆向与工程解构 `[Repo-Local]`** | `motion-video-deconstruct` | 将参考 MP4 逆向解构为 `motion_blueprint.json` 并编译为 Remotion TSX（桥梁：`vac_studio/server/ast_engine/ir_bridge.ts`） |
| **高品味 Web/App 界面设计 `[Repo-Local]`** | `taste-skill` (`v2.1`) | 调度 `skills/taste-skill/scripts/draw.mjs` / `inspect.mjs` / `lint.mjs` / `assets.mjs` |
| **纯平面矢量轻动效与无缝循环 `[Repo-Local]`** | `motion2code` | 运行 `skills/motion2code/scripts/study_video.py` / `frame_diff.py` / `check_anim.py` / `render_anim.py` |
| **真实录音配乐规范 `[Spec-Only / External]`** | `real-sound` | 仅含工作流规范（混音脚本需外部提供，无源码时降级回 `earshot` 或 `ffmpeg`） |
| **全局扩展技能 `[Global Agent Skills]`** | `hyperframes` / `web-sims` / `motion-doctrine` / `cut-the-curve` / `chatcut-*` | 由宿主 Agent 环境提供（非本仓库内嵌文件）；Three.js `renderAt(t)` 遵循 `references/cinema-physics-and-qa-playbook.md` |
| **外部可选工具参考 `[External Optional]`** | `blender-skills` / `Manim` / `three.quarks` / `Tweakpane` / `Openverse API` | 按需安装的外部生态能力，详参 `references/cinema-physics-and-qa-playbook.md` |

---

## 六、 启动仪式与用户交付标准 (Standard Interaction Ritual)

当接收到任何视频或动效制作需求时，Agent 必须执行以下标准仪式：

1. **确立总导演案 (Phase 1 汇报)**：
   - 【核心隐喻】：将产品特性映射为什么实体世界。
   - 【贯穿信物】：定义全片不消失的 Carrier Object。
   - 【技法抽样】：公布 `cinetic pick.py` 抽取的动效组合。
   - 【视觉版面】：定义 Swiss Bento 网格各分区功能（主舞台 70%、遥测区 20%、微注区 10%）。
   - 【节奏流态】：定义帧率 (60fps) 与 `PACE.calm` (100 BPM) 或 `PACE.crisp` (120 BPM)，公布 Fragment Chains 与 Picture Beats 规划。
2. **宣布技术引擎与音效策略 (Phase 2 汇报)**：
   - 宣布所选技术引擎：依据智能分发决策矩阵，说明选定 Remotion（商业/SaaS/电影级）、HyperFrames（Web级多场景）或 motion2code（纯平面矢量轻动效/循环动图）的客观理由。
   - 明确音频方案：初始化 `earshot kit`（配乐发布片强制选用 **`--preset launch`**，文本片选 `calm`），公布 `bed_db` 相对配乐电平、`mix.stop_down` 瞬态避让与 `offset_ms` 心理声学微时差。
3. **渲染并生成视听双模态证据 (Phase 3 闭环)**：
   - 导出 `contact_sheet.png` (4×2 视觉关键帧切片)。
   - 运行 `skills/cinetic/scripts/audio/listen.py` 导出 `sound_sheet.png` (声谱与对齐标记)。
   - 运行 HB1–HB20 自检清单、`ffmpeg freezedetect`、`frame_diff` 运动曲线与 `cold-seek` 校验，并给出逐项定量合规判定。
4. **交付最终成品与自检报告**：附带视觉印样与声学测量数据向用户汇报交付！
