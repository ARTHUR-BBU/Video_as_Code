import os
import wave
import struct
import math
import subprocess

def create_sync_audio(output_wav="sync_audio_48k.wav", sample_rate=48000, duration_s=15.0):
    total_samples = int(sample_rate * duration_s)
    pulse_samples = int(sample_rate * (2.0 / 60.0))
    
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

def create_fast_sync_video(output_mp4="sync_test_1080p60_15s.mp4"):
    audio_wav = "sync_audio_48k.wav"
    create_sync_audio(audio_wav)
    
    font_path = "C\\:/Windows/Fonts/consola.ttf"
    vf = (
        f"drawtext=fontfile='{font_path}':"
        "text='SMPTE %{pts\\:hms}  |  F%{eif\\:n\\:d\\:3}':"
        "x=w-tw-60:y=60:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.85:boxborderw=16"
    )
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=15:size=1920x1080:rate=60",
        "-i", audio_wav,
        "-vf", vf,
        "-c:v", "libx264",
        "-tune", "fastdecode",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-g", "12",
        "-keyint_min", "12",
        "-sc_threshold", "0",
        "-r", "60",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-t", "15.0",
        output_mp4
    ]
    
    print("Encoding with -tune fastdecode...")
    subprocess.run(cmd, check=True)
    print(f"[OK] Fast-decode video created: {output_mp4}")
    if os.path.exists(audio_wav):
        os.remove(audio_wav)

if __name__ == "__main__":
    os.chdir(r"F:\Video_as_Code\tests\tc_sync_01")
    create_fast_sync_video()
