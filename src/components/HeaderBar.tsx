/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DeviceState, RoutingMode } from '../types/remote';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Tv,
  Wifi,
  Settings,
  Volume2,
  VolumeX,
  Vibrate,
  MonitorPlay,
  Layers,
  Sparkles,
  Smartphone,
} from 'lucide-react';

interface HeaderBarProps {
  routingMode: RoutingMode;
  onSetRoutingMode: (mode: RoutingMode) => void;
  devices: Record<string, DeviceState>;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onOpenSettings: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  onOpenMobileTest: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  routingMode,
  onSetRoutingMode,
  devices,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  onOpenSettings,
  showPreview,
  onTogglePreview,
  onOpenMobileTest,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Brand & Dual Device Connectivity Status */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-black text-xs tracking-wider bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
                  D
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center">
                  DRemote
                </h1>
                <span className="text-[10px] font-semibold tracking-wide bg-gradient-to-r from-cyan-500/20 to-amber-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded-full uppercase">
                  Dual-Bridge
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">Toshiba Fire TV + Stick 4K Max</p>
            </div>
          </div>

          {/* Quick status badges on mobile */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={onOpenMobileTest}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm transition active:scale-95"
              title="Open QR code and test on your iPhone or Android"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mobile QR</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 transition"
              title="Configure device IP addresses and bridge"
            >
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium hidden md:inline">TV</span>
              </div>
              <span className="text-slate-500">|</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-medium hidden md:inline">Stick 4K</span>
              </div>
            </button>

            {/* In-app PWA install trigger */}
            <PWAInstallButton />
          </div>
        </div>

        {/* Center / Right Control Toolbar: Routing Mode Tabs */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
          {/* Routing Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => onSetRoutingMode('smart_hybrid')}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                routingMode === 'smart_hybrid'
                  ? 'bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Smart Hybrid: Routes TV volume/power/input to Toshiba TV, and navigation/apps to Firestick 4K Max!"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Hybrid</span>
            </button>

            <button
              onClick={() => onSetRoutingMode('firestick_only')}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                routingMode === 'firestick_only'
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Route all commands solely to Fire TV Stick 4K Max (16GB)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Stick 4K</span>
            </button>

            <button
              onClick={() => onSetRoutingMode('toshiba_tv_only')}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                routingMode === 'toshiba_tv_only'
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Route all commands solely to Toshiba Fire TV (4GB)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>TV (4GB)</span>
            </button>

            <button
              onClick={() => onSetRoutingMode('dual_sync')}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                routingMode === 'dual_sync'
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Broadcast commands synchronously to both devices"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Sync Both</span>
            </button>
          </div>

          {/* Quick toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePreview}
              className={`p-1.5 rounded-lg border transition ${
                showPreview
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
              }`}
              title="Toggle Live Dual-Screen TV Preview Monitor"
            >
              <MonitorPlay className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border transition ${
                soundEnabled
                  ? 'bg-slate-800 text-cyan-400 border-slate-700'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={soundEnabled ? 'Click Sound: Enabled' : 'Click Sound: Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onToggleHaptics}
              className={`p-1.5 rounded-lg border transition ${
                hapticsEnabled
                  ? 'bg-slate-800 text-amber-400 border-slate-700'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={hapticsEnabled ? 'Haptic Vibration: On' : 'Haptic Vibration: Off'}
            >
              <Vibrate className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
              title="Device Bridge & Network Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
