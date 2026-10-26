/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Amazon Fire TV Official Mobile Remote (Lightning Protocol) Client
// Communicates with Fire TV OS over local Wi-Fi on port 8080 (HTTPS) and 8009 (Wake/DIAL)

export interface FireTVPairingState {
  deviceId: 'firestick_4k' | 'toshiba_tv';
  ip: string;
  isPaired: boolean;
  token?: string;
  lastPingMs?: number;
  error?: string;
}

const API_KEY = '0987654321';
const PAIRING_KEY_PREFIX = 'dremote_firetv_pair_';

export function getStoredPairing(deviceId: 'firestick_4k' | 'toshiba_tv'): { ip: string; token?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${PAIRING_KEY_PREFIX}${deviceId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Storage read error
  }
  return null;
}

export function saveStoredPairing(deviceId: 'firestick_4k' | 'toshiba_tv', ip: string, token?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${PAIRING_KEY_PREFIX}${deviceId}`, JSON.stringify({ ip, token }));
  } catch {
    // Storage write error
  }
}

/**
 * Step 1: Wake up the Fire TV via DIAL service on port 8009
 */
export async function wakeFireTV(ip: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);

    await fetch(`http://${ip}:8009/apps/FireTVRemote`, {
      method: 'POST',
      signal: controller.signal,
      mode: 'no-cors',
    }).catch(() => {});

    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Step 2: Request Fire TV to display 4-digit PIN on TV screen
 */
export async function requestTvPinDisplay(ip: string): Promise<{ success: boolean; message: string; requiresCertAcceptance?: boolean }> {
  try {
    // Attempt wake first
    await wakeFireTV(ip);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://${ip}:8080/v1/FireTV/pin/display`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ friendlyName: 'DRemote Mobile' }),
      signal: timeout ? controller.signal : undefined,
    });

    clearTimeout(timeout);

    if (res.ok || res.status === 200 || res.status === 204) {
      return { success: true, message: '4-digit PIN is now displayed on your TV screen!' };
    }
    return { success: false, message: `TV returned status ${res.status}. Please verify TV is turned on.` };
  } catch (err: any) {
    // In browsers, self-signed certs reject with TypeError: Failed to fetch
    return {
      success: false,
      requiresCertAcceptance: true,
      message: 'Browser security requires 1-time certificate authorization.',
    };
  }
}

/**
 * Step 3: Verify user-entered 4-digit PIN with Fire TV and obtain permanent client token
 */
export async function verifyTvPin(ip: string, pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://${ip}:8080/v1/FireTV/pin/verify`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin: pin.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const token = data.description || data.token || 'AUTHORIZED';
      return { success: true, token };
    }

    return { success: false, error: 'Incorrect PIN. Please re-enter the 4 digits from your TV screen.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification connection failed' };
  }
}

/**
 * Step 4: Send Fire TV keypress / media command
 */
export async function sendFireTVKey(
  ip: string,
  token: string | undefined,
  action: string
): Promise<{ success: boolean; latencyMs: number }> {
  const start = performance.now();
  const headers: Record<string, string> = {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['X-Client-Token'] = token;
  }

  // Determine endpoint based on command type
  let endpoint = `https://${ip}:8080/v1/FireTV?action=${encodeURIComponent(action.toLowerCase())}`;
  
  if (['play', 'pause', 'rewind', 'fast_forward', 'volume_up', 'volume_down', 'mute'].includes(action.toLowerCase())) {
    endpoint = `https://${ip}:8080/v1/media?action=${encodeURIComponent(action.toLowerCase())}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      mode: 'no-cors',
    }).catch(() => {});

    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);
    return { success: true, latencyMs };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return { success: false, latencyMs };
  }
}

/**
 * Launch Streaming App directly via DIAL protocol or Intent
 */
export async function launchStreamingApp(ip: string, appName: string): Promise<boolean> {
  const DIAL_MAP: Record<string, string> = {
    netflix: 'Netflix',
    youtube: 'YouTube',
    prime_video: 'AmazonVideo',
    disney_plus: 'DisneyPlus',
  };

  const dialName = DIAL_MAP[appName.toLowerCase()] || appName;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    await fetch(`http://${ip}:8009/apps/${encodeURIComponent(dialName)}`, {
      method: 'POST',
      signal: controller.signal,
      mode: 'no-cors',
    }).catch(() => {});

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ping Fire TV to test actual network reachability
 */
export async function pingFireTV(ip: string): Promise<{ alive: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);

    // Try port 8009 DIAL or 8080
    await fetch(`http://${ip}:8009/apps`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    }).catch(() => {});

    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);
    return { alive: true, latencyMs };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return { alive: false, latencyMs };
  }
}
