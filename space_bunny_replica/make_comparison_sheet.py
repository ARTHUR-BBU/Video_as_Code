import os
import sys
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def main():
    proj_dir = Path("F:/Video_as_Code/space_bunny_replica")
    ref_video = Path("F:/Video_as_Code/deconstruct/space_bunny/ref_video.mp4")
    rep_video = proj_dir / "replica_space_bunny_1080p.mp4"
    out_diff = proj_dir / "diff_comparison_sheet.png"

    if not rep_video.exists():
        print(f"[!] Replica video not found at {rep_video}")
        return

    # 6 Keyframe timestamps across the 26s timeline
    timestamps = [1.5, 6.0, 9.5, 13.0, 16.0, 19.5, 22.0, 25.0]
    
    tmp_dir = proj_dir / "comp_stills"
    tmp_dir.mkdir(exist_ok=True)

    ref_imgs = []
    rep_imgs = []

    for i, t in enumerate(timestamps):
        ref_out = tmp_dir / f"ref_{i}_{t:.1f}s.jpg"
        rep_out = tmp_dir / f"rep_{i}_{t:.1f}s.jpg"

        subprocess.run(f'ffmpeg -y -ss {t} -i "{ref_video}" -vframes 1 "{ref_out}"', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(f'ffmpeg -y -ss {t} -i "{rep_video}" -vframes 1 "{rep_out}"', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        if ref_out.exists() and rep_out.exists():
            ref_imgs.append(Image.open(ref_out).convert("RGB"))
            rep_imgs.append(Image.open(rep_out).convert("RGB"))

    if not ref_imgs:
        print("[!] No frames extracted")
        return

    # Create 8-column or 4x2 grid of comparison pairs
    # Layout: Top row = Ref, Bottom row = Replica (or paired columns)
    num_samples = len(ref_imgs)
    thumb_w = 480
    thumb_h = 270
    
    # 4 columns, each column has: Header, Ref Frame, Replica Frame
    cols = 4
    rows = (num_samples + cols - 1) // cols
    
    total_w = cols * thumb_w + (cols + 1) * 20
    # Each row block has: timestamp label (30px) + Ref (thumb_h) + Rep (thumb_h) + gap (30px)
    row_block_h = 30 + thumb_h * 2 + 15
    total_h = rows * row_block_h + 80

    sheet = Image.new("RGB", (total_w, total_h), (15, 23, 42))
    draw = ImageDraw.Draw(sheet)

    # Title Banner
    draw.text((30, 25), "MiniMax M3.1 Flash / Space Bunny: Reference vs 3D Code Replica Comparison", fill=(255, 255, 255))

    for idx in range(num_samples):
        r = idx // cols
        c = idx % cols
        t = timestamps[idx]

        bx = 20 + c * (thumb_w + 20)
        by = 70 + r * row_block_h

        draw.text((bx, by), f"Scene {idx+1} ({t:.1f}s) - Top: Ref 原片 | Bottom: Replica 还原", fill=(148, 163, 184))

        ref_thumb = ref_imgs[idx].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        rep_thumb = rep_imgs[idx].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)

        sheet.paste(ref_thumb, (bx, by + 25))
        sheet.paste(rep_thumb, (bx, by + 25 + thumb_h + 5))

    sheet.save(str(out_diff), quality=92)
    print(f"[+] Successfully generated comparison sheet: {out_diff}")

if __name__ == "__main__":
    main()
