import os
import sys
import math
import json
from functools import lru_cache

# 确保 Windows 控制台支持 UTF-8 打印
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

# Pillow >= 10.0 向后兼容补丁
if not hasattr(Image, "ANTIALIAS"):
    Image.ANTIALIAS = Image.Resampling.LANCZOS

from moviepy.editor import (
    VideoFileClip, VideoClip, AudioFileClip, CompositeAudioClip
)

# 动态加载 claude-motion 音效模块 (带自包含回退)
SFX_AVAILABLE = False
try:
    sys.path.append("F:/GitHub/claude-motion")
    from sfx.synth import click, pop, whoosh, chime, riser, impact, pad, blip
    SFX_AVAILABLE = True
except Exception:
    pass

# ==========================================================
# 全局美学规范：Warm Tactile Editorial (暖调触感实验室色板)
# ==========================================================
W, H = 1920, 1080
FPS = 24
DURATION = 30.0
BPM = 100.0
BEAT_SEC = 60.0 / BPM  # 0.6秒一拍，共50拍

# 统一的时间轴契约 (motion-design: Time lives in timeline.json)
TIMELINE = {
    "bpm": 100,
    "duration": 30.0,
    "acts": [
        {"id": "act1", "start": 0.0,  "end": 3.6,  "name": "SPECIMEN 01: SUNLIT DOUGH", "beats": 6},
        {"id": "act2", "start": 3.6,  "end": 9.6,  "name": "KINETIC ENERGY TRANSFER",   "beats": 10},
        {"id": "act3", "start": 9.6,  "end": 13.2, "name": "COMPRESSION: 85mm -> 1.6mm", "beats": 6},
        {"id": "act4", "start": 13.2, "end": 16.2, "name": "TACTILE SENSOR: PALM",       "beats": 5},
        {"id": "act5", "start": 16.2, "end": 19.8, "name": "GEOMETRY OF 128 STRANDS",    "beats": 6},
        {"id": "act6", "start": 19.8, "end": 22.8, "name": "ANTI-ADHESION AIRFLOW",     "beats": 5},
        {"id": "act7", "start": 22.8, "end": 26.4, "name": "THERMAL CONTRAST: 100C/18C", "beats": 6},
        {"id": "act8", "start": 26.4, "end": 30.0, "name": "THE SOUL COMPOUND",          "beats": 6},
    ]
}

with open("timeline.json", "w", encoding="utf-8") as f:
    json.dump(TIMELINE, f, indent=2, ensure_ascii=False)

# 提取自食材与阳光的自然高级色板
C_PAPER = (244, 239, 230)    # 原麦宣纸白 (#F4EFE6)
C_PAPER_DK = (228, 220, 206) # 亚麻灰米色 (用于卡片底色与网格)
C_ESPRESSO = (28, 25, 23)    # 烘焙深咖黑 (#1C1917 - 替代死板的纯黑)
C_CHARCOAL = (68, 64, 60)    # 炭灰次要文字
C_CHILI = (217, 56, 30)      # 红油朱砂红 (#D9381E - 视觉焦点色)
C_HERB = (46, 111, 64)       # 香菜森绿 (#2E6F40 - 校验通过/新鲜度)
C_GOLD = (212, 154, 61)      # 午后阳光金 (#D49A3D - 温暖高光)
C_CREAM = (250, 247, 242)    # 暗底上的奶油白字

# 预计算 16 帧自然胶片颗粒池，大幅加速单帧渲染
np.random.seed(42)
GRAIN_POOL = [np.random.randint(-4, 5, (H, W, 1), dtype=np.int16) for _ in range(16)]

# ==========================================================
# 动效缓动函数库 (claude-motion: motion-design rules)
# ==========================================================
def ease_out_cubic(x):
    return 1.0 - math.pow(1.0 - x, 3)

def ease_in_cubic(x):
    return x * x * x

def ease_in_out_quad(x):
    return 2 * x * x if x < 0.5 else 1 - math.pow(-2 * x + 2, 2) / 2

# ==========================================================
# 模块一：100 BPM 原声温暖律动 BGM + claude-motion 音效引擎
# ==========================================================
def generate_craft_bgm(filename="craft_editorial_bgm.wav", duration=30.0, sr=44100):
    print("🎵 正在通过数学模型合成 100 BPM 暖调木质律动 BGM (木吉他拨弦 + 温暖Rhodes + 料理节拍)...")
    total_samples = int(sr * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    audio = np.zeros((total_samples, 2), dtype=np.float32)

    # 1. 温暖黑胶与午后阳光空气底噪
    noise = np.random.normal(0, 0.0022, (total_samples, 2))
    b, a = butter(2, 950 / (sr / 2), btype='low')
    audio += lfilter(b, a, noise, axis=0)

    # 2. 温暖治愈的和弦进行 (Gmaj9 -> F#m7 -> Em9 -> Dmaj9)
    chords = [
        [196.00, 246.94, 293.66, 369.99, 440.00],  # Gmaj9
        [185.00, 220.00, 277.18, 329.63, 415.30],  # F#m7b9
        [164.81, 196.00, 246.94, 293.66, 369.99],  # Em9
        [146.83, 185.00, 220.00, 277.18, 329.63],  # Dmaj9
    ]
    bar_sec = BEAT_SEC * 4  # 2.4秒一小节
    num_bars = int(math.ceil(duration / bar_sec))

    for bar in range(num_bars):
        chord = chords[bar % len(chords)]
        start_idx = int(bar * bar_sec * sr)
        end_idx = min(int((bar + 1) * bar_sec * sr), total_samples)
        seg_len = end_idx - start_idx
        if seg_len <= 0:
            continue
        st = np.linspace(0, seg_len / sr, seg_len, endpoint=False)

        # Rhodes 电钢琴温暖铺底
        env = np.clip(st / 0.15, 0, 1) * np.exp(-st * 0.85)
        pad_L = np.zeros_like(st)
        pad_R = np.zeros_like(st)
        for i, freq in enumerate(chord):
            vib = np.sin(2 * np.pi * 4.2 * st) * 0.0012
            f = freq * (1 + vib)
            tone = (0.65 * np.sin(2 * np.pi * f * st) +
                    0.22 * np.sin(2 * np.pi * f * 2 * st) * np.exp(-st * 2.5))
            pan = 0.25 + 0.5 * (i / len(chord))
            pad_L += tone * (1 - pan)
            pad_R += tone * pan

        # 温暖的木贝斯根音 (Upright Acoustic Bass 模拟)
        bass_f = chord[0] / 2.0
        bass = (np.sin(2 * np.pi * bass_f * st) * 0.7 +
                np.sin(2 * np.pi * bass_f * 2 * st) * 0.3 * np.exp(-st * 4.0)) * np.exp(-st * 1.4)

        audio[start_idx:end_idx, 0] += (pad_L * 0.09 + bass * 0.28) * env
        audio[start_idx:end_idx, 1] += (pad_R * 0.09 + bass * 0.28) * env

    # 3. 灵动的原声木吉他分解拨弦 (Acoustic Pluck Arpeggio)
    sixteenth = BEAT_SEC / 4.0  # 0.15秒
    pluck_pattern = [0, 2, 3, 4, 3, 2, 1, 3]
    for step in range(int(duration / sixteenth)):
        s_idx = int(step * sixteenth * sr)
        p_len = int(0.35 * sr)
        if s_idx + p_len >= total_samples:
            break
        pt = np.linspace(0, 0.35, p_len, endpoint=False)
        cur_bar = int((step * sixteenth) / bar_sec)
        chord = chords[cur_bar % len(chords)]
        note_f = chord[pluck_pattern[step % len(pluck_pattern)]] * 2.0

        # Karplus-Strong 风格泛音衰减模拟木吉他琴弦
        pluck_wave = (
            0.55 * np.sin(2 * np.pi * note_f * pt) +
            0.30 * np.sin(2 * np.pi * note_f * 2 * pt) * np.exp(-pt * 14) +
            0.15 * np.sin(2 * np.pi * note_f * 3 * pt) * np.exp(-pt * 24)
        ) * np.exp(-pt * 9.5) * 0.14

        pan = 0.35 if step % 2 == 0 else 0.65
        audio[s_idx:s_idx + p_len, 0] += pluck_wave * pan
        audio[s_idx:s_idx + p_len, 1] += pluck_wave * (1 - pan)

    # 4. 料理感原声打击乐律动 (柔和木箱鼓 Cajon + 砧板木质 Rimshot)
    for beat in range(int(duration / BEAT_SEC)):
        b_idx = int(beat * BEAT_SEC * sr)
        k_len = int(0.18 * sr)
        if b_idx + k_len < total_samples:
            kt = np.linspace(0, 0.18, k_len)
            f_env = 52 + 85 * np.exp(-kt * 42)
            kick = np.sin(2 * np.pi * f_env * kt) * np.exp(-kt * 16) * 0.32
            audio[b_idx:b_idx + k_len, 0] += kick
            audio[b_idx:b_idx + k_len, 1] += kick

        if beat % 2 == 1:
            r_len = int(0.08 * sr)
            if b_idx + r_len < total_samples:
                rt = np.linspace(0, 0.08, r_len)
                wood_click = (np.sin(2 * np.pi * 820 * rt) * np.exp(-rt * 85) * 0.18 +
                              np.random.normal(0, 1, r_len) * np.exp(-rt * 45) * 0.12)
                audio[b_idx:b_idx + r_len, 0] += wood_click
                audio[b_idx:b_idx + r_len, 1] += wood_click

    # 5. 融合 claude-motion 的程序化音效 (转场 Whoosh, 质检 Pop, 终章 Chime/Impact)
    if SFX_AVAILABLE:
        print("🔊 正在注入 claude-motion 拟真音效 (Whoosh 转场 / Pop 校验 / Chime 印章)...")
        # 章节切换时注入轻柔 Whoosh
        switch_times = [3.6, 9.6, 16.2, 22.8, 26.4]
        for st_time in switch_times:
            w_samples = np.array(whoosh(0.32, 220, 1400, peak=0.45), dtype=np.float32)
            w_idx = int((st_time - 0.15) * sr)
            w_end = min(w_idx + len(w_samples), total_samples)
            if 0 <= w_idx < total_samples:
                audio[w_idx:w_end, 0] += w_samples[:w_end - w_idx] * 0.14
                audio[w_idx:w_end, 1] += w_samples[:w_end - w_idx] * 0.14

        # Act 06 质检卡打勾 Pop 音效
        check_times = [19.8 + i * 0.55 for i in range(4)]
        for i, c_t in enumerate(check_times):
            p_samples = np.array(pop(600 + i * 160, 350, dur=0.12), dtype=np.float32)
            p_idx = int(c_t * sr)
            p_end = min(p_idx + len(p_samples), total_samples)
            if 0 <= p_idx < total_samples:
                pan = 0.35 + 0.1 * i
                audio[p_idx:p_end, 0] += p_samples[:p_end - p_idx] * 0.18 * (1 - pan)
                audio[p_idx:p_end, 1] += p_samples[:p_end - p_idx] * 0.18 * pan

        # Act 08 终章印章落下 Chime & Impact
        stamp_time = 27.2
        c_samples = np.array(chime([293.66, 369.99, 440.00, 587.33], dur=1.8), dtype=np.float32)
        c_idx = int(stamp_time * sr)
        c_end = min(c_idx + len(c_samples), total_samples)
        if 0 <= c_idx < total_samples:
            audio[c_idx:c_end, 0] += c_samples[:c_end - c_idx] * 0.22
            audio[c_idx:c_end, 1] += c_samples[:c_end - c_idx] * 0.22

        imp_samples = np.array(impact(dur=0.9), dtype=np.float32)
        imp_idx = int(stamp_time * sr)
        imp_end = min(imp_idx + len(imp_samples), total_samples)
        if 0 <= imp_idx < total_samples:
            audio[imp_idx:imp_end, 0] += imp_samples[:imp_end - imp_idx] * 0.18
            audio[imp_idx:imp_end, 1] += imp_samples[:imp_end - imp_idx] * 0.18

    # 6. 整体低通滤波与首尾淡入淡出
    b_m, a_m = butter(2, 4200 / (sr / 2), btype='low')
    audio = lfilter(b_m, a_m, audio, axis=0)
    fi = np.linspace(0, 1, int(1.2 * sr))[:, None]
    fo = np.linspace(1, 0, int(2.0 * sr))[:, None]
    audio[:len(fi)] *= fi
    audio[-len(fo):] *= fo

    max_v = np.max(np.abs(audio))
    if max_v > 0:
        audio = audio / max_v * 0.88
    wavfile.write(filename, sr, (audio * 32767).astype(np.int16))
    print(f"✅ 暖调原声律动 BGM 合成完毕: {filename}")
    return filename


# ==========================================================
# 模块二：中英双语高级排版字体加载器（带 LRU 缓存）
# ==========================================================
@lru_cache(maxsize=128)
def get_font(style="cn_sans", size=36):
    """自动匹配系统内的高品质字体，LRU 缓存消除帧重复开销"""
    font_paths = {
        "cn_sans": [
            "C:/Windows/Fonts/msyhbd.ttc",
            "C:/Windows/Fonts/msyh.ttc",
            "/System/Library/Fonts/PingFang.ttc",
            "/System/Library/Fonts/STHeiti Medium.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        ],
        "cn_serif": [
            "C:/Windows/Fonts/simsun.ttc",
            "/System/Library/Fonts/Songti.ttc",
            "/System/Library/Fonts/STSong.ttf",
            "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc",
        ],
        "en_display": [
            "C:/Windows/Fonts/impact.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/System/Library/Fonts/Supplemental/Impact.ttf",
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ],
        "en_serif": [
            "C:/Windows/Fonts/georgia.ttf",
            "C:/Windows/Fonts/times.ttf",
            "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
            "/System/Library/Fonts/Supplemental/Georgia.ttf",
            "/System/Library/Fonts/Times.ttc",
        ],
        "mono": [
            "C:/Windows/Fonts/consola.ttf",
            "C:/Windows/Fonts/cour.ttf",
            "/System/Library/Fonts/Menlo.ttc",
            "/System/Library/Fonts/Courier.dfont",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        ]
    }
    for p in font_paths.get(style, font_paths["cn_sans"]):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


class MediaVault:
    """管理全部 9 张照片与揉面视频，提供高精度焦点缩放与画面增强"""
    def __init__(self):
        self.imgs = {}
        mapping = {
            "roll":      "image.png",
            "palm":      "image_2.png",
            "chili":     "image_3.png",
            "coriander": "image_4.png",
            "broth":     "image_5.png",
            "shake":     "image_6.png",
            "dust":      "image_7.png",
            "slice":     "image_8.png",
            "rest":      "image_9.png",
        }
        for key, fn in mapping.items():
            path_to_open = fn
            if not os.path.exists(path_to_open):
                alt = os.path.join("拉面", fn)
                if os.path.exists(alt):
                    path_to_open = alt

            if os.path.exists(path_to_open):
                img = Image.open(path_to_open).convert("RGB")
                img = ImageEnhance.Contrast(img).enhance(1.08)
                img = ImageEnhance.Color(img).enhance(1.06)
                self.imgs[key] = img
            else:
                self.imgs[key] = Image.new("RGB", (1200, 900), (210, 195, 175))

        # 视频探测
        vid_candidates = [
            "574495.mov",
            "kneading.mp4",
            "2e1f401b50d21d7ae56391fbaf254dfd.mp4",
            os.path.join("拉面", "2e1f401b50d21d7ae56391fbaf254dfd.mp4")
        ]
        vid_file = next((f for f in vid_candidates if os.path.exists(f)), None)
        self.vid = VideoFileClip(vid_file) if vid_file else None

    def fetch(self, key, w, h, zoom=1.0, focus=(0.5, 0.5)):
        src = self.imgs[key]
        sw, sh = src.size
        target_r = w / h
        src_r = sw / sh
        if src_r > target_r:
            nw = int(sh * target_r)
            nh = sh
        else:
            nw = sw
            nh = int(sw / target_r)

        nw = max(10, int(nw / zoom))
        nh = max(10, int(nh / zoom))
        cx = int(sw * focus[0])
        cy = int(sh * focus[1])
        x1 = max(0, min(sw - nw, cx - nw // 2))
        y1 = max(0, min(sh - nh, cy - nh // 2))
        cropped = src.crop((x1, y1, x1 + nw, y1 + nh))
        return cropped.resize((w, h), Image.Resampling.BILINEAR)

    def fetch_video(self, t, w, h, zoom=1.05):
        if self.vid is None:
            return self.fetch("rest", w, h, zoom=zoom)
        vt = t % self.vid.duration
        frame = self.vid.get_frame(vt)
        self.imgs["_vid_tmp"] = Image.fromarray(frame)
        return self.fetch("_vid_tmp", w, h, zoom=zoom)


# ==========================================================
# 模块三：杂志级信息图表与 UI 组件绘制引擎
# ==========================================================
def draw_editorial_scaffold(draw, t, dark_mode=False):
    """绘制全局瑞士网格参考线、页眉刊头、以及底部50拍料理节拍进度尺"""
    fg = C_CREAM if dark_mode else C_ESPRESSO
    muted = (150, 142, 132) if dark_mode else (130, 122, 112)
    grid_c = (46, 42, 39) if dark_mode else C_PAPER_DK

    margin = 48
    draw.rectangle([margin, margin, W - margin, H - margin - 24], outline=grid_c, width=2)
    draw.line([(margin, 105), (W - margin, 105)], fill=grid_c, width=2)

    f_mono = get_font("mono", 18)
    f_cn = get_font("cn_sans", 18)
    draw.text((margin + 20, 66), "JOURNAL OF ARTISAN NOODLES // ISSUE NO. 01", fill=fg, font=f_mono)
    draw.text((W // 2 - 110, 65), "《面粉的物理学》慢食料理档案", fill=C_CHILI, font=f_cn)
    cur_beat = min(50, int(t / BEAT_SEC) + 1)
    draw.text((W - margin - 310, 66), f"100 BPM · BEAT {cur_beat:02d}/50 · 5200K", fill=muted, font=f_mono)

    # 底部 50 格料理时间轴刻度尺
    bar_y = H - 52
    total_beats = 50
    seg_w = (W - margin * 2) / total_beats
    for i in range(total_beats):
        sx = margin + i * seg_w
        ex = sx + seg_w - 4
        if i < cur_beat - 1:
            c = C_CHILI
        elif i == cur_beat - 1:
            c = C_GOLD if dark_mode else C_ESPRESSO
        else:
            c = grid_c
        draw.rectangle([sx, bar_y, ex, bar_y + 8], fill=c)


def draw_tag_pill(draw, x, y, text, bg_color=C_ESPRESSO, dot_color=C_GOLD, text_color=C_CREAM):
    """绘制精致的胶囊状态指示器"""
    f_cn = get_font("cn_sans", 18)
    bbox = draw.textbbox((0, 0), text, font=f_cn)
    tw = bbox[2] - bbox[0]
    w = tw + 52
    h = 36
    draw.rounded_rectangle([x, y, x + w, y + h], radius=18, fill=bg_color)
    draw.ellipse([x + 14, y + 11, x + 26, y + 23], fill=dot_color)
    draw.text((x + 34, y + 7), text, fill=text_color, font=f_cn)
    return w


def draw_craft_stamp(canvas, x, y, title_cn, sub_en, color=C_CHILI, angle=-6):
    """绘制带有手作印章质感的双语方印/斜章"""
    f_cn = get_font("cn_sans", 38)
    f_en = get_font("mono", 16)
    sw, sh = 310, 96
    stamp = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stamp)
    sd.rectangle([4, 4, sw - 4, sh - 4], fill=color + (235,), outline=(255, 255, 255, 255), width=3)
    sd.rectangle([10, 10, sw - 10, sh - 10], outline=(255, 255, 255, 180), width=1)
    sd.text((24, 16), title_cn, fill=(255, 250, 240, 255), font=f_cn)
    sd.text((26, 64), sub_en, fill=(255, 235, 210, 255), font=f_en)
    rot = stamp.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    canvas.paste(rot, (x, y), rot)


def paste_framed_photo(canvas, draw, img, x, y, border_color=C_ESPRESSO, caption=""):
    """粘贴照片并附带瑞士网格细线框与图注"""
    w, h = img.size
    canvas.paste(img, (x, y))
    draw.rectangle([x, y, x + w, y + h], outline=border_color, width=2)
    if caption:
        f_mono = get_font("mono", 16)
        draw.rectangle([x, y + h - 32, x + len(caption) * 10 + 24, y + h], fill=border_color)
        draw.text((x + 10, y + h - 26), caption, fill=C_CREAM, font=f_mono)


# ==========================================================
# 模块四：8幕“慢食实验室”视觉叙事主渲染器
# ==========================================================
def render_editorial_frame(t, vault):
    # 根据幕次自动切换【原麦宣纸白底】与【烘焙深咖黑底】，营造呼吸节奏
    dark_scenes = (3.6 <= t < 9.6) or (16.2 <= t < 19.8) or (26.4 <= t <= 30.0)
    bg_color = C_ESPRESSO if dark_scenes else C_PAPER
    canvas = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(canvas)
    draw_editorial_scaffold(draw, t, dark_mode=dark_scenes)

    f_en_hero = get_font("en_display", 130)
    f_en_lg   = get_font("en_display", 84)
    f_cn_lg   = get_font("cn_sans", 40)
    f_cn_md   = get_font("cn_sans", 26)
    f_mono_lg = get_font("mono", 32)
    f_mono_md = get_font("mono", 22)
    f_mono_sm = get_font("mono", 17)

    # ------------------------------------------------------
    # Act 01 (00:00 - 00:03.6): 【档案建档：阳光醒面】
    # ------------------------------------------------------
    if t < 3.6:
        st = t
        img_rest = vault.fetch("rest", 960, 820, zoom=1.0 + st * 0.025)
        paste_framed_photo(canvas, draw, img_rest, 880, 130, C_ESPRESSO, "FIG 01. SUNLIT RESTING // 午后三点的醒发")

        draw_tag_pill(draw, 85, 135, "STAGE 01 · 醒面静置", bg_color=C_CHILI, dot_color=C_CREAM)
        draw.text((85, 195), "THE SUNLIT", fill=C_ESPRESSO, font=f_en_hero)
        draw.text((85, 325), "DOUGH.", fill=C_ESPRESSO, font=f_en_hero)
        draw.text((85, 475), "阳光、时间与水合作用的静默交响", fill=C_CHARCOAL, font=f_cn_lg)
        draw.line([(85, 545), (820, 545)], fill=C_ESPRESSO, width=2)

        specs = [
            ("WHEAT FLOUR / 高筋麦芯粉", "500.0 g", "100%"),
            ("HYDRATION / 纯净水合比",   "240.0 ml", "48.0%"),
            ("SOLAR WARMTH / 台面日照",  "26.5 °C",  "OPTIMAL"),
            ("REST TIMER / 醒发计时",    f"{min(45, int(st * 15)):02d}:00 min", "READY"),
        ]
        for idx, (label, val, badge) in enumerate(specs):
            if st > idx * 0.45:
                cy = 570 + idx * 88
                draw.rectangle([85, cy, 820, cy + 74], fill=C_PAPER_DK, outline=C_ESPRESSO, width=1)
                draw.text((105, cy + 12), label, fill=C_CHARCOAL, font=f_cn_md)
                draw.text((105, cy + 44), f"STATUS: {badge}", fill=C_HERB, font=f_mono_sm)
                draw.text((580, cy + 18), val, fill=C_ESPRESSO, font=f_mono_lg)

    # ------------------------------------------------------
    # Act 02 (00:03.6 - 00:09.6): 【力学遥测：手工揉面视频】
    # ------------------------------------------------------
    elif t < 9.6:
        st = t - 3.6
        vid_img = vault.fetch_video(st, 1080, 620, zoom=1.04)
        paste_framed_photo(canvas, draw, vid_img, 80, 130, C_GOLD, "LIVE TELEMETRY // 掌心温度与面筋网络构建")
        draw_tag_pill(draw, 105, 155, "STAGE 02 · 手工揉面 (保留原声 ASMR)", bg_color=C_ESPRESSO, dot_color=C_HERB)

        rx = 1200
        draw.text((rx, 130), "KINETIC", fill=C_CREAM, font=f_en_lg)
        draw.text((rx, 215), "KNEADING", fill=C_GOLD, font=f_en_lg)
        draw.text((rx, 315), "每一次掌根按压，都在重塑蛋白质网格", fill=C_PAPER_DK, font=f_cn_md)

        # 实时绘制手掌按压力学波形图 (Force Curve)
        gx, gy, gw, gh = rx, 375, 640, 210
        draw.rectangle([gx, gy, gx + gw, gy + gh], fill=(38, 34, 31), outline=C_GOLD, width=1)
        draw.text((gx + 15, gy + 10), "PALM PRESSURE WAVE (NEWTONS / SEC)", fill=C_GOLD, font=f_mono_sm)
        pts = []
        for x_step in range(0, gw - 20, 6):
            wave_t = st * 4.5 + x_step * 0.04
            amp = math.sin(wave_t) * math.cos(wave_t * 0.5) * 65
            pts.append((gx + 10 + x_step, int(gy + gh * 0.58 - amp)))
        if len(pts) > 1:
            draw.line(pts, fill=C_CHILI, width=4)

        folds = 140 + int(st * 24)
        elasticity = min(99.4, 82.0 + st * 2.9)
        draw.rectangle([rx, 610, rx + 305, 750], fill=(38, 34, 31), outline=C_CREAM, width=1)
        draw.text((rx + 20, 625), "CUMULATIVE FOLDS / 折叠", fill=C_PAPER_DK, font=f_mono_sm)
        draw.text((rx + 20, 655), f"{folds}", fill=C_CREAM, font=f_en_lg)

        draw.rectangle([rx + 335, 610, rx + 640, 750], fill=(38, 34, 31), outline=C_CREAM, width=1)
        draw.text((rx + 355, 625), "ELASTICITY / 筋道指数", fill=C_PAPER_DK, font=f_mono_sm)
        draw.text((rx + 355, 655), f"{elasticity:.1f}%", fill=C_HERB, font=f_en_lg)

        draw.rectangle([80, 780, 1840, 965], fill=(20, 18, 16), outline=(70, 65, 60), width=1)
        logs = [
            f"[00:0{int(t)}.12] PALM_SENSOR: 掌心恒温 36.6°C 激活麦香与延展活性...",
            f"[00:0{int(t)}.45] GLUTEN_NET : 内部气孔已排出 {elasticity:.1f}%，面团表面呈现绸缎柔光",
            f"[00:0{int(t)}.80] VERDICT    : 拒绝机械搅拌撕裂，100% 掌心柔道揉制",
        ]
        for i, l_str in enumerate(logs):
            draw.text((105, 800 + i * 50), l_str, fill=C_GOLD if i == 2 else C_CREAM, font=f_cn_md)

    # ------------------------------------------------------
    # Act 03 (00:09.6 - 00:13.2): 【延展工程：撒粉与擀面厚度卡尺】
    # ------------------------------------------------------
    elif t < 13.2:
        st = t - 9.6
        prog = min(1.0, st / 3.0)
        e_prog = ease_out_cubic(prog)

        img_dust = vault.fetch("dust", 760, 400, zoom=1.08 - prog * 0.06)
        paste_framed_photo(canvas, draw, img_dust, 80, 130, C_ESPRESSO, "STEP 03A // 轻撒薄粉防粘")

        img_roll = vault.fetch("roll", 760, 400, zoom=1.0 + prog * 0.07)
        paste_framed_photo(canvas, draw, img_roll, 80, 560, C_ESPRESSO, "STEP 03B // 原木擀面杖均匀推开")

        rx = 900
        draw_tag_pill(draw, rx, 130, "STAGE 03 · 延展与压薄力学", bg_color=C_ESPRESSO, dot_color=C_GOLD)
        draw.text((rx, 185), "ROLLING", fill=C_ESPRESSO, font=f_en_hero)
        draw.text((rx + 530, 210), "EXTENSION", fill=C_CHILI, font=f_en_lg)

        thickness = 85.0 * (1.0 - e_prog) + 1.6
        diameter = int(14 + e_prog * 52)

        cal_y = 370
        gap_px = int(8 + (1.0 - e_prog) * 150)
        draw.rectangle([rx, cal_y, rx + 940, cal_y + 24], fill=C_ESPRESSO)
        draw.rectangle([rx, cal_y + 24 + gap_px, rx + 940, cal_y + 48 + gap_px], fill=C_ESPRESSO)
        draw.rectangle([rx + 40, cal_y + 24, rx + 900, cal_y + 24 + gap_px], fill=C_GOLD)
        draw.text((rx + 360, cal_y + max(2, gap_px // 2 + 12)), "<<< DOUGH SHEET LAYER >>>", fill=C_ESPRESSO, font=f_mono_sm)

        draw.text((rx, 610), "SHEET THICKNESS / 面皮实时厚度", fill=C_CHARCOAL, font=f_cn_md)
        draw.text((rx, 650), f"{thickness:04.1f} mm", fill=C_CHILI, font=f_en_hero)

        draw.text((rx + 540, 610), "DIAMETER / 延展直径", fill=C_CHARCOAL, font=f_cn_md)
        draw.text((rx + 540, 650), f"{diameter} cm", fill=C_ESPRESSO, font=f_en_hero)

        draw.rectangle([rx, 835, rx + 940, 895], outline=C_ESPRESSO, width=2)
        bars = int(e_prog * 30)
        for b in range(bars):
            draw.rectangle([rx + 8 + b * 31, 843, rx + 8 + b * 31 + 24, 887], fill=C_HERB)
        draw.text((rx, 912), "UNIFORMITY CHECK: 边缘与中心厚薄公差 < 0.05mm", fill=C_CHARCOAL, font=f_cn_md)

    # ------------------------------------------------------
    # Act 04 (00:13.2 - 00:16.2): 【触觉校准：手掌轻抚面皮微距】
    # ------------------------------------------------------
    elif t < 16.2:
        st = t - 13.2
        img_palm = vault.fetch("palm", 1120, 830, zoom=1.02 + st * 0.02)
        paste_framed_photo(canvas, draw, img_palm, 80, 130, C_ESPRESSO, "FIG 04. TACTILE CALIBRATION // 掌纹与面皮的微距对话")

        sx, sy, sw, sh = 260, 290, 560, 420
        draw.rectangle([sx, sy, sx + sw, sy + sh], outline=C_GOLD, width=3)
        draw.line([(sx - 25, sy + sh // 2), (sx + sw + 25, sy + sh // 2)], fill=C_GOLD, width=1)
        draw.line([(sx + sw // 2, sy - 25), (sx + sw // 2, sy + sh + 25)], fill=C_GOLD, width=1)
        draw_tag_pill(draw, sx + 20, sy + 20, "TACTILE SENSOR: 人类手掌触觉扫描中", bg_color=C_ESPRESSO, dot_color=C_GOLD)

        rx = 1240
        draw.text((rx, 135), "FEEL >", fill=C_ESPRESSO, font=f_en_hero)
        draw.text((rx, 265), "SENSORS", fill=C_CHILI, font=f_en_hero)
        draw.text((rx, 415), "机器只认识冷冰冰的参数，\n而手掌懂得面团今天的干湿脾气。", fill=C_ESPRESSO, font=f_cn_lg)

        draw.rectangle([rx, 555, rx + 600, 780], fill=C_PAPER_DK, outline=C_ESPRESSO, width=2)
        draw.text((rx + 25, 575), "SENSITIVITY COMPARISON / 触感细腻度对比", fill=C_CHARCOAL, font=f_mono_sm)

        h_bar = int(ease_out_cubic(min(1.0, st / 1.5)) * 480)
        draw.text((rx + 25, 615), "ARTISAN PALM (手工抚触校准)", fill=C_ESPRESSO, font=f_cn_md)
        draw.rectangle([rx + 25, 655, rx + 25 + h_bar, 685], fill=C_HERB)
        draw.text((rx + 515, 655), "99.8%", fill=C_HERB, font=f_mono_md)

        draw.text((rx + 25, 700), "FACTORY ROLLER (工业流水线压辊)", fill=C_CHARCOAL, font=f_cn_md)
        draw.rectangle([rx + 25, 740, rx + 110, 765], fill=C_CHARCOAL)
        draw.text((rx + 125, 738), "12.0%", fill=C_CHARCOAL, font=f_mono_md)

        if st > 1.2:
            draw_craft_stamp(canvas, rx + 140, 815, "手感校验合格", "APPROVED BY ARTISAN PALM", color=C_CHILI, angle=-4)

    # ------------------------------------------------------
    # Act 05 (00:16.2 - 00:19.8): 【几何切片：三联刀工阵列】
    # ------------------------------------------------------
    elif t < 19.8:
        st = t - 16.2
        draw_tag_pill(draw, 80, 125, "STAGE 05 · 刀起刀落的几何学", bg_color=C_CHILI, dot_color=C_CREAM)
        draw.text((80, 175), "PRECISION HAND-CUT", fill=C_CREAM, font=f_en_lg)
        strands = min(128, int(st * 42) + 12)
        draw.text((1380, 125), f"{strands:03d} STRANDS", fill=C_GOLD, font=f_en_lg)
        draw.text((1385, 215), "TARGET WIDTH: 3.0mm ± 0.1mm", fill=C_PAPER_DK, font=f_mono_md)

        panels = [
            (0.25, 0.5, "SLICE_ZONE #01 // 起刀定宽", 0.0),
            (0.50, 0.5, "SLICE_ZONE #02 // 匀速推进", 0.6),
            (0.75, 0.5, "SLICE_ZONE #03 // 截面齐整", 1.2),
        ]
        for idx, (fx, fy, cap, trig_t) in enumerate(panels):
            px = 80 + idx * 600
            py = 265
            pw, ph = 560, 560
            active = (st >= trig_t)
            img_p = vault.fetch("slice", pw, ph, zoom=1.18, focus=(fx, fy))
            if not active:
                img_p = ImageEnhance.Brightness(img_p).enhance(0.22)
            paste_framed_photo(canvas, draw, img_p, px, py, C_GOLD if active else C_CHARCOAL, cap)

            if active:
                for lx in range(px + 60, px + pw - 40, 45):
                    draw.line([(lx, py + 20), (lx, py + 55)], fill=C_GOLD, width=2)

        draw.rectangle([80, 855, 1840, 960], fill=C_CHILI)
        draw.text((115, 872), "刀锋下的秩序感：宽窄一致才能保证每一根面条在沸水中同时成熟", fill=C_CREAM, font=f_cn_lg)

    # ------------------------------------------------------
    # Act 06 (00:19.8 - 00:22.8): 【流体动力学：提起抖散】
    # ------------------------------------------------------
    elif t < 22.8:
        st = t - 19.8
        img_shake = vault.fetch("shake", 980, 830, zoom=1.0 + st * 0.03)
        paste_framed_photo(canvas, draw, img_shake, 860, 130, C_ESPRESSO, "FIG 06. LOOSENING // 抖落浮粉，根根分明")

        draw_tag_pill(draw, 80, 130, "STAGE 06 · 抖散防粘", bg_color=C_HERB, dot_color=C_CREAM)
        draw.text((80, 185), "SHAKE &", fill=C_ESPRESSO, font=f_en_hero)
        draw.text((80, 310), "BREATHE", fill=C_CHILI, font=f_en_hero)

        checks = [
            ("EXCESS FLOUR SHEDDING", "抖落多余浮粉，汤底清澈不浑浊"),
            ("STRAND SEPARATION",     "128 根面条完全舒展，零粘连"),
            ("SURFACE MICRO-ROUGHNESS","保留手工切面微孔，挂汁力提升 300%"),
            ("BOILING READINESS",     "鲜面含水率锁定，准备下锅"),
        ]
        for idx, (en_t, cn_t) in enumerate(checks):
            if st >= idx * 0.55:
                cy = 465 + idx * 120
                draw.rectangle([80, cy, 810, cy + 102], fill=C_CREAM, outline=C_ESPRESSO, width=2)
                draw.rectangle([80, cy, 165, cy + 102], fill=C_HERB)
                draw.text((108, cy + 28), "PASS", fill=C_CREAM, font=f_mono_md)
                draw.text((190, cy + 16), en_t, fill=C_ESPRESSO, font=f_mono_md)
                draw.text((190, cy + 52), cn_t, fill=C_CHARCOAL, font=f_cn_md)

    # ------------------------------------------------------
    # Act 07 (00:22.8 - 00:26.4): 【冰火对撞：100°C 沸汤 vs 18°C 鲜切香菜】
    # ------------------------------------------------------
    elif t < 26.4:
        st = t - 22.8
        mid_x = W // 2

        draw.rectangle([48, 105, mid_x, H - 76], fill=C_CHILI)
        img_broth = vault.fetch("broth", mid_x - 140, 450, zoom=1.0 + st * 0.04)
        paste_framed_photo(canvas, draw, img_broth, 90, 460, C_CREAM, "SIMMERING POT // 小锅慢炖原汤")

        draw_tag_pill(draw, 90, 135, "THERMAL POLE A · 滚烫骨汤", bg_color=C_ESPRESSO, dot_color=C_GOLD)
        draw.text((90, 190), f"{99.2 + min(0.8, st * 0.3):.1f}°C", fill=C_CREAM, font=f_en_hero)
        draw.text((90, 335), "ROARING BROTH / 琥珀色浓汤翻滚", fill=C_CREAM, font=f_cn_lg)
        draw.text((90, 395), "COLLAGEN EMULSIFICATION: ACTIVE", fill=C_PAPER_DK, font=f_mono_md)

        draw.rectangle([mid_x, 105, W - 48, H - 76], fill=C_HERB)
        img_herb = vault.fetch("coriander", mid_x - 140, 450, zoom=1.08 - st * 0.03)
        paste_framed_photo(canvas, draw, img_herb, mid_x + 50, 460, C_CREAM, "FRESH HERBS // 刀落瞬间的植物清香")

        draw_tag_pill(draw, mid_x + 50, 135, "THERMAL POLE B · 清冽香菜", bg_color=C_ESPRESSO, dot_color=C_CREAM)
        draw.text((mid_x + 50, 190), "18.5°C", fill=C_CREAM, font=f_en_hero)
        draw.text((mid_x + 50, 335), "CRISP CORIANDER / 翠绿鲜切提味", fill=C_CREAM, font=f_cn_lg)
        draw.text((mid_x + 50, 395), "ESSENTIAL OIL VOLATILITY: PEAK", fill=C_PAPER_DK, font=f_mono_md)

        draw.rectangle([mid_x - 24, 105, mid_x + 24, H - 76], fill=C_ESPRESSO)
        draw.ellipse([mid_x - 55, H // 2 - 55, mid_x + 55, H // 2 + 55], fill=C_GOLD, outline=C_CREAM, width=3)
        draw.text((mid_x - 28, H // 2 - 20), "VS", fill=C_ESPRESSO, font=get_font("en_display", 42))

    # ------------------------------------------------------
    # Act 08 (00:26.4 - 00:30.0): 【终章合成：红油白芝麻与美味曲线】
    # ------------------------------------------------------
    else:
        st = t - 26.4
        img_chili = vault.fetch("chili", 820, 560, zoom=1.0 + st * 0.03)
        paste_framed_photo(canvas, draw, img_chili, 80, 130, C_GOLD, "FINAL SOUL // 熟白芝麻与秘制红油")

        thumb_keys = ["rest", "dust", "roll", "palm", "slice", "shake"]
        for idx, tk in enumerate(thumb_keys):
            tx = 80 + idx * 138
            ty = 715
            th_img = vault.fetch(tk, 128, 220, zoom=1.1)
            canvas.paste(th_img, (tx, ty))
            draw.rectangle([tx, ty, tx + 128, ty + 220], outline=C_GOLD, width=1)

        rx = 950
        draw_tag_pill(draw, rx, 130, "FINAL VERDICT · 人间烟火风味合成", bg_color=C_CHILI, dot_color=C_GOLD)
        draw.text((rx, 185), "THE SOUL", fill=C_CREAM, font=f_en_hero)
        draw.text((rx, 310), "COMPOUND.", fill=C_GOLD, font=f_en_hero)
        draw.text((rx, 455), "工业速食只提供热量，手工面食提供灵魂。", fill=C_CREAM, font=f_cn_lg)

        gx, gy, gw, gh = rx, 525, 890, 290
        draw.rectangle([gx, gy, gx + gw, gy + gh], fill=(38, 34, 31), outline=C_CHARCOAL, width=1)
        draw.line([(gx + 50, gy + 30), (gx + 50, gy + gh - 35)], fill=C_PAPER_DK, width=2)
        draw.line([(gx + 50, gy + gh - 35), (gx + gw - 30, gy + gh - 35)], fill=C_PAPER_DK, width=2)

        prog = min(1.0, st / 1.8)
        n_pts = int(prog * 45)
        if n_pts > 1:
            pts_ind = []
            pts_art = []
            for i in range(n_pts):
                px = i / 45.0
                cx = int(gx + 50 + px * (gw - 100))
                iy = int(gy + gh - 35 - (gh - 80) * (0.45 * (1.0 - px ** 0.7)))
                ay = int(gy + gh - 35 - (gh - 75) * (0.12 + 0.85 * (px ** 1.9)))
                pts_ind.append((cx, iy))
                pts_art.append((cx, ay))
            draw.line(pts_ind, fill=C_CHARCOAL, width=3)
            draw.line(pts_art, fill=C_CHILI, width=5)
            draw.text((pts_art[-1][0] - 180, pts_art[-1][1] - 32), "HANDMADE AROMA × 100", fill=C_GOLD, font=f_mono_md)
            draw.text((pts_ind[-1][0] - 140, pts_ind[-1][1] + 8), "INDUSTRIAL FLATLINE", fill=C_CHARCOAL, font=f_mono_sm)

        draw.text((rx, 845), "CRAFTED BY HAND · SUNLIGHT · WHEAT · PATIENCE", fill=C_GOLD, font=f_mono_md)
        draw.text((rx, 885), "一碗好面，值得用30秒看懂双手留下的温度。", fill=C_CREAM, font=f_cn_md)
        if st > 0.8:
            draw_craft_stamp(canvas, rx + 560, 825, "壹碗好面", "100% HUMAN MADE", color=C_CHILI, angle=-5)

    # 叠加自然胶片微颗粒
    arr = np.array(canvas, dtype=np.int16)
    grain = GRAIN_POOL[int(t * FPS) % 16]
    return np.clip(arr + grain, 0, 255).astype(np.uint8)


# ==========================================================
# 模块五：音画混音合成、渲染导出与自检机制 (Review Loop)
# ==========================================================
def build_editorial_noodle_vlog():
    bgm_file = generate_craft_bgm("craft_editorial_bgm.wav", duration=DURATION)
    vault = MediaVault()

    print("🎬 正在按照《面粉的物理学》8幕瑞士网格策划案逐帧渲染...")
    video_clip = VideoClip(lambda t: render_editorial_frame(t, vault), duration=DURATION)

    bgm_clip = AudioFileClip(bgm_file).subclip(0, DURATION)
    tracks = [bgm_clip]

    if vault.vid is not None and vault.vid.audio is not None:
        knead_audio = (vault.vid.audio
                       .subclip(0, min(6.0, vault.vid.duration))
                       .set_start(3.6)
                       .volumex(0.55)
                       .audio_fadein(0.3)
                       .audio_fadeout(0.3))
        tracks.append(knead_audio)

    final_video = video_clip.set_audio(CompositeAudioClip(tracks))

    output_name = "physics_of_gluten_editorial_30s.mp4"
    print(f"🚀 正在编码输出 1080P 杂志级 Video-as-Code 成片: {output_name} ...")
    final_video.write_videofile(
        output_name,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        bitrate="10000k",
        preset="medium",
        threads=4
    )
    print("✨ 视频渲染完成！")

    # 执行 claude-motion 的 review-loop：生成 4x2 时间戳网格联络图 (Contact Sheet)
    print("🔍 正在生成 claude-motion 视觉自检网格联络图 (Contact Sheet)...")
    generate_contact_sheet(output_name, "physics_of_gluten_contact_sheet.png")
    print("✅ 自检联络图已生成: physics_of_gluten_contact_sheet.png")


def generate_contact_sheet(video_path, sheet_path):
    """根据 review-loop 规范，抽取各幕关键节点拼接成 4x2 联络图以供视觉走查"""
    clip = VideoFileClip(video_path)
    sample_times = [1.8, 6.0, 11.4, 14.7, 18.0, 21.3, 24.6, 28.5]
    cols, rows = 4, 2
    tile_w, tile_h = 480, 270
    sheet = Image.new("RGB", (tile_w * cols, tile_h * rows), (20, 20, 20))
    s_draw = ImageDraw.Draw(sheet)
    f_stamp = get_font("mono", 16)

    for idx, st in enumerate(sample_times):
        r = idx // cols
        c = idx % cols
        frame = clip.get_frame(st)
        im = Image.fromarray(frame).resize((tile_w, tile_h), Image.Resampling.LANCZOS)
        x = c * tile_w
        y = r * tile_h
        sheet.paste(im, (x, y))
        s_draw.rectangle([x, y, x + tile_w, y + tile_h], outline=(50, 50, 50), width=1)
        # 标上时间戳
        s_draw.rectangle([x + 8, y + 8, x + 130, y + 32], fill=(0, 0, 0, 180))
        s_draw.text((x + 14, y + 10), f"ACT {idx+1:02d} // {st:.1f}s", fill=(255, 255, 255), font=f_stamp)

    clip.close()
    sheet.save(sheet_path)

if __name__ == "__main__":
    build_editorial_noodle_vlog()
