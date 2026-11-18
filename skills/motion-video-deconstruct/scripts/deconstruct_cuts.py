#!/usr/bin/env python3
"""
deconstruct_cuts.py
Deconstructs a reference video into shot cuts, keyframes, contact sheets, and a motion_blueprint.json skeleton.
Remotion-first architecture with dual-target export.
"""

import argparse
import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    Image = None


def run_command(cmd):
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True)
    return result.stdout, result.stderr, result.returncode


def get_video_metadata(video_path):
    cmd = f'ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,nb_frames -show_entries format=duration -of json "{video_path}"'
    stdout, stderr, code = run_command(cmd)
    if code != 0 or not stdout.strip():
        raise RuntimeError(f"ffprobe failed to inspect {video_path}: {stderr}")
    
    data = json.loads(stdout)
    stream = data.get("streams", [{}])[0]
    format_info = data.get("format", {})
    
    width = int(stream.get("width", 1920))
    height = int(stream.get("height", 1080))
    
    # parse frame rate (e.g. 60/1 or 30/1 or 29.97)
    r_fps = stream.get("r_frame_rate", "60/1")
    if "/" in r_fps:
        num, den = r_fps.split("/")
        fps = round(float(num) / float(den), 2)
    else:
        fps = float(r_fps)
        
    duration = float(stream.get("duration") or format_info.get("duration", 0.0))
    total_frames = int(stream.get("nb_frames") or round(duration * fps))
    
    return {
        "width": width,
        "height": height,
        "fps": fps,
        "duration": duration,
        "total_frames": total_frames
    }


def detect_scene_cuts(video_path, threshold=0.3):
    """Detects scene cut timestamps using ffmpeg's select='gt(scene,threshold)' filter."""
    print(f"[*] Scanning video for scene cuts (threshold={threshold})...")
    cmd = f'ffmpeg -i "{video_path}" -filter:v "select=\'gt(scene,{threshold})\',showinfo" -f null -'
    _, stderr, _ = run_command(cmd)
    
    # parse pts_time or n: from showinfo lines
    # Example line: [Parsed_showinfo_1 @ ...] n:   45 pts: 150150 pts_time:1.5015 ...
    cuts_sec = []
    pattern = re.compile(r"pts_time:([0-9\.]+)")
    for line in stderr.splitlines():
        if "Parsed_showinfo" in line:
            match = pattern.search(line)
            if match:
                cuts_sec.append(float(match.group(1)))
                
    cuts_sec = sorted(list(set(cuts_sec)))
    return cuts_sec


def extract_frame_at(video_path, time_sec, out_image_path):
    cmd = f'ffmpeg -y -ss {time_sec:.3f} -i "{video_path}" -frames:v 1 -q:v 2 "{out_image_path}"'
    _, _, code = run_command(cmd)
    return code == 0


def create_contact_sheet(image_paths, out_path, cols=4, labels=None):
    if not Image:
        print("[!] Pillow (PIL) is not installed; skipping contact sheet generation.")
        return False
        
    if not image_paths:
        return False
        
    images = [Image.open(p).convert("RGB") for p in image_paths]
    n = len(images)
    cols = min(cols, n)
    rows = math.ceil(n / cols)
    
    thumb_w, thumb_h = 480, int(480 * (images[0].height / images[0].width))
    padding = 16
    label_h = 32
    
    sheet_w = cols * thumb_w + (cols + 1) * padding
    sheet_h = rows * (thumb_h + label_h) + (rows + 1) * padding
    
    sheet = Image.new("RGB", (sheet_w, sheet_h), color=(15, 17, 23))
    draw = ImageDraw.Draw(sheet)
    
    for idx, (img, path) in enumerate(zip(images, image_paths)):
        r = idx // cols
        c = idx % cols
        x = padding + c * (thumb_w + padding)
        y = padding + r * (thumb_h + label_h + padding)
        
        resized = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(resized, (x, y))
        
        # Draw label
        label_text = labels[idx] if labels and idx < len(labels) else f"Shot {idx+1:02d}"
        draw.text((x + 6, y + thumb_h + 6), label_text, fill=(220, 230, 245))
        
    sheet.save(out_path, quality=92)
    print(f"[+] Contact sheet saved: {out_path}")
    return True


def deconstruct_video(video_path, out_dir, threshold=0.3):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    shots_dir = out_dir / "shots"
    shots_dir.mkdir(parents=True, exist_ok=True)
    
    meta = get_video_metadata(video_path)
    fps = meta["fps"]
    duration = meta["duration"]
    total_frames = meta["total_frames"]
    
    print(f"[+] Loaded video: {meta['width']}x{meta['height']} @ {fps}fps, {duration:.2f}s ({total_frames} frames)")
    
    # 1. Detect cuts
    cut_timestamps = detect_scene_cuts(video_path, threshold)
    
    # Ensure start (0.0) and end are represented
    all_points = [0.0]
    for ct in cut_timestamps:
        if ct > 0.5 and (duration - ct) > 0.5:
            all_points.append(ct)
    all_points.append(duration)
    all_points = sorted(list(set(all_points)))
    
    # If no cuts were detected (e.g. continuous motion), fallback to equal beat divisions
    if len(all_points) <= 2:
        print("[*] No sharp cuts detected; dividing into rhythmic 2-3s motion intervals...")
        interval = 3.0 if duration >= 6.0 else (duration / 2.0)
        all_points = [i * interval for i in range(int(duration // interval) + 1)]
        if all_points[-1] < duration:
            all_points.append(duration)
            
    scenes = []
    shot_images = []
    shot_labels = []
    
    for i in range(len(all_points) - 1):
        t_start = all_points[i]
        t_end = all_points[i + 1]
        t_mid = (t_start + t_end) / 2.0
        
        f_start = int(round(t_start * fps))
        f_end = int(round(t_end * fps))
        f_dur = f_end - f_start
        
        scene_id = f"scene_{i+1:02d}"
        shot_img_path = shots_dir / f"{scene_id}_frame.jpg"
        
        extract_frame_at(video_path, t_mid, str(shot_img_path))
        shot_images.append(str(shot_img_path))
        
        label = f"#{i+1:02d} ({t_start:.1f}s - {t_end:.1f}s | {f_dur}f)"
        shot_labels.append(label)
        
        scenes.append({
            "id": scene_id,
            "name": f"Scene_{i+1:02d}",
            "timeline": {
                "start_time_sec": round(t_start, 3),
                "end_time_sec": round(t_end, 3),
                "start_frame": f_start,
                "end_frame": f_end,
                "duration_frames": f_dur
            },
            "layout": {
                "pattern": "swiss_bento_split",
                "zones": {
                    "stage_ground": { "x": "5%", "y": "10%", "w": "65%", "h": "80%" },
                    "telemetry_sidebar": { "x": "72%", "y": "10%", "w": "23%", "h": "80%" }
                }
            },
            "kinetic_components": [
                {
                    "id": f"card_{scene_id}",
                    "component": "BentoCard",
                    "physics": {
                        "enter": {
                            "type": "spring",
                            "spring_config": { "mass": 1.0, "stiffness": 140, "damping": 14 },
                            "vector": { "dx": 0, "dy": 60, "dz": 0 },
                            "start_frame": f_start,
                            "duration_frames": min(24, f_dur)
                        },
                        "hold": { "mode": "idle_still" },
                        "exit": {
                            "type": "easing",
                            "curve": [0.6, 0.0, 0.9, 0.35],
                            "vector": { "dx": -100, "dy": 0, "dz": 0 },
                            "start_frame": max(f_start, f_end - 20),
                            "duration_frames": min(20, f_dur)
                        }
                    }
                }
            ],
            "transition_out": {
                "type": "match_dissolve_on_carrier",
                "duration_frames": 16,
                "direction": "leftward",
                "vector_continuity": True
            },
            "audio_cues": [
                { "frame": f_start, "type": "whoosh", "forge_recipe": "whoosh" }
            ],
            "keyframe_image": str(shot_img_path.relative_to(out_dir))
        })
        
    # 2. Contact sheet
    contact_sheet_path = out_dir / "ref_contact_sheet.png"
    create_contact_sheet(shot_images, str(contact_sheet_path), cols=4, labels=shot_labels)
    
    # 3. Motion Blueprint
    blueprint = {
        "$schema": "https://video-as-code.org/schemas/motion-blueprint.v1.json",
        "meta": {
            "source_file": os.path.basename(video_path),
            "deconstructed_at": str(Path().cwd()),
            "resolution": { "width": meta["width"], "height": meta["height"] },
            "fps": fps,
            "total_frames": total_frames,
            "duration_seconds": round(duration, 2),
            "bpm": 120,
            "primary_target": "remotion",
            "secondary_target": "hyperframes"
        },
        "design_tokens": {
            "palette": {
                "background": "#0b0c10",
                "surface": "#141721",
                "border": "rgba(255, 255, 255, 0.08)",
                "text_primary": "#ffffff",
                "text_secondary": "#717e94",
                "accent": "#00f0ff",
                "accent_area_pct": 5.0
            },
            "typography": {
                "headline_font": "Geist Sans, -apple-system, sans-serif",
                "mono_font": "JetBrains Mono, monospace",
                "scale_ratio": 2.5
            },
            "safe_margin_px": 64
        },
        "carrier_object": {
            "id": "telemetry_carrier_line",
            "type": "horizontal_scanline",
            "color": "#00f0ff",
            "role": "贯穿全片转场连续线"
        },
        "scenes": scenes
    }
    
    blueprint_path = out_dir / "motion_blueprint.json"
    with open(blueprint_path, "w", encoding="utf-8") as f:
        json.dump(blueprint, f, indent=2, ensure_ascii=False)
        
    cuts_path = out_dir / "cuts.json"
    with open(cuts_path, "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "scenes": scenes}, f, indent=2, ensure_ascii=False)
        
    print(f"[+] Saved motion blueprint: {blueprint_path}")
    print(f"[+] Deconstruction finished! {len(scenes)} scenes extracted.")
    return blueprint


def main():
    parser = argparse.ArgumentParser(description="Deconstruct reference video to code motion blueprint")
    parser.add_argument("--input", "-i", required=True, help="Path to reference video (mp4)")
    parser.add_argument("--out", "-o", default="deconstruct_out", help="Output directory")
    parser.add_argument("--threshold", "-t", type=float, default=0.3, help="Scene cut detection threshold (0.1 - 0.5)")
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: input file '{args.input}' not found.", file=sys.stderr)
        sys.exit(1)
        
    deconstruct_video(args.input, args.out, args.threshold)


if __name__ == "__main__":
    main()
