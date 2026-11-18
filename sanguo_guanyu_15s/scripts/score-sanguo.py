import os
import sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln

SAMPLE_RATE = 48000
TOTAL_FRAMES = 900
FPS = 60
DURATION_SEC = TOTAL_FRAMES / FPS # 15.000s
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION_SEC)

def load_wav(path):
    data, rate = sf.read(path)
    if rate != SAMPLE_RATE:
        # Simple resample via linear interpolation if needed
        num_target = int(len(data) * SAMPLE_RATE / rate)
        if data.ndim == 1:
            data = np.interp(np.linspace(0, len(data), num_target), np.arange(len(data)), data)
        else:
            chans = [np.interp(np.linspace(0, len(data), num_target), np.arange(len(data)), data[:, c]) for c in range(data.shape[1])]
            data = np.column_stack(chans)
    if data.ndim == 1:
        data = np.column_stack([data, data]) # mono to stereo
    return data

def main():
    print("[1] Loading BGM: public/audio/bgm_15s.wav...")
    bgm_path = "public/audio/bgm_15s.wav"
    if not os.path.exists(bgm_path):
        print("ERROR: BGM file missing:", bgm_path)
        sys.exit(1)

    bgm = load_wav(bgm_path)
    if len(bgm) < TOTAL_SAMPLES:
        # Pad with silence if short
        pad = np.zeros((TOTAL_SAMPLES - len(bgm), 2))
        bgm = np.vstack([bgm, pad])
    else:
        bgm = bgm[:TOTAL_SAMPLES]

    # Master mix canvas
    mix = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float64)
    # Add BGM at gentle bed gain (-6 dB)
    bgm_gain = 0.55
    mix += bgm * bgm_gain

    # Audio cue schedule
    # frame: relative to 60fps
    cues = [
        # Act 1
        (15, "audio/kit/whoosh-short_1.wav", 0.7),
        (30, "audio/kit/hit_1.wav", 0.85),
        (60, "audio/kit/snap_1.wav", 0.6),

        # Act 2
        (180, "audio/kit/whoosh-long_1.wav", 0.65),
        (200, "audio/kit/tick-crisp_1.wav", 0.5),
        (215, "audio/kit/tick-crisp_2.wav", 0.5),
        (230, "audio/kit/pop_1.wav", 0.6),
        (250, "audio/kit/tick-crisp_3.wav", 0.5),
        (270, "audio/kit/click-confirm_1.wav", 0.8),
        (300, "audio/kit/tock_1.wav", 0.65),
        (320, "audio/kit/tock_2.wav", 0.65),
        (360, "audio/kit/drop_1.wav", 0.8),

        # Act 3
        (420, "audio/kit/whoosh-long_1.wav", 0.75),
        (480, "audio/kit/whoosh-short_2.wav", 0.85),
        (480, "audio/kit/hit_2.wav", 0.9),
        (570, "audio/kit/hit_3.wav", 0.95),
        (570, "audio/kit/drop_1.wav", 0.75),
        (630, "audio/kit/whoosh-long_2.wav", 0.8),
        (660, "audio/kit/hit_1.wav", 1.0),
        (660, "audio/kit/whoosh-short_3.wav", 0.9),

        # Act 4
        (810, "audio/kit/hit_2.wav", 1.0),
        (810, "audio/kit/drop_1.wav", 0.85),
        (850, "audio/kit/bell_G5.wav", 0.7),
        (870, "audio/kit/bell_D5.wav", 0.6),
    ]

    print(f"[2] Overlaying {len(cues)} procedural earshot sound cues...")
    for frame, wav_file, gain in cues:
        if not os.path.exists(wav_file):
            print("Warning: cue file not found:", wav_file)
            continue
        sfx = load_wav(wav_file)
        start_samp = int((frame / FPS) * SAMPLE_RATE)
        end_samp = min(TOTAL_SAMPLES, start_samp + len(sfx))
        sfx_len = end_samp - start_samp
        if sfx_len > 0:
            mix[start_samp:end_samp] += sfx[:sfx_len] * gain

    print("[3] Mastering audio to BS.1770 -14.0 LUFS...")
    # Measure integrated loudness
    meter = pyln.Meter(SAMPLE_RATE)
    current_lufs = meter.integrated_loudness(mix)
    print(f"    Raw Mix Loudness: {current_lufs:.2f} LUFS")

    # Target: -14.0 LUFS (cinematic game trailer standard)
    target_lufs = -14.0
    normalized = pyln.normalize.loudness(mix, current_lufs, target_lufs)

    # True Peak Limiter (ensure TP <= -1.5 dBTP)
    max_peak = np.max(np.abs(normalized))
    max_allowed = 10 ** (-1.5 / 20.0) # approx 0.841
    if max_peak > max_allowed:
        print(f"    Applying soft ceiling limiter: peak {max_peak:.3f} -> {max_allowed:.3f}")
        normalized = normalized * (max_allowed / max_peak)

    final_lufs = meter.integrated_loudness(normalized)
    final_tp = 20 * np.log10(np.max(np.abs(normalized)))
    print(f"    Mastered Loudness: {final_lufs:.2f} LUFS, True Peak: {final_tp:.2f} dBTP")

    out_path = "public/audio/soundtrack.wav"
    sf.write(out_path, normalized.astype(np.float32), SAMPLE_RATE)
    print(f"[4] Exported soundtrack successfully: {out_path} ({len(normalized)/SAMPLE_RATE:.3f}s)")

if __name__ == "__main__":
    main()
