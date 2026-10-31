/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Volume2, VolumeX, RefreshCw, Settings } from 'lucide-react';

interface CleanHeaderBarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled?: boolean;
  onToggleHaptics?: () => void;
  onRefreshWifi: () => void;
  isScanning: boolean;
  onOpenSettings: () => void;
  onOpenWizard?: () => void;
  bridgeConnected?: boolean;
}

export const CleanHeaderBar: React.FC<CleanHeaderBarProps> = ({
  soundEnabled,
  onToggleSound,
  onRefreshWifi,
  isScanning,
  onOpenSettings,
}) => {
  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-3 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-amber-500 p-0.5 shadow flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-xs bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
                D
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">DRemote</h1>
              <span className="text-[9px] bg-cyan-950/80 border border-cyan-800 text-cyan-400 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                FireTV
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Focused, Clean, Install App Made First */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* 1. INSTALL APP BUTTON: Prominent & First */}
          <PWAInstallButton />

          {/* 2. WI-FI SCAN / REFRESH */}
          <button
            onClick={onRefreshWifi}
            disabled={isScanning}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 active:scale-95 transition"
            title="Scan Wi-Fi for Fire TVs"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
          </button>

          {/* 3. SOUND TOGGLE: Defaults to Muted (VolumeX) */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 active:scale-95 transition"
            title={soundEnabled ? 'Click Sound: On' : 'Click Sound: Muted (Default)'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* 4. SETTINGS & BRIDGE OPTIONS */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 active:scale-95 transition"
            title="Device & Network Settings"
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
