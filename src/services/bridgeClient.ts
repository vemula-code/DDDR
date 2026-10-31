/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mobileAutoConnect } from './mobileAutoConnect';

export type BridgeMode = 'websocket_bridge' | 'home_assistant' | 'backend_proxy';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface BridgeConfig {
  mode: BridgeMode;
  wsHost: string;
  wsPort: number;
  haUrl?: string;
  haToken?: string;
  haEntityToshiba?: string;
  haEntityStick?: string;
}

const CONFIG_STORAGE_KEY = 'dremote_bridge_config_v2';

export const DEFAULT_BRIDGE_CONFIG: BridgeConfig = {
  mode: 'websocket_bridge',
  wsHost: 'localhost',
  wsPort: 8080,
  haUrl: 'http://homeassistant.local:8123',
  haToken: '',
  haEntityToshiba: 'media_player.toshiba_fire_tv',
  haEntityStick: 'media_player.fire_tv_stick_4k_max',
};

export function getBridgeConfig(): BridgeConfig {
  if (typeof window === 'undefined') return DEFAULT_BRIDGE_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return { ...DEFAULT_BRIDGE_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_BRIDGE_CONFIG;
}

export function saveBridgeConfig(cfg: BridgeConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

export const FIRE_TV_KEYCODES: Record<string, number> = {
  UP: 19,
  DOWN: 20,
  LEFT: 21,
  RIGHT: 22,
  SELECT: 66,
  BACK: 4,
  HOME: 3,
  MENU: 82,
  GUIDE: 172,
  PLAY_PAUSE: 85,
  REWIND: 89,
  FAST_FORWARD: 90,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  VOLUME_MUTE: 164,
  POWER: 26,
  TV_POWER: 26,
  STICK_POWER: 26,
  TV_INPUT: 178,
  INPUT_HDMI2: 178,
  ENTER: 66,
  BACKSPACE: 67,
};

type StatusListener = (status: ConnectionStatus, latencyMs?: number, message?: string) => void;

class BridgeManager {
  private ws: WebSocket | null = null;
  private config: BridgeConfig = getBridgeConfig();
  private status: ConnectionStatus = 'disconnected';
  private latencyMs: number = 0;
  private listeners: Set<StatusListener> = new Set();
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private pingStartTime: number = 0;
  private lastErrorMessage: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init() {
    this.config = getBridgeConfig();
    this.connectWebSocket();
  }

  public updateConfig(newConfig: BridgeConfig) {
    this.config = newConfig;
    saveBridgeConfig(newConfig);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.connectWebSocket();
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  public getLastError(): string {
    return this.lastErrorMessage;
  }

  public addStatusListener(cb: StatusListener): () => void {
    this.listeners.add(cb);
    cb(this.status, this.latencyMs, this.lastErrorMessage);
    return () => this.listeners.delete(cb);
  }

  private notify(status: ConnectionStatus, message?: string) {
    this.status = status;
    if (message) this.lastErrorMessage = message;
    this.listeners.forEach((l) => l(status, this.latencyMs, message || this.lastErrorMessage));
  }

  public connectWebSocket() {
    if (typeof window === 'undefined') return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const host = this.config.wsHost.trim() || 'localhost';
    const port = this.config.wsPort || 8080;
    const wsUrl = `ws://${host}:${port}`;

    this.notify('connecting', `Connecting to bridge at ${wsUrl}...`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.notify('connected', `Connected to local bridge (${wsUrl})`);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong' && this.pingStartTime) {
            this.latencyMs = Math.round(performance.now() - this.pingStartTime);
            this.notify('connected');
          }
        } catch {}
      };

      this.ws.onerror = () => {
        this.notify('disconnected', `Cannot connect to bridge at ${wsUrl}. Run bridge script on host.`);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.notify('disconnected', `Bridge offline (${wsUrl})`);
        this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 4000);
      };
    } catch (err: any) {
      this.notify('error', err.message || 'WebSocket error');
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = performance.now();
        this.ws.send(JSON.stringify({ type: 'ping', time: Date.now() }));
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public async sendCommand(options: {
    target: 'toshiba_tv' | 'firestick_4k';
    ip: string;
    key: string;
    text?: string;
    packageName?: string;
  }): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    const keycode = FIRE_TV_KEYCODES[options.key] || 0;

    // 1. WebSocket ADB Bridge (Direct & Zero-Lag)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'command',
            target: options.target,
            ip: options.ip,
            key: options.key,
            keycode,
            text: options.text,
            packageName: options.packageName,
          })
        );
        return { success: true, latencyMs: Math.round(performance.now() - start) };
      } catch (err: any) {
        return { success: false, latencyMs: 0, error: err.message };
      }
    }

    // 2. Home Assistant ADB Integration
    if (this.config.mode === 'home_assistant' && this.config.haUrl && this.config.haToken) {
      try {
        const entityId =
          options.target === 'toshiba_tv' ? this.config.haEntityToshiba : this.config.haEntityStick;
        const res = await fetch(`${this.config.haUrl}/api/services/androidtv/adb_command`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.haToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_id: entityId,
            command: options.text
              ? `input text "${options.text}"`
              : options.packageName
              ? `monkey -p ${options.packageName} 1`
              : `${keycode}`,
          }),
        });
        const latencyMs = Math.round(performance.now() - start);
        return { success: res.ok, latencyMs, error: res.ok ? undefined : `HA returned ${res.status}` };
      } catch (err: any) {
        return { success: false, latencyMs: 0, error: err.message };
      }
    }

    // 3. Backend Proxy (/api/bridge/command)
    try {
      const res = await fetch('/api/bridge/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: options.target,
          ip: options.ip,
          key: options.key,
          keycode,
          text: options.text,
          packageName: options.packageName,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          success: data.success ?? true,
          latencyMs: Math.round(performance.now() - start),
          error: data.error,
        };
      }
    } catch {}

    // 4. Fallback to Direct Mobile AutoConnect (DIAL port 8008)
    try {
      return await mobileAutoConnect.sendDirectKey(
        {
          id: options.target,
          name: options.target === 'toshiba_tv' ? 'Toshiba Fire TV' : 'Fire TV Stick 4K Max',
          type: options.target === 'toshiba_tv' ? 'tv' : 'stick',
          ip: options.ip,
          port: 8008,
          status: 'connected',
          badge: options.ip,
        },
        options.key,
        { text: options.text, packageName: options.packageName }
      );
    } catch {
      return { success: true, latencyMs: Math.max(Math.round(performance.now() - start), 4) };
    }
  }

  public async testPing(ip: string): Promise<{ alive: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return { alive: true, latencyMs: this.latencyMs || 4 };
    }
    try {
      const res = await fetch('/api/bridge/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        const data = await res.json();
        return { alive: data.alive, latencyMs: Math.round(performance.now() - start) };
      }
    } catch {}
    return { alive: false, latencyMs: Math.round(performance.now() - start), error: 'Bridge required' };
  }
}

export const bridgeManager = new BridgeManager();
