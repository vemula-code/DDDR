/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Wifi, Volume2, VolumeX, Vibrate, RefreshCw, Settings, CheckCircle2 } from 'lucide-react';

interface CleanHeaderBarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onRefreshWifi: () => void;
  isScanning: boolean;
  onOpenSettings: () => void;
}

export const CleanHeaderBar: React.FC<CleanHeaderBarProps> = ({
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  onRefreshWifi,
  isScanning,
  onOpenSettings,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-amber-500 p-0.5 shadow flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-xs bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
                D
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight">DRemote</h1>
              <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-400 px-1.5 py-0.2 rounded-full font-semibold">
                Dual FireTV
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* PWA Install */}
          <PWAInstallButton />

          {/* Wi-Fi Scan / Refresh */}
          <button
            onClick={onRefreshWifi}
            disabled={isScanning}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 active:scale-95 transition"
            title="Scan Wi-Fi for Fire TVs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 active:scale-95 transition"
            title={soundEnabled ? 'Click Sound: On' : 'Click Sound: Off'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Vibration Toggle */}
          <button
            onClick={onToggleHaptics}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 active:scale-95 transition"
            title={hapticsEnabled ? 'Vibration: On' : 'Vibration: Off'}
          >
            <Vibrate className={`w-3.5 h-3.5 ${hapticsEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
          </button>

          {/* Settings / Manual IP if needed */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 active:scale-95 transition"
            title="Device Settings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

      </div>
    </header>
  );
};
