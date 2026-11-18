import os
import sys
import time
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    proj_dir = Path("F:/Video_as_Code/space_bunny_replica")
    html_path = (proj_dir / "space_bunny_replica.html").resolve()
    audio_path = Path("F:/Video_as_Code/deconstruct/space_bunny/soundtrack.wav").resolve()
    frames_dir = proj_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    out_video = proj_dir / "replica_space_bunny_1080p.mp4"

    fps = 24
    total_duration = 26.083
    total_frames = int(round(total_duration * fps)) # 626 frames

    print(f"[*] Starting Deadlock-Free 3D Frame Extraction Pipeline:", flush=True)
    print(f"    - HTML: {html_path}", flush=True)
    print(f"    - Audio: {audio_path}", flush=True)
    print(f"    - Resolution: 1920x1080 @ {fps}fps", flush=True)
    print(f"    - Total Frames: {total_frames} ({total_duration:.2f}s)", flush=True)
    print(f"    - Frames Temp Dir: {frames_dir}", flush=True)

    t0 = time.time()
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--enable-features=Vulkan,DefaultANGLEVulkan",
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        )
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(html_path.as_uri())
        time.sleep(1.0) # wait for three.js and assets

        # Hide UI overlay controls
        page.evaluate("() => { const ui = document.getElementById('ui-overlay'); if (ui) ui.style.display = 'none'; }")
        canvas = page.locator("#webgl-canvas")

        for f in range(total_frames):
            cur_time = f / fps
            page.evaluate(f"window.renderAtTime({cur_time})")
            frame_path = frames_dir / f"frame_{f:04d}.jpg"
            canvas.screenshot(path=str(frame_path), type="jpeg", quality=90)

            if f % 25 == 0 or f == total_frames - 1:
                elapsed = time.time() - t0
                pct = (f + 1) / total_frames * 100
                speed = (f + 1) / (elapsed + 0.001)
                rem = (total_frames - f - 1) / (speed + 0.001)
                print(f"[>] Frame {f+1}/{total_frames} ({pct:.1f}%) | {speed:.1f} fps | Elapsed: {elapsed:.1f}s | ETA: {rem:.1f}s", flush=True)

        browser.close()

    extract_time = time.time() - t0
    print(f"[+] All {total_frames} frames captured in {extract_time:.1f}s. Encoding to MP4 via FFmpeg...", flush=True)

    # Encode with FFmpeg
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "frame_%04d.jpg"),
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "17",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(out_video)
    ]

    res = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"[!] FFmpeg error: {res.stderr}", flush=True)
        return

    size_mb = out_video.stat().st_size / (1024 * 1024)
    print(f"[+] SUCCESS! Video rendered successfully: {out_video} ({size_mb:.2f} MB)", flush=True)

if __name__ == "__main__":
    main()
