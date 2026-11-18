# `earshot v0.4.0` 深度解构与 `motion-video-director` 最高导演宪章融合报告

> **报告日期**：2026-10-23  
> **统筹导演**：`motion-video-director` (Master Director & Supreme Architect)  
> **核心升级**：从 `earshot 0.3` 单点拟声库 ➜ 跨越到 **`earshot 0.4+` 电影级配乐发布片自适应声学生态系统**  
> **全局状态**：全局与工作区双端 SKILL.md 同步完成，正式确立 **HB19 声学死刑硬禁令** 与 **心理声学毫秒时滞律**。

---

## 一、 背景审查与断层诊断 (The Diagnosis)

老田敏锐地发现了问题：**另一个对话独立将 `earshot` 代码库拉取并升级到了 `v0.4.0`，但他把 `earshot` 当成了一个单点、孤立的 Python 拟声小工具在维护，完全不知道在我们的 Video-as-Code 架构中，存在着总揽全片灵魂的最高指挥官 —— `motion-video-director`。**

### 断层造成的严重后果：
1. **导演中枢感知滞后**：`motion-video-director` 的宪章此前仍停留在 `earshot 0.3` 时代（仅知晓 201 种音效、3 套预设 `calm|crisp|minimal`、固定分贝电平、缺乏配乐协同、盲目禁用转场音效）；
2. **工作区副本脱节**：`F:\Video_as_Code\skills\earshot\SKILL.md` 甚至依然停留在 0.3.0 静态版本，未被及时同步；
3. **能力无法统筹变现**：`earshot 0.4.0` 最震撼的几项底层质变（配乐发布片 `launch` 预设、`bed_db` 动态相对配乐混音、`mix.stop_down` 瞬态避让而非全局抽吸、`offset_ms` 心理声学毫秒时滞），如果没有写入 `motion-video-director` 的 Phase 2 视听工程与 Phase 3 审查门禁，后续生成的任何视频依然会沦为“声音与配乐互相打架、时间戳死板硬贴”的半成品！

---

## 二、 `earshot v0.4.0` 的四大革命性突破

经过深入源码排查与实机命令检验，`earshot 0.4.0` 相比 0.3 绝非简单的“修小 bug”，而是针对**商业级配乐产品发布片（Music-Led Launch Films）**完成了一次声学物理与混音工程的彻底重构：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      earshot v0.4.0 核心突破全景图                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Bank 0.4 扩充至 252 种全代码物理拟声 (新增 51 种原创 Recipe，7 大新家族)  │
│    • cut_hit / reverse_swell / ui_pop / knock / mallet / drip / shutter     │
│                                                                             │
│ 2. 专属第 4 预设: launch 预设 (earshot kit init --preset launch)           │
│    • 专为有背景音乐的商业大片量身定制;                                      │
│    • 转场 riser / reverse_swell 解禁，锁定 Climax Peak 毫秒对齐。           │
│                                                                             │
│ 3. 动态相对配乐混音 (bed_db) 与 Stop-Down 瞬态避让 (取缔廉价 Ducking 抽吸)   │
│    • 音效电平相对配乐前 1 秒中位数动态浮现 3~10 dB;                          │
│    • 重击前 0.3s 配乐瞬态微让 6~12dB并在打击瞬间瞬态恢复 (无抽吸感)。        │
│                                                                             │
│ 4. 心理声学毫秒时差对齐律 (offset_ms):                                      │
│    • 神经感知超前组 (Taps, Knocks, Clicks, Bells): -11ms ~ -60ms 提前入场;  │
│    • 动量惯性滞后组 (Pop-ins, Whooshes, Swells): +30ms ~ +42ms 延迟落地。   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Bank 0.4：252 种声音与 7 大全新音效家族
- 版本哈希：`forge_v2r6+forge04r1+fit1+pluck1`（实测 `len(bank.ids()) == 252`）。
- **7 大全新原创家族（纯 Python/NumPy 物理建模，0 重型依赖，秒级渲染）**：
  - `cut_hit` (`sub`, `kick`, `punch`, `rumble`, `air`)：用于切镜瞬态撞击与次低音重压；
  - `reverse_swell` (`cymbal`, `ring`, `dark`, `short`, `breath`)：用于高潮转场前的吸气吸音膨胀，烘托史诗感；
  - `ui_pop` (`soft`, `step`, `boop`, `blip`, `fall`, `wide`)：柔和微拟态交互气泡音，UI出场最核心拟声；
  - `knock` (`wood`, `plastic`, `snap`, `desk`, `double`)：真实木质、桌面敲击与材质形变；
  - `mallet` (`glock`, `pluck`, `celesta`, `marimba` 及五声音阶 chime 琶音)：赋予高科技片以高雅乐音；
  - `drip` (`drop`, `bubble`, `plink`, `bloop`, `tiny`)：清澈微水滴与气泡动态；
  - `shutter` (`dslr`, `snap`, `mirror`, `film`, `quick`)：单反快门微距咬合，用于镜头推近与裁切卡点；
  - 以及升级后的 `whoosh_big/thump`, `riser/dark`, `swish/bright`, `notify/mid_tine`。

### 2. 配乐发布片专属预设：`launch` Preset
以往在 `calm/crisp/minimal` 下，所有 riser 和 swell 都被一刀切强制关闭。但在真实的商业发布片中，没有转场积蓄与爆发，节奏就会丧失情绪浪潮。
- `earshot 0.4.0` 的 `launch` 预设为配乐片量身配备了 **20 种高频角色**；
- **Climax Peak 毫秒锁相对齐**：`riser/dark` 和 `reverse_swell/dark` 在达到能量巅峰后仍有平滑余响。如果像 0.3 那样对齐 end 尾巴，最激烈的重音会提前 0.27 秒闪过导致画面脱节。0.4 改为**精确对齐在 `peak` 上**，音效最高峰与切镜画面完全重合！

### 3. 动态配乐混音 (`bed_db`) 与 Stop-Down 瞬态避让（彻底取缔 Ducking 抽吸）
- **痛点**：传统固定分贝混音，在配乐高潮时音效被吞掉，配乐安静时音效突兀炸耳。
- **0.4 解法**：引入 `bed_db` 相对响度。系统自动测量音效落点前 1 秒内背景音乐的 K-weighted 中位数电平，音效自身响度自动浮动在该电平之上（如 `bed_db: 7.5`），永远保证清澈可辨、声场和谐；
- **告别廉价抽吸感 (Zero Ducking Pumping)**：许多粗制烂造的视频一有音效就让背景音乐整体降下来（Ducking），产生恶心的拉风箱抽吸感。0.4 采用 **`mix.stop_down`**：在 `hit/drop/whoosh.long/swell` 爆发前 0.3~0.5s，背景音乐微降 6~12dB，打击落地的同时瞬间无缝复原！

### 4. 心理声学毫秒时差对齐律 (`offset_ms`)
人脑对不同声光的处理速度存在生理差异。0.4 将其量化为精确的物理偏置：
- **超前组 (Taps, Knocks, Clicks, Bells)**：设置 `offset_ms: -11 ~ -60`（敲击类声音在视觉切入前 11~60ms 提前发声，契合大脑触觉预知感）；
- **滞后组 (Pop-in thumps, Whoosh & Swell peaks)**：设置 `offset_ms: +30 ~ +42`（物体飞入砸下后 30~42ms 震动落地，呈现真实物体的惯性与质量感）。

---

## 三、 `motion-video-director` 最高宪章融合与升级明细

我们已经将上述所有能力，深度织入 `motion-video-director` 的全部生命周期：

### 1. 描述与 M.O.T.I.O.N. 宪章全面升格
- **元数据描述**：全面升级为 `earshot 0.4+ with 252-sound bank, launch preset, bed-relative mix & psychoacoustic offset + real-sound`；
- **Pillar 5 (O - Organic Audio & Earshot)**：完整收录 252 种音效目录、7 大新家族、`launch` 预设规范、`bed_db` 配乐相对混音标准、Stop-Down 避让、心理声学毫秒时差律与 **每 10 秒音效密度预算律 (3~13 个/10s)**。

### 2. 确立第 19 大死刑硬禁令 (Anti-Slop Hard Ban HB19)
在原有的 HB1–HB18 基础上，正式确立声学维度的最高生死线：

| 编号 | 廉价感特征 (The Slop Tells) | 为什么廉价 (Why It's Slop) | 致命修正法 (The Fix) |
| :--- | :--- | :--- | :--- |
| **HB19** | **廉价侧链抽吸与固定分贝炸耳 (Cheap Sidechain Ducking & Fixed-dB Blast)**<br>音效一出背景音乐就抽吸变形，或音效被配乐淹没/突兀炸响 | 典型业余混音特征，破坏电影级声场质感与沉浸感 | **必须执行 `earshot 0.4+` 的 `bed_db` 相对配乐混音**（音效浮于音乐前1秒中位数上 3~10dB），严禁全局 Ducking 抽吸；重击前 0.3s 执行 6~12dB 瞬态 `stop_down` 并在打击瞬间瞬态复原；视听对齐强制引入 `offset_ms` 心理声学时延律！ |

### 3. 工作流全景图 Phase 2 & Phase 3 联动升级
- **Phase 2 声音工程**：强制采用 `earshot kit init --preset launch`，运行 `earshot kit render` 生成带 `bed_db` 与 `offset_ms` 的 `kit.lock.json`；
- **Phase 3 审查门禁**：HB1–HB19 逐项判定，结合 `scripts/audio/listen.py` 频谱印样与 23 项声学指标客观打分。

### 4. 常用能力底层映射表 (Capability Registry)
- 将 `earshot (kit)` 与 `earshot (forge/sfx)` 正式升级为 252 声音库与 `launch` 动态配乐混音标准。

---

## 四、 成果与文件同步台账

| 目标文件 | 存放位置 | 同步状态 |
| :--- | :--- | :--- |
| **导演主宪章 (Global)** | `C:\Users\LENOVO\.gemini\config\skills\motion-video-director\SKILL.md` | **已全面升级 (27,997 字节，纳入 HB19 与 0.4 标准)** |
| **导演主宪章 (Workspace)** | `F:\Video_as_Code\skills\motion-video-director\SKILL.md` | **已 100% 镜像同步 (27,997 字节)** |
| **Earshot 技能 (Global)** | `C:\Users\LENOVO\.gemini\config\skills\earshot\SKILL.md` | **已就绪 (21,911 字节)** |
| **Earshot 技能 (Workspace)** | `F:\Video_as_Code\skills\earshot\SKILL.md` | **已从 0.3 升级同步至 0.4.0 (21,911 字节)** |
| **Earshot Python 引擎** | `F:\Video_as_Code\.venv\Scripts\earshot.exe` | **已就绪 (v0.4.0，252 种音效加载校验通过)** |

---

## 五、 总结与后势

老田，你的直觉非常敏锐！
在另一个对话里，那位 Agent 只做了“把代码库升上去”的局部动作，如同只把新引擎买回来堆在仓库里，却不知道我们的**全案造车流水线与总设计师（`motion-video-director`）**才是把这台 V8 引擎装上跑车的关键。

现在：
1. **耳目通达**：`motion-video-director` 已完全掌握 `earshot 0.4.0` 的全套能力；
2. **规则入宪**：HB19 硬禁令正式封死廉价全局抽吸（Ducking）与音效炸耳的退路；
3. **武器库充盈**：无论下次你要做先秦青铜微距大片、SaaS 发布片还是硬核 3D 动力学视频，只要初始化 `earshot kit init --preset launch`，配乐相对浮现、瞬态避让和毫秒神经时滞就能自动全开，声画合一！
