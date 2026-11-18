import subprocess

cmd = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "--headless=new",
    "--autoplay-policy=no-user-gesture-required",
    "--enable-features=WebCodecs,AudioWorklet",
    "--user-data-dir=C:\\Users\\LENOVO\\AppData\\Local\\Temp\\chrome_audio_test",
    "data:text/html,<script>const a = new AudioContext(); a.resume().then(() => fetch('http://127.0.0.1:9726/ok?state=' + a.state));</script>"
]

from http.server import HTTPServer, SimpleHTTPRequestHandler
class H(SimpleHTTPRequestHandler):
    def do_GET(self):
        print("Received request:", self.path)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")
        global done
        done = True
    def log_message(self, *args): pass

done = False
httpd = HTTPServer(("127.0.0.1", 9726), H)
p = subprocess.Popen(cmd)
while not done:
    httpd.handle_request()
p.terminate()
print("Done!")
