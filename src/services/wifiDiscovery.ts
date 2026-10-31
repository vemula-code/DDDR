/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { scanLocalNetworkForFireTVs, probeFireTvIp } from './subnetScanner';

export interface FireTVDevice {
  id: 'firestick_4k' | 'toshiba_tv';
  name: string;
  type: 'stick' | 'tv';
  ip: string;
  port: number;
  status: 'connected' | 'searching' | 'paired' | 'offline';
  inputPort?: string;
  badge: string;
  lastPingMs?: number;
}

const STORAGE_KEY = 'dremote_discovered_devices_v3';

export const DEFAULT_DEVICES: FireTVDevice[] = [
  {
    id: 'firestick_4k',
    name: 'Fire TV Stick 4K Max',
    type: 'stick',
    ip: '192.168.1.106',
    port: 8008,
    status: 'searching',
    badge: '16GB (HDMI 2)',
  },
  {
    id: 'toshiba_tv',
    name: 'Toshiba Fire TV',
    type: 'tv',
    ip: '192.168.1.105',
    port: 8008,
    status: 'searching',
    inputPort: 'HDMI 2',
    badge: 'TV & Sound',
  },
];

export function getSavedDevices(): FireTVDevice[] {
  if (typeof window === 'undefined') return DEFAULT_DEVICES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
    }
  } catch {
    // Storage read error
  }
  return DEFAULT_DEVICES;
}

export function saveDevices(devices: FireTVDevice[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  } catch {
    // Storage write error
  }
}

/**
 * Real Fire TV Wi-Fi Protocol Auto-Discovery:
 * 1. Probes currently stored IPs on DIAL port 8008
 * 2. If not responsive, scans local Wi-Fi subnet using Fire TV DIAL & ADB protocols
 * 3. Updates and persists verified IP addresses
 */
export async function autoDiscoverWifiDevices(): Promise<FireTVDevice[]> {
  const current = getSavedDevices();

  // Step 1: Probe current devices to see if they are actively responding on the network
  const [stickProbe, tvProbe] = await Promise.all([
    probeFireTvIp(current[0].ip, 500),
    probeFireTvIp(current[1].ip, 500),
  ]);

  if (stickProbe || tvProbe) {
    const verified = current.map((dev, idx) => {
      const probe = idx === 0 ? stickProbe : tvProbe;
      return {
        ...dev,
        status: (probe ? 'connected' : 'searching') as 'connected' | 'searching',
        lastPingMs: probe ? probe.responseTimeMs : undefined,
      };
    });
    saveDevices(verified);
    return verified;
  }

  // Step 2: Neither device responded on old IPs. Scan the Wi-Fi subnet!
  try {
    const discovered = await scanLocalNetworkForFireTVs();
    if (discovered.length > 0) {
      const updated: FireTVDevice[] = [
        {
          id: 'firestick_4k',
          name: 'Fire TV Stick 4K Max',
          type: 'stick',
          ip: discovered[0].ip,
          port: 8008,
          status: 'connected',
          badge: `16GB (${discovered[0].ip})`,
          lastPingMs: discovered[0].responseTimeMs,
        },
        {
          id: 'toshiba_tv',
          name: 'Toshiba Fire TV',
          type: 'tv',
          ip: discovered[1]?.ip || current[1].ip,
          port: 8008,
          status: (discovered[1] ? 'connected' : 'searching') as 'connected' | 'searching',
          inputPort: 'HDMI 2',
          badge: `TV & Sound (${discovered[1]?.ip || current[1].ip})`,
          lastPingMs: discovered[1]?.responseTimeMs,
        },
      ];
      saveDevices(updated);
      return updated;
    }
  } catch {}

  // If scan didn't find any yet, mark as searching (not fake connected)
  const searchingState = current.map((dev) => ({
    ...dev,
    status: 'searching' as const,
  }));
  saveDevices(searchingState);
  return searchingState;
}

/**
 * Send Remote Command using Fire TV DIAL protocol
 */
export async function sendFireTVCommand(
  device: FireTVDevice,
  command: string,
  extra?: { text?: string; packageName?: string }
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);

    // If launching an app via DIAL protocol:
    if (extra?.packageName) {
      const dialMap: Record<string, string> = {
        'com.netflix.ninja': 'Netflix',
        'com.amazon.amazonvideo.livingroom': 'AmazonVideo',
        'com.amazon.firetv.youtube': 'YouTube',
        'com.disney.disneyplus': 'DisneyPlus',
      };
      const appName = dialMap[extra.packageName] || 'YouTube';
      await fetch(`http://${device.ip}:8008/apps/${appName}`, {
        method: 'POST',
        mode: 'no-cors',
        signal: controller.signal,
      }).catch(() => {});
    } else {
      // Key event or Wake via DIAL
      await fetch(
        `http://${device.ip}:8008/apps/FireTVRemote?cmd=${encodeURIComponent(command)}`,
        {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, text: extra?.text }),
          signal: controller.signal,
        }
      ).catch(() => {});
    }

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
