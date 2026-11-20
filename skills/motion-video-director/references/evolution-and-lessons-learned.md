# Skill Evolution Strategy & Engineering Lessons Learned

> **核心信条**：每一次审计打回、每一次真 Bug、每一次流程事故，都必须从“口头教训”升级为**可执行断言、Schema 校验或强制路由规则**，沉淀进系统基座，绝不在同一个坑里摔第二次。

---

## 一、Skill 持续升级与优化闭环策略 (The 4-Step Evolution Loop)

每当出现以下任一事件时，**必须**触发一次 Skill 演进闭环：
- 外部审计（如 Eve / 豆包）提出 P0/P1/P2 整改或打回；
- 生产渲染或门禁测试捕获真实 Bug（如帧冻结、时间轴漂移、路径 404）；
- 吸收外部优秀开源能力或方法论（如 `@flxrnc` Playbook）。

### 四步沉淀 SOP
1. **根因定性 (Root-Cause Triage)**：区分“工程真缺陷” vs. “文档/路径口径漂移” vs. “外部环境差异（如 CDN 缓存、本机 `.venv`）”，只对真问题动刀，对误判用客观证据澄清。
2. **规则化闸 (Rule-to-Gate Conversion)**：能写成脚本/断言/JSON Schema 的教训，**绝不只停留在 Markdown 口号里**（例如：把“防冻结”做成 `motion_qa_gate.py`，把“路由防冲突”做成 `manifest.json` + `skills-manifest.v1.json`）。
3. **交叉验证 (Smoke & Regression Check)**：每次升级 Skill 或底层引擎后，必须跑真机冒烟（如 `motion_qa_gate.py`、`npm run build`、历史门禁 `test:m1:2`），验证“真实开火”与零回归。
4. **双端同步与不可变交付 (Dual-Sync & Immutable Commit)**：保持工作区 `skills/` 与宿主全局 `~/.gemini/config/skills/` 内容一致（SHA-256 核验），执行 `git push origin main --tags`，对外交付一律附 **Commit SHA**。

---

## 二、实战踩坑经验库 (Battle-Tested Post-Mortems)

### 类别 A：Skill 路由与契约体系（源自豆包四轮仓库审计：52 → 86+）

| 踩过的坑 | 根因剖析 | 永久性固化防线 |
|---|---|---|
| **A1. 5 类输入 4 类路由冲突** | 路由器只读 frontmatter `description`，不读正文；总控写 `MANDATORY / all` 会吞掉所有叶子技能 | 总控定位为叶子技能选中后的 Policy + QA Gate；所有 Skill 在 `description` 内显式写清 `Use when` 与 `Excludes`；互斥对在 `manifest.json` 增加机器可读 `disambiguation` 字段。 |
| **A2. 路由表、Manifest、依赖清单三方漂移** | `ROUTER.md` 写了 8 行、`manifest.json` 只有 7 槽、`DEPENDENCIES.md` 漏登记，出现“孤儿 Owner” | 铁律：`ROUTER.md` 槽位数 == `manifest.json` 槽位数 == `DEPENDENCIES.md` 仓库技能数（1:1 严格一致）；宿主全局技能隔离在独立章节；三方 `status` 枚举严格统一。 |
| **A3. 能力注册表虚胖 & 外链 `$schema` 404** | 把未入库的外部库和本地 `.venv` 能力混写成开箱即用；`$schema` 指向不可达外链 | 所有能力按 `[Repo-Local]` / `[Requires .venv]` / `[Spec-Only / External]` / `[Global Agent Skills]` 如实分级；`$schema` 必须落盘本地 `skills/schemas/*.json` 并用相对路径引用。 |
| **A4. 跨 Skill 路径三种写法混用** | 同文件内混用 `scripts/...`、`<skill>/scripts/...` 和 `skills/<skill>/scripts/...`，导致按图索骥 404 | `ROUTER.md §2` 唯一锁定仓库根相对路径 `skills/<skill>/scripts/<script>`，禁止跨 Skill 裸写 `scripts/...`。 |
| **A5. 跨帧率时间轴未换算 & 往返丢字段** | `ir_bridge.ts` 硬编码 `fps: 60` 却直接拷贝 24/30fps 源帧号导致整片时间轴错位；逆向丢失 `name`、`sourceFps`、`sceneId` | 所有帧号轨统一执行 `Math.round(f * 60 / srcFps)` 归一化，**毫秒量（`offsetMs`）严禁换算**；保留 `sourceFps`、`name`、`sceneId` 并跑 24/30fps 无参往返实测。 |
| **A6. 重复目录名引发路由抢占** | `skills/video-director/` 与 `skills/motion-video-director/` 同时声明 `name: motion-video-director` | 升级或重命名 Skill 时必须物理删除旧目录，全库 `name` 唯一。 |

### 类别 B：工程门禁、测试防剧场与交付纪律（源自 Eve M0 / M1.1 / M1.2 审计）

| 踩过的坑 | 根因剖析 | 永久性固化防线 |
|---|---|---|
| **B1. 拿被告自报当证据（回声/钳制/常量剧场）** | 曾出现 `?? target` 回声兜底、`% 1.0` 钳制、`cumulativeDriftMs = 0.0` 常量 | **证据必须独立于被告**：磁盘零写用独立 SHA-256 + 文件字节数双验；渲染帧直读播放器权威状态；失败时必须响失败（`exit 1`）。 |
| **B2. 考官漏洞比考生作弊更危险** | 自检模式无条件 `exit(0)`；C1 哈希过滤把两行 `durationInFrames` 全排除了，导致改错场景也能通过 | 自检退出码强绑定 `skeletonArmed`；哈希排除严格锁定目标行（`Scene01`），非目标同类名行（`Scene02`）必须纳入哈希保护并加多重断言。 |
| **B3. 本地 commit/tag 忘了 push 导致提货 404** | 本地打完 tag 即宣告交付，未执行 `git push`；报告含本机盘符 `C:\Users\...` | 交付的唯一定义是远端可拉取：**`git push origin main --tags` + `git ls-remote` 鉴真通过**；对外报告零本机盘符，一律附**不可变 Commit SHA**（同时规避 GitHub `raw/.../main` CDN 5 分钟缓存）。 |
| **B4. 守护进程静默兜底 & 缺少防回归** | API 写了 `Number(x) || 285`（传 0 会静默改成 285）；动 `server/` 未附历史门禁回归 | 非法参数一律显式返回 JSON-RPC `-32602` 拒绝；凡修改 `server/` 或时钟底层，交付必须附 M0/M1/M1.2 回归跑批记录。 |

### 类别 C：音画质检与物理动力学（源自 `@flxrnc` Playbook & 真机实测）

| 踩过的坑 | 根因剖析 | 永久性固化防线 |
|---|---|---|
| **C1. 静帧盲审放过冻结视频** | Contact Sheet 只看离散帧；单一 `freezedetect` 也可能被微噪点绕过（实测 `xianyu_promo_v2.mp4` 中 `freezedetect` 通过但 `motion_curve` 抓出 126 帧停滞） | 必须运行 `skills/motion-video-director/scripts/motion_qa_gate.py`（`freezedetect` + `motion_curve` 双保险 + AAC 编码后 `ebur128` 复测）。 |
| **C2. 逐帧积分状态机破坏冷跳转** | 依赖上一帧速度/位置积分的动画，直接 seek 到第 300 帧与顺序播到第 300 帧画面不一致 | 所有弹簧与动画必须是时间 `t` 的纯解析闭式函数（`renderAt(t)`），阻尼比按对象分级（UI `1.0` / 产品 `0.8` / 角色 `0.5`），并用 `cold-seek` 校验。 |
