# Video-as-Code Skills Router (`skills/ROUTER.md`)

> **Purpose**: Single deterministic routing table (7 repo slots, 1-to-1 with `skills/manifest.json` and `DEPENDENCIES.md`) eliminating multi-skill collisions.
> Always resolve **one leaf execution owner** first, then follow its `pipeline` chain (e.g., `cinetic` -> `earshot` -> `motion-video-director` QA gate).

## 1. Mutually Exclusive Repo Routing Matrix (7 Slots)

| # | User Intent | Unique Owner | Status in Repo | Pipeline / Next Stage |
|---|---|---|---|---|
| 1 | **Create a new video/film from scratch** (launch film, product demo, teaser, kinetic type) | `cinetic` | `ready-in-repo` | `earshot` (optional audio) -> `motion-video-director` (QA) |
| 2 | **Reverse-engineer reference MP4 into Remotion TSX** (`motion_blueprint.json`) | `motion-video-deconstruct` | `partial-in-repo` | `motion-video-director` (QA) |
| 3 | **Rebuild flat 2D motion/UI clip as inline SVG + GSAP loop or `site.html`** | `motion2code` | `ready-in-repo` | `motion-video-director` (QA) |
| 4 | **Generate procedural SFX, audio kit, or 23-metric audio critique** | `earshot` | `requires-local-venv` | Fallback: `motion-video-director` (`ebur128`) |
| 5 | **Source & mix real CC-licensed foley/music** (Freesound / Mixkit / Openverse) | `real-sound` | `spec-only-external-scripts` | Fallback: `earshot` or `ffmpeg` + `motion-video-director` |
| 6 | **Build or polish a website, landing page, or app UI** | `taste-skill` | `ready-in-repo` | Self-contained (`inspect.mjs` / `lint.mjs`) |
| 7 | **Post-render HB1–HB20 / Freeze / Motion-Curve / LUFS QA & Policy** | `motion-video-director` | `orchestrator-policy` | Applied after leaf skill; never primary generator |

## 2. Canonical Script Path Convention
All cross-skill script invocations **must** use **repo-root-relative paths**: `skills/<skill>/scripts/<script>`. Bare `scripts/...` paths are forbidden in cross-skill references.

## 3. Optional Host/Global Extensions (Outside Repo)
Host environments may additionally expose global skills (e.g., `web-sims`, `hyperframes`, `chatcut-*`). They are **not** counted in the 7 repo slots above and are optional host-level extensions.
