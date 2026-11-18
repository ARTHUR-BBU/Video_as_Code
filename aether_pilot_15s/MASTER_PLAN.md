# Aether Edge (以太边缘) 15s 商业发布片 · 试炼企划总案

> **项目代号**：`Aether-Taste-Pilot`  
> **总导演引擎**：`motion-video-director` (60fps BPM 刚性时钟 + 瑞士 Bento 网格 + 视听双模态自检)  
> **视觉品味底座**：`taste-skill v2.1.4` (`draw.mjs --app` 抽取真实软件界面 + `app.css` + `charts.js` + `lint.mjs` 前置质检)  
> **声学合成引擎**：`earshot 0.3+` (全代码物理拟声 Sound Kit + 毫秒级声画合拍)

---

## 一、 产品定义与核心隐喻 (Product Identity & Metaphor)

| 维度 | 设定参数 |
| :--- | :--- |
| **产品全称** | **Aether Edge (以太边缘)** · 全球微秒级智能流量与边缘算力编排云 |
| **一句话定位** | *"Global Traffic. Zero Indirection."*（全球流量，微秒直达） |
| **核心解决痛点** | 跨国云服务传统 BGP 路由抖动、全球边缘节点间延迟高达 80ms+、冷启动不可预测 |
| **产品杀手级能力** | 全球 320 个 PoP 节点微秒级动态选路，将 P99 跨洲延迟强行压制至 **1.8 ms**，SLO 违规率归零 |
| **核心隐喻 (Lens A)** | **光学轨道与激光测距尺**：全球网络不再是混沌的云雾，而是一套严密咬合、以光速校准的物理光轨 |
| **全片贯穿信物 (Carrier Object)** | **以太微秒激光游标 (Aether Laser Cursor)**：从第 1 帧的延迟测距线，跨转场穿透入 Dashboard 形成基准参考线，最终在尾声收敛为品牌主标 |

---

## 二、 `taste-skill v2.1` 抽样的三套真实软件界面提案

通过运行 `taste-skill draw.mjs --app --kind devtools`，我们为 Aether 抽取了 3 套完全杜绝“AI 塑料模板病”的纯正软件系统，请老田定夺：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Aether 视觉设计系统三选一                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 提案 A (抽样首选): Framed sheet (边框画纸流)                                │
│   - 特征: L 型浅蓝灰底框 (#f9fbfc)，悬浮圆角 (16px) 白底画纸，0 投影，极克制 │
│   - 色彩: 97% 墨黑与极简灰阶，仅 3% 科技青蓝 (#1b6c80) 用于核心流量数据与状态 │
│   - 字体: IBM Plex Sans (标题/正文) + IBM Plex Mono (节点键名与毫秒数值)    │
│                                                                             │
│ 提案 B: Achromatic ledger (无色记账簿流)                                    │
│   - 特征: 纯正瑞士国际主义黑白灰，全屏 0 品牌彩色镀铬，彩色像素 < 1%         │
│   - 色彩: 纯墨黑 (#0a0a0a) + 纯白 (#ffffff) + 仅在延迟骤降拐点亮起深宝蓝     │
│   - 字体: Geist + Geist Mono，绝对严谨的现代工业感                          │
│                                                                             │
│ 提案 C: Data terminal (高密微秒终端流)                                      │
│   - 特征: 纯黑深色背景 (#0d0e11)，单像素发丝线分隔，极致紧凑的信息密度     │
│   - 色彩: 碳素黑底盘 + 琥珀黄预警线 + 祖母绿健康信号点                      │
│   - 字体: JetBrains Mono + Inter，黑客与基础设施极客风格                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、 15秒 商业级动效分镜总谱 (The 15-Second Storyboard)

全片严格执行 **60 fps / 900 帧**，节拍锁定 **`PACE.calm` (100 BPM，每拍 36 帧)**：

```
时间轴 (帧数)      画面动作演进 (Picture Beat)                   文字碎词链条 (Fragment Chain)
0.0s - 4.0s        【Act 1: 痛点暴露 · 全球网络抖动】            "Packets drift."
(f0 - f240)        深色全球拓扑网格，节点红光闪烁，              (文字落地，画面剧烈抖动)
                   激光游标扫过显示 "P99 LATENCY: 84.6ms"         "Latency bites."
                   [转场: 激光游标横向切开画面，矢量右冲]

4.0s - 10.0s       【Act 2: 核心赋能 · taste-skill 真实界面】     "Aether routes."
(f240 - f600)      镜头平滑推入 Aether 核心控制台：              (文字停留，界面微动)
                   1. 等分 KPI 栏数字从 84.6ms 滚轮实时跳变为 1.8ms
                   2. `charts.js` 实时绘制 24h 流量趋势线与虚线 SLO 阈值
                   3. 节点状态表逐行亮起绿灯：Tokyo, Frankfurt, SFO
                   [转场: 控制台数据框收缩汇聚为一道光束]

10.0s - 15.0s      【Act 3: 价值终局 · 品牌收官】                 "Zero indirection."
(f600 - f900)      光束穿透虚空，信物展开为 Aether 极简双环定标，   "Speed of light."
                   四角微注浮现全球 320 节点合规认证，画面沉静驻留。
```

---

## 四、 `taste-skill v2.1` 严苛质检与工程落地步骤

```mermaid
flowchart LR
    Step1["1. 抽取界面方案<br>(draw.mjs --app)"] --> Step2["2. 装配真实组件<br>(app.css + charts.js)"]
    Step2 --> Step3["3. 纯静态防塑料质检<br>(lint.mjs --app)"]
    Step3 --> Step4["4. Remotion 60fps 动效渲染<br>+ earshot 0.3 音频锁相"]
    Step4 --> Step5["5. 视听双模态终审<br>(Contact Sheet + 声谱)"]
```

1. **零假数据原则**：控制台内的所有节点 IP、毫秒延迟、吞吐吞吐量均严格闭合，杜绝 Lorem Ipsum 与无意义文字。
2. **前置质检门禁**：在调用 Remotion 离屏渲染前，强制运行 `node skills/taste-skill/scripts/lint.mjs`，确保代码中无任何外发光、劣质毛玻璃、紫蓝渐变与静止阴影。
3. **声学工程**：调用 `earshot kit` 初始化 `crisp` 预设，生成全球节点同步微滴答声 (`click/optic`)、延迟切断冲击音 (`impact/metal`) 与尾声收官和弦。

---

## 五、 老田决策确认点

在正式启动代码工程前，请老田确认：
1. **视觉风格倾向**：你更中意 **提案 A（Framed sheet 浅色画纸流）**、**提案 B（Achromatic ledger 极简黑白灰）** 还是 **提案 C（Data terminal 深色终端流）**？
2. **节奏强度**：当前的 15 秒（100 BPM，沉稳克制、字画交替呼吸）是否符合你的口味？
3. **确认即可启动**：确认后立即进入 Phase 2 代码构建与真实界面装配！
