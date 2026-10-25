/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoutingMode = 'smart_hybrid' | 'firestick_only' | 'toshiba_tv_only' | 'dual_sync';

export type TargetDeviceType = 'toshiba_tv' | 'firestick_4k';

export type ProtocolType = 'websocket' | 'http_rest' | 'web_bluetooth' | 'adb_bridge';

export interface DeviceState {
  id: TargetDeviceType;
  name: string;
  shortName: string;
  ip: string;
  port: number;
  adbPort: number;
  wsPort: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  power: 'on' | 'standby';
  volume: number; // 0 - 100
  muted: boolean;
  currentInput?: string; // For Toshiba TV: HDMI 1, HDMI 2 (Stick), HDMI 3, Live TV
  activeApp?: string; // For Firestick: Netflix, YouTube, Prime Video, Home, etc.
  memoryCapacity: string;
  color: string;
  lastCommandAt?: number;
}

export type RemoteKey =
  // Directional & Select
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'SELECT'
  // Navigation
  | 'BACK'
  | 'HOME'
  | 'MENU'
  | 'GUIDE'
  | 'RECENT'
  // Media Playback
  | 'PLAY_PAUSE'
  | 'REWIND'
  | 'FAST_FORWARD'
  | 'SKIP_BACK_10'
  | 'SKIP_FWD_10'
  // Volume & Power (TV primary)
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'VOLUME_MUTE'
  | 'POWER'
  | 'TV_POWER'
  | 'STICK_POWER'
  | 'TV_INPUT'
  | 'INPUT_HDMI1'
  | 'INPUT_HDMI2'
  | 'INPUT_HDMI3'
  | 'INPUT_LIVE_TV'
  | 'SETTINGS'
  | 'SLEEP'
  // Text & Keyboard
  | 'TEXT_STRING'
  | 'BACKSPACE'
  | 'ENTER'
  // App Launches
  | 'LAUNCH_APP';

export interface CommandLogEntry {
  id: string;
  timestamp: string;
  key: RemoteKey;
  label: string;
  targetDevice: TargetDeviceType | 'both';
  targetDeviceName: string;
  protocol: ProtocolType;
  status: 'success' | 'pending' | 'failed';
  latencyMs: number;
  payload: Record<string, unknown>;
}

export interface StreamingApp {
  id: string;
  name: string;
  packageName: string;
  iconBg: string;
  iconTextColor: string;
  badge?: string;
  logoUrl?: string;
}

export interface MacroAction {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  steps: {
    target: TargetDeviceType | 'both';
    key: RemoteKey;
    label: string;
    delayMs: number;
    param?: string | number;
  }[];
}
