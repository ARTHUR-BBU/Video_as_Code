#!/usr/bin/env python3
"""
Motion Video Director - Universal Quantitative Motion & Delivery QA Gate
Standard: HB20 Anti-Freeze, Motion Curve, Loop Seam, Cold-Seek & Post-AAC Loudness Gate

Works on ANY rendered MP4 (Remotion, HyperFrames, Web-Sims, Manim, MoviePy, Blender).
Complements cinetic/scripts/forensics.py (pixel forensics) & av-audit.py (cue sync).

Usage:
  python skills/motion-video-director/scripts/motion_qa_gate.py out/film.mp4 --json out/qa_gate.json
  python skills/motion-video-director/scripts/motion_qa_gate.py out/loop.mp4 --loop --json out/qa_gate.json
  python skills/motion-video-director/scripts/motion_qa_gate.py out/sim.mp4 --html http://127.0.0.1:8000/film.html?render=1 --seek-frame 300
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np


def run_cmd(cmd: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def probe_video(video_path: str) -> Dict[str, Any]:
    cmd = [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        video_path,
    ]
    res = run_cmd(cmd)
    if res.returncode != 0:
        raise RuntimeError(f"ffprobe failed for {video_path}: {res.stderr}")
    data = json.loads(res.stdout)
    v_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    a_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    if not v_stream:
        raise RuntimeError(f"No video stream found in {video_path}")

    fps_str = v_stream.get("r_frame_rate", "60/1")
    num, den = map(float, fps_str.split("/")) if "/" in fps_str else (float(fps_str), 1.0)
    fps = num / den if den else 60.0

    return {
        "width": int(v_stream.get("width", 0)),
        "height": int(v_stream.get("height", 0)),
        "fps": round(fps, 3),
        "pix_fmt": v_stream.get("pix_fmt", ""),
        "codec": v_stream.get("codec_name", ""),
        "duration_s": float(data.get("format", {}).get("duration", 0.0)),
        "has_audio": a_stream is not None,
        "audio_codec": a_stream.get("codec_name", "") if a_stream else None,
    }


def check_freezedetect(video_path: str, noise_db: float = -60.0, duration_s: float = 0.5) -> Dict[str, Any]:
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-i",
        video_path,
        "-vf",
        f"freezedetect=n={noise_db}dB:d={duration_s}",
        "-map",
        "0:v:0",
        "-f",
        "null",
        "-",
    ]
    res = run_cmd(cmd)
    output = res.stderr
    starts = [float(x) for x in re.findall(r"freeze_start:\s*([0-9.]+)", output)]
    ends = [float(x) for x in re.findall(r"freeze_end:\s*([0-9.]+)", output)]
    durations = [float(x) for x in re.findall(r"freeze_duration:\s*([0-9.]+)", output)]

    freezes = []
    for idx, s in enumerate(starts):
        e = ends[idx] if idx < len(ends) else None
        d = durations[idx] if idx < len(durations) else None
        freezes.append({"start_s": s, "end_s": e, "duration_s": d})

    return {
        "freeze_count": len(freezes),
        "freezes": freezes,
        "passed": len(freezes) == 0,
    }


def check_frame_diff_curve(
    video_path: str,
    fps: float,
    change_thresh: float = 0.5,
    min_still_frames: int = 30,
    check_loop: bool = False,
) -> Dict[str, Any]:
    # Downscale to 320x180 gray via ffmpeg pipe for fast, dependency-light frame-diff
    w, h = 320, 180
    frame_bytes = w * h
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        video_path,
        "-vf",
        f"scale={w}:{h},format=gray",
        "-f",
        "rawvideo",
        "-",
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdout is not None

    prev: Optional[np.ndarray] = None
    first_frame: Optional[np.ndarray] = None
    last_frame: Optional[np.ndarray] = None

    diffs: List[float] = []
    still_streak = 0
    max_still_streak = 0
    frozen_windows: List[Dict[str, Any]] = []
    frame_idx = 0

    while True:
        raw = proc.stdout.read(frame_bytes)
        if len(raw) < frame_bytes:
            break
        curr = np.frombuffer(raw, dtype=np.uint8).astype(np.float32).reshape((h, w))
        if first_frame is None:
            first_frame = curr
        last_frame = curr

        if prev is not None:
            diff = float(np.abs(curr - prev).mean())
            diffs.append(diff)
            if diff < change_thresh:
                still_streak += 1
                if still_streak > max_still_streak:
                    max_still_streak = still_streak
                if still_streak == min_still_frames:
                    frozen_windows.append(
                        {
                            "start_frame": frame_idx - min_still_frames,
                            "start_s": round((frame_idx - min_still_frames) / fps, 2),
                        }
                    )
            else:
                still_streak = 0

        prev = curr
        frame_idx += 1

    proc.wait()

    if not diffs:
        return {
            "total_frames": frame_idx,
            "mean_diff": 0.0,
            "median_diff": 0.0,
            "max_still_streak_frames": frame_idx,
            "frozen_windows": [],
            "passed": False,
        }

    median_diff = float(np.median(diffs))
    mean_diff = float(np.mean(diffs))

    loop_seam_diff = None
    loop_seam_passed = True
    if check_loop and first_frame is not None and last_frame is not None:
        loop_seam_diff = round(float(np.abs(first_frame - last_frame).mean()), 4)
        # Seam jump should be smaller than 2.5x normal median frame step (or < 3.0 if very quiet)
        seam_limit = max(3.0, median_diff * 2.5)
        loop_seam_passed = loop_seam_diff <= seam_limit

    return {
        "total_frames": frame_idx,
        "mean_diff": round(mean_diff, 4),
        "median_diff": round(median_diff, 4),
        "max_diff": round(float(np.max(diffs)), 4),
        "max_still_streak_frames": max_still_streak,
        "frozen_windows": frozen_windows,
        "loop_seam_diff": loop_seam_diff,
        "loop_seam_passed": loop_seam_passed,
        "passed": len(frozen_windows) == 0 and loop_seam_passed,
    }


def check_ebur128(video_path: str, max_true_peak_dbtp: float = -1.5) -> Dict[str, Any]:
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-i",
        video_path,
        "-af",
        "ebur128=peak=true",
        "-f",
        "null",
        "-",
    ]
    res = run_cmd(cmd)
    output = res.stderr
    i_match = re.findall(r"I:\s*(-?[0-9.]+)\s*LUFS", output)
    tp_match = re.findall(r"Peak:\s*(-?[0-9.]+)\s*dBFS", output)
    lra_match = re.findall(r"LRA:\s*(-?[0-9.]+)\s*LU", output)

    integrated_lufs = float(i_match[-1]) if i_match else None
    true_peak_dbtp = float(tp_match[-1]) if tp_match else None
    lra_lu = float(lra_match[-1]) if lra_match else None

    lufs_ok = integrated_lufs is not None and (-16.5 <= integrated_lufs <= -12.5)
    peak_ok = true_peak_dbtp is not None and (true_peak_dbtp <= max_true_peak_dbtp)

    return {
        "integrated_lufs": integrated_lufs,
        "true_peak_dbtp": true_peak_dbtp,
        "lra_lu": lra_lu,
        "target_lufs": -14.0,
        "max_true_peak_dbtp": max_true_peak_dbtp,
        "passed": lufs_ok and peak_ok,
    }


def check_cold_seek(html_url: str, frame_idx: int, fps: float = 60.0) -> Dict[str, Any]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"skipped": True, "reason": "playwright not installed", "passed": True}

    t_prev = (frame_idx - 1) / fps
    t_target = frame_idx / fps

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(html_url)
        page.wait_for_function("window.__ready === true || document.documentElement.dataset.ready === '1'", timeout=15000)

        def seek_eval(t_val: float):
            return page.evaluate(
                f"""(t) => {{
                    if (typeof window.renderAt === 'function') {{ window.renderAt(t); return true; }}
                    if (window.anim && typeof window.anim.seek === 'function') {{ window.anim.seek(t); return true; }}
                    return false;
                }}""",
                t_val,
            )

        # Cold seek directly to target
        ok1 = seek_eval(t_target)
        if not ok1:
            browser.close()
            return {"passed": False, "reason": "Neither window.renderAt(t) nor window.anim.seek(t) found"}
        cold_png = page.screenshot(type="png")

        # Sequential seek: frame-1 then frame
        page.goto(html_url)
        page.wait_for_function("window.__ready === true || document.documentElement.dataset.ready === '1'", timeout=15000)
        seek_eval(t_prev)
        seek_eval(t_target)
        seq_png = page.screenshot(type="png")
        browser.close()

    identical = cold_png == seq_png
    return {
        "seek_frame": frame_idx,
        "cold_vs_sequential_identical": identical,
        "passed": identical,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Motion Video Director - Universal Motion & Delivery QA Gate (HB20)")
    parser.add_argument("video", help="Path to rendered MP4 video")
    parser.add_argument("--freeze-db", type=float, default=-60.0)
    parser.add_argument("--freeze-dur", type=float, default=0.5)
    parser.add_argument("--motion-thresh", type=float, default=0.5)
    parser.add_argument("--min-still-frames", type=int, default=30)
    parser.add_argument("--loop", action="store_true", help="Verify seamless loop seam (frame N-1 vs frame 0)")
    parser.add_argument("--max-tp", type=float, default=-1.5, help="Max True Peak dBTP (-2.0 for X/social, -1.5 master)")
    parser.add_argument("--html", help="Optional HTML URL/file to run cold-seek determinism check")
    parser.add_argument("--seek-frame", type=int, default=300)
    parser.add_argument("--json", help="Output JSON report path")
    args = parser.parse_args()

    video_path = str(Path(args.video))
    meta = probe_video(video_path)
    freeze_res = check_freezedetect(video_path, args.freeze_db, args.freeze_dur)
    motion_res = check_frame_diff_curve(
        video_path,
        meta["fps"],
        change_thresh=args.motion_thresh,
        min_still_frames=args.min_still_frames,
        check_loop=args.loop,
    )

    audio_res = None
    if meta["has_audio"]:
        audio_res = check_ebur128(video_path, max_true_peak_dbtp=args.max_tp)

    seek_res = None
    if args.html:
        seek_res = check_cold_seek(args.html, args.seek_frame, meta["fps"])

    all_passed = (
        freeze_res["passed"]
        and motion_res["passed"]
        and (audio_res["passed"] if audio_res is not None else True)
        and (seek_res["passed"] if seek_res is not None else True)
    )

    report = {
        "video": video_path,
        "meta": meta,
        "checks": {
            "freezedetect": freeze_res,
            "motion_curve": motion_res,
            "audio_ebur128": audio_res,
            "cold_seek": seek_res,
        },
        "verdict": "PASSED" if all_passed else "FAILED",
    }

    if args.json:
        out_p = Path(args.json)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        out_p.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"\n[MOTION-QA-GATE] {video_path} ({meta['width']}x{meta['height']} @ {meta['fps']}fps, {meta['duration_s']:.2f}s)")
    print(f"  -> freezedetect   : {'PASS' if freeze_res['passed'] else 'FAIL'} (freezes={freeze_res['freeze_count']})")
    print(
        f"  -> motion_curve   : {'PASS' if motion_res['passed'] else 'FAIL'} "
        f"(mean={motion_res['mean_diff']}, max_still={motion_res['max_still_streak_frames']}f)"
    )
    if args.loop:
        print(f"  -> loop_seam      : {'PASS' if motion_res['loop_seam_passed'] else 'FAIL'} (seam_diff={motion_res['loop_seam_diff']})")
    if audio_res is not None:
        print(
            f"  -> audio_ebur128  : {'PASS' if audio_res['passed'] else 'FAIL'} "
            f"(I={audio_res['integrated_lufs']} LUFS, TP={audio_res['true_peak_dbtp']} dBTP)"
        )
    if seek_res is not None:
        print(f"  -> cold_seek      : {'PASS' if seek_res['passed'] else 'FAIL'}")
    print(f"VERDICT: {report['verdict']}\n")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
