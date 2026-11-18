import os
import sys
import json
import csv
import subprocess
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 9725
SERVER_DIR = r"F:\Video_as_Code\tests\tc_sync_01"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

benchmark_completed = threading.Event()
benchmark_results = {}

class BenchmarkServerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SERVER_DIR, **kwargs)

    def do_POST(self):
        if self.path == "/api/submit_results":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))
            
            global benchmark_results
            benchmark_results = data
            
            # Write CSV
            csv_path = os.path.join(SERVER_DIR, "tc_sync_01_telemetry_900f.csv")
            records = data.get("telemetryRecords", [])
            if records:
                with open(csv_path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=["frame", "t_audio_s", "t_video_pts_s", "e_t_ms", "delta_frame", "servo_rate", "gt_match"])
                    writer.writeheader()
                    for r in records:
                        writer.writerow(r)
                print(f"[OK] Saved CSV: {csv_path} ({len(records)} rows)")
                
            # Write Summary JSON
            summary_path = os.path.join(SERVER_DIR, "tc_sync_01_summary.json")
            with open(summary_path, "w", encoding="utf-8") as f:
                json.dump(data.get("summary", {}), f, indent=2)
            print(f"[OK] Saved Summary JSON: {summary_path}")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"SAVED"}')
            
            benchmark_completed.set()
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        # Silence standard HTTP access logging to keep terminal clean
        pass

def run_server(httpd):
    httpd.serve_forever()

def main():
    os.chdir(SERVER_DIR)
    
    # 1. Start Server
    httpd = HTTPServer(("127.0.0.1", PORT), BenchmarkServerHandler)
    server_thread = threading.Thread(target=run_server, args=(httpd,), daemon=True)
    server_thread.start()
    print(f"[1/3] Local benchmark HTTP server listening on http://127.0.0.1:{PORT}")
    
    # 2. Launch Chrome
    chrome_cmd = [
        CHROME_PATH,
        "--headless=new",
        "--autoplay-policy=no-user-gesture-required",
        "--use-gl=angle",
        "--use-angle=d3d11",
        "--user-data-dir=C:\\Users\\LENOVO\\AppData\\Local\\Temp\\chrome_sync_profile",
        "--window-size=1280,720",
        f"http://127.0.0.1:{PORT}/harness.html"
    ]
    
    print("[2/3] Launching Chrome in optimized hardware D3D11 mode with AudioContext & rVFC...")
    chrome_proc = subprocess.Popen(chrome_cmd)
    
    # 3. Wait for Results
    print("[3/3] Executing 900-frame dual-stream synchronization run (15.0s)...")
    finished = benchmark_completed.wait(timeout=40.0)
    
    # Terminate Chrome
    chrome_proc.terminate()
    try:
        chrome_proc.wait(timeout=3.0)
    except subprocess.TimeoutExpired:
        chrome_proc.kill()
        
    httpd.shutdown()
    
    if not finished:
        print("[ERROR] Benchmark timed out after 35 seconds without receiving results.")
        sys.exit(1)
        
    summary = benchmark_results.get("summary", {})
    print("\n" + "=" * 70)
    print("TC-SYNC-01 BENCHMARK AUDIT EXECUTION REPORT")
    print("=" * 70)
    print(f"Total Frames Sampled    : {summary.get('totalSamples')}")
    print(f"Max Frame Displacement  : {summary.get('maxDeltaFrame')} frames (Criterion A: ΔFrame ≡ 0)")
    print(f"Max Phase Lag |e(t)|    : {summary.get('maxAbsErrorMs')} ms (Criterion B: |e(t)| < 8.0ms)")
    print(f"RMS Phase Jitter        : {summary.get('rmsJitterMs')} ms (Criterion C: RMS ≤ 3.5ms)")
    print(f"Ground Truth Match Rate : {summary.get('gtMatchRatePercent')}%")
    print("-" * 70)
    print("Criteria Verification:")
    for k, v in summary.get("criteriaResults", {}).items():
        status_color = "[PASS]" if v == "PASSED" else "[FAIL]"
        print(f"  {status_color} {k}: {v}")
    print("-" * 70)
    print(f"FINAL AUDIT VERDICT     : {summary.get('verdict')}")
    print("=" * 70)

if __name__ == "__main__":
    main()
