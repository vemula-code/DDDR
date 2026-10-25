/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommandLogEntry,
  DeviceState,
  MacroAction,
  ProtocolType,
  RemoteKey,
  RoutingMode,
  StreamingApp,
  TargetDeviceType,
} from '../types/remote';

// Default devices configuration
export const INITIAL_DEVICES: Record<TargetDeviceType, DeviceState> = {
  toshiba_tv: {
    id: 'toshiba_tv',
    name: 'Toshiba Fire TV (Built-in)',
    shortName: 'Toshiba TV',
    ip: '192.168.1.105',
    port: 8008,
    adbPort: 5555,
    wsPort: 8080,
    status: 'connected',
    power: 'on',
    volume: 18,
    muted: false,
    currentInput: 'HDMI 2 (Stick)',
    memoryCapacity: '4 GB (TV & Display Hub)',
    color: '#f59e0b', // amber
  },
  firestick_4k: {
    id: 'firestick_4k',
    name: 'Fire TV Stick 4K Max (16GB)',
    shortName: 'Stick 4K Max',
    ip: '192.168.1.106',
    port: 8008,
    adbPort: 5555,
    wsPort: 8080,
    status: 'connected',
    power: 'on',
    volume: 100, // Pass-through
    muted: false,
    activeApp: 'Home Screen',
    memoryCapacity: '16 GB Wi-Fi 6E (High-Speed Engine)',
    color: '#06b6d4', // cyan
  },
};

export const POPULAR_APPS: StreamingApp[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    packageName: 'com.netflix.ninja',
    iconBg: '#e50914',
    iconTextColor: '#ffffff',
    badge: '4K HDR',
  },
  {
    id: 'prime_video',
    name: 'Prime Video',
    packageName: 'com.amazon.amazonvideo.livingroom',
    iconBg: '#00a8e1',
    iconTextColor: '#ffffff',
    badge: 'Included',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    packageName: 'com.amazon.firetv.youtube',
    iconBg: '#ff0000',
    iconTextColor: '#ffffff',
    badge: '4K',
  },
  {
    id: 'disney_plus',
    name: 'Disney+',
    packageName: 'com.disney.disneyplus',
    iconBg: '#113ccf',
    iconTextColor: '#ffffff',
    badge: 'IMAX',
  },
  {
    id: 'plex',
    name: 'Plex',
    packageName: 'com.plexapp.android',
    iconBg: '#e5a00d',
    iconTextColor: '#000000',
    badge: 'Local',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    packageName: 'com.spotify.tv.android',
    iconBg: '#1db954',
    iconTextColor: '#000000',
    badge: 'Music',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    packageName: 'tv.twitch.android.app',
    iconBg: '#9146ff',
    iconTextColor: '#ffffff',
    badge: 'Live',
  },
  {
    id: 'apple_tv',
    name: 'Apple TV',
    packageName: 'com.apple.atve.amazon.appletv',
    iconBg: '#000000',
    iconTextColor: '#ffffff',
    badge: 'Originals',
  },
  {
    id: 'kodi',
    name: 'Kodi',
    packageName: 'org.xbmc.kodi',
    iconBg: '#17b2e7',
    iconTextColor: '#ffffff',
    badge: 'Media',
  },
  {
    id: 'settings',
    name: 'TV Settings',
    packageName: 'com.amazon.tv.settings',
    iconBg: '#475569',
    iconTextColor: '#ffffff',
    badge: 'System',
  },
];

export const MACRO_ACTIONS: MacroAction[] = [
  {
    id: 'watch_firestick',
    name: 'Watch Firestick 4K Max',
    description: 'Powers on Toshiba TV, switches to HDMI 2, and wakes Firestick 4K Max',
    iconName: 'Tv',
    color: '#06b6d4',
    steps: [
      { target: 'toshiba_tv', key: 'TV_POWER', label: 'Power On TV', delayMs: 0 },
      { target: 'toshiba_tv', key: 'INPUT_HDMI2', label: 'Switch to HDMI 2 (Stick)', delayMs: 300, param: 'HDMI 2 (Stick)' },
      { target: 'firestick_4k', key: 'HOME', label: 'Wake Firestick & Open Home', delayMs: 600 },
    ],
  },
  {
    id: 'cinema_mode',
    name: 'Cinema Streaming Mode',
    description: 'Switches to HDMI 2, sets volume to 24, and launches Netflix',
    iconName: 'Film',
    color: '#e50914',
    steps: [
      { target: 'toshiba_tv', key: 'INPUT_HDMI2', label: 'Switch to HDMI 2', delayMs: 0, param: 'HDMI 2 (Stick)' },
      { target: 'toshiba_tv', key: 'VOLUME_UP', label: 'Set Optimal Audio', delayMs: 250, param: 24 },
      { target: 'firestick_4k', key: 'LAUNCH_APP', label: 'Launch Netflix 4K', delayMs: 500, param: 'Netflix' },
    ],
  },
  {
    id: 'bedtime_sleep',
    name: 'Bedtime Sleep Macro',
    description: 'Lowers volume, activates sleep timer, and turns both off',
    iconName: 'Moon',
    color: '#8b5cf6',
    steps: [
      { target: 'toshiba_tv', key: 'VOLUME_DOWN', label: 'Quiet Volume (10%)', delayMs: 0, param: 10 },
      { target: 'toshiba_tv', key: 'SLEEP', label: 'Set 30m Sleep Timer', delayMs: 200 },
      { target: 'firestick_4k', key: 'STICK_POWER', label: 'Put Firestick to Sleep', delayMs: 400 },
    ],
  },
  {
    id: 'reboot_toshiba',
    name: 'Clear Toshiba 4GB RAM',
    description: 'Sends soft-reboot to clear bogged-down memory on the 4GB TV',
    iconName: 'RefreshCw',
    color: '#f59e0b',
    steps: [
      { target: 'toshiba_tv', key: 'SETTINGS', label: 'Open TV Settings', delayMs: 0 },
      { target: 'toshiba_tv', key: 'SELECT', label: 'Trigger Memory Cleanse / Reboot', delayMs: 300 },
    ],
  },
];

// Mapping to determine routing under Smart Hybrid Mode
export function getSmartTarget(key: RemoteKey): TargetDeviceType {
  switch (key) {
    // TV hardware controls
    case 'POWER':
    case 'TV_POWER':
    case 'TV_INPUT':
    case 'INPUT_HDMI1':
    case 'INPUT_HDMI2':
    case 'INPUT_HDMI3':
    case 'INPUT_LIVE_TV':
    case 'VOLUME_UP':
    case 'VOLUME_DOWN':
    case 'VOLUME_MUTE':
    case 'SETTINGS':
    case 'SLEEP':
      return 'toshiba_tv';

    // Navigation & Streaming controls
    case 'STICK_POWER':
    case 'UP':
    case 'DOWN':
    case 'LEFT':
    case 'RIGHT':
    case 'SELECT':
    case 'BACK':
    case 'HOME':
    case 'MENU':
    case 'GUIDE':
    case 'RECENT':
    case 'PLAY_PAUSE':
    case 'REWIND':
    case 'FAST_FORWARD':
    case 'SKIP_BACK_10':
    case 'SKIP_FWD_10':
    case 'LAUNCH_APP':
    case 'TEXT_STRING':
    case 'BACKSPACE':
    case 'ENTER':
    default:
      return 'firestick_4k';
  }
}

// Convert RemoteKey to standard Fire TV / Android keyevent code for ADB & WebSocket
export function getAndroidKeyCode(key: RemoteKey): number {
  switch (key) {
    case 'UP': return 19; // KEYCODE_DPAD_UP
    case 'DOWN': return 20; // KEYCODE_DPAD_DOWN
    case 'LEFT': return 21; // KEYCODE_DPAD_LEFT
    case 'RIGHT': return 22; // KEYCODE_DPAD_RIGHT
    case 'SELECT': return 66; // KEYCODE_ENTER / DPAD_CENTER (23)
    case 'BACK': return 4; // KEYCODE_BACK
    case 'HOME': return 3; // KEYCODE_HOME
    case 'MENU': return 82; // KEYCODE_MENU
    case 'VOLUME_UP': return 24; // KEYCODE_VOLUME_UP
    case 'VOLUME_DOWN': return 25; // KEYCODE_VOLUME_DOWN
    case 'VOLUME_MUTE': return 164; // KEYCODE_VOLUME_MUTE
    case 'POWER':
    case 'TV_POWER':
    case 'STICK_POWER': return 26; // KEYCODE_POWER
    case 'PLAY_PAUSE': return 85; // KEYCODE_MEDIA_PLAY_PAUSE
    case 'REWIND': return 89; // KEYCODE_MEDIA_REWIND
    case 'FAST_FORWARD': return 90; // KEYCODE_MEDIA_FAST_FORWARD
    case 'TV_INPUT': return 178; // KEYCODE_TV_INPUT
    case 'BACKSPACE': return 67; // KEYCODE_DEL
    case 'ENTER': return 66; // KEYCODE_ENTER
    default: return 0;
  }
}

// Generate companion Python or Node bridge script for users who want 
// a local WebSocket-to-ADB daemon running on their local network
export function generateLocalBridgeScript(language: 'python' | 'node', devices: Record<TargetDeviceType, DeviceState>): string {
  if (language === 'python') {
    return `#!/usr/bin/env python3
"""
DRemote - Dual Fire TV Unified Local Bridge
Connects Toshiba Fire TV (${devices.toshiba_tv.ip}) and Firestick 4K Max (${devices.firestick_4k.ip})
Runs a lightweight WebSocket server on port 8080 for instant, zero-lag local remote control.
"""

import asyncio
import json
import subprocess
import websockets

DEVICES = {
    "toshiba_tv": "${devices.toshiba_tv.ip}",
    "firestick_4k": "${devices.firestick_4k.ip}"
}

print("==================================================")
print("  DRemote Unified Bridge Server (Python)")
print("  Listening on ws://0.0.0.0:8080")
print("  Toshiba TV IP:    ", DEVICES["toshiba_tv"])
print("  Firestick 4K IP: ", DEVICES["firestick_4k"])
print("==================================================")

async def send_adb_command(device_ip, keycode):
    try:
        cmd = f"adb -s {device_ip}:5555 shell input keyevent {keycode}"
        proc = await asyncio.create_subprocess_shell(cmd)
        await proc.communicate()
        return True
    except Exception as e:
        print(f"ADB Error on {device_ip}:", e)
        return False

async def handler(websocket):
    print(f"DRemote Client connected from {websocket.remote_address}")
    try:
        async for message in websocket:
            data = json.loads(message)
            target = data.get("target")
            keycode = data.get("keycode")
            key_name = data.get("key")
            
            if target in DEVICES and keycode:
                ip = DEVICES[target]
                print(f"[CMD] -> {target.upper()} ({ip}) : {key_name} (keycode {keycode})")
                asyncio.create_task(send_adb_command(ip, keycode))
                await websocket.send(json.dumps({"status": "ok", "key": key_name, "target": target}))
    except websockets.exceptions.ConnectionClosed:
        print("DRemote Client disconnected.")

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8080):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
`;
  }

  return `/**
 * DRemote - Dual Fire TV Unified Local Bridge (Node.js)
 * Connects Toshiba Fire TV (${devices.toshiba_tv.ip}) and Firestick 4K Max (${devices.firestick_4k.ip})
 * Run with: node dremote-bridge.js
 */

const { WebSocketServer } = require('ws');
const { exec } = require('child_process');

const DEVICES = {
  toshiba_tv: '${devices.toshiba_tv.ip}',
  firestick_4k: '${devices.firestick_4k.ip}'
};

const wss = new WebSocketServer({ port: 8080 });

console.log('DRemote Unified Bridge running on ws://0.0.0.0:8080');
console.log('Toshiba Fire TV:   ', DEVICES.toshiba_tv);
console.log('Firestick 4K Max: ', DEVICES.firestick_4k);

wss.on('connection', (ws) => {
  console.log('DRemote phone app connected!');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { target, keycode, key } = data;
      const ip = DEVICES[target];
      if (ip && keycode) {
        console.log(\`Sending \${key} (code \${keycode}) to \${target} (\${ip})\`);
        exec(\`adb -s \${ip}:5555 shell input keyevent \${keycode}\`);
        ws.send(JSON.stringify({ status: 'ok', target, key }));
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });
});
`;
}
