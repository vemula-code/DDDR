/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { POPULAR_APPS } from '../services/remoteBridge';
import { RemoteKey, TargetDeviceType } from '../types/remote';
import { PlaySquare, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

interface AppLauncherModeProps {
  onSendKey: (key: RemoteKey, label: string, customTarget?: TargetDeviceType | 'both', param?: string) => void;
  activeApp?: string;
}

export const AppLauncherMode: React.FC<AppLauncherModeProps> = ({ onSendKey, activeApp }) => {
  return (
    <div className="w-full max-w-[360px] mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
            <PlaySquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">1-Tap App Launcher</h3>
            <p className="text-[11px] text-slate-400">Directly launched on Firestick 4K Max (16GB)</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3 text-cyan-400" />
          <span>Fast 16GB</span>
        </div>
      </div>

      {/* Notice why Stick is used for apps */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-400 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p>
          Apps open on your <strong>Firestick 4K Max</strong> so you bypass the slow 4GB internal Toshiba TV RAM and enjoy full 4K HDR & Wi-Fi 6 speed.
        </p>
      </div>

      {/* Grid of streaming apps */}
      <div className="grid grid-cols-2 gap-2.5">
        {POPULAR_APPS.map((app) => {
          const isActive = activeApp?.toLowerCase() === app.name.toLowerCase();
          return (
            <button
              key={app.id}
              onClick={() => onSendKey('LAUNCH_APP', `Launch ${app.name}`, 'firestick_4k', app.name)}
              className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-95 shadow-sm ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0"
                  style={{ backgroundColor: app.iconBg, color: app.iconTextColor }}
                >
                  {app.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300">
                    {app.name}
                  </h4>
                  {app.badge && (
                    <span className="text-[9px] text-slate-400 font-mono">
                      {app.badge}
                    </span>
                  )}
                </div>
              </div>

              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 ml-1 transition" />
            </button>
          );
        })}
      </div>

    </div>
  );
};
