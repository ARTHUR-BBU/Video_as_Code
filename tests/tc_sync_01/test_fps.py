import os
import json
import subprocess
from http.server import HTTPServer, SimpleHTTPRequestHandler

data_received = None

class H(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=r"F:\Video_as_Code\tests\tc_sync_01", **kwargs)
    def do_POST(self):
        length = int(self.headers["Content-Length"])
        global data_received
        data_received = json.loads(self.rfile.read(length).decode("utf-8"))
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")
    def log_message(self, *args): pass

httpd = HTTPServer(("127.0.0.1", 9726), H)
chrome = subprocess.Popen([
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "--headless=new",
    "--autoplay-policy=no-user-gesture-required",
    "--disable-frame-rate-limit",
    "--disable-gpu-vsync",
    "--use-gl=angle",
    "--use-angle=d3d11",
    "--user-data-dir=C:\\Users\\LENOVO\\AppData\\Local\\Temp\\chrome_temp_test",
    "http://127.0.0.1:9726/test_video_fps.html"
])

while data_received is None:
    httpd.handle_request()

chrome.terminate()
print("Received frames:", len(data_received))
if len(data_received) > 1:
    dt_now = [(data_received[i]["now"] - data_received[i-1]["now"]) for i in range(1, len(data_received))]
    dt_media = [(data_received[i]["mediaTime"] - data_received[i-1]["mediaTime"]) * 1000 for i in range(1, len(data_received))]
    avg_dt_now = sum(dt_now) / len(dt_now)
    avg_dt_media = sum(dt_media) / len(dt_media)
    print(f"Average now interval: {avg_dt_now:.2f} ms ({1000/avg_dt_now:.1f} fps)")
    print(f"Average media interval: {avg_dt_media:.2f} ms ({1000/avg_dt_media:.1f} fps)")
    print(f"First 10 intervals (ms): {[round(x, 1) for x in dt_now[:10]]}")
