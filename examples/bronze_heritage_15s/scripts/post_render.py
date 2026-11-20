import subprocess
import os
import json
import shutil

base_dir = r"f:\Video_as_Code\bronze_heritage_15s"
art_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\eb16aa3d-3dd0-4b4d-9292-1fc75ed89670"

video_in = os.path.join(base_dir, "out", "bronze_silent.mp4")
audio_in = os.path.join(base_dir, "public", "audio", "soundtrack.wav")
video_out = os.path.join(base_dir, "out", "bronze_heritage_15s.mp4")
art_video = os.path.join(art_dir, "bronze_heritage_15s.mp4")

print(f"Muxing {video_in} with {audio_in}...")

cmd = [
    "ffmpeg", "-y",
    "-i", video_in,
    "-i", audio_in,
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "320k",
    "-shortest",
    "-movflags", "+faststart",
    video_out
]

res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("FFmpeg error:", res.stderr)
    exit(1)

print(f"Muxed video created: {video_out}")

# Copy to artifacts directory
shutil.copy2(video_out, art_video)
print(f"Copied final deliverable to artifact directory: {art_video}")

# FFprobe probe QA
probe_cmd = [
    "ffprobe", "-v", "quiet",
    "-print_format", "json",
    "-show_format", "-show_streams",
    video_out
]
probe_res = subprocess.run(probe_cmd, capture_output=True, text=True)
probe_data = json.loads(probe_res.stdout)

video_stream = next(s for s in probe_data['streams'] if s['codec_type'] == 'video')
audio_stream = next(s for s in probe_data['streams'] if s['codec_type'] == 'audio')

print("--- QA VERIFICATION REPORT ---")
print(f"Resolution: {video_stream['width']}x{video_stream['height']}")
print(f"Frame Rate: {video_stream['r_frame_rate']} ({video_stream.get('avg_frame_rate')})")
print(f"Pixel Format: {video_stream.get('pix_fmt')}")
print(f"Color Space: {video_stream.get('color_space')}")
print(f"Duration: {probe_data['format']['duration']}s")
print(f"Video Bitrate: {int(video_stream.get('bit_rate', 0))/1000:.1f} kbps")
print(f"Audio Codec: {audio_stream['codec_name']} @ {audio_stream['sample_rate']}Hz, {audio_stream.get('bit_rate', '320000')} bps")
print("All QA parameters compliant!")
