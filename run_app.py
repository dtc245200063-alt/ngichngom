import os
import sys
import webbrowser
import threading
import time
import subprocess
import uvicorn

def free_port(port=8000):
    """Ensure port 8000 is clean before starting uvicorn."""
    try:
        # Check and terminate existing processes listening on the port
        cmd = f"netstat -ano | findstr :{port}"
        output = subprocess.check_output(cmd, shell=True).decode()
        current_pid = os.getpid()
        killed_any = False
        for line in output.splitlines():
            if "LISTENING" in line:
                parts = line.strip().split()
                if parts:
                    pid = parts[-1]
                    if pid.isdigit() and int(pid) != current_pid and int(pid) != 0:
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                        killed_any = True
        if killed_any:
            time.sleep(0.8)
    except Exception:
        pass

def open_browser():
    time.sleep(1.5)
    url = "http://127.0.0.1:8000"
    print(f"\n[+] Đang mở VietAnh Sub Studio tại: {url}\n")
    webbrowser.open(url)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    sys.path.insert(0, os.path.join(base_dir, "backend"))

    print("=" * 60)
    print("   VietAnh Sub Studio v2.2 - AI Video Translation")
    print("=" * 60)
    print("[*] Tự động kiểm tra và dọn dẹp cổng 8000...")
    free_port(8000)
    print("[*] Khởi động máy chủ backend và giao diện Studio...")
    
    # Open browser automatically in a background thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run Uvicorn server
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, app_dir="backend")
