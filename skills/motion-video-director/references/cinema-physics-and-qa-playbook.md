# Cinema Physics, 3D Armory & Quantitative Motion QA Playbook

> Distilled from production film workflows (`@flxrnc` Fable 5.2 Motion Playbook + 18-Repo Motion Stack) and integrated into `motion-video-director`.

---

## 1. Closed-Form Kinematics & Character Physics

### 1.1 Closed-Form Spring Law (Zero Integration)
Every spring **must** be a closed-form analytical function of time `t` (`f(t)`), **never** frame-to-frame state integration (`v += a * dt; x += v * dt`). This guarantees deterministic cold-seek (`frame(300, cold) === frame(300, sequential)`).

Damping ratio $\zeta = \frac{c}{2\sqrt{km}}$:
| Target | Damping Ratio ($\zeta$) | Visual Behavior |
|---|---|---|
| **UI / Typography / Cards** | `1.0` (Critically Damped) | Zero overshoot; fast snap, clean settle (aligns with HB17). |
| **Product / Logo / Hardware** | `0.8` (Lightly Underdamped) | Exactly **1 small settle bounce** — tactile weight without toy wobble. |
| **Characters / Mascots / Comedy** | `0.5` (Underdamped) | **2 readable bounces** — expressive life. |

### 1.2 Volume-Preserving Squash & Stretch + Follow-Through (60 fps)
Preserve area/volume (`scaleX * scaleY ≈ 1.0` in 2D; `scaleX * scaleZ * scaleY ≈ 1.0` in 3D):
- **Crouch / Anticipation**: `1.20 × 0.75` (width × height)
- **Takeoff / Launch**: `0.85 × 1.28`
- **Landing / Impact**: `1.25 × 0.75`
- **Follow-Through Lags (at 60 fps)**:
  - Secondary limbs / arms: lag **4 frames** (`66.7 ms`)
  - Tails / ties / scarves / accessories: lag **6 frames** (`100.0 ms`)

---

## 2. Cinematography, Lenses & Framing Numbers

Replace vague adjectives ("cinematic", "crisp") with concrete optical parameters:
- **Focal Lengths**:
  - `35 mm`: Establishing / room / spatial context.
  - `50 mm`: Primary action / balanced perspective.
  - `85 mm`: Face / hero close-up / portrait compression.
- **Dynamic Focus Tracking**: Shallow Depth of Field (`f/2.0–f/2.8`) where focal distance **tracks the hero's real world depth on every frame**, never a static focal plane.
- **Capped Hero Motion Blur**: Cap motion blur on the hero face/type so identity stays razor-sharp even at high velocity, while background streaks naturally.
- **Hero Pixel-Width Rule (1080p Phone Readability)**:
  - Main hero subject must measure **`>= 170 px` wide** at `1920×1080` (`>= 95 px` in multi-character/crowd rows). Anything smaller reads as an unreadable dot on mobile.
- **Cut & Hold Grammar**:
  - Energy comes from **cuts on the beat**, never whip pans or endless zooms.
  - Hold a strong composition for a full beat before cutting.
  - Comedy & catastrophe play in **one locked frame**; shake the camera *only* on the impact frame.
  - Text must be **100% inside** or **100% outside** the frame — never half-clipped at edges.
  - **Final frame = the image**: end on the hero visual cleanly with no extra caption line underneath.

---

## 3. Master Clock & Deterministic `renderAt(t)` GPU Contract

### 3.1 `timing.json` First + 1-Frame Audio Lag
Write `timing.json` **before** scene animation or audio code:
- Every visual beat, camera cut, and sound cue reads from this single clock.
- Standard impact audio lands **1 frame (`16.7 ms` @ 60 fps)** after the visual contact event (or `-11..-60 ms` / `+30..+42 ms` per `earshot` psychoacoustic class).

### 3.2 Pure-Time `renderAt(t)` & Playwright GPU Pipe
For Three.js / WebGL / Canvas films:
```js
window.renderAt = (t) => {
  updateEverythingFrom(t); // pure function of t; no clocks, no Math.random, no accumulated state
  renderer.render(scene, camera);
};
const live = !new URLSearchParams(location.search).has("render");
if (live) renderer.setAnimationLoop((ms) => renderAt((ms / 1000) % DURATION));
window.__ready = true; // set ONLY after fonts, GLB models, and textures finish loading
```
Render frames **`0` to `N-1`** (never frame `N`, which duplicates frame `0` in loops) using Chromium GPU acceleration (`--enable-gpu --ignore-gpu-blocklist --use-angle=d3d11` on Windows, `--use-angle=metal` on macOS) piped directly into `ffmpeg -f image2pipe`.

---

## 4. Quantitative Motion & Delivery QA Gate (Beyond Still Frames)

**Still contact sheets alone pass frozen videos.** Every finished render must pass all 6 numeric checks before delivery:

1. **FFmpeg Freeze Detection** (0 unplanned freezes):
   ```bash
   ffmpeg -i film.mp4 -vf freezedetect=n=-60dB:d=0.5 -map 0:v:0 -f null -
   ```
2. **Frame-Diff Motion Curve** (every planned beat must show a motion spike):
   ```python
   import imageio.v3 as iio, numpy as np
   prev, still = None, 0
   for i, frame in enumerate(iio.imiter("film.mp4")):
       gray = frame.mean(axis=2)
       if prev is not None:
           change = np.abs(gray - prev).mean()
           still = still + 1 if change < 0.5 else 0
           if still == 30:
               print(f"FROZEN from {(i - 30) / 60:.2f} s")
       prev = gray
   ```
3. **Cold-Seek Determinism**: Render `frame 300` cold (`renderAt(300/60)`) and compare pixel-for-pixel against `frame 300` rendered after `frame 299`. Diff must be `0`.
4. **Loop Seam Check**: `mean_diff(frame[N-1], frame[0])` must be `< 1 normal frame step`.
5. **Hero Pixel-Width Measurement**: Measure hero bounding-box width in pixels across key shots (`>= 170 px` at 1080p).
6. **Post-AAC Social/X Delivery Gate**:
   ```bash
   ffmpeg -i film.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p -r 60 -crf 18 \
          -c:a aac -b:a 192k -movflags +faststart film_x.mp4
   ffmpeg -i film_x.mp4 -af ebur128=peak=true -f null -
   ```
   Measure loudness **after** AAC encoding: integrated `-14.0 LUFS`, True Peak `<= -2.0 dBTP` (for X/social) or `<= -1.5 dBTP` (master).

---

## 5. Extended Armory & Style Ecosystem (18-Repo Stack)

| Capability | Tool / Repo | When to Dispatch |
|---|---|---|
| **Headless 3D Props & Costumes** | `EL4CTEO/blender-skills` (`blender -b --factory-startup -P`) | Custom 3D props/mascots; run numeric non-intersection check, export GLB + ES module, inspect turnaround sheet at phone size. |
| **3D Particle VFX** | `Alchemist0823/three.quarks` | Physics-driven particle bursts/trails inside Three.js scenes (controlled, never generic confetti). |
| **Cinematic Post-Processing** | `pmndrs/react-postprocessing` | Controlled DoF, ACES Filmic tone-mapping, subtle vignette/chromatic aberration in React Three Fiber. |
| **Live Parameter Tuning** | `cocopon/tweakpane` | Attach `?tweak=1` UI sliders for springs, focal length, hex tokens, and timing during interactive iteration. |
| **Rust Fast Compositing** | `storytold/effectcraft` | High-throughput native video compositing / shader pipelines. |
| **Math & Formula Animation** | `ManimCommunity/manim` | Equations, geometric proofs, neural-net/algorithmic explainers. |
| **Style & Aesthetic Presets** | `mg-styles-15` / `huashu-art-motion` / `anidoodle` / `motionmaxxing` | 15 motion style prompts, 35 painterly art styles, code doodles/loops, anti-slop motion polish. |
| **Free CC Audio Fallback** | `Openverse` (`api.openverse.org/v1/`) | Free Creative Commons SFX/music fallback alongside `earshot` & `real-sound`. |

---

## 6. Agent Execution & Subagent Discipline

- **Finishing Contract**: Define done explicitly (`full MP4 rendered + all 6 numeric QA checks reported with numbers + NOTES.md`). Treat ordinary obstacles (timeout, failed render, missing font) as fix-and-continue, stopping only for genuine user-only missing assets.
- **Role-Isolated Subagents**: Split large films into `score` (`timing.json`), `layout`, `animation`, `look`, and an **independent `reviewer`** who did not author the code. Cap concurrent render processes at `<= 2` and keep shared rules `< 40 lines`.
