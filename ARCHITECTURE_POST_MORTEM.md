# 深度复盘与架构升级：从“概念级临摹”到“像素级微动逆向与满构重构”

> **复盘背景**：针对初版闲鱼 Remotion 宣传片暴露的 3 项致命缺陷进行根本溯源，确立“数据结构与颗粒度缺陷是导致代码视频缩水根源”的诊断，全盘重构逆向工程规范、数据契约（`motion_blueprint.json` v2）与导演双感官审核红线。

---

## 一、初版代码视频致命缺陷根本复盘

### 1. 缺陷一：视觉上空洞稀疏、比例尺寸失真、图形控件数量与复杂度“严重缩水”
* **病灶现象**：初版闲鱼画面大片留白，主文字仅 60~72px 居中浮动，右侧控件缩减为单一小卡片，整体画面填充率不足 35%，充斥着廉价 PPT 感。
* **原片真相对照（第 2、3、4 幕像素分析）**：
  * **原片左右黄金分栏**：
    * **左栏 (X: 80~820px, 占屏 40%)**：主标题字号高达 **110px ~ 130px**（极粗 900 字重，行高 1.05），核心关键词配备**实色高亮底块（Solid Highlight Box）**；左下角常驻 **260px × 260px 巨型吉祥物圆形徽章**（黑粗边 3.5px，硬阴影 6px）。
    * **右栏 (X: 900~1840px, 占屏 50%)**：单个 UI 容器宽度高达 **900px**，高度 **580px~640px**，占满右半屏；采用瑞士新野兽派（Neo-brutalist）重型黑色实体投影（`12px 12px 0px #000`）。
    * **四角与边缘**：浮动 2~4 枚慢速自转与微漂浮的像素钱币/星标粒子，填补对角线张力。
  * **画面整体填充率**：**原片达到 75%~85% 的强视觉冲击度**，而初版缩水了一半以上。

### 2. 缺陷二：场景转场生硬、单场景多元素缺乏“四轨并发交响”
* **病灶现象**：初版场景之间仅靠 Remotion `<Series>` 进行简单的硬切，单场景内文字出来后其他元素静止，元素之间没有呼吸交响。
* **原片真相对照**：
  * **载体对象（Carrier Object）跨转场驻留**：左下角的吉祥物圆形徽章在背景色翻转（如从米白切到浅紫、天蓝）时，**位置恒定锁定，仅伴随微动弹性眨眼或轻微抖动**，作为视觉锚点穿透转场！
  * **四轨并发（Four-Track Symphony）**：在 124 BPM 下，同一个 170 帧场景内同时发生四轨运动：
    * `Track 1` (文字轨)：标题前两词重弹簧敲入 -> 核心词高亮色块带弹性拉伸爆出。
    * `Track 2` (卡片轨)：右侧巨型 UI 卡片从右下方 45 度带重物理惯性滑入并压向定点。
    * `Track 3` (微动轨)：卡片入场尚未结束，内部的进度条已开始被动态削减，清单条目依次打勾弹入。
    * `Track 4` (粒子与遥测轨)：时间码数字高频刷新，边缘钱币与星标正弦波浮动。

### 3. 缺陷三：图形控件内部无动态，退化为静态死板卡片
* **病灶现象**：初版卡片里只有写死的文字和按钮，没有交互过程，没有数字流动，没有状态转换。
* **原片真相对照**：
  * **第 3 幕（手续费吞噬）**：橙色金额条不是静态条，而是**随着下方 4 行费率条目带着红叉 `?` 逐行弹入，进度条长度实时被一截一截啃食缩短**！
  * **第 4 幕（价格滑杆与极速售出）**：价格标签带弹性微震，卡片内包含可动滑杆与按钮高光涟漪。
  * **第 5 幕（表单输入）**：包含跳动的打字机光标 `|` 伴随文字逐字打印。
  * **第 7 幕（极速回款）**：右上角订单卡滑入 `+¥3,200`，下方银行卡内可用余额数字**实时以滚轮计数器向上飙升跳动**！

---

## 二、逆向工程数据契约重大重构 (`motion_blueprint.json` v2)

我们将数据契约的颗粒度从“分镜层”直接下沉到“**控件子层（Sub-Widget）与微动时序层（Micro-Timeline）**”：

```json
{
  "$schema": "https://video-as-code.org/schemas/motion-blueprint.v2.json",
  "meta": { "version": "2.0.0", "target": "remotion", "fps": 60, "bpm": 124 },
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
      "id": "scene_03_problem",
      "duration_frames": 170,
      "transition_type": "carrier_locked_color_flip",
      "background_color": "#FED000",
      "concurrent_tracks": {
        "track_left_headline": {
          "text": ["买二手怕被坑？", "每单都在缩水."],
          "highlight_word": "都在缩水.",
          "stagger_delay_frames": 6
        },
        "track_carrier_badge": {
          "expression": "sweating_worried",
          "bobbing_frequency": 2.0
        },
        "track_right_ui_card": {
          "card_type": "interactive_depletion_meter",
          "enter_frame": 12,
          "spring_config": { "stiffness": 190, "damping": 15 },
          "intra_control_animations": [
            {
              "type": "progress_bar_deplete",
              "start_pct": 100,
              "end_pct": 42,
              "start_frame": 35,
              "duration_frames": 70
            },
            {
              "type": "staggered_penalty_list",
              "items": [
                { "label": "中介抽成", "val": "-15%", "cross_pop_frame": 40 },
                { "label": "支付通道费", "val": "-3%", "cross_pop_frame": 55 },
                { "label": "隐形折损费", "val": "-20%", "cross_pop_frame": 70 },
                { "label": "闲鱼个人交易", "val": "0抽成", "badge_pop_frame": 90 }
              ]
            }
          ]
        },
        "track_orbiting_particles": {
          "count": 3,
          "types": ["coin", "star"],
          "rotation_speed": 1.5
        }
      }
    }
  ]
}
```

---

## 三、更新 Anti-Slop 刚性审查红线（HB12 ~ HB15）

在 `motion-video-director` 中追加以下四条针对“缩水”与“假动态”的不可逾越红线：

| 红线编号 | 红线名称 | 刚性指标与禁止行为 |
| :--- | :--- | :--- |
| **HB12** | **70% 画面密度与防缩水禁令** | 严禁单帧留白超过 30%！主标题字号必须在 **100px~130px**；右侧主卡片必须占屏 50%（宽度 ≥880px）；底角载体徽章必须 ≥240px，严禁缩水为稀疏小构件。 |
| **HB13** | **控件内部微动强制令** | 严禁任何 UI 卡片为静态展示！所有卡片内必须包含**至少 2 处实时功能性微动**（进度条吞噬/增长、数字滚轮实时跳升、复选框顺序打勾、开关拨动、打字机光标或冲压印章）。 |
| **HB14** | **四轨并发节拍编排律** | 严禁单元素等速排队入场。每一幕必须同时挂载**文字轨、卡片轨、控件微动轨、载体粒子轨**，在 124 BPM 鼓点上完成复合交响。 |
| **HB15** | **载体锁定与动量连续律** | 跨场景转场不得全部摧毁重绘。底角载体徽章必须在背景切色时实现**视觉锚定穿透**，右侧卡片需保持动量接力。 |
