#!/usr/bin/env node
/**
 * DRemote - Dual Fire TV Local Wi-Fi Bridge (Node.js)
 * 
 * Why this bridge is needed:
 * Web browsers on HTTPS (like Vercel) block direct connections to home IP addresses
 * due to browser Mixed Content & Private Network Access security rules.
 * 
 * This lightweight bridge runs on any computer/laptop on your home Wi-Fi and routes
 * remote commands from DRemote directly into your Firestick 4K Max and Toshiba TV via ADB / TCP!
 * 
 * Usage:
 *   node dremote-bridge.js [firestick_ip] [toshiba_tv_ip]
 * 
 * Example:
 *   node dremote-bridge.js 192.168.1.106 192.168.1.105
 */

const http = require('http');
const { exec } = require('child_process');

const PORT = process.env.BRIDGE_PORT || 8080;
const stickIp = process.argv[2] || process.env.FIRESTICK_IP || '192.168.1.106';
const tvIp = process.argv[3] || process.env.TOSHIBA_TV_IP || '192.168.1.105';

console.log('========================================================');
console.log('  ⚡ DRemote Dual Fire TV Local Bridge Server (Node.js)');
console.log(`  Listening on http://0.0.0.0:${PORT}`);
console.log(`  Target 1 (Firestick 4K Max): ${stickIp}:5555`);
console.log(`  Target 2 (Toshiba Fire TV):  ${tvIp}:5555`);
console.log('========================================================\n');

// Attempt ADB connect on startup
function connectAdb(ip) {
  exec(`adb connect ${ip}:5555`, (err, stdout) => {
    if (!err && stdout.includes('connected')) {
      console.log(`✅ ADB Connected to ${ip}:5555`);
    } else {
      console.log(`ℹ️ ADB connect ${ip}: ${stdout.trim() || 'Waiting for TV'}`);
    }
  });
}

connectAdb(stickIp);
connectAdb(tvIp);

// Keycode mapping for Android Fire TV
const KEYCODES = {
  up: 19,
  down: 20,
  left: 21,
  right: 22,
  select: 66,
  center: 23,
  back: 4,
  home: 3,
  menu: 82,
  play: 85,
  pause: 85,
  play_pause: 85,
  rewind: 89,
  fast_forward: 90,
  volume_up: 24,
  volume_down: 25,
  mute: 164,
  power: 26,
  source: 178,
  hdmi2: 178,
  input_hdmi2: 178,
};

// Create HTTP API server with CORS enabled for DRemote PWA
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', stickIp, tvIp }));
    return;
  }

  if (url.pathname === '/command') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const targetIp = data.ip || (data.target === 'toshiba_tv' ? tvIp : stickIp);
        const action = (data.action || data.key || '').toLowerCase();
        const code = KEYCODES[action] || data.keycode;

        if (action === 'input_hdmi2' || action === 'hdmi2') {
          // Direct Toshiba TV HDMI 2 Input Switch Intent
          const cmd = `adb -s ${targetIp}:5555 shell am start -a android.intent.action.VIEW -d "content://android.media.tv/passthrough/com.amazon.tv.ime/.tvinput.TvInputService%2FHW2"`;
          exec(cmd, (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, details: stdout.trim() }));
          });
          return;
        }

        if (data.text) {
          const cmd = `adb -s ${targetIp}:5555 shell input text "${data.text.replace(/"/g, '\\"')}"`;
          exec(cmd, (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, details: stdout.trim() }));
          });
          return;
        }

        if (data.packageName) {
          const cmd = `adb -s ${targetIp}:5555 shell monkey -p ${data.packageName} 1`;
          exec(cmd, (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, details: stdout.trim() }));
          });
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Unknown key action: ${action}` }));
          return;
        }

        const cmd = `adb -s ${targetIp}:5555 shell input keyevent ${code}`;
        exec(cmd, (err, stdout, stderr) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: !err, details: stdout.trim() }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ DRemote Bridge running at http://0.0.0.0:${PORT}`);
});
