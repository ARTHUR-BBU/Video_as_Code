import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

def main():
    proj_dir = Path("F:/Video_as_Code/space_bunny_replica")
    html_path = (proj_dir / "space_bunny_replica.html").resolve()
    stills_dir = proj_dir / "stills"
    stills_dir.mkdir(exist_ok=True)

    print(f"[*] Loading HTML: {html_path}")
    timestamps = [1.0, 3.5, 6.0, 9.5, 12.5, 16.0, 19.5, 22.0, 25.0]

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
        time.sleep(1.0) # wait for three.js and textures

        canvas = page.locator("#webgl-canvas")

        still_paths = []
        for idx, t in enumerate(timestamps):
            page.evaluate(f"window.renderAtTime({t})")
            time.sleep(0.05)
            out_img = stills_dir / f"still_{idx:02d}_{t:.1f}s.png"
            canvas.screenshot(path=str(out_img))
            print(f"[+] Rendered still at {t}s -> {out_img.name}")
            still_paths.append(out_img)

        browser.close()

    # Generate a review contact sheet of the stills
    sheet_w = 1920
    sheet_h = 1080
    cols = 3
    rows = 3
    thumb_w = sheet_w // cols
    thumb_h = sheet_h // rows
    sheet = Image.new("RGB", (sheet_w, sheet_h), (20, 24, 33))

    for idx, path in enumerate(still_paths):
        r = idx // cols
        c = idx % cols
        img = Image.open(path).convert("RGB")
        img = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(img, (c * thumb_w, r * thumb_h))

    sheet_out = proj_dir / "replica_contact_sheet.jpg"
    sheet.save(str(sheet_out), quality=92)
    print(f"[+] Saved replica contact sheet: {sheet_out}")

if __name__ == "__main__":
    main()
