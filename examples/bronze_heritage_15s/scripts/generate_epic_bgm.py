import numpy as np
import wave
import struct
import os

SAMPLE_RATE = 44100
DURATION = 15.0 # seconds
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

t_all = np.linspace(0, DURATION, TOTAL_SAMPLES, endpoint=False)

def add_bronze_bell(start_t, dur, f0, amp=0.6, pan=0.0):
    start_idx = int(start_t * SAMPLE_RATE)
    n_samples = int(dur * SAMPLE_RATE)
    end_idx = min(start_idx + n_samples, TOTAL_SAMPLES)
    L = end_idx - start_idx
    if L <= 0:
        return
    t = np.linspace(0, L / SAMPLE_RATE, L, endpoint=False)
    
    # Ancient Chinese Bianzhong dual-tone acoustic model
    # Strike transient + two fundamental strike modes + non-harmonic brass modes
    transient = (np.random.rand(L) * 2 - 1) * np.exp(-t * 220) * 0.4
    
    # Two strike frequencies (sui & gu)
    f1 = f0
    f2 = f0 * 1.25 # Minor third dual-tone interval
    
    mode1 = np.sin(2 * np.pi * f1 * t) * np.exp(-t * (2.2 / dur))
    mode2 = np.sin(2 * np.pi * f2 * t) * np.exp(-t * (2.6 / dur)) * 0.75
    mode3 = np.sin(2 * np.pi * (f0 * 2.82) * t) * np.exp(-t * (4.5 / dur)) * 0.45
    mode4 = np.sin(2 * np.pi * (f0 * 4.41) * t) * np.exp(-t * (6.0 / dur)) * 0.3
    mode5 = np.sin(2 * np.pi * (f0 * 6.78) * t) * np.exp(-t * (9.0 / dur)) * 0.2
    
    # Metallic shimmer ring-mod
    shimmer = 1.0 + 0.15 * np.sin(2 * np.pi * 7.5 * t)
    
    sig = (transient + (mode1 + mode2 + mode3 + mode4 + mode5) * shimmer) * amp
    l_gain = np.cos((pan + 1) * np.pi / 4)
    r_gain = np.sin((pan + 1) * np.pi / 4)
    
    left[start_idx:end_idx] += sig * l_gain
    right[start_idx:end_idx] += sig * r_gain

def add_war_drum(start_t, amp=0.8, pan=0.0, f_start=85, f_end=42):
    start_idx = int(start_t * SAMPLE_RATE)
    dur = 0.9
    n_samples = int(dur * SAMPLE_RATE)
    end_idx = min(start_idx + n_samples, TOTAL_SAMPLES)
    L = end_idx - start_idx
    if L <= 0:
        return
    t = np.linspace(0, L / SAMPLE_RATE, L, endpoint=False)
    
    # Frequency drop (pitch envelope)
    freq = f_end + (f_start - f_end) * np.exp(-t * 18)
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    body = np.sin(phase) * np.exp(-t * 3.8)
    
    # Sub boom
    sub = np.sin(2 * np.pi * 42 * t) * np.exp(-t * 2.5) * 0.6
    
    # Stick slap transient
    slap = (np.random.rand(L) * 2 - 1) * np.exp(-t * 120) * 0.35
    
    sig = (body + sub + slap) * amp
    l_gain = np.cos((pan + 1) * np.pi / 4)
    r_gain = np.sin((pan + 1) * np.pi / 4)
    left[start_idx:end_idx] += sig * l_gain
    right[start_idx:end_idx] += sig * r_gain

def add_brass_horn(start_t, dur, f0, amp=0.5, pan=0.0, swell=True):
    start_idx = int(start_t * SAMPLE_RATE)
    n_samples = int(dur * SAMPLE_RATE)
    end_idx = min(start_idx + n_samples, TOTAL_SAMPLES)
    L = end_idx - start_idx
    if L <= 0:
        return
    t = np.linspace(0, L / SAMPLE_RATE, L, endpoint=False)
    
    # Rich brass harmonics (sawtooth approximation)
    sig = np.zeros(L, dtype=np.float32)
    for h in range(1, 9):
        h_gain = (1.0 / (h ** 0.85))
        sig += np.sin(2 * np.pi * (f0 * h) * t) * h_gain
    
    # Dynamic envelope with brass swell
    if swell:
        env = (np.sin(np.pi * (t / dur)) ** 1.4)
    else:
        env = np.ones(L)
        fade_len = min(int(0.08 * SAMPLE_RATE), L // 2)
        if fade_len > 0:
            env[:fade_len] = np.linspace(0, 1, fade_len)
            env[-fade_len:] = np.linspace(1, 0, fade_len)
            
    signal = sig * env * amp * 0.25
    l_gain = np.cos((pan + 1) * np.pi / 4)
    r_gain = np.sin((pan + 1) * np.pi / 4)
    left[start_idx:end_idx] += signal * l_gain
    right[start_idx:end_idx] += signal * r_gain

def add_gong(start_t, dur=3.5, amp=0.5):
    start_idx = int(start_t * SAMPLE_RATE)
    n_samples = int(dur * SAMPLE_RATE)
    end_idx = min(start_idx + n_samples, TOTAL_SAMPLES)
    L = end_idx - start_idx
    if L <= 0:
        return
    t = np.linspace(0, L / SAMPLE_RATE, L, endpoint=False)
    
    # Dense inharmonic metallic cluster
    sig = np.zeros(L, dtype=np.float32)
    freqs = [124, 189, 271, 388, 512, 734, 1024, 1420]
    for i, f in enumerate(freqs):
        sig += np.sin(2 * np.pi * f * t) * np.exp(-t * (1.2 + i * 0.2)) * (1.0 / (i + 1))
    
    sig += (np.random.rand(L) * 2 - 1) * np.exp(-t * 8) * 0.15
    sig *= amp
    left[start_idx:end_idx] += sig * 0.8
    right[start_idx:end_idx] += sig * 0.8

print("Synthesizing Epic Cinematic Orchestral Score...")

# --- ACT 1: 鸿蒙太初，吉金初铸 (0.0s - 4.5s) ---
# Deep Low Brass Drone (D2 = 73.4Hz + A2 = 110Hz)
add_brass_horn(0.0, 4.5, 73.4, amp=0.45, pan=-0.2, swell=False)
add_brass_horn(0.0, 4.5, 110.0, amp=0.35, pan=0.2, swell=False)

# Ceremonial War Drum opening hits
add_war_drum(0.1, amp=0.85, pan=-0.1)
add_war_drum(1.5, amp=0.7, pan=0.1)
add_war_drum(3.0, amp=0.8, pan=-0.15)
add_war_drum(3.75, amp=0.85, pan=0.15)

# Ancient Bronze Bell opening tolls
add_bronze_bell(0.15, 3.8, 146.8, amp=0.6, pan=-0.3) # D3 Bell
add_bronze_bell(1.8, 3.2, 220.0, amp=0.55, pan=0.3)  # A3 Bell

# Transition riser to Act 2 (3.8s to 4.5s)
add_gong(3.9, dur=2.5, amp=0.4)

# --- ACT 2: 礼乐鼎盛，天命昭彰 (4.5s - 10.5s) ---
# Monumental Impact at Act 2 Entry (t = 4.5s)
add_war_drum(4.5, amp=0.95, pan=0.0)
add_bronze_bell(4.5, 4.8, 110.0, amp=0.75, pan=0.0) # Great Zhong Bell

# Low Brass Melodic Arc (Sacred Pentatonic: D2 -> F2 -> G2 -> A2)
add_brass_horn(4.5, 2.5, 73.4, amp=0.55, pan=-0.25)
add_brass_horn(4.5, 2.5, 146.8, amp=0.45, pan=0.25)
add_brass_horn(6.8, 2.5, 110.0, amp=0.6, pan=-0.2)
add_brass_horn(6.8, 2.5, 164.8, amp=0.5, pan=0.2)

# Accelerating Ceremonial Drum Cadence
drum_beats = [4.5, 5.5, 6.5, 7.5, 8.25, 9.0, 9.5, 9.8, 10.1, 10.3]
for db in drum_beats:
    pan = (db % 2) * 0.4 - 0.2
    add_war_drum(db, amp=0.75 + (db - 4.5) * 0.03, pan=pan)

# Interlocking Bronze Bell Melodic Sequence (f0: 220, 261, 293, 329, 392, 440)
add_bronze_bell(5.5, 3.0, 220.0, amp=0.5, pan=-0.25) # A3
add_bronze_bell(6.8, 3.0, 293.6, amp=0.55, pan=0.25) # D4
add_bronze_bell(8.0, 2.8, 329.6, amp=0.55, pan=-0.15) # E4
add_bronze_bell(9.0, 2.6, 440.0, amp=0.6, pan=0.15)   # A4

# Pre-climax gong & sub build (t = 9.8s to 10.5s)
add_gong(9.8, dur=3.5, amp=0.6)

# --- ACT 3: 国之重器，鼎立千秋 (10.5s - 15.0s) ---
# CLIMAX MONUMENTAL HIT (t = 10.5s)
# Dual War Drums + Great Cauldron Gong + Resonant Great Bell
add_war_drum(10.5, amp=1.0, pan=-0.15, f_start=95, f_end=38)
add_war_drum(10.52, amp=0.9, pan=0.15, f_start=90, f_end=35)
add_bronze_bell(10.5, 4.5, 73.4, amp=0.85, pan=0.0) # Colossal 73Hz Bell
add_bronze_bell(10.52, 4.2, 146.8, amp=0.7, pan=-0.2)
add_gong(10.5, dur=4.5, amp=0.7)

# Monumental Full Brass Chord (D1 sub 36.7Hz + D2 + A2 + D3 + F#3)
add_brass_horn(10.5, 4.4, 36.7, amp=0.7, pan=0.0, swell=False)
add_brass_horn(10.5, 4.4, 73.4, amp=0.65, pan=-0.2, swell=False)
add_brass_horn(10.5, 4.4, 110.0, amp=0.6, pan=0.2, swell=False)
add_brass_horn(10.5, 4.4, 146.8, amp=0.55, pan=-0.1, swell=False)
add_brass_horn(10.5, 4.4, 185.0, amp=0.5, pan=0.1, swell=False)

# Echoing chime decay on the golden chord
add_bronze_bell(12.0, 2.8, 293.6, amp=0.4, pan=-0.2)
add_bronze_bell(13.0, 2.0, 440.0, amp=0.35, pan=0.2)

# Normalization to -1.5 dBTP (target peak = 0.84)
max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
if max_val > 0:
    target_peak = 0.84
    gain = target_peak / max_val
    left *= gain
    right *= gain
    print(f"Normalized with gain {gain:.3f} (Max peak was {max_val:.3f})")

out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(out_dir, exist_ok=True)
out_wav = os.path.join(out_dir, 'soundtrack.wav')

with wave.open(out_wav, 'w') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    
    interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    interleaved[0::2] = np.clip(left * 32767, -32768, 32767).astype(np.int16)
    interleaved[1::2] = np.clip(right * 32767, -32768, 32767).astype(np.int16)
    
    wf.writeframes(interleaved.tobytes())

print(f"Epic BGM Generated: {out_wav} ({TOTAL_SAMPLES} samples, 15.0s)")
