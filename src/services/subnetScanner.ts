/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// High-Speed Local Wi-Fi Subnet Scanner for Fire TV Auto-Detection
// Scans common home subnets for open Fire TV ports (8008 DIAL, 8009 Fling, 8080 REST, 5555 ADB)

export interface DiscoveredFireTV {
  ip: string;
  port: number;
  name: string;
  type: 'stick' | 'tv';
  responseTimeMs: number;
}

export type ScanProgressCallback = (scannedCount: number, total: number, found: DiscoveredFireTV[]) => void;

/**
 * Detect local subnet prefix using WebRTC or default to common subnets
 */
export async function detectLocalSubnetPrefix(): Promise<string[]> {
  const commonPrefixes = ['192.168.1', '192.168.0', '10.0.0'];

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
    // WebRTC blocked or not supported
  }

  return commonPrefixes;
}

/**
 * Probe a specific IP to check if a Fire TV is responding on port 8008, 8009, or 8080
 */
export async function probeFireTvIp(ip: string, timeoutMs = 450): Promise<DiscoveredFireTV | null> {
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // We probe port 8008 / 8009 (DIAL protocol supported on all Fire TV devices)
  try {
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
      name: `Fire TV (${ip})`,
      type: 'stick',
      responseTimeMs: latency,
    };
  } catch {
    // If 8008 failed, test 8009 or 8080
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
        name: `Fire TV Device (${ip})`,
        type: 'tv',
        responseTimeMs: latency,
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }
}

/**
 * Scan local subnet IPs in parallel batches
 */
export async function scanLocalNetworkForFireTVs(
  onProgress?: ScanProgressCallback
): Promise<DiscoveredFireTV[]> {
  const prefixes = await detectLocalSubnetPrefix();
  const prefix = prefixes[0]; // Primary subnet e.g. 192.168.1

  // Generate list of IPs: priority targets first (common router DHCP assignments), then full range
  const priorityHostIps = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    30, 35, 40, 42, 45, 50, 60, 70, 80, 90, 100, 105, 106, 110, 120, 150, 200,
  ];

  const candidateIps: string[] = [];
  priorityHostIps.forEach((host) => candidateIps.push(`${prefix}.${host}`));

  // Also include secondary subnet if primary doesn't find devices
  if (prefixes[1]) {
    [2, 3, 4, 5, 10, 15, 20, 25, 50, 100, 105, 106].forEach((host) => {
      candidateIps.push(`${prefixes[1]}.${host}`);
    });
  }

  const foundDevices: DiscoveredFireTV[] = [];
  const BATCH_SIZE = 12;
  let scannedCount = 0;

  for (let i = 0; i < candidateIps.length; i += BATCH_SIZE) {
    const batch = candidateIps.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((ip) => probeFireTvIp(ip, 500)));

    results.forEach((res) => {
      if (res && !foundDevices.some((d) => d.ip === res.ip)) {
        foundDevices.push(res);
      }
    });

    scannedCount += batch.length;
    if (onProgress) {
      onProgress(scannedCount, candidateIps.length, [...foundDevices]);
    }

    // If we already discovered both TVs, we can finish early!
    if (foundDevices.length >= 2) {
      break;
    }
  }

  // Deduplicate and classify devices
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
