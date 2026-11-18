import os
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

PROJECT_DIR = r"F:\Remotion\回声\remotion-project"
ENTRY_POINT = os.path.join(PROJECT_DIR, "src", "index.ts")
OUT_DIR = os.path.join(PROJECT_DIR, "out", "stills", "xianyu_v2")
ARTIFACT_DIR = r"C:\Users\LENOVO\.gemini\antigravity\brain\eb16aa3d-3dd0-4b4d-9292-1fc75ed89670"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

# 8 key frames across the 13 scenes with new high-density architecture
KEYFRAMES = [
    (90, "01_MascotHero", "闲置放着 也是闲着？"),
    (255, "02_Depletion", "每单交易 都在缩水被坑？"),
    (610, "04_ResellSlider", "淘宝买过 一键转卖."),
    (790, "05_StatsTicker", "每天闲置 上新400万件."),
    (1150, "07_Inspection", "官方验货宝 58项质检."),
    (1510, "09_InstantPayout", "极速回款 秒级到账."),
    (2050, "12_BentoMatrix", "四大引擎 全维矩阵."),
    (2225, "13_ClimaxCTA", "闲不住？ 上闲鱼！"),
]

print("=== Rendering High-Density Xianyu Promo Keyframe Stills (v2) ===")

rendered_paths = []
for frame_num, scene_id, label in KEYFRAMES:
    out_file = os.path.join(OUT_DIR, f"frame_{frame_num:04d}_{scene_id}.jpg")
    print(f"\n[Rendering Frame {frame_num}] Scene: {scene_id} ({label})")
    cmd = [
        "npm.cmd", "--prefix", PROJECT_DIR, "exec", "--",
        "remotion", "still",
        ENTRY_POINT,
        "XianyuPromo",
        out_file,
        f"--frame={frame_num}",
        "--image-format=jpeg",
        "--jpeg-quality=95",
        "--log=warn"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
    if res.returncode != 0:
        print(f"Error rendering frame {frame_num}: {res.stderr}")
    else:
        print(f" Rendered: {out_file}")
    
    if os.path.exists(out_file):
        rendered_paths.append((out_file, frame_num, scene_id, label))

print(f"\nTotal ready frames: {len(rendered_paths)}/{len(KEYFRAMES)}")

# Create 4x2 Contact Sheet
print("\n=== Generating 4x2 High-Density Contact Sheet ===")
cols = 4
rows = 2
thumb_w = 480
thumb_h = 270
padding = 24
header_h = 70
footer_bar_h = 36

sheet_w = cols * thumb_w + (cols + 1) * padding
sheet_h = rows * (thumb_h + footer_bar_h) + (rows + 1) * padding + header_h

try:
    font_header = ImageFont.truetype(r"C:\Windows\Fonts\msyhbd.ttc", 22)
    font_sub = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 14)
    font_caption = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 15)
except Exception:
    font_header = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_caption = ImageFont.load_default()

sheet = Image.new("RGB", (sheet_w, sheet_h), color="#111216")
draw = ImageDraw.Draw(sheet)

# Header Title
draw.text((padding, 18), "XIANYU (GOOFISH) PROMO v2 — HIGH-DENSITY REMOTION 60FPS BLUEPRINT", fill="#FED000", font=font_header)
draw.text((sheet_w - 560, 24), "SWISS BENTO 75% OCCUPANCY | LIVING MICRO-MOTIONS | 124 BPM", fill="#A0A5B5", font=font_sub)

for idx, (img_path, f_num, s_id, lbl) in enumerate(rendered_paths):
    c = idx % cols
    r = idx // cols
    x = padding + c * (thumb_w + padding)
    y = header_h + padding + r * (thumb_h + footer_bar_h + padding)

    if os.path.exists(img_path):
        im = Image.open(img_path)
        im = im.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(im, (x, y))
        # Draw border
        draw.rectangle([x, y, x + thumb_w, y + thumb_h], outline="#FED000", width=2)
        # Draw caption bar
        draw.rectangle([x, y + thumb_h, x + thumb_w, y + thumb_h + footer_bar_h], fill="#1C1E24")
        caption_text = f"F:{f_num} | {s_id} · {lbl}"
        draw.text((x + 10, y + thumb_h + 8), caption_text, fill="#F6F3EB", font=font_caption)

output_sheet_local = os.path.join(PROJECT_DIR, "out", "xianyu_contact_sheet_v2.png")
output_sheet_artifact = os.path.join(ARTIFACT_DIR, "xianyu_contact_sheet.png")

sheet.save(output_sheet_local, quality=95)
sheet.save(output_sheet_artifact, quality=95)

print(f"\n High-density contact sheet successfully generated:\n  - Local: {output_sheet_local}\n  - Artifact: {output_sheet_artifact}")
