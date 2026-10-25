/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RemoteKey, RoutingMode, TargetDeviceType } from '../types/remote';
import {
  Power,
  Tv,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Menu,
  Volume2,
  VolumeX,
  Play,
  Pause,
  FastForward,
  Rewind,
  SlidersHorizontal,
  Moon,
  Compass,
} from 'lucide-react';

interface PhysicalRemoteProps {
  routingMode: RoutingMode;
  onSendKey: (key: RemoteKey, label: string, customTarget?: TargetDeviceType | 'both') => void;
  lastTarget: TargetDeviceType | 'both' | null;
  lastCommandLabel: string;
  isTransmitting: boolean;
  tvCurrentInput?: string;
  tvVolume: number;
  isPlaying: boolean;
}

export const PhysicalRemote: React.FC<PhysicalRemoteProps> = ({
  routingMode,
  onSendKey,
  lastTarget,
  lastCommandLabel,
  isTransmitting,
  tvCurrentInput = 'HDMI 2 (Stick)',
  tvVolume,
  isPlaying,
}) => {
  const [showInputSelector, setShowInputSelector] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);

  // Determine LED beam color
  const getLedColor = () => {
    if (!isTransmitting) return 'bg-slate-700 opacity-30 shadow-none';
    if (lastTarget === 'toshiba_tv') return 'bg-amber-400 shadow-[0_0_16px_#f59e0b] animate-ping';
    if (lastTarget === 'firestick_4k') return 'bg-cyan-400 shadow-[0_0_16px_#06b6d4] animate-ping';
    return 'bg-purple-400 shadow-[0_0_16px_#c084fc] animate-ping';
  };

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[360px] mx-auto bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 rounded-[44px] p-5 border border-slate-800/90 remote-chassis shadow-2xl flex flex-col items-center">
      
      {/* Top Infrared / Bluetooth Dual Emitter Node */}
      <div className="w-full flex items-center justify-between px-3 pt-1 pb-4">
        {/* Input Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowInputSelector(!showInputSelector)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 text-slate-200 text-xs font-medium transition active:scale-95 shadow-sm"
            title="Switch TV Input (Toshiba Fire TV)"
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[85px]">{tvCurrentInput.replace(' (Stick)', '')}</span>
          </button>

          {/* Quick Input Dropdown */}
          {showInputSelector && (
            <div className="absolute left-0 top-10 z-40 w-48 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Toshiba TV Inputs
              </div>
              <button
                onClick={() => {
                  onSendKey('INPUT_HDMI2', 'Switch to HDMI 2 (Firestick)', 'toshiba_tv');
                  setShowInputSelector(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 flex items-center justify-between"
              >
                <span>HDMI 2 (Stick 4K)</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </button>
              <button
                onClick={() => {
                  onSendKey('INPUT_HDMI1', 'Switch to HDMI 1', 'toshiba_tv');
                  setShowInputSelector(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
              >
                HDMI 1 (Console/PC)
              </button>
              <button
                onClick={() => {
                  onSendKey('INPUT_HDMI3', 'Switch to HDMI 3', 'toshiba_tv');
                  setShowInputSelector(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
              >
                HDMI 3
              </button>
              <button
                onClick={() => {
                  onSendKey('INPUT_LIVE_TV', 'Switch to Live TV / Antenna', 'toshiba_tv');
                  setShowInputSelector(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
              >
                Live TV / Antenna
              </button>
            </div>
          )}
        </div>

        {/* Dual LED Transmission Node */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-3.5 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center gap-1.5 px-2">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-150 ${getLedColor()}`}
              title="Dual-beam transmitter"
            />
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                isTransmitting ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-800'
              }`}
            />
          </div>
          <span className="text-[9px] text-slate-500 mt-0.5 tracking-widest font-mono">
            {routingMode === 'smart_hybrid' ? 'HYBRID' : routingMode === 'dual_sync' ? 'SYNC' : 'SINGLE'}
          </span>
        </div>

        {/* Power Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowPowerMenu(!showPowerMenu)}
            className="w-9 h-9 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-700/60 flex items-center justify-center text-red-400 transition active:scale-95 shadow-sm"
            title="Power Controls"
          >
            <Power className="w-4 h-4" />
          </button>

          {showPowerMenu && (
            <div className="absolute right-0 top-10 z-40 w-44 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Power State
              </div>
              <button
                onClick={() => {
                  onSendKey('TV_POWER', 'Toggle Toshiba TV Power', 'toshiba_tv');
                  setShowPowerMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-500/20 flex items-center justify-between"
              >
                <span>Toshiba TV Power</span>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </button>
              <button
                onClick={() => {
                  onSendKey('STICK_POWER', 'Toggle Stick 4K Sleep', 'firestick_4k');
                  setShowPowerMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-cyan-300 hover:bg-cyan-500/20 flex items-center justify-between"
              >
                <span>Stick 4K Sleep</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </button>
              <button
                onClick={() => {
                  onSendKey('POWER', 'All Power Off', 'both');
                  setShowPowerMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/60 border-t border-slate-800 mt-1 pt-1.5"
              >
                Power Off Both
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Macro / Helper strip */}
      <div className="w-full flex items-center justify-between gap-2 px-2 py-2 mb-3">
        <button
          onClick={() => onSendKey('TV_INPUT', 'TV Input', 'toshiba_tv')}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition"
          title="Source / Input Switcher (Toshiba TV)"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Source</span>
        </button>

        <button
          onClick={() => onSendKey('SETTINGS', 'TV Picture Settings', 'toshiba_tv')}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition"
          title="Picture / Display Settings (Toshiba TV)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span>Picture</span>
        </button>

        <button
          onClick={() => onSendKey('SLEEP', 'Sleep Timer 30m', 'toshiba_tv')}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition"
          title="Sleep Timer (Toshiba TV)"
        >
          <Moon className="w-3.5 h-3.5 text-purple-400" />
          <span>Sleep</span>
        </button>
      </div>

      {/* 5-WAY PRECISION D-PAD (Primary Navigation - Routes to Firestick 4K Max!) */}
      <div className="relative my-2 w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] flex items-center justify-center">
        {/* Outer Circular Ring Bezel */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border-2 border-slate-700/80 dpad-ring" />

        {/* UP Direction */}
        <button
          onClick={() => onSendKey('UP', 'Up')}
          className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-16 rounded-t-full flex items-start justify-center pt-2.5 text-slate-300 hover:text-white hover:bg-slate-700/30 active:scale-95 active:bg-cyan-500/20 transition remote-btn"
          aria-label="Up"
        >
          <ChevronUp className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* DOWN Direction */}
        <button
          onClick={() => onSendKey('DOWN', 'Down')}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-16 rounded-b-full flex items-end justify-center pb-2.5 text-slate-300 hover:text-white hover:bg-slate-700/30 active:scale-95 active:bg-cyan-500/20 transition remote-btn"
          aria-label="Down"
        >
          <ChevronDown className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* LEFT Direction */}
        <button
          onClick={() => onSendKey('LEFT', 'Left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-16 h-20 rounded-l-full flex items-center justify-start pl-2.5 text-slate-300 hover:text-white hover:bg-slate-700/30 active:scale-95 active:bg-cyan-500/20 transition remote-btn"
          aria-label="Left"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* RIGHT Direction */}
        <button
          onClick={() => onSendKey('RIGHT', 'Right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-16 h-20 rounded-r-full flex items-center justify-end pr-2.5 text-slate-300 hover:text-white hover:bg-slate-700/30 active:scale-95 active:bg-cyan-500/20 transition remote-btn"
          aria-label="Right"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* CENTER SELECT / OK BUTTON */}
        <button
          onClick={() => onSendKey('SELECT', 'Select / OK')}
          className="relative z-10 w-[96px] h-[96px] rounded-full bg-gradient-to-br from-slate-750 via-slate-800 to-slate-900 border-2 border-slate-600/60 hover:border-cyan-400/80 text-white font-bold text-sm tracking-wide shadow-inner flex flex-col items-center justify-center transition-all duration-100 active:scale-90 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] remote-btn"
          aria-label="Select"
        >
          <span className="text-xs uppercase tracking-wider text-slate-200 font-bold">SELECT</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shadow-[0_0_6px_#06b6d4]" />
        </button>
      </div>

      {/* CORE NAVIGATION TRIO: Back, Home, Menu */}
      <div className="w-full grid grid-cols-3 gap-3 px-3 my-4">
        {/* BACK Button */}
        <button
          onClick={() => onSendKey('BACK', 'Back')}
          className="flex flex-col items-center justify-center py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition active:scale-95 remote-btn shadow-sm"
          title="Back"
        >
          <RotateCcw className="w-4 h-4 text-slate-300 mb-0.5" />
          <span className="text-[10px] font-medium text-slate-400">Back</span>
        </button>

        {/* HOME Button */}
        <button
          onClick={() => onSendKey('HOME', 'Home')}
          className="flex flex-col items-center justify-center py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition active:scale-95 remote-btn shadow-sm"
          title="Fire TV Home"
        >
          <Home className="w-4 h-4 text-cyan-400 mb-0.5" />
          <span className="text-[10px] font-semibold text-cyan-300">Home</span>
        </button>

        {/* MENU Button */}
        <button
          onClick={() => onSendKey('MENU', 'Menu / Options')}
          className="flex flex-col items-center justify-center py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition active:scale-95 remote-btn shadow-sm"
          title="Menu / Options"
        >
          <Menu className="w-4 h-4 text-slate-300 mb-0.5" />
          <span className="text-[10px] font-medium text-slate-400">Menu</span>
        </button>
      </div>

      {/* VOLUME & MEDIA CONTROLS ROW */}
      <div className="w-full grid grid-cols-2 gap-3 px-3 my-1">
        
        {/* VOLUME ROCKER CARD (Toshiba TV) */}
        <div className="bg-slate-850/80 border border-slate-700/60 rounded-2xl p-2.5 flex flex-col items-center justify-between shadow-sm">
          <div className="w-full flex items-center justify-between text-[10px] text-amber-400/90 font-medium px-1 mb-1">
            <span>TV VOL</span>
            <span className="font-mono">{tvVolume}%</span>
          </div>

          <div className="w-full flex items-center justify-between gap-1">
            <button
              onClick={() => onSendKey('VOLUME_DOWN', 'Volume Down', 'toshiba_tv')}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/50 flex items-center justify-center font-bold text-base active:scale-95 transition"
              title="Volume Down"
            >
              -
            </button>

            <button
              onClick={() => onSendKey('VOLUME_MUTE', 'Mute TV', 'toshiba_tv')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 flex items-center justify-center active:scale-95 transition"
              title="Mute TV"
            >
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={() => onSendKey('VOLUME_UP', 'Volume Up', 'toshiba_tv')}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/50 flex items-center justify-center font-bold text-base active:scale-95 transition"
              title="Volume Up"
            >
              +
            </button>
          </div>
        </div>

        {/* MEDIA PLAYBACK CARD (Firestick 4K Max) */}
        <div className="bg-slate-850/80 border border-slate-700/60 rounded-2xl p-2.5 flex flex-col items-center justify-between shadow-sm">
          <div className="w-full flex items-center justify-between text-[10px] text-cyan-400/90 font-medium px-1 mb-1">
            <span>4K PLAYBACK</span>
            <span className="font-mono text-[9px] uppercase">{isPlaying ? 'PLAY' : 'PAUSE'}</span>
          </div>

          <div className="w-full flex items-center justify-between gap-1">
            <button
              onClick={() => onSendKey('REWIND', 'Rewind (-10s)')}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 flex items-center justify-center active:scale-95 transition"
              title="Rewind"
            >
              <Rewind className="w-3.5 h-3.5 text-cyan-300" />
            </button>

            <button
              onClick={() => onSendKey('PLAY_PAUSE', isPlaying ? 'Pause' : 'Play')}
              className="flex-1 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center active:scale-95 transition shadow"
              title="Play / Pause"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-cyan-400" /> : <Play className="w-4 h-4 fill-cyan-400 ml-0.5" />}
            </button>

            <button
              onClick={() => onSendKey('FAST_FORWARD', 'Fast Forward (+10s)')}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 flex items-center justify-center active:scale-95 transition"
              title="Fast Forward"
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          </div>
        </div>

      </div>

      {/* TRANSMISSION TELEMETRY BADGE */}
      <div className="w-full mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="truncate">
            {lastCommandLabel ? `Last: ${lastCommandLabel}` : 'Ready for command'}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] font-mono uppercase text-slate-500">Target:</span>
          {lastTarget === 'toshiba_tv' ? (
            <span className="text-amber-400 font-semibold text-[10px]">Toshiba TV</span>
          ) : lastTarget === 'firestick_4k' ? (
            <span className="text-cyan-400 font-semibold text-[10px]">Stick 4K Max</span>
          ) : lastTarget === 'both' ? (
            <span className="text-purple-400 font-semibold text-[10px]">Dual Sync</span>
          ) : (
            <span className="text-slate-400 text-[10px]">Auto-Route</span>
          )}
        </div>
      </div>

    </div>
  );
};
