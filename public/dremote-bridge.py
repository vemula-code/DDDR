#!/usr/bin/env python3
"""
DRemote - Dual Fire TV Local Bridge Server (Python 3)
Connects your web browser remote to your Toshiba Fire TV and Fire TV Stick 4K Max over ADB.

Requirements:
  1. Python 3.7+
  2. pip install websockets
  3. ADB installed (Android Debug Bridge, e.g. 'sudo apt install adb' or Android platform-tools)
"""

import asyncio
import json
import shutil
import subprocess
import sys

try:
    import websockets
except ImportError:
    print("[DRemote Bridge] Installing required 'websockets' package...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

PORT = 8080
HOST = "0.0.0.0"

KEY_MAP = {
    "UP": 19, "DOWN": 20, "LEFT": 21, "RIGHT": 22, "SELECT": 66,
    "BACK": 4, "HOME": 3, "MENU": 82, "GUIDE": 172,
    "PLAY_PAUSE": 85, "REWIND": 89, "FAST_FORWARD": 90,
    "VOLUME_UP": 24, "VOLUME_DOWN": 25, "VOLUME_MUTE": 164,
    "POWER": 26, "TV_POWER": 26, "STICK_POWER": 26,
    "TV_INPUT": 178, "INPUT_HDMI2": 178, "ENTER": 66, "BACKSPACE": 67,
}

CONNECTED_DEVICES = set()

def check_adb():
    return shutil.which("adb") is not None

def connect_adb(ip):
    if not ip or ip in CONNECTED_DEVICES:
        return
    try:
        res = subprocess.run(["adb", "connect", f"{ip}:5555"], capture_output=True, text=True, timeout=3)
        if "connected" in res.stdout.lower():
            print(f"✅ ADB Connected to {ip}:5555")
            CONNECTED_DEVICES.add(ip)
        else:
            print(f"ℹ️ ADB connect {ip}: {res.stdout.strip()}")
    except Exception as e:
        print(f"⚠️ ADB connect error for {ip}: {e}")

def run_adb(ip, args):
    if ip not in CONNECTED_DEVICES:
        connect_adb(ip)
    cmd = ["adb", "-s", f"{ip}:5555"] + args
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
        return True, res.stdout.strip()
    except Exception as e:
        return False, str(e)

async def handler(websocket):
    client_ip = websocket.remote_address[0]
    print(f"📱 Remote client connected from {client_ip}")

    await websocket.send(json.dumps({
        "type": "handshake",
        "status": "connected",
        "adb": check_adb(),
        "bridge": "DRemote Python Bridge v2",
    }))

    async for message in websocket:
        try:
            data = json.loads(message)
        except Exception:
            continue

        msg_type = data.get("type", "command")

        if msg_type == "ping":
            await websocket.send(json.dumps({"type": "pong", "time": data.get("time", 0)}))
            continue

        target = data.get("target", "firestick_4k")
        ip = data.get("ip")
        key = data.get("key")
        keycode = data.get("keycode") or KEY_MAP.get(key, 0)
        text = data.get("text")
        package_name = data.get("packageName")

        if not ip:
            await websocket.send(json.dumps({"type": "error", "message": "Missing device IP"}))
            continue

        if text:
            success, details = run_adb(ip, ["shell", "input", "text", text])
        elif package_name:
            success, details = run_adb(ip, ["shell", "monkey", "-p", package_name, "1"])
        elif keycode:
            success, details = run_adb(ip, ["shell", "input", "keyevent", str(keycode)])
        else:
            success, details = False, "No keycode or text provided"

        await websocket.send(json.dumps({
            "type": "command_result",
            "key": key,
            "target": target,
            "success": success,
            "details": details,
        }))

async def main():
    print("=" * 60)
    print(f"  ⚡ DRemote Fire TV Local WebSocket Bridge")
    print(f"  Listening on ws://{HOST}:{PORT}")
    print(f"  ADB Installed: {'YES ✅' if check_adb() else 'NO ❌ (Please install Android Platform-Tools)'}")
    print("=" * 60)
    async with websockets.serve(handler, HOST, PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBridge stopped.")
