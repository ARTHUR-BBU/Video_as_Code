# Video-as-Code Studio (VAC Studio)

> **"君子使物，不以物使，一切为我所用"**  
> 原生、本地优先、代码与视口双向绝对一致的工业级动效编辑与代码合成底座。

---

## 1. 核心架构与设计原则

VAC Studio 是面向全流程代码驱动视频（Video-as-Code）生产与二次编辑的专业 Studio 系统。不同于传统的黑盒外挂，VAC Studio 将业界先进动效引擎与交互模式完全吸收并内生化为自研的确定性流水线：

- **双流锁相时间基准**：
  - **模式 A (实时播放)**：以 Web Audio 硬件晶振时钟为绝对主时钟，采用比例-积分（PI）伺服锁相环实时微调原片送显倍率，实现 $<8.0\text{ms}$ 亚半帧相位漂移（实测最劣 $\max|e(t)| = 2.643\text{ms}, \text{RMS} = 0.909\text{ms}$，跨 3 类异构素材 $0$ 帧错位）；
  - **模式 B (逐帧擦洗)**：基于 WebCodecs 确定性离散帧解算，Remotion 视口通过命令式订阅瞬时受控同步，达成 $\Delta t = 0.00\text{ms}$ 绝对时钟冻结。
- **双向 AST 语法治理 (MotionIR)**：
  - **托管声明区 (MDZ)**：可视化 GUI 具备局部精准属性 Patch 权限，写入严格保持单行 `git diff`；
  - **非托管自由区 (UZ)**：业务逻辑采用 CST 级别保真机制，严禁全局格式化污染；
  - **动态表达式**：自动降级为只读镜像，保障代码所有权绝对安全。
- **动态差分比对与反 AI HUD**：
  - 双流画布像素级差分热力图计算（$\Delta E$ 欧氏距离）；
  - 动效工程 HUD 实时拦截异常回弹与静止停滞违规。

---

## 2. 规范与审计文档体系

- [VAC_STUDIO_PRD_V2_AUDIT_READY.md](./VAC_STUDIO_PRD_V2_AUDIT_READY.md)：外部技术审计终审正本（涵盖架构、时钟方案、端口防碰撞、MotionIR、风险登记与 13 组测试用例）。
- [VAC_STUDIO_PRD_AND_DEVELOPMENT_TREE.md](./VAC_STUDIO_PRD_AND_DEVELOPMENT_TREE.md)：PRD v1.0 与完整 WBS 研发里程碑分解树。
- [OPENMOTION_ASSIMILATION_BLUEPRINT.md](./OPENMOTION_ASSIMILATION_BLUEPRINT.md)：OpenMotion 吸收解构与同化工程蓝图。
- [tests/tc_sync_01/tc_sync_01_manifest.json](./tests/tc_sync_01/tc_sync_01_manifest.json)：TC-SYNC-01 核心资产与遥测工件 SHA-256 密码学指纹清单。

---

## 3. 测试与独立机检复算

项目内嵌完整的全自动化盲测验证套件，支持在标准 Python 3.11+ 环境下无外部依赖独立复现：

```bash
# 运行 TC-SYNC-01 跨素材（60fps/24fps/30fps）盲测与统计复算
python tests/tc_sync_01/run_full_blind_audit.py
```

### 验证准则：
- **准则 A (零帧错位)**：$\max |\Delta\text{Frame}| == 0$
- **准则 B (亚半帧时滞)**：最劣 $\max |e(t)| < 8.0\text{ ms}$
- **准则 C (抖动控制)**：最劣 $\text{RMS} \le 3.5\text{ ms}$
- **光学抽样检查点**：整秒抽样点匹配率严格为 $100.0\%$ (`PASS`)

---

## 4. 目录结构

```text
Video_as_Code/
├── VAC_STUDIO_PRD_V2_AUDIT_READY.md       # 工业级 PRD v2.1.1 审计终审正本
├── VAC_STUDIO_PRD_AND_DEVELOPMENT_TREE.md # WBS 研发分解树与排期
├── OPENMOTION_ASSIMILATION_BLUEPRINT.md   # 架构同化设计蓝图
├── openmotion_catalog_index.json          # 287 套模板资产元数据索引
├── tests/
│   └── tc_sync_01/                        # TC-SYNC-01 锁相环盲测与遥测工件
│       ├── run_full_blind_audit.py        # 跨素材全自动盲测套件
│       ├── tc_sync_01_telemetry_900f.csv  # 900 帧高精度遥测采样数据
│       ├── tc_sync_01_summary.json        # 审计汇总结论
│       ├── tc_sync_01_manifest.json       # SHA-256 工件指纹清单
│       ├── sync_test_1080p60_15s.mp4      # 基准合成测试信号
│       ├── sync_test_complex_gop24_24fps_15s.mp4 # 盲测复杂素材
│       └── sync_test_broadcast_gop6_30fps_15s.mp4# 盲测彩条素材
├── aether_pilot_15s/                      # Aether SaaS 动效实战项目
├── bronze_heritage_15s/                   # 青铜器文博实战项目
├── sanguo_guanyu_15s/                     # 关羽高燃实战项目
├── ghibli_awakening_60s/                  # 吉卜力手绘动效项目
└── space_bunny_replica/                   # 太空兔动效复刻项目
```

---

## 5. 许可与声明

本项目内所有核心架构设计、算法控制律与 PRD 资产归研发团队所有。
