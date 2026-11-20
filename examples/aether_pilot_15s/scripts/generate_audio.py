import numpy as np
import wave
import struct
import os

SAMPLE_RATE = 44100
DURATION = 15.0 # seconds
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

# Initialize stereo buffer
left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

t_all = np.linspace(0, DURATION, TOTAL_SAMPLES, endpoint=False)

def add_tone(start_t, dur, freq, amp=0.5, pan=0.0, decay=True):
    start_idx = int(start_t * SAMPLE_RATE)
    n_samples = int(dur * SAMPLE_RATE)
    end_idx = min(start_idx + n_samples, TOTAL_SAMPLES)
    actual_len = end_idx - start_idx
    if actual_len <= 0:
        return
    
    t = np.linspace(0, actual_len / SAMPLE_RATE, actual_len, endpoint=False)
    tone = np.sin(2 * np.pi * freq * t)
    
    if decay:
        env = np.exp(-t * (4.0 / dur))
    else:
        env = np.ones_like(t)
        # 10ms fade in/out
        fade_len = min(int(0.01 * SAMPLE_RATE), actual_len // 2)
        if fade_len > 0:
            env[:fade_len] = np.linspace(0, 1, fade_len)
            env[-fade_len:] = np.linspace(1, 0, fade_len)
            
    signal = tone * env * amp
    l_gain = np.cos((pan + 1) * np.pi / 4)
    r_gain = np.sin((pan + 1) * np.pi / 4)
    
    left[start_idx:end_idx] += signal * l_gain
    right[start_idx:end_idx] += signal * r_gain

def add_click(start_t, amp=0.4, pan=0.0, freq=3200):
    start_idx = int(start_t * SAMPLE_RATE)
    n_samples = int(0.015 * SAMPLE_RATE) # 15ms
    end_idx = min(start_idx + n_samples, TOTAL_SAMPLES)
    actual_len = end_idx - start_idx
    if actual_len <= 0:
        return
    t = np.linspace(0, actual_len / SAMPLE_RATE, actual_len, endpoint=False)
    tone = np.sin(2 * np.pi * freq * t) * np.exp(-t * 280)
    noise = (np.random.rand(actual_len) * 2 - 1) * np.exp(-t * 400)
    signal = (tone * 0.7 + noise * 0.3) * amp
    
    l_gain = np.cos((pan + 1) * np.pi / 4)
    r_gain = np.sin((pan + 1) * np.pi / 4)
    left[start_idx:end_idx] += signal * l_gain
    right[start_idx:end_idx] += signal * r_gain

def add_whoosh(start_t, dur, amp=0.3):
    start_idx = int(start_t * SAMPLE_RATE)
    n_samples = int(dur * SAMPLE_RATE)
    end_idx = min(start_idx + n_samples, TOTAL_SAMPLES)
    actual_len = end_idx - start_idx
    if actual_len <= 0:
        return
    t = np.linspace(0, actual_len / SAMPLE_RATE, actual_len, endpoint=False)
    noise = np.random.rand(actual_len) * 2 - 1
    # Swept filter simulation
    f_center = np.linspace(300, 3200, actual_len)
    phase = 2 * np.pi * np.cumsum(f_center) / SAMPLE_RATE
    carrier = np.sin(phase)
    env = np.sin(np.pi * (t / dur)) ** 2
    signal = noise * carrier * env * amp
    left[start_idx:end_idx] += signal * 0.8
    right[start_idx:end_idx] += signal * 0.8

# 1. Background Ambience Drone (f0 to f240)
drone_env = np.zeros(TOTAL_SAMPLES)
drone_samples = int(4.2 * SAMPLE_RATE)
drone_env[:drone_samples] = np.linspace(0.12, 0.15, drone_samples)
drone_env[drone_samples - int(0.4*SAMPLE_RATE):drone_samples] *= np.linspace(1, 0, int(0.4*SAMPLE_RATE))
drone = (np.sin(2 * np.pi * 54 * t_all) * 0.7 + np.sin(2 * np.pi * 108 * t_all) * 0.3) * drone_env
left += drone * 0.5
right += drone * 0.5

# Act 1 Clicks & Alerts
for click_t in [0.4, 0.8, 1.2, 1.6, 2.0, 2.4]:
    add_click(click_t, amp=0.25, pan=click_t * 0.3 - 0.3, freq=2800)

# Latency Alert Pulse (t = 2.0, 2.8)
add_tone(2.0, 0.35, 220, amp=0.35, pan=-0.2)
add_tone(2.1, 0.35, 440, amp=0.25, pan=-0.2)
add_tone(2.8, 0.35, 220, amp=0.35, pan=0.2)
add_tone(2.9, 0.35, 440, amp=0.25, pan=0.2)

# Whoosh transition to Act 2 (3.6s to 4.0s)
add_whoosh(3.6, 0.45, amp=0.45)

# Act 2 Entrance Impact (t = 4.0s)
add_tone(4.0, 0.6, 68, amp=0.65, pan=0.0) # Sub impact
add_click(4.0, amp=0.6, pan=0.0, freq=3800)

# Rapid Stepper Countdown Clicks (84.6ms down to 1.8ms)
stepper_times = np.linspace(4.3, 6.8, 22)
for i, st in enumerate(stepper_times):
    p = (i / 22) * 0.6 - 0.3
    add_click(st, amp=0.2 + (i/22)*0.15, pan=p, freq=3200 + i * 40)

# PAYOFF HIT on 1.8ms Lock (t = 7.5s / f450)
add_tone(7.5, 0.8, 55, amp=0.7, pan=0.0) # Deep Sub drop
add_tone(7.5, 1.2, 1280, amp=0.5, pan=0.0) # Optic crystal ping
add_tone(7.51, 1.0, 2560, amp=0.35, pan=0.0) # Upper overtone
add_click(7.5, amp=0.7, pan=0.0, freq=4500)

# Node Chime Arpeggio (Tokyo, Frankfurt, SFO, Singapore)
add_tone(8.0, 0.6, 740, amp=0.35, pan=-0.3)  # F# (Tokyo nrt-01)
add_tone(8.35, 0.6, 932, amp=0.35, pan=-0.1) # A# (Frankfurt fra-03)
add_tone(8.7, 0.6, 1108, amp=0.35, pan=0.1)  # C# (SFO sfo-02)
add_tone(9.05, 0.6, 1318, amp=0.38, pan=0.3) # E (Singapore sin-01)

# Transition to Act 3 (9.6s to 10.0s)
add_whoosh(9.6, 0.45, amp=0.35)

# Act 3 Brand Lockup Payoff (t = 10.0s)
add_tone(10.0, 1.5, 48, amp=0.75, pan=0.0)   # Deep Sub Resonance
add_tone(10.0, 3.5, 432, amp=0.5, pan=-0.1)  # Sacred A 432Hz
add_tone(10.0, 3.5, 648, amp=0.42, pan=0.1)  # Pure Fifth 648Hz
add_click(10.0, amp=0.55, pan=0.0, freq=4000)

# Normalize to -1.5 dBTP (approx peak 0.84)
max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
if max_val > 0:
    target_peak = 0.84
    gain = target_peak / max_val
    left *= gain
    right *= gain

# Write 16-bit PCM WAV
out_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio', 'soundtrack.wav')
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with wave.open(out_path, 'w') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    
    interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    interleaved[0::2] = np.clip(left * 32767, -32768, 32767).astype(np.int16)
    interleaved[1::2] = np.clip(right * 32767, -32768, 32767).astype(np.int16)
    
    wf.writeframes(interleaved.tobytes())

print(f"Generated soundtrack successfully: {out_path} ({TOTAL_SAMPLES} samples, {DURATION}s)")
