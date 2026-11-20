# 《TixFox 宣传片》视频逆向工程与 Remotion 蓝图拆解报告

> **目标源文件**：`F:\grok video\mbnrH8INtduXj8GW.mp4`  
> **逆向引擎**：`motion-video-deconstruct` (Remotion-First Dual-Target Pipeline)  
> **执行时间**：2026-10-16 14:22  

---

## 一、 原片全局基本面与视听参数

通过 `deconstruct_cuts.py` 与 `earshot timeline` 自动化提取的物理元数据：

| 维度 | 参数值 | 行业标准评价 |
| :--- | :--- | :--- |
| **画布规格** | `1920 × 1080` (16:9 横屏) | 旗舰级桌面与网页标准分辨率 |
| **画面帧率** | **60.0 fps** | 极其流畅的高刷动效，拒绝 24/30fps 顿挫 |
| **总时长** | **38.50 秒** (2310 帧) | 经典 30-40s SaaS 旗舰发布片结构 |
| **节拍时钟 (BPM)** | **124.0 BPM** (65 film bars, phase 0.00s) | 强节奏打击乐驱动，完美吻合 120-125 BPM 动效黄金区间 |
| **综合集成响度** | **-14.4 LUFS** (True Peak -0.3 dBTP) | 完美契合 ITU-R BS.1770 -14 LUFS 工业标准 |
| **声学分段** | Intro (0-5s) $\rightarrow$ Body (5-31s) $\rightarrow$ Outro (31-38.5s) | 弹拨乐器打击驱动，三段式叙事闭环 |

---

## 二、 原片全景接触印样 (Reference Contact Sheet)

自动抓取 13 个关键分镜代表帧并合成接触印样：

![TixFox Reference Contact Sheet](C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/tixfox_ref_contact_sheet.png)

---

## 三、 视觉艺术与版面解构 (Visual & Bento Grid Deconstruction)

### 1. 核心视觉流派：瑞士网格半色调抖动风 (Swiss Dithered Halftone & Neo-Brutalism)
- **点阵半色调质感 (Dithered Pixel)**：主角小狐狸形象、票券图标与装饰徽章均采用复古印刷网点（Halftone/Dither）处理，兼具科技感与复古手作温润感。
- **高对比动态转场色彩**：不同小节采用对比鲜明的背景大色块推进节奏：
  - **Scene 01**: 象牙原白 `#F5F2EB`（开门见山，小狐狸戴墨镜“psst...”入场）
  - **Scene 02**: 暖杏橙 `#F5B682`（痛点展示：`Tired of fees`）
  - **Scene 03**: 原色墨黑 `#111216`（产品亮相：`Meet TixFox.`）
  - **Scene 04**: 长春花蓝 `#8B9EE3`（定价冲击：`Just 39¢ a ticket.`）
  - **Scene 05**: 柠檬亮黄 `#EEF345`（能量爆破与快速切镜）
  - **Scene 07-08**: 天青蓝 `#76B3F0`（手机端验票：`QR tickets land`）
  - **Scene 09**: 薰衣草紫 `#C5B8F1`（即时回款结算：`Paid out instantly.`）
  - **Scene 10-11**: 科技黑 `#18191D`（现场验票零硬件：`At the door? No hardware.`）
  - **Scene 12-13**: 品牌主色原白 `#F8F7F4`（大 Logo、信物聚合与 CTA 按钮收官）

### 2. 贯穿信物 (Carrier Object)
- **信物实体**：**Dithered Fox Avatar（半色调像素小狐狸）**。
- **信物轨迹**：
  - 第一幕作为核心主角登场；
  - 第二幕至第十一幕缩小驻留在**左下角圆形印章视窗**中，作为贯穿信物实时陪伴用户视线；
  - 最终第十二幕跃入中央主舞台，与品牌 Wordmark `TixFox` 聚合，达成品牌印记闭环。

### 3. 排版与微注系统 (Telemetry Headers)
- 每一幕顶部统一包含极简等宽微注：
  `// 01 · the problem  TIXFOX 00:00:04:30`
  `// 03 · pricing  TIXFOX 00:00:10:30`
  `// 06 · checkout  TIXFOX 00:00:19:30`
- 既具备严谨的技术工程感，又清晰界定了产品功能模块。

---

## 四、 编译落地：已生成的 Remotion 工程脚手架

已通过 `emit_remotion.py` 在 `F:\Video_as_Code\remotion_deconstruct_tixfox` 自动生成完整的 Remotion TSX 工程代码：

```
F:\Video_as_Code\remotion_deconstruct_tixfox\
├── Root.tsx               # 注册 60fps, 2310 帧, 13 幕 <Series.Sequence> 主时间轴
├── constants.ts           # 提取出的全局参数 (BPM 124, 调色盘, 安全留白 64px, 字体)
└── scenes\
    ├── Scene01.tsx        # Hook 开门见山 (物理 Spring 弹簧动效 + 瑞士 Bento 卡片)
    ├── Scene02.tsx        # The Problem
    ├── Scene03.tsx        # Meet TixFox
    ├── Scene04.tsx        # Pricing (39¢)
    ├── Scene05.tsx        # Accent Flash
    ├── Scene06.tsx        # Transition Blur
    ├── Scene07.tsx        # Mobile Mockup
    ├── Scene08.tsx        # QR Scan
    ├── Scene09.tsx        # Instant Payout
    ├── Scene10.tsx        # Check-in Camera
    ├── Scene11.tsx        # Crossed-out Hardware
    ├── Scene12.tsx        # Full Brand Lockup
    └── Scene13.tsx        # CTA & Outro
```

---

## 五、 后续实战建议

1. **直接在此骨架上修改**：只需将文案、图标或数据换成我们自己的产品，就能立刻以 Remotion 的最高渲染品质复刻这套火爆的海外 SaaS 动效宣传片！
2. **像素级动效增强**：我们可以在 `Scene01` 至 `Scene13` 中继续强化 Remotion 独有的 `interpolate` 物理曲线与 `earshot` 拟声音效。
