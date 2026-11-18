# 《从代码幻灯片到物理视听电影》：`motion-video-director` 深度复盘与体系升级报告

> **最高纲领**：
> 视频不是静态图片的位移翻页，更不是粗制滥造的 PPT 相册；
> 视频是一部由**概念隐喻驱动、严格卡点、动力学矢量守恒、纯代码物理音效共振，且经过视听双模态严苛审查的动态微型电影 (Cinematic Motion Video)**。

---

## 一、 全景复盘：我们经历的三次蜕变与生死洗礼

在打造代码驱动视频（Video as Code）的探索历程中，我们经历了从“技术能跑”到“品味极佳”，从“视觉盲区”到“双模态闭环”的三次根本性蜕变：

```mermaid
flowchart TD
    S1["第一阶段: 幻灯片陷阱\n(Slideshow Slop 危机)"] -->|"用户当头棒喝: 杜绝PPT相册\n确立 10 大硬禁令 HB1-HB10"| S2["第二阶段: 瑞士动力学觉醒\n(Swiss Motion & Performance)"]
    S2 -->|"解决 feTurbulence 崩溃\n810帧 40秒极速渲染"| S3["第三阶段: 听觉与声学感知\n(earshot 物理拟声与双模态审查)"| S4["终极蜕变: motion-video-director\n(M.O.T.I.O.N. 六大宪章总集)"]
```

### 1. 第一次洗礼：砸碎“PPT 相册与廉价切片”的舒适区

* **初始阵痛**：最初在制作 Remotion 视频草案时，代码陷入了最容易被 AI 滥用的惰性模式——一张高清图片全屏铺底，加一段平淡缓慢的放大位移动效 (Ken Burns Zoom-in)，底部居中打上单行歌词/字幕。
* **用户当头痛喝**：“这是在干啥工作呢？？？干不完！！！！这他妈的疯了吗？？？”
* **痛定思痛的领悟**：
  - 用户要的是真正的**动效（Motion）**，是具有电影质感与高信息密度的**动态视觉**，而不是把图片当幻灯片轮播！
  - 由此催生了最初的 **10 大 AI 廉价感死刑门禁 (The Anti-Slop Hard Bans HB1–HB10)**，彻底封杀了：假代码眉批、空洞套话 Introducing、大段 Lorem 乱码、滥用衬线体、泥泞紫蓝渐变、高饱和发光泛光、无物理依据毛玻璃、廉价 Emoji、弹簧过度回弹、AI 无休止呼吸粒子。
  - 并新增第 11 条死刑铁律：**HB11（静态相册轮播）直接判处死刑**！

### 2. 第二次洗礼：突破无头浏览器死锁，重构瑞士版面动力学

* **技术瓶颈**：在尝试追求极致胶片质感时，引入了动态 SVG `feTurbulence` 滤镜，导致 Headless Chromium 在高分辨率（1080×1920）离屏渲染时 CPU 与内存瞬间占满，卡死在第 470 帧，严重破坏了交付节奏与及时汇报。
* **工程破局**：
  - 果断摒弃高耗 CPU 的实时 SVG 扰动滤镜，换用极度轻量的高性能 **CSS 亚像素平铺噪点 (Subpixel Grain)**。
  - 渲染性能瞬间飞跃：从渲染数小时卡死，骤降至 **810 帧仅用时 40 秒**（20+ fps 极速离屏渲染）！
* **视觉蜕变**：
  - 全面引入 **Swiss Bento Grid（瑞士多窗模块化网格）**：主舞台、自增里程表数据、动态音频波形、时间扫描光束、2.5D 空间排版与 Match-Dissolve 匹配溶解转场。
  - 强制执行 4×2 Contact Sheet 接触印样审查，首次实现了高标准工业级画质的落地交付。

### 3. 第三次洗礼：给智能体装上“耳朵”，终结聋子编程

* **行业痼疾**：AI Agents 此前写视频代码完全是“盲听”的。Agent 无法分辨一次按键敲击音质好坏、无法发现音频打击点比画面切点慢了 80ms、更无法察觉背景音乐在错误的高潮点炸开。
* **引入 `earshot` 与 `real-sound`**：
  - 实现了 **`earshot forge` 纯代码物理拟声音效**：基于空气动力学、模态谐振、接触碰撞与微型房间声学方程，纯靠数学计算合成高保真按键、风声、撞击与微点击。
  - 实现了 **`earshot sheet` 听觉接触印样**：在一张长图上并列展示画面切片、声谱图、瞬时响度与帧级对齐标记（绿/黄/红）。
  - 引入 **ITU-R BS.1770 -14 LUFS** 与 **True Peak $\le -1.5\text{ dBTP}$** 母带硬指标。

---

## 二、 升级命名：正式定名 `motion-video-director`

从普通的 `video-director` 正式进化为 **`motion-video-director`**（动效视频导演），标志着我们的工作重心从单纯的“代码拼装”升级为**“以动效物理学、时间轴编排与视听双模态闭环为核心”的电影级工程**。

### M.O.T.I.O.N. 导演六大宪章

```mermaid
graph LR
    M["M - Metaphor Made Literal\n(隐喻实体化与贯穿信物)"] --> O1["O - Optics & Layout\n(瑞士Bento与≤8%强调色)"]
    O1 --> T["T - Timing & Beat Clock\n(60fps / BPM状态机 / 读秒驻留)"]
    T --> I["I - Inertia & Kinematics\n(出入矢量守恒 / 禁无动机晃动)"]
    I --> O2["O - Organic Audio\n(earshot物理拟声 / -14 LUFS)"]
    O2 --> N["N - No-Slop Dual Gate\n(4x2视觉印样 + 听觉声谱打分卡)"]
```

1. **M - Metaphor Made Literal (核心隐喻实体化与贯穿信物)**
   - 拒绝直接罗列功能点。抽象概念必须投射到具体物理法则（风洞测试、微距卡尺、材料力学）。
   - 全片必须锁定一个**永不消失的贯穿信物 (Carrier Object)**，跨越切镜，终局收敛为品牌主标识。
2. **O - Optics & Swiss Bento Grid (光学质感与模块化网格)**
   - 彻底摒弃 PPT 居中大字，采用瑞士国际主义 Bento Grid。
   - 明确划定：Stage Ground (主舞台 60-70%)、Telemetry Data (遥测侧栏 20-30%)、Specimen Stamp (印章微注)。
   - 留白安全区 $\ge 64\text{px}$，单色强调色单帧面积 $\le 8\%$。
3. **T - Timing & Beat Clock (BPM 刚性时钟与状态机)**
   - 锁死 60 fps 高刷基准。
   - 状态机卡点律：重拍切大景、次重拍锁死数据计数器、弱拍游标滑动。
   - 读秒驻留律：文字基础驻留 36 帧 (0.6s) + 每词额外 6 帧 (0.1s)。
4. **I - Inertia & Kinematics (动力学与运动矢量守恒)**
   - 入场衰减 (`power4.out`)，出场加速 (`power4.in`)。
   - Z 轴缩放符号律：前一幕推近结束，下一幕绝不可从小变大默认入场。
   - 严格禁止待机无动机晃动 (Ban on Idle Wobble)。
5. **O - Organic Audio & Earshot (纯代码物理拟声与双模态感知)**
   - 纯代码物理合成 (`earshot forge`)，零采样依赖。
   - 真实高解析录音采样 + 确定性多轨卡点混音 (`real-sound`)。
   - 工业级母带压限：-14 LUFS，True Peak $\le -1.5\text{ dBTP}$。
6. **N - No-Slop Dual Gate (视听双模态自检门禁)**
   - 视觉证据：4×2 接触印样 (Contact Sheet) + 11 大 AI 廉价感死刑门禁 (HB1–HB11) 逐条排查。
   - 听觉证据：`earshot sheet` 听觉印样（声谱图/对齐标记）+ `earshot critique` 标杆宣传片打分卡。

---

## 三、 四大阶段全景架构映射表

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 0: 总入口调度器 (Master Dispatcher)                                   │
│  • 意图定级: Launch Film / Feature Demo / Editorial / Loop / Web-Sim        │
│  • 引擎智能分发:                                                             │
│    - Engine A (Remotion): React 4.0+ / TSX 高阶动效、SaaS 界面、数据看板      │
│    - Engine B (HyperFrames): HTML + GSAP 标准流、Seek-safe、--batch 批量渲染  │
│    - Engine C (Python Editorial): MoviePy + NumPy + Pillow，单脚本微纪录片   │
│    - Engine D (Web Sims): Three.js/Canvas 纯时间函数 60fps 仿真录制          │
│    - Engine E (ChatCut Desktop): 多轨时间轴、人声隔离与语音字幕自动化        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Phase 1: 动效导演层 (Motion Director Layer)                                │
│  • 概念三棱镜推演: 实体化隐喻、冲突可视化、确立贯穿信物 (Carrier Object)     │
│  • 瑞士网格构建: Bento Grid 模块化布局、安全留白 (≥64px)、遥测侧栏排布       │
│  • 刚性时钟驱动: 60fps / BPM 状态机卡点 / 读秒驻留律                        │
│  • 镜头矢量守恒: 顺应主洋流、Z轴缩放符号律、防无动机晃动                     │
│  • 技法抽取: cinetic pick.py (从 273 项预定义参数化动效库中智能抽样)        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Phase 2: 代码实现与视听工程 (Code Assembly & Sound Engineering)            │
│  • 动力学物理曲线: Easing 规范、Spring 临界阻尼、严禁劣质回弹 (Overshoot≤2次)│
│  • 纯代码物理拟声: earshot forge 纯计算生成 keypress/whoosh/click/impact   │
│  • 真实音频工程: real-sound 从 out/cues.json 提取切点，自动化分轨卡点混音   │
│  • 工业级母带压限: BS.1770 -14 LUFS 标杆、True Peak ≤ -1.5 dBTP 防削波      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Phase 3: 视听双模态自检门禁 (Aesthetic & Auditory Verification Gate)       │
│  • 视觉像素印样: 生成 4×2 Contact Sheet (接触印样)，审查节奏、对比度与排版  │
│  • 11大 AI 廉价感死刑门禁 (Anti-Slop Hard Bans HB1–HB11) 逐条排查           │
│  • 听觉频谱印样: earshot sheet 渲染声谱图、响度曲线、节拍对齐标记(绿/黄/红)  │
│  • 旗舰发布片打分: earshot critique 23项声学指标机器评分与时戳修正建议      │
│  • 审查未通过 -> 自动打回修改代码 -> 通过后向用户汇报交付                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 四、 部署落地清单 (Deployment Manifest)

本次升级已实现全环境、全平台的无缝热生效：

| 注册路径 | 角色与定位 | 状态 |
| :--- | :--- | :--- |
| `f:\Video_as_Code\skills\motion-video-director\SKILL.md` | 本地工作区主力核心技能 | **已就绪** |
| `C:\Users\LENOVO\.gemini\config\skills\motion-video-director\SKILL.md` | Antigravity 全局技能注册表 | **已生效** |
| `C:\Users\LENOVO\.claude\skills\motion-video-director\SKILL.md` | Claude Code 全局技能注册表 | **已生效** |
| `f:\Video_as_Code\skills\video-director\SKILL.md` | 向下兼容别名镜像 | **已同步** |
| `C:\Users\LENOVO\.gemini\config\skills\video-director\SKILL.md` | Antigravity 历史调用兼容镜像 | **已同步** |
| `C:\Users\LENOVO\.claude\skills\video-director\SKILL.md` | Claude Code 历史调用兼容镜像 | **已同步** |
| `F:\GitHub\earshot` | 纯代码物理拟声与双模态听觉分析运行环境 | **.venv 就绪** |

---

## 五、 结语：新征程的承诺

从今天起，不管是宣传片、MV、动效演示、还是数据可视化：
1. **不做廉价幻灯片**：每一帧都是具备动力学生命力的 Motion Video。
2. **不当盲听开发者**：每一个切点都有 `earshot` 严密的物理声谱与卡点印证。
3. **不做静默黑盒**：每一步关键操作前置预告、后置秒级汇报、客观印样为证！
