# Video-as-Code Skills Router (`skills/ROUTER.md`)

> **Purpose**: Single deterministic routing table eliminating multi-skill collisions.
> Always resolve **one leaf execution owner** first, then apply `motion-video-director` as the **orchestration & QA policy** (`skills/motion-video-director/scripts/motion_qa_gate.py`).

## 1. Mutually Exclusive Routing Matrix

| User Intent | Unique Owner | Status in Repo | Pre-flight / Fallback |
|---|---|---|---|
| **Create a new video/film from scratch** (launch film, product demo, teaser, kinetic type) | `cinetic` | `ready-in-repo` | Audio kit uses `earshot` if `.venv` present; otherwise silent/bed + `motion_qa_gate.py` |
| **Reverse-engineer reference MP4 into Remotion TSX** (`motion_blueprint.json`) | `motion-video-deconstruct` | `partial-in-repo` | Uses `skills/motion2code/scripts/study_video.py` + `skills/motion-video-director/scripts/motion_qa_gate.py` |
| **Rebuild flat 2D motion/UI clip as inline SVG + GSAP loop or `site.html`** | `motion2code` | `ready-in-repo` | Self-contained (`study_video.py`, `frame_diff.py`, `check_anim.py`, `render_anim.py`) |
| **Generate procedural SFX, audio kit, or 23-metric audio critique** | `earshot` | `requires-local-venv` | Requires `./earshot` + `.venv`; fallback to `ffmpeg ebur128` in `motion_qa_gate.py` |
| **Source & mix real CC-licensed foley/music** (Freesound / Mixkit / Openverse) | `real-sound` | `spec-only-external-scripts` | External mix scripts not bundled; fallback to `earshot` or manual `ffmpeg` + `motion_qa_gate.py` |
| **Build or polish a website, landing page, or app UI** | `taste-skill` | `ready-in-repo` | Self-contained (`draw.mjs`, `inspect.mjs`, `lint.mjs`, `assets.mjs`) |
| **3D simulation / Three.js `renderAt(t)`** | `web-sims` (global) | `global-agent-skill` | Follows `skills/motion-video-director/references/cinema-physics-and-qa-playbook.md` + `motion_qa_gate.py` |
| **End-to-end multi-engine direction & HB1–HB20 / Freeze QA Gate** | `motion-video-director` | `orchestrator-policy` | Policy + `skills/motion-video-director/scripts/motion_qa_gate.py` |

## 2. Script Path Convention
All cross-skill script invocations **must** use repo-root-relative paths (`skills/<skill>/scripts/...`) or explicit `<skill>/scripts/...` when executed from inside a skill directory.
