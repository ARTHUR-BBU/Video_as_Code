# 闲鱼品牌 × Cinetic 1.1.0 + Earshot 0.3.0 跑测与全流程验收报告

> **测试目标**：将 Leon 库（`Leonxlnx/cinetic` v1.1.0 与 `Leonxlnx/earshot` v0.3.0）的参考视频架构完全移植到**闲鱼（Goofish）**品牌体系中，完成从品牌设计语言注入、Fragment 链式动效、Earshot 声效采样渲染、时间轴网格锁相、音频配乐合成到 Remotion 逐帧渲染与声画质检的完整工业级闭环。

---

## 1. 核心产物与交付文件

- **最终合成视频**：[`xianyu_cinetic_test.mp4`](file:///f:/Video_as_Code/xianyu_cinetic_test/out/xianyu_cinetic_test.mp4)
  - 规格：`1920x1080 @ 60.0 fps`，共 780 帧（13.000 秒）
  - 编码：H.264 (High Profile, yuv420p, BT.709 广播级色彩空间)
  - 音频：AAC 320 kbps, 48 kHz, 2 Channels, +faststart 优化
- **46 帧全片视觉接触表（Visual Contact Sheet）**：
  ![闲鱼视觉接触表](file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/xianyu_cinetic_contact_sheet.png)
- **关键帧视觉实拍**：
  - **Frame 100**（首段文案「买卖闲置」升入并静读）：
    ![Frame 100](file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/xianyu_frame100.png)
  - **Frame 250**（句式闭合「买卖闲置 就上闲鱼」加闲鱼黄句点）：
    ![Frame 250](file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/xianyu_frame250.png)
  - **Frame 750**（闲鱼标志几何化装配与品牌字标 Wordmark 定格）：
    ![Frame 750](file:///C:/Users/LENOVO/.gemini/antigravity/brain/eb16aa3d-3dd0-4b4d-9292-1fc75ed89670/xianyu_frame750.png)

---

## 2. 品牌工程化适配详情

| 维度 | 原 cinetic starter | 闲鱼品牌定制实现 (`xianyu_cinetic_test`) |
| :--- | :--- | :--- |
| **主品牌色** | Electric Blue `#0055FF` | **闲鱼官方黄 `#FED000`**（通过 `// cinetic:brand-supplied` 白名单校验） |
| **暗色调画底** | `#0B0C0E` | **深炭灰画底 `#111216`**（纯色背景抗压缩色带） |
| **品牌几何标** | 3 片式抽象 Mark（穹顶 A + 矩形 B + 锚点 D） | **闲鱼鱼形标志装配**：弧形鱼身（A）、尾鳍方块（B）、闲鱼黄鱼眼（D） |
| **载体信使 (Carrier)** | 蓝色句点 Dot | **闲鱼黄视觉句点**：由第一幕文案标点顺滑演变为鱼眼核心 |
| **文案链条** | `["Built on", "the beat."]` | `["买卖闲置", CUE.fragA] -> ["就上闲鱼", CUE.fragB]`（100 BPM calm 节奏） |
| **字体系统** | Geist Variable (英文字族) | `PingFang SC`, `Microsoft YaHei`, `sans-serif` 无衬线中文屏显字族 |

---

## 3. 自动化质量门禁（QA Gates）检测结果

### 3.1 规格与封装探测 (`probe.py`)：✅ 全部 PASS
- 尺寸分辨率：`1920x1080` (PASS)
- 帧率：`60.0 fps`，总帧数 `780` 帧 (PASS)
- 容器时长：`13.000s +-0.018s` (PASS)
- 像素格式与色彩：`yuv420p`, `bt709/bt709/bt709/tv` (PASS)
- 音频流：`AAC 48000Hz 2ch`，时长精确对齐 `13.000s` (PASS)

### 3.2 声画同步门禁 (`check-sync.py`)：✅ 0 采样误差极限 PASS
- 监测点：
  - `t = 1.40s`（首句落定）：**lag = 0 samples (+0.00 ms), correlation = 1.000**
  - `t = 4.96s`（句号敲定与次句进入）：**lag = 0 samples (+0.00 ms), correlation = 0.9995**
  - `t = 9.28s`（标志组装锁定音效）：**lag = 0 samples (+0.00 ms), correlation = 1.000**
- 最大延迟：**0 samples**（容忍上限为 48 samples，达理论极限精准度）
- 综合响度：**-18.03 LUFS**（广播级标准）
- 真实峰值（True Peak）：**-2.25 dBTP**（安全阈值 <= -1.0 dBTP）

### 3.3 视听对应与编排审计 (`av-audit.py`)：✅ 全部 PASS
- 瞬态打击同步：**7/7 声学瞬态落点在 +-2 帧窗口内，中位数漂移 +0.00 帧**
- 视觉关键高潮顶点：**1/1 强力声学峰值与标志组装视觉 Apex 完美吻合**
- 破音与杂音检测：首尾电平缓冲合格，0 破音（Clipped samples = 0），0 点击噪声（Clicks = 0）

---

## 4. 关键验证结论
1. **Remotion 与 cinetic 框架兼容性**：完全达成 60fps 确定性单帧渲染与多进程加速，代码结构符合品牌规范。
2. **Earshot 0.3.0 音频生成与管线**：成功根据时间轴网格自动渲染 64 个音频采样 Take，通过 `score.py` 自动化合成出具备动态起伏的电影感声轨。
3. **视觉传达与动效连贯性**：闲鱼黄句点作为 Carrier 信使贯穿 Act 1 与 Act 2，避免了多场景间的割裂感，彻底消除了生硬翻页感。
