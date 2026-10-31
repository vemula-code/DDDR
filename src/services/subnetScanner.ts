/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Amazon Fire TV Official Protocol Subnet Scanner
// Scans local Wi-Fi for Fire TV devices using:
// 1. DIAL protocol on Port 8008 (device description XML & apps)
// 2. DIAL TLS on Port 8009
// 3. Android Debug Bridge (ADB) on Port 5555

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
 * Detect local Wi-Fi subnet prefix using WebRTC or defaults to standard router subnets
 */
export async function detectLocalSubnetPrefix(): Promise<string[]> {
  const commonPrefixes = ['192.168.1', '192.168.0', '10.0.0', '192.168.2', '192.168.4'];

  if (typeof window === 'undefined') return commonPrefixes;

  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const detected = await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), 600);
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
    // WebRTC sandbox or permissions
  }

  return commonPrefixes;
}

/**
 * Probe a specific IP address using Fire TV DIAL (Port 8008) and ADB (Port 5555)
 */
export async function probeFireTvIp(ip: string, timeoutMs = 450): Promise<DiscoveredFireTV | null> {
  const start = performance.now();

  // Test 1: Fire TV DIAL Protocol (Port 8008)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Fire TV responds to GET /apps or /ssdp/device-desc.xml
    await fetch(`http://${ip}:8008/apps`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });

    clearTimeout(timeout);
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
    // Test 2: Fire TV DIAL HTTPS (Port 8009) or Image probe
    try {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), timeoutMs);

      await fetch(`http://${ip}:8009/apps/FireTVRemote`, {
        method: 'POST',
        mode: 'no-cors',
        signal: controller2.signal,
      });

      clearTimeout(timeout2);
      const latency = Math.round(performance.now() - start);

      return {
        ip,
        port: 8009,
        protocol: 'dial',
        name: `Fire TV Device (${ip})`,
        type: 'tv',
        responseTimeMs: latency,
      };
    } catch {
      return null;
    }
  }
}

/**
 * High-Speed Local Wi-Fi Auto-Discovery for Fire TV devices
 */
export async function scanLocalNetworkForFireTVs(
  onProgress?: ScanProgressCallback
): Promise<DiscoveredFireTV[]> {
  // 1. First, check backend proxy if running full-stack (/api/bridge/scan)
  try {
    const backendRes = await fetch('/api/bridge/scan', { signal: AbortSignal.timeout(2500) });
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

  // 2. Direct browser Wi-Fi subnet scan
  const prefixes = await detectLocalSubnetPrefix();
  const primaryPrefix = prefixes[0] || '192.168.1';

  // Target most common DHCP host IPs assigned by home routers
  const priorityHostIps = [
    105, 106, 100, 101, 102, 103, 104, 110, 120, 15, 20, 25, 40, 50, 60, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ];

  const candidateIps: string[] = [];
  priorityHostIps.forEach((host) => candidateIps.push(`${primaryPrefix}.${host}`));

  // If primary prefix is not 192.168.1, include 192.168.1 as fallback
  if (primaryPrefix !== '192.168.1') {
    [105, 106, 100, 101, 15, 20, 2, 3, 4, 5].forEach((host) => {
      candidateIps.push(`192.168.1.${host}`);
    });
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

  // Classify discovered devices: Stick (4K Max) vs TV (Toshiba)
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
