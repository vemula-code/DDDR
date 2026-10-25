/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DeviceState } from '../types/remote';
import { Tv, Volume2, VolumeX, Radio, Sparkles, Play, Pause, Film } from 'lucide-react';

interface DualDeviceScreenPreviewProps {
  tvState: DeviceState;
  stickState: DeviceState;
  activeApp: string;
  cursorPosition: { row: number; col: number };
  isPlaying: boolean;
  volumeOSDVisible: boolean;
  onClose?: () => void;
}

export const DualDeviceScreenPreview: React.FC<DualDeviceScreenPreviewProps> = ({
  tvState,
  stickState,
  activeApp,
  cursorPosition,
  isPlaying,
  volumeOSDVisible,
}) => {
  const isStickActiveInput = tvState.currentInput?.includes('HDMI 2') || tvState.currentInput?.includes('Stick');

  const HOME_TILES = [
    ['Home', 'Find', 'Live', 'My Stuff'],
    ['Netflix', 'Prime Video', 'YouTube', 'Disney+'],
    ['Recent 1', 'Recent 2', 'Recent 3', 'Settings'],
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 p-0.5 flex items-center justify-center shadow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Tv className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Live Setup Monitor</h3>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Response
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive dual-screen preview of Toshiba TV & Firestick 4K Max
            </p>
          </div>
        </div>

        {/* Input & Routing pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">Toshiba TV Input:</span>
            <span className="font-semibold text-amber-400 font-mono">{tvState.currentInput || 'HDMI 2'}</span>
          </div>
        </div>
      </div>

      {/* THE PHYSICAL TV CHASSIS SIMULATION */}
      <div className="relative mx-auto w-full max-w-2xl bg-black rounded-2xl p-3 sm:p-4 border-4 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        
        {/* TV Top Brand Badge */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pb-2 px-1 font-mono">
          <span className="text-amber-500/80 font-bold tracking-widest uppercase">TOSHIBA FIRE TV EDITION</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-emerald-400">POWER ON</span>
          </div>
        </div>

        {/* TV SCREEN PANEL */}
        <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 sm:p-5 shadow-inner">
          
          {/* If Toshiba TV is set to HDMI 2 (Firestick 4K Max feed) */}
          {isStickActiveInput ? (
            <div className="relative w-full h-full flex flex-col justify-between">
              
              {/* Stick Top Bar */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-wider text-cyan-400 text-sm">fire tv</span>
                  <span className="text-[10px] font-semibold bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                    4K MAX (16GB)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span className="font-medium text-white">{activeApp}</span>
                  <span className="font-mono text-slate-400">1080p@60Hz HDR</span>
                </div>
              </div>

              {/* Stick Content Area (Interactive Grid showing D-pad cursor) */}
              <div className="my-auto py-2">
                <div className="flex items-center gap-1.5 mb-2 text-[10px] text-cyan-300">
                  <Sparkles className="w-3 h-3" />
                  <span>D-Pad Cursor Navigation:</span>
                </div>

                <div className="space-y-2">
                  {HOME_TILES.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-4 gap-2">
                      {row.map((item, cIdx) => {
                        const isFocused = cursorPosition.row === rIdx && cursorPosition.col === cIdx;
                        return (
                          <div
                            key={cIdx}
                            className={`p-2 rounded-xl text-center text-xs font-semibold transition-all duration-150 ${
                              isFocused
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105 border-2 border-white'
                                : 'bg-slate-900/90 text-slate-300 border border-slate-800/80'
                            }`}
                          >
                            <span className="truncate block">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Playback status footer on Stick */}
              <div className="flex items-center justify-between bg-slate-900/80 rounded-lg p-2 border border-slate-800 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  {isPlaying ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Play className="w-3.5 h-3.5 fill-emerald-400" />
                      <span>Playing 4K HDR Stream</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Pause className="w-3.5 h-3.5 fill-amber-400" />
                      <span>Paused</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">HDMI 2 CEC Active</span>
              </div>
            </div>
          ) : (
            // TV is showing another input (e.g. HDMI 1 or Live TV)
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
              <Radio className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
              <h4 className="text-base font-bold text-white">
                Toshiba TV: {tvState.currentInput}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Displaying internal TV source. To view your Fire TV Stick 4K Max, tap <strong>"Source"</strong> and select <strong>HDMI 2</strong>!
              </p>
            </div>
          )}

          {/* TV HARDWARE VOLUME OSD POPUP (Renders over any input, exactly like a real TV!) */}
          {volumeOSDVisible && (
            <div className="absolute top-4 right-4 z-30 bg-slate-950/90 border border-amber-500/60 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
              {tvState.muted ? (
                <VolumeX className="w-5 h-5 text-red-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-amber-400" />
              )}
              <div>
                <div className="flex items-center justify-between text-[10px] text-amber-300 font-mono font-bold mb-1">
                  <span>TOSHIBA TV VOLUME</span>
                  <span>{tvState.muted ? 'MUTED' : `${tvState.volume}%`}</span>
                </div>
                <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-150"
                    style={{ width: `${tvState.muted ? 0 : tvState.volume}%` }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* TV Bottom Chin & Stand */}
        <div className="mt-2 flex items-center justify-between px-2 text-[10px] text-slate-600">
          <span>TOSHIBA FIRE TV (4GB)</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>HDMI 2: Firestick 4K Max (16GB)</span>
          </span>
        </div>
      </div>

    </div>
  );
};
