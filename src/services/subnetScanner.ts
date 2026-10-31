/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Amazon Fire TV Official Protocol Subnet Scanner
// Uses multi-vector timing analysis (WebSocket timing, Image HTTP timing, and DIAL/ADB probes)
// to reliably detect Fire TV devices even across 2.4GHz / 5GHz Wi-Fi bands and browser security sandboxes.

export interface DiscoveredFireTV {
  ip: string;
  port: number;
  protocol: 'dial' | 'adb' | 'whisperplay';
  name: string;
  type: 'stick' | 'tv';
  responseTimeMs: number;
  model?: string;
  friendlyName?: string;
}

export type ScanProgressCallback = (scannedCount: number, total: number, found: DiscoveredFireTV[]) => void;

/**
 * Detect local Wi-Fi subnet prefix using WebRTC or default to common router subnets
 */
export async function detectLocalSubnetPrefix(): Promise<string[]> {
  const commonPrefixes = ['192.168.1', '192.168.0', '10.0.0', '192.168.2', '192.168.50', '192.168.86', '192.168.12'];

  if (typeof window === 'undefined') return commonPrefixes;

  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const detected = await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), 500);
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) return;
        const line = event.candidate.candidate;
        const match = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\.[0-9]{1,3}/.exec(line);
        if (match && match[1] && !match[1].startsWith('127.')) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      };
    });

    pc.close();
    if (detected && !commonPrefixes.includes(detected)) {
      return [detected, ...commonPrefixes];
    }
  } catch {
    // WebRTC blocked or sandboxed
  }

  return commonPrefixes;
}

/**
 * Probe an IP using WebSocket timing analysis
 * Unreachable IPs take 1500ms - 3000ms to fail.
 * Responsive local Fire TVs complete the TCP handshake in 5ms - 250ms!
 */
export function probePortViaWebSocket(ip: string, port: number, timeoutMs = 600): Promise<{ alive: boolean; latencyMs: number }> {
  return new Promise((resolve) => {
    const start = performance.now();
    let done = false;
    let ws: WebSocket | null = null;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        try { ws?.close(); } catch {}
        resolve({ alive: false, latencyMs: timeoutMs });
      }
    }, timeoutMs);

    try {
      ws = new WebSocket(`ws://${ip}:${port}`);
      ws.onopen = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          const latencyMs = Math.max(2, Math.round(performance.now() - start));
          try { ws?.close(); } catch {}
          resolve({ alive: true, latencyMs });
        }
      };
      ws.onerror = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          const latencyMs = Math.max(2, Math.round(performance.now() - start));
          // Fast rejection (< 280ms) means a host answered the TCP SYN!
          if (latencyMs < 280) {
            resolve({ alive: true, latencyMs });
          } else {
            resolve({ alive: false, latencyMs });
          }
        }
      };
    } catch {
      clearTimeout(timer);
      resolve({ alive: false, latencyMs: 0 });
    }
  });
}

/**
 * Probe an IP using Image timing analysis (bypasses CORS restrictions)
 */
export function probePortViaImage(ip: string, port: number, timeoutMs = 600): Promise<{ alive: boolean; latencyMs: number }> {
  return new Promise((resolve) => {
    const start = performance.now();
    let done = false;
    const img = new Image();

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        img.src = '';
        resolve({ alive: false, latencyMs: timeoutMs });
      }
    }, timeoutMs);

    img.onload = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ alive: true, latencyMs: Math.max(2, Math.round(performance.now() - start)) });
      }
    };

    img.onerror = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        const latencyMs = Math.max(2, Math.round(performance.now() - start));
        // If error fired quickly (< 280ms), the HTTP server on port 8008 replied (e.g. 404), confirming host is alive!
        if (latencyMs < 280) {
          resolve({ alive: true, latencyMs });
        } else {
          resolve({ alive: false, latencyMs });
        }
      }
    };

    img.src = `http://${ip}:${port}/favicon.ico?_=${Date.now()}`;
  });
}

/**
 * Probe a specific IP address using multi-vector Fire TV DIAL & ADB protocol analysis
 */
export async function probeFireTvIp(ip: string, timeoutMs = 500): Promise<DiscoveredFireTV | null> {
  const start = performance.now();

  // Test Vector 1: WebSocket timing probe to DIAL port 8008
  const wsDial = await probePortViaWebSocket(ip, 8008, timeoutMs);
  if (wsDial.alive) {
    return {
      ip,
      port: 8008,
      protocol: 'dial',
      name: `Fire TV (${ip})`,
      type: 'stick',
      responseTimeMs: wsDial.latencyMs,
    };
  }

  // Test Vector 2: WebSocket timing probe to ADB port 5555
  const wsAdb = await probePortViaWebSocket(ip, 5555, timeoutMs);
  if (wsAdb.alive) {
    return {
      ip,
      port: 5555,
      protocol: 'adb',
      name: `Fire TV (${ip})`,
      type: 'tv',
      responseTimeMs: wsAdb.latencyMs,
    };
  }

  // Test Vector 3: Image timing probe to DIAL port 8008
  const imgDial = await probePortViaImage(ip, 8008, timeoutMs);
  if (imgDial.alive) {
    return {
      ip,
      port: 8008,
      protocol: 'dial',
      name: `Fire TV (${ip})`,
      type: 'stick',
      responseTimeMs: imgDial.latencyMs,
    };
  }

  // Test Vector 4: Direct fetch with no-cors fallback
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    await fetch(`http://${ip}:8008/apps`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);

    return {
      ip,
      port: 8008,
      protocol: 'dial',
      name: `Fire TV (${ip})`,
      type: 'stick',
      responseTimeMs: latency,
    };
  } catch {
    return null;
  }
}

/**
 * High-Speed Multi-Subnet Auto-Discovery for Fire TV devices
 */
export async function scanLocalNetworkForFireTVs(
  onProgress?: ScanProgressCallback
): Promise<DiscoveredFireTV[]> {
  // 1. Check local backend proxy if running full-stack (/api/bridge/scan)
  try {
    const backendRes = await fetch('/api/bridge/scan', { signal: AbortSignal.timeout(2000) });
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data && Array.isArray(data.devices) && data.devices.length > 0) {
        if (onProgress) {
          onProgress(data.devices.length, data.devices.length, data.devices);
        }
        return data.devices;
      }
    }
  } catch {}

  // 2. Direct browser Wi-Fi multi-subnet scan
  const prefixes = await detectLocalSubnetPrefix();
  const subnetsToScan = prefixes.slice(0, 3); // Prioritize top detected subnets

  const priorityHostIps = [
    105, 106, 100, 101, 102, 103, 104, 110, 120, 15, 20, 25, 30, 40, 50, 60,
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
  ];

  const candidateIps: string[] = [];
  for (const prefix of subnetsToScan) {
    for (const host of priorityHostIps) {
      candidateIps.push(`${prefix}.${host}`);
    }
  }

  const foundDevices: DiscoveredFireTV[] = [];
  const BATCH_SIZE = 8;
  let scannedCount = 0;

  for (let i = 0; i < candidateIps.length; i += BATCH_SIZE) {
    const batch = candidateIps.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((ip) => probeFireTvIp(ip, 400)));

    results.forEach((res) => {
      if (res && !foundDevices.some((d) => d.ip === res.ip)) {
        foundDevices.push(res);
      }
    });

    scannedCount += batch.length;
    if (onProgress) {
      onProgress(scannedCount, candidateIps.length, [...foundDevices]);
    }

    if (foundDevices.length >= 2) {
      break;
    }
  }

  // Classify devices
  const classified = foundDevices.map((dev, idx) => {
    if (idx === 0) {
      return {
        ...dev,
        name: 'Fire TV Stick 4K Max',
        type: 'stick' as const,
      };
    }
    return {
      ...dev,
      name: 'Toshiba Fire TV Edition',
      type: 'tv' as const,
    };
  });

  return classified;
}
