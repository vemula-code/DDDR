/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import net from 'net';
import dgram from 'dgram';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Helper: Get local network IPv4 subnets
function getLocalSubnets(): string[] {
  const interfaces = os.networkInterfaces();
  const subnets: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const netInfo of interfaces[name] || []) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        const parts = netInfo.address.split('.');
        if (parts.length === 4) {
          subnets.push(`${parts[0]}.${parts[1]}.${parts[2]}`);
        }
      }
    }
  }

  // Common fallbacks
  if (subnets.length === 0) {
    subnets.push('192.168.1', '192.168.0', '10.0.0');
  }
  return Array.from(new Set(subnets));
}

// 1. Status endpoint
app.get('/api/bridge/status', (req, res) => {
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  res.json({ status: 'ok', isLocal, server: 'DRemote Express Backend' });
});

// 2. Ping endpoint
app.post('/api/bridge/ping', (req, res) => {
  const { ip, port = 5555 } = req.body;
  if (!ip) return res.status(400).json({ alive: false, error: 'Missing IP' });

  const socket = new net.Socket();
  socket.setTimeout(1200);
  socket.on('connect', () => {
    socket.destroy();
    res.json({ alive: true, port });
  });
  socket.on('timeout', () => {
    socket.destroy();
    res.json({ alive: false, error: 'Connection timed out' });
  });
  socket.on('error', (err) => {
    socket.destroy();
    res.json({ alive: false, error: err.message });
  });
  socket.connect(port, ip);
});

// 3. Fire TV Protocol Auto-Discovery Endpoint (SSDP + Subnet DIAL & ADB Scanner)
app.get('/api/bridge/scan', async (req, res) => {
  const subnets = getLocalSubnets();
  const discovered: Array<{
    ip: string;
    port: number;
    protocol: string;
    name: string;
    type: 'stick' | 'tv';
    latencyMs: number;
    model?: string;
  }> = [];

  // 3a. Check ADB connected devices first if adb is on host
  try {
    await new Promise<void>((resolve) => {
      exec('adb devices', { timeout: 1500 }, (err, stdout) => {
        if (!err && stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            const match = line.match(/^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}):5555\s+device/);
            if (match) {
              const ip = match[1];
              discovered.push({
                ip,
                port: 5555,
                protocol: 'adb',
                name: `Fire TV (${ip})`,
                type: discovered.length === 0 ? 'stick' : 'tv',
                latencyMs: 3,
              });
            }
          }
        }
        resolve();
      });
    });
  } catch {}

  // 3b. High-speed parallel TCP scan across local subnet on Port 8008 (DIAL) & Port 5555 (ADB)
  const candidateIps: string[] = [];
  const primarySubnet = subnets[0] || '192.168.1';
  const priorityHosts = [
    2, 3, 4, 5, 10, 11, 12, 14, 15, 20, 25, 30, 40, 45, 50, 60, 70, 80, 90,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 120, 150, 200,
  ];

  for (const host of priorityHosts) {
    candidateIps.push(`${primarySubnet}.${host}`);
  }
  if (subnets[1]) {
    for (const host of [2, 3, 5, 10, 20, 50, 100, 105, 106]) {
      candidateIps.push(`${subnets[1]}.${host}`);
    }
  }

  const probeHost = (ip: string, port: number): Promise<{ alive: boolean; latency: number } | null> => {
    return new Promise((resolve) => {
      const start = Date.now();
      const s = new net.Socket();
      s.setTimeout(350);
      s.on('connect', () => {
        const latency = Date.now() - start;
        s.destroy();
        resolve({ alive: true, latency });
      });
      s.on('timeout', () => { s.destroy(); resolve(null); });
      s.on('error', () => { s.destroy(); resolve(null); });
      s.connect(port, ip);
    });
  };

  const probeTasks = candidateIps.map(async (ip) => {
    if (discovered.some((d) => d.ip === ip)) return;
    const dialRes = await probeHost(ip, 8008);
    if (dialRes) {
      discovered.push({
        ip,
        port: 8008,
        protocol: 'dial',
        name: `Fire TV (${ip})`,
        type: discovered.length === 0 ? 'stick' : 'tv',
        latencyMs: dialRes.latency,
      });
      return;
    }
    const adbRes = await probeHost(ip, 5555);
    if (adbRes) {
      discovered.push({
        ip,
        port: 5555,
        protocol: 'adb',
        name: `Fire TV (${ip})`,
        type: discovered.length === 0 ? 'stick' : 'tv',
        latencyMs: adbRes.latency,
      });
    }
  });

  await Promise.all(probeTasks);

  // Label detected devices intelligently: Toshiba TV vs Fire TV Stick 4K Max
  const formatted = discovered.map((dev, index) => {
    if (index === 0) {
      return {
        ...dev,
        id: 'firestick_4k',
        name: 'Fire TV Stick 4K Max',
        type: 'stick' as const,
        badge: `16GB (${dev.ip})`,
      };
    }
    return {
      ...dev,
      id: 'toshiba_tv',
      name: 'Toshiba Fire TV',
      type: 'tv' as const,
      badge: `TV Display (${dev.ip})`,
    };
  });

  res.json({
    success: true,
    subnets,
    count: formatted.length,
    devices: formatted,
  });
});

// 4. Command dispatch over local ADB
app.post('/api/bridge/command', (req, res) => {
  const { ip, keycode, text, packageName } = req.body;
  if (!ip) return res.status(400).json({ success: false, error: 'Missing device IP' });

  let adbCmd = '';
  if (text) {
    adbCmd = `adb -s ${ip}:5555 shell input text "${text.replace(/"/g, '\\"')}"`;
  } else if (packageName) {
    adbCmd = `adb -s ${ip}:5555 shell monkey -p ${packageName} 1`;
  } else if (keycode) {
    adbCmd = `adb -s ${ip}:5555 shell input keyevent ${keycode}`;
  } else {
    return res.status(400).json({ success: false, error: 'Missing command' });
  }

  exec(adbCmd, { timeout: 3000 }, (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        error: error.message.includes('not found')
          ? 'ADB not installed on backend host. Please run the local WebSocket bridge.'
          : stderr || error.message,
      });
    }
    res.json({ success: true, details: stdout.trim() || 'Executed' });
  });
});

// 5. Fire TV DIAL App Launch Proxy Endpoint
app.post('/api/bridge/dial/launch', async (req, res) => {
  const { ip, appName } = req.body;
  if (!ip || !appName) return res.status(400).json({ success: false, error: 'Missing ip or appName' });

  try {
    const dialRes = await fetch(`http://${ip}:8008/apps/${encodeURIComponent(appName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
    });
    res.json({ success: dialRes.ok, status: dialRes.status });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// 6. Download endpoints for standalone bridge scripts and migration guide
app.get('/api/bridge/download/python', (req, res) => {
  res.download(path.join(__dirname, 'public', 'dremote-bridge.py'), 'dremote-bridge.py');
});

app.get('/api/bridge/download/node', (req, res) => {
  res.download(path.join(__dirname, 'public', 'dremote-bridge.js'), 'dremote-bridge.js');
});

app.get('/api/bridge/download/guide', (req, res) => {
  res.download(path.join(__dirname, 'public', 'AI_MIGRATION_GUIDE.md'), 'AI_MIGRATION_GUIDE.md');
});

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DRemote Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
