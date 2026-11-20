# Video-as-Code Studio & Capability Base

> **"君子使物，不以物使，一切为我所用"**  
> 一个五层闭环、可自动化路由、带自我审计闸门的 Video-as-Code 能力基座与本地优先动效编辑 Studio。

> [!IMPORTANT]
> **当前研发状态声明 (Active Development / WIP)**  
> - **Video-as-Code 能力基座 (`skills/` + `ROUTER.md` + `manifest.json` + CI 门禁)**：五层结构已闭环可交付，支持自动化路由与持续自我审计。  
> - **VAC Studio 产品本体 (`vac_studio/`)**：**目前仍处于持续开发与迭代阶段（非最终成品）**。已完成 **M0（双模引擎与首跑）**、**M1.1（五轨时间轴与主时钟锁相）**、**M1.2（MotionIR AST 双向同步引擎）** 三道门禁签字，后续 **M1.3 / M2（差分分屏与军火库装配）/ M3（反塑料感 HUD 与声学中枢）** 将持续开发和优化。

---

## 1. 两层核心架构

1. **VAC Studio（开发中产品，`vac_studio/`）**：
   - **双流锁相时间基准**：Web Audio 主时钟 + PI 伺服锁相环（实测 $\max|e(t)| = 2.643\text{ms}, \text{RMS} = 0.909\text{ms}$）；暂停/擦洗切换离散整数帧 $\Delta f \equiv 0$。
   - **MotionIR 双向 AST 同步引擎（M1.2 已签字）**：托管声明区（MDZ）严格单行 `git diff` 精准替换；非托管区（UZ）CST 100% 字节保真；动态表达式自动降级只读锁死（磁盘零写入）；支持 `motion_blueprint.json` $\leftrightarrow$ `MotionIR` 24/25/30/60fps 无损往返桥接（`ir_bridge.ts`）。
2. **Agent 能力基座（`skills/`）**：
   - 7 个互斥技能槽位 + 机器可读 [`skills/manifest.json`](./skills/manifest.json)（本地 JSON Schema [`skills/schemas/skills-manifest.v1.json`](./skills/schemas/skills-manifest.v1.json)）+ [`skills/ROUTER.md`](./skills/ROUTER.md) + 完整来源清单 [`DEPENDENCIES.md`](./DEPENDENCIES.md)。
   - 内置自动化防回归闸门：`motion_qa_gate.py`（防冻结 + 运动曲线 + `cold-seek` + AAC 后响度）与 `audit_skills.py`（路由、契约、路径全自动审计）。

---

## 2. 一键验证与 CI 门禁

GitHub Actions（[`.github/workflows/ci.yml`](./.github/workflows/ci.yml)）在每次 `push` / `pull_request` 自动运行以下全部闸门：

```bash
# 1. VAC Studio 生产编译校验
npm --prefix vac_studio run build

# 2. MotionIR <-> Blueprint 24/25/30fps 无损往返测试 (Lesson A5)
npm --prefix vac_studio run test:ir

# 3. M1.2 AST 双向同步三准则门禁 (TC-AST-01/02/03)
npm --prefix vac_studio run test:m1:2

# 4. Skill 架构、路由与契约自动审计 (A1/A2/A3/A4/A6)
npm --prefix vac_studio run test:skills

# 5. TC-SYNC-01 跨素材（60fps/24fps/30fps）锁相盲测复算
python3 tests/tc_sync_01/run_full_blind_audit.py
```

---

## 3. 仓库目录结构

```text
Video_as_Code/
├── .github/workflows/ci.yml               # 远端自动化 CI 门禁（Build + IR + M1.2 + Skills Audit）
├── vac_studio/                            # VAC Studio 产品工程（持续开发中：M0/M1.1/M1.2 已过闸）
├── skills/                                # 7 个 Agent 能力基座 + ROUTER.md + manifest.json + schemas/
├── tests/                                 # 门禁遥测与盲测工件（TC-SYNC-01 / M0 / M1 / M1.2）
├── examples/                              # 实战样例作品（aether / bronze_heritage / ghibli / sanguo 等）
├── tools/                                 # 本地辅助与运维脚本（非库核心能力）
├── DEPENDENCIES.md                        # 7 项能力来源登记与 clone 后安装指南
├── VAC_STUDIO_PRD_V2_AUDIT_READY.md       # 工业级 PRD v2.1.2 审计终审正本
└── VAC_STUDIO_PRD_AND_DEVELOPMENT_TREE.md # WBS 研发分解树与里程碑规划
```

---

## 4. 许可与声明

本项目内所有核心架构设计、算法控制律与 PRD 资产归研发团队所有；第三方参考技能与依赖仓库详见 [`DEPENDENCIES.md`](./DEPENDENCIES.md)。
