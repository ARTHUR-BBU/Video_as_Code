# Third-Party Reference Repositories & Skill Dependency Manifest

As per the VAC Studio design doctrine (*"君子使物，不以物使，一切为我所用"*), this manifest registers all 7 capabilities in `skills/` plus external reference checkouts excluded by `.gitignore`.

## 1. Local Skills Inventory (`skills/`)

| Skill Name | Origin | Repo Status | Runtime / External Requirements |
| :--- | :--- | :--- | :--- |
| **cinetic** | Third-party (`Leonxlnx/cinetic`, `ecfa660`) | `ready-in-repo` (27 scripts + assets) | Node 22+, FFmpeg 6+, Python 3.11+, optional `earshot 0.4+` |
| **motion2code** | Third-party (`lovisdotio/motion2code`, `0f00328`) | `ready-in-repo` (8 scripts + templates) | Python 3.9+, FFmpeg, Playwright |
| **taste-skill** | Third-party (`Leonxlnx/taste-skill`, `6010f91`) | `ready-in-repo` (5 scripts + library) | Node, Playwright (for `inspect.mjs`) |
| **motion-video-director** | In-repo authored (`VAC Studio`) | `orchestrator-policy` (`scripts/motion_qa_gate.py`) | Python + NumPy + FFmpeg/FFprobe |
| **motion-video-deconstruct** | In-repo authored (`VAC Studio`) | `partial-in-repo` (uses `motion2code` + `motion_qa_gate.py`) | FFmpeg, `vac_studio/server/ast_engine/ir_bridge.ts` |
| **earshot** | Third-party (`Leonxlnx/earshot`, `591fa3e`) | `requires-local-venv` (`SKILL.md` in repo) | Local checkout `./earshot` + `.venv/Scripts/earshot.exe` |
| **real-sound** | External spec | `spec-only-external-scripts` (`SKILL.md` only) | External audio sourcing/mixing scripts (fallback: `earshot` / `ffmpeg`) |

## 2. Third-Party Reference Checkouts (`.gitignore` excluded)

| Package / Repository | Upstream Remote URL | Pinned Commit Hash | Role in VAC Ecosystem |
| :--- | :--- | :--- | :--- |
| **cinetic** | `https://github.com/Leonxlnx/cinetic.git` | `ecfa6605de1adb9345ce937724810dc32267d068` | Code-driven cinematic motion design reference |
| **earshot** | `https://github.com/Leonxlnx/earshot.git` | `591fa3e028032e6dce56620a20e932e35667e8d8` | CPU-only procedural audio synthesis (`0.4+`) & BS.1770 loudness |
| **motion2code** | `https://github.com/lovisdotio/motion2code.git` | `0f003288997604487df04c1b7a0586900d3e36bb` | AI video deconstruct to SVG & GSAP animation loop |
| **openmotion** | `https://github.com/nexu-io/openmotion.git` | `d2bbbe032b1d883af1d3922d73268e7941c353fd` | Template catalog & editor interface reference |
| **taste-skill** | `https://github.com/Leonxlnx/taste-skill.git` | `6010f91a9935f1c167dfc500fb1a475681892e6b` | Anti-slop frontend art direction & inspection rules |

## 3. Quick Setup After Fresh Clone (Optional `earshot 0.4+` Audio Runtime)

```bash
git clone https://github.com/Leonxlnx/earshot.git ./earshot
git -C ./earshot checkout 591fa3e028032e6dce56620a20e932e35667e8d8
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\pip.exe install -e ./earshot
# macOS / Linux:      ./.venv/bin/pip install -e ./earshot
```
