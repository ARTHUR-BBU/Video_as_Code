import math
import random

FPS = 60.0
DT = 1.0 / FPS
Kp, Ki = 6.0, 0.8
integral, servo_rate = 0.0, 1.0
t_audio, t_video = 0.0, 0.0
errors = []
deltas = []
random.seed(42)

for k in range(900):
    t_audio = k * DT + random.gauss(0, 0.00002)
    if k == 0:
        t_video = 0.0
    else:
        # Video media time advances proportionally to playbackRate: dt_media = dt_wall * servo_rate
        t_video += (DT * servo_rate) + random.gauss(0, 0.0003)
        
    e_s = t_video - t_audio
    integral = max(-0.02, min(0.02, integral + e_s * DT))
    servo_rate = max(0.95, min(1.05, 1.0 - Kp * e_s - Ki * integral))
    
    errors.append(e_s * 1000.0)
    fc = int(round(t_audio * FPS))
    fv = int(round(t_video * FPS))
    deltas.append(fc - fv)

rms = math.sqrt(sum(x**2 for x in errors) / 900)
print(f"Max |e|   : {max(abs(x) for x in errors):.3f} ms (Target: < 8.0ms)")
print(f"RMS Jitter: {rms:.3f} ms (Target: <= 3.5ms)")
print(f"Max |ΔF|  : {max(abs(x) for x in deltas)} frames (Target: == 0)")
