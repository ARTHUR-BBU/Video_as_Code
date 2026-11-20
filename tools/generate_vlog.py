import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
from PIL import Image, ImageDraw, ImageFont

# Compatibility patch for MoviePy 1.0.3 with Pillow >= 10.0
if not hasattr(Image, "ANTIALIAS"):
    Image.ANTIALIAS = Image.Resampling.LANCZOS

from moviepy.editor import (
    VideoFileClip, ImageClip, AudioFileClip, CompositeAudioClip,
    concatenate_videoclips
)

# ==========================================
# 常量与全局资源初始化
# ==========================================
TARGET_W, TARGET_H = 1920, 1080
BAR_H = 110  # 上下黑边高度，打造 2.35:1 电影宽银幕比例

def init_fonts():
    """跨平台优雅加载等宽时间戳字体与中文字幕字体"""
    font_mono = None
    font_sub = None
    
    # 候选字体列表 (Windows, macOS, Linux)
    mono_paths = [
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/cour.ttf",
        "/System/Library/Fonts/Courier.dfont",
        "/Library/Fonts/Courier New.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
    ]
    sub_paths = [
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/msyhl.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "/System/Library/Fonts/PingFang.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
    ]
    
    for p in mono_paths:
        if os.path.exists(p):
            try:
                font_mono = ImageFont.truetype(p, 20)
                break
            except Exception:
                pass
                
    for p in sub_paths:
        if os.path.exists(p):
            try:
                font_sub = ImageFont.truetype(p, 26)
                break
            except Exception:
                pass

    if font_mono is None:
        try:
            font_mono = ImageFont.truetype("consola.ttf", 20)
        except Exception:
            font_mono = ImageFont.load_default()

    if font_sub is None:
        try:
            font_sub = ImageFont.truetype("msyh.ttc", 26)
        except Exception:
            font_sub = ImageFont.load_default()

    return font_mono, font_sub

FONT_MONO, FONT_SUB = init_fonts()

# 预计算 256 阶高精度暖调胶片 S 曲线查找表 (LUT)，加速单帧渲染 100 倍且绝不高光过曝
def build_cinematic_lut():
    x = np.arange(256, dtype=np.float32)
    # 暖阳光影通道微调
    r = np.clip(x * 1.03 + 3, 0, 255) / 255.0
    g = np.clip(x * 1.01 + 1, 0, 255) / 255.0
    b = np.clip(x * 0.96 + 4, 0, 255) / 255.0

    # 规范化 Sigmoid / S 曲线 (保全高光与暗部细节，保留胶片空气感)
    alpha = 2.0
    denom = np.arctan(alpha * 0.5)
    s_curve = lambda ch: np.clip(0.5 + 0.5 * (np.arctan(alpha * (ch - 0.5)) / denom), 0, 1)

    lut_r = (s_curve(r) * 255.0).astype(np.uint8)
    lut_g = (s_curve(g) * 255.0).astype(np.uint8)
    lut_b = (s_curve(b) * 255.0).astype(np.uint8)
    return lut_r, lut_g, lut_b

LUT_R, LUT_G, LUT_B = build_cinematic_lut()


# ==========================================
# 第一部分：用代码合成高级感 Ambient Lo-Fi BGM
# ==========================================
def generate_bgm(filename="ambient_bgm.wav", duration=30.0, sr=44100):
    print("🎵 正在通过数学波形合成 30 秒高级感 Lo-Fi BGM...")
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    audio = np.zeros((len(t), 2), dtype=np.float32)

    # 1. 黑胶环境底噪与温暖空气感 (Filtered Pink-ish Noise)
    noise = np.random.normal(0, 0.003, (len(t), 2))
    b, a = butter(2, 800 / (sr / 2), btype='low')
    vinyl_warmth = lfilter(b, a, noise, axis=0)
    audio += vinyl_warmth

    # 2. 和弦进行：Fmaj7 -> Em7 -> Dm7 -> Cmaj7 (温暖、治愈、午后感)
    chords = [
        [174.61, 220.00, 261.63, 329.63, 392.00],  # Fmaj9
        [164.81, 196.00, 246.94, 293.66, 392.00],  # Em7
        [146.83, 174.61, 220.00, 261.63, 329.63],  # Dm9
        [130.81, 164.81, 196.00, 246.94, 293.66],  # Cmaj9
    ]

    chord_dur = 3.75  # 75 BPM 下每小节 3.75 秒，30秒正好 8 个小节循环 2 遍
    num_chords = int(duration / chord_dur)

    for i in range(num_chords):
        chord = chords[i % len(chords)]
        start_idx = int(i * chord_dur * sr)
        end_idx = min(int((i + 1) * chord_dur * sr), len(t))
        seg_t = np.linspace(0, (end_idx - start_idx) / sr, end_idx - start_idx, endpoint=False)

        # ADSR 包络：柔和渐入，长尾自然衰减
        attack = np.clip(seg_t / 0.4, 0, 1)
        decay = np.exp(-seg_t * 0.75)
        env = attack * decay

        chord_wave_L = np.zeros_like(seg_t)
        chord_wave_R = np.zeros_like(seg_t)

        # 琶音微延迟与立体声声场扩展
        for idx, freq in enumerate(chord):
            # 加入轻微磁带颤音 (Tape Wow/Flutter)
            vibrato = np.sin(2 * np.pi * 4.5 * seg_t) * 0.0015
            f_mod = freq * (1 + vibrato)

            # 基波 + 偶次谐波模拟 Rhodes 电钢琴质感
            note_wave = (
                0.65 * np.sin(2 * np.pi * f_mod * seg_t) +
                0.20 * np.sin(2 * np.pi * (f_mod * 2) * seg_t) * np.exp(-seg_t * 2.0) +
                0.05 * np.sin(2 * np.pi * (f_mod * 3) * seg_t) * np.exp(-seg_t * 4.0)
            )
            # 琶音错开触发时间 (修复 idx=0 时切片长度为 0 的边界情况)
            delay_samples = int(idx * 0.06 * sr)
            if 0 < delay_samples < len(note_wave):
                note_wave = np.pad(note_wave[:-delay_samples], (delay_samples, 0), 'constant')

            pan = 0.3 + 0.4 * (idx / len(chord))  # 立体声分布
            chord_wave_L += note_wave * (1 - pan)
            chord_wave_R += note_wave * pan

        # 叠加温暖的 Sub-bass 根音
        bass_freq = chord[0] / 2.0
        bass_wave = np.sin(2 * np.pi * bass_freq * seg_t) * np.exp(-seg_t * 0.9) * 0.4

        audio[start_idx:end_idx, 0] += (chord_wave_L * 0.12 + bass_wave) * env
        audio[start_idx:end_idx, 1] += (chord_wave_R * 0.12 + bass_wave) * env

    # 3. 轻柔的心跳感低频律动 (Lo-Fi Soft Pulse)
    beat_interval = 3.75 / 2.0
    for b_idx in range(int(duration / beat_interval)):
        b_start = int(b_idx * beat_interval * sr)
        b_len = int(0.25 * sr)
        if b_start + b_len < len(t):
            bt = np.linspace(0, 0.25, b_len)
            # 频率从 110Hz 快速滑落到 45Hz 的柔和底鼓
            freq_sweep = 45 + 65 * np.exp(-bt * 30)
            kick = np.sin(2 * np.pi * freq_sweep * bt) * np.exp(-bt * 12) * 0.22
            audio[b_start:b_start + b_len, 0] += kick
            audio[b_start:b_start + b_len, 1] += kick

    # 4. 整体低通滤波（营造水下/午后阳光的朦胧高级感）与淡入淡出
    b_master, a_master = butter(2, 2800 / (sr / 2), btype='low')
    audio = lfilter(b_master, a_master, audio, axis=0)

    fade_in = np.linspace(0, 1, int(2.0 * sr))[:, None]
    fade_out = np.linspace(1, 0, int(3.0 * sr))[:, None]
    audio[:len(fade_in)] *= fade_in
    audio[-len(fade_out):] *= fade_out

    # 归一化输出
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val * 0.85

    wavfile.write(filename, sr, (audio * 32767).astype(np.int16))
    print(f"✅ BGM 合成完毕: {filename}")
    return filename


# ==========================================
# 第二部分：电影感调色、宽银幕遮幅与极简字幕
# ==========================================
def apply_cinematic_grade_and_overlay(frame, global_t, subtitle_text="", step_code=""):
    """对单帧画面进行暖调胶片调色、2.35:1遮幅、录制红点与极简排版"""
    # 1. 采用 LUT 极速调色
    img = np.empty_like(frame)
    img[:, :, 0] = LUT_R[frame[:, :, 0]]
    img[:, :, 1] = LUT_G[frame[:, :, 1]]
    img[:, :, 2] = LUT_B[frame[:, :, 2]]

    # 2. 绘制 2.35:1 电影遮幅黑边
    img[:BAR_H, :, :] = 0
    img[TARGET_H - BAR_H:, :, :] = 0

    # 3. 使用 PIL 添加极简杂志感文字与电影时间戳
    pil_img = Image.fromarray(img)
    draw = ImageDraw.Draw(pil_img)

    # 左上角遮幅内：录制指示灯红点 + Video-as-Code 极简时间码
    draw.ellipse([(44, 48), (54, 58)], fill=(225, 45, 45))
    timecode_str = f"REC // 00:00:{int(global_t):02d}:{int((global_t % 1) * 24):02d}  |  {step_code}"
    draw.text((64, 42), timecode_str, fill=(160, 155, 145), font=FONT_MONO)

    # 右上角遮幅内：色温与光圈参数装饰
    draw.text((TARGET_W - 340, 42), "5600K  F/1.8  ISO 100", fill=(130, 125, 115), font=FONT_MONO)

    # 底部遮幅内：居中极简字幕
    if subtitle_text:
        bbox = draw.textbbox((0, 0), subtitle_text, font=FONT_SUB)
        tw = bbox[2] - bbox[0]
        draw.text(((TARGET_W - tw) // 2, TARGET_H - BAR_H + 36), subtitle_text, fill=(230, 225, 215), font=FONT_SUB)

    return np.array(pil_img)


def create_ken_burns_clip(img_path, duration, zoom_mode="in", subtitle="", step_code="", t_offset=0.0):
    """将静态图片转化为具有呼吸感推拉运镜的动态片段"""
    pil_orig = Image.open(img_path).convert("RGB")
    orig_w, orig_h = pil_orig.size
    target_ratio = TARGET_W / TARGET_H
    curr_ratio = orig_w / orig_h

    if curr_ratio > target_ratio:
        new_w = int(orig_h * target_ratio)
        left = (orig_w - new_w) // 2
        pil_crop = pil_orig.crop((left, 0, left + new_w, orig_h))
    else:
        new_h = int(orig_w / target_ratio)
        top = (orig_h - new_h) // 2
        pil_crop = pil_orig.crop((0, top, orig_w, top + new_h))

    base_w, base_h = int(TARGET_W * 1.12), int(TARGET_H * 1.12)
    pil_resized = pil_crop.resize((base_w, base_h), Image.Resampling.LANCZOS)
    base_arr = np.array(pil_resized)

    def make_frame(t):
        progress = t / duration
        if zoom_mode == "in":
            scale = 1.0 + 0.08 * progress
        else:
            scale = 1.08 - 0.08 * progress

        crop_w = int(TARGET_W / scale)
        crop_h = int(TARGET_H / scale)
        x1 = max(0, (base_w - crop_w) // 2)
        y1 = max(0, (base_h - crop_h) // 2)

        cropped = base_arr[y1:y1 + crop_h, x1:x1 + crop_w]
        frame_resized = np.array(Image.fromarray(cropped).resize((TARGET_W, TARGET_H), Image.Resampling.BILINEAR))
        return apply_cinematic_grade_and_overlay(frame_resized, t + t_offset, subtitle, step_code)

    return ImageClip(base_arr).set_make_frame(make_frame).set_duration(duration)


# ==========================================
# 第三部分：编排时间轴与渲染输出
# ==========================================
def build_vlog():
    bgm_file = generate_bgm("ambient_bgm.wav", duration=30.0)

    # 分镜脚本编排 (考虑 0.4s crossfade 重叠补偿)
    fade_dur = 0.4
    timeline_spec = [
        {"type": "img", "file": "image_9.png", "dur": 3.4, "zoom": "in",  "sub": "午后三点，阳光落在面团上 / Resting in sunlight", "code": "STEP_01: REST"},
        {"type": "vid", "file": "kneading.mp4","dur": 6.4, "zoom": "in",  "sub": "掌心的温度与筋道 / Rhythmic kneading",         "code": "STEP_02: KNEAD"},
        {"type": "img", "file": "image_7.png", "dur": 3.2, "zoom": "out", "sub": "轻撒薄粉，留住麦香 / Dusting flour",             "code": "STEP_03: DUST"},
        {"type": "img", "file": "image.png",   "dur": 3.6, "zoom": "in",  "sub": "木槌推开岁月 / Rolling flat",                   "code": "STEP_04: ROLL"},
        {"type": "img", "file": "image_2.png", "dur": 3.2, "zoom": "out", "sub": "细腻如绸的触感 / Smooth texture",               "code": "STEP_05: FEEL"},
        {"type": "img", "file": "image_8.png", "dur": 3.2, "zoom": "in",  "sub": "刀起刀落，宽窄由心 / Hand-cut strands",         "code": "STEP_06: SLICE"},
        {"type": "img", "file": "image_6.png", "dur": 3.2, "zoom": "out", "sub": "抖落浮粉，根根分明 / Loosening noodles",        "code": "STEP_07: SHAKE"},
        {"type": "img", "file": "image_5.png", "dur": 3.2, "zoom": "in",  "sub": "小锅慢炖，高汤翻滚 / Simmering broth",          "code": "STEP_08: SIMMER"},
        {"type": "img", "file": "image_4.png", "dur": 2.1, "zoom": "out", "sub": "切碎一抹清香 / Fresh coriander",                "code": "STEP_09: HERBS"},
        {"type": "img", "file": "image_3.png", "dur": 2.1, "zoom": "in",  "sub": "红油白芝麻，人间烟火 / Chili oil & sesame",     "code": "STEP_10: SOUL"},
    ]

    clips = []
    curr_time_offset = 0.0

    print("🎬 正在处理视觉分镜与电影感调色...")
    for idx, item in enumerate(timeline_spec):
        t_offset = curr_time_offset
        file_path = item["file"]
        
        # 兼容当前目录或'拉面'子目录
        if not os.path.exists(file_path):
            alt_path = os.path.join("拉面", file_path)
            if os.path.exists(alt_path):
                file_path = alt_path

        if item["type"] == "img":
            clip = create_ken_burns_clip(
                file_path,
                duration=item["dur"],
                zoom_mode=item["zoom"],
                subtitle=item["sub"],
                step_code=item["code"],
                t_offset=t_offset
            )
        else:
            # 处理揉面原视频片段：截取前 6.4 秒，居中裁剪至 1080p，保留 35% 环境揉面原声 (ASMR 质感)
            raw_vid = VideoFileClip(file_path).subclip(0, item["dur"])
            raw_vid = raw_vid.resize(width=TARGET_W)
            if raw_vid.h > TARGET_H:
                y_center = raw_vid.h // 2
                raw_vid = raw_vid.crop(y1=y_center - TARGET_H // 2, y2=y_center + TARGET_H // 2)
            else:
                raw_vid = raw_vid.resize((TARGET_W, TARGET_H))

            sub_text = item["sub"]
            code_text = item["code"]
            
            def make_vid_frame(gf, t, to=t_offset, s=sub_text, c=code_text):
                return apply_cinematic_grade_and_overlay(gf(t), t + to, s, c)

            clip = raw_vid.fl(make_vid_frame)
            if clip.audio is not None:
                clip = clip.volumex(0.35).audio_fadein(0.5).audio_fadeout(0.5)

        if idx > 0:
            clip = clip.crossfadein(fade_dur)
        clips.append(clip)
        curr_time_offset += (item["dur"] - fade_dur)

    # 拼接并应用交叉叠化转场
    final_video = concatenate_videoclips(clips, method="compose", padding=-fade_dur)
    final_video = final_video.subclip(0, 30.0).fadein(0.8).fadeout(1.2)

    # 混音：代码合成的 Lo-Fi BGM + 揉面片段的 ASMR 原声
    bgm_clip = AudioFileClip(bgm_file).subclip(0, 30.0)
    if final_video.audio is not None:
        final_audio = CompositeAudioClip([bgm_clip.volumex(0.85), final_video.audio])
    else:
        final_audio = bgm_clip

    final_video = final_video.set_audio(final_audio)

    output_name = "artisan_noodles_vlog_30s.mp4"
    print(f"🚀 正在渲染导出 30 秒高画质 Vlog: {output_name} ...")
    final_video.write_videofile(
        output_name,
        fps=24,                  # 24帧电影帧率
        codec="libx264",
        audio_codec="aac",
        bitrate="8000k",
        preset="medium",
        threads=4
    )
    print("✨ 制作完成！")

if __name__ == "__main__":
    build_vlog()
