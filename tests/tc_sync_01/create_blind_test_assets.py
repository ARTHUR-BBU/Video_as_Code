import os
import wave
import struct
import math
import subprocess

TEST_DIR = r"F:\Video_as_Code\tests\tc_sync_01"

def create_audio_pulse(output_wav, fps, duration_s=15.0, sample_rate=48000):
    total_samples = int(sample_rate * duration_s)
    pulse_samples = int(sample_rate * (2.0 / fps))
    
    with wave.open(output_wav, "w") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        
        frames = bytearray()
        for i in range(total_samples):
            t = i / sample_rate
            sec_idx = int(t)
            time_in_sec = t - sec_idx
            sample_in_sec = int(time_in_sec * sample_rate)
            
            val = 0.02 * math.sin(2 * math.pi * 100 * t)
            if sample_in_sec < pulse_samples:
                val += 0.5 * math.sin(2 * math.pi * 1000 * t)
                
            sample_int = int(max(-1.0, min(1.0, val)) * 32767)
            frames.extend(struct.pack("<hh", sample_int, sample_int))
            
        wav.writeframes(frames)
    print(f"[OK] Audio created: {output_wav}")

def generate_blind_assets():
    os.makedirs(TEST_DIR, exist_ok=True)
    os.chdir(TEST_DIR)
    font_path = "C\\:/Windows/Fonts/consola.ttf"
    
    # 1. Blind Asset B: 24fps film rate, GOP=24 (long GOP), complex texture
    wav_24 = "sync_audio_24fps.wav"
    mp4_24 = "sync_test_complex_gop24_24fps_15s.mp4"
    create_audio_pulse(wav_24, fps=24.0)
    
    vf_24 = (
        f"drawtext=fontfile='{font_path}':"
        "text='24FPS BLIND | %{pts\\:hms} | F%{eif\\:n\\:d\\:3}':"
        "x=w-tw-60:y=60:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.85:boxborderw=16"
    )
    cmd_24 = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "mandelbrot=size=1920x1080:rate=24:maxiter=80",
        "-i", wav_24,
        "-vf", vf_24,
        "-c:v", "libx264",
        "-tune", "fastdecode",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-g", "24",
        "-keyint_min", "24",
        "-sc_threshold", "0",
        "-r", "24",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-t", "15.0",
        mp4_24
    ]
    print("Generating Blind Asset B (24fps, GOP=24)...")
    subprocess.run(cmd_24, check=True)
    if os.path.exists(wav_24): os.remove(wav_24)
    print(f"[OK] Created {mp4_24}")

    # 2. Blind Asset C: 30fps broadcast rate, GOP=6 (dense keyframes), high frequency
    wav_30 = "sync_audio_30fps.wav"
    mp4_30 = "sync_test_broadcast_gop6_30fps_15s.mp4"
    create_audio_pulse(wav_30, fps=30.0)
    
    vf_30 = (
        f"drawtext=fontfile='{font_path}':"
        "text='30FPS BLIND | %{pts\\:hms} | F%{eif\\:n\\:d\\:3}':"
        "x=w-tw-60:y=60:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.85:boxborderw=16"
    )
    cmd_30 = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "smptebars=size=1920x1080:rate=30",
        "-i", wav_30,
        "-vf", vf_30,
        "-c:v", "libx264",
        "-tune", "fastdecode",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-g", "6",
        "-keyint_min", "6",
        "-sc_threshold", "0",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-t", "15.0",
        mp4_30
    ]
    print("Generating Blind Asset C (30fps, GOP=6)...")
    subprocess.run(cmd_30, check=True)
    if os.path.exists(wav_30): os.remove(wav_30)
    print(f"[OK] Created {mp4_30}")

if __name__ == "__main__":
    generate_blind_assets()
