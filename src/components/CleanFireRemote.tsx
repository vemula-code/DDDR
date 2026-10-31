/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FireTVDevice } from '../services/wifiDiscovery';
import { playClickSound, triggerHaptic } from '../utils/feedback';
import {
  Power,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Menu,
  Play,
  Pause,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Tv,
  Keyboard,
  Mic,
  SlidersHorizontal,
  Wifi,
  Sparkles,
  CheckCircle2,
  Search,
  Download,
  Zap,
  HelpCircle,
  FileCode,
} from 'lucide-react';

interface CleanFireRemoteProps {
  selectedDeviceId: 'firestick_4k' | 'toshiba_tv';
  onSelectDevice: (id: 'firestick_4k' | 'toshiba_tv') => void;
  devices: FireTVDevice[];
  onSendCommand: (cmd: string, label: string, targetOverride?: 'firestick_4k' | 'toshiba_tv') => void;
  onOpenKeyboard: () => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  tvCurrentInput?: string;
  tvVolume: number;
  onOpenPairing: (deviceId: 'firestick_4k' | 'toshiba_tv') => void;
  onOpenAutoDetect: () => void;
  onOpenWizard: () => void;
  bridgeStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  bridgeLatency?: number;
}

export const CleanFireRemote: React.FC<CleanFireRemoteProps> = ({
  selectedDeviceId,
  onSelectDevice,
  devices,
  onSendCommand,
  onOpenKeyboard,
  soundEnabled,
  hapticsEnabled,
  tvCurrentInput = 'HDMI 2',
  tvVolume,
  onOpenPairing,
  onOpenAutoDetect,
  onOpenWizard,
  bridgeStatus = 'disconnected',
  bridgeLatency = 0,
}) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastAction, setLastAction] = useState<string>('Ready');
  const [isPlaying, setIsPlaying] = useState(false);

  const activeDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];
  const isStick = selectedDeviceId === 'firestick_4k';

  const pressBtn = (cmd: string, label: string, targetOverride?: 'firestick_4k' | 'toshiba_tv') => {
    playClickSound('click', soundEnabled);
    triggerHaptic('light', hapticsEnabled);
    setIsTransmitting(true);
    setLastAction(label);
    if (cmd === 'PLAY_PAUSE') {
      setIsPlaying((p) => !p);
    }
    onSendCommand(cmd, label, targetOverride);
    setTimeout(() => setIsTransmitting(false), 200);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      {/* 1. TOP DEVICE SELECTOR PILLS (Simple for anyone to use!) */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-1.5 shadow-lg mb-3 flex items-center justify-between gap-1.5">
        <button
          onClick={() => {
            playClickSound('select', soundEnabled);
            onSelectDevice('firestick_4k');
          }}
          className={`flex-1 py-3 px-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
            isStick
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isStick ? 'bg-white' : 'bg-cyan-400'}`} />
            <span className="text-xs sm:text-sm tracking-tight">Fire TV Stick 4K</span>
          </div>
          <span className={`text-[10px] mt-0.5 ${isStick ? 'text-cyan-100' : 'text-slate-500'}`}>
            Fast 16GB (HDMI 2)
          </span>
        </button>

        <button
          onClick={() => {
            playClickSound('select', soundEnabled);
            onSelectDevice('toshiba_tv');
          }}
          className={`flex-1 py-3 px-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
            !isStick
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${!isStick ? 'bg-white' : 'bg-amber-400'}`} />
            <span className="text-xs sm:text-sm tracking-tight">Toshiba Fire TV</span>
          </div>
          <span className={`text-[10px] mt-0.5 ${!isStick ? 'text-amber-100' : 'text-slate-500'}`}>
            TV Display & Sound
          </span>
        </button>
      </div>

      {/* 2. AUTO-DISCOVERED WI-FI STATUS BADGE & AUTO-DETECT BUTTON */}
      <div className="w-full mb-3 flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400">
        <button
          onClick={() => onOpenPairing(selectedDeviceId)}
          className="flex items-center gap-1.5 font-semibold truncate hover:text-slate-200 transition text-left"
          title="Click to view or edit device IP"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              activeDevice.status === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className={`truncate ${activeDevice.status === 'connected' ? 'text-emerald-400' : 'text-amber-300'}`}>
            {activeDevice.status === 'connected'
              ? `Connected • ${activeDevice.name} (${activeDevice.ip})`
              : `Searching Wi-Fi • ${activeDevice.name}`}
          </span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onOpenAutoDetect}
            className="flex items-center gap-1 text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-xl font-bold transition active:scale-95 shadow-sm"
            title="Automatically scan home Wi-Fi and find your Fire TVs"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auto-Detect</span>
          </button>
        </div>
      </div>

      {/* 3. REALISTIC PHYSICAL FIRE TV REMOTE CHASSIS */}
      <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 rounded-[48px] p-5 sm:p-6 border-2 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center">
        {/* Top Section: Power, Alexa Glowing LED Ring, Input */}
        <div className="w-full flex items-center justify-between pb-3">
          {/* Quick TV Input Button */}
          <button
            onClick={() => pressBtn('INPUT_HDMI2', 'Switched to HDMI 2 (Stick)', 'toshiba_tv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 active:scale-95 transition shadow-sm"
            title="Switch TV Input to HDMI 2 for Firestick 4K Max"
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>HDMI 2</span>
          </button>

          {/* Cyan Alexa Status Glow Ring */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-3 rounded-full transition-all duration-150 ${
                isTransmitting
                  ? 'bg-cyan-400 shadow-[0_0_16px_#38bdf8]'
                  : 'bg-slate-800'
              }`}
            />
          </div>

          {/* Power Button */}
          <button
            onClick={() => pressBtn('POWER', 'Power Pressed', isStick ? 'firestick_4k' : 'toshiba_tv')}
            className="w-10 h-10 rounded-full bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 flex items-center justify-center text-red-400 active:scale-90 transition shadow-sm"
            title="Power"
          >
            <Power className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* If user is on Toshiba TV: Show big friendly "Switch to Firestick" button */}
        {!isStick && (
          <div className="w-full my-2 bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 p-3 rounded-2xl border border-amber-500/40 flex items-center justify-between gap-2 shadow-sm">
            <div className="text-left">
              <p className="text-xs font-bold text-white">Watch Fire TV Stick 4K?</p>
              <p className="text-[10px] text-slate-400">Switches Toshiba TV input to HDMI 2</p>
            </div>
            <button
              onClick={() => {
                pressBtn('INPUT_HDMI2', 'Switched to HDMI 2 (4K Max)', 'toshiba_tv');
                onSelectDevice('firestick_4k');
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <span>HDMI 2 (4K)</span>
            </button>
          </div>
        )}

        {/* 4. THE 5-WAY ERGONOMIC D-PAD RING */}
        <div className="relative my-3 w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center">
          {/* Outer circle bevel */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border-2 border-slate-750 shadow-inner" />

          {/* UP Button */}
          <button
            onClick={() => pressBtn('UP', 'Up', activeDevice.id)}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-16 rounded-t-full flex items-start justify-center pt-2.5 text-slate-300 hover:text-white active:scale-95 active:text-cyan-400 transition"
            aria-label="Up"
          >
            <ChevronUp className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* DOWN Button */}
          <button
            onClick={() => pressBtn('DOWN', 'Down', activeDevice.id)}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-16 rounded-b-full flex items-end justify-center pb-2.5 text-slate-300 hover:text-white active:scale-95 active:text-cyan-400 transition"
            aria-label="Down"
          >
            <ChevronDown className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* LEFT Button */}
          <button
            onClick={() => pressBtn('LEFT', 'Left', activeDevice.id)}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-16 h-20 rounded-l-full flex items-center justify-start pl-2.5 text-slate-300 hover:text-white active:scale-95 active:text-cyan-400 transition"
            aria-label="Left"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* RIGHT Button */}
          <button
            onClick={() => pressBtn('RIGHT', 'Right', activeDevice.id)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-16 h-20 rounded-r-full flex items-center justify-end pr-2.5 text-slate-300 hover:text-white active:scale-95 active:text-cyan-400 transition"
            aria-label="Right"
          >
            <ChevronRight className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* CENTER SELECT / OK BUTTON */}
          <button
            onClick={() => pressBtn('SELECT', 'Select', activeDevice.id)}
            className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-slate-750 via-slate-800 to-slate-900 border border-slate-600/70 text-white font-bold text-sm tracking-wider shadow-md flex items-center justify-center active:scale-90 hover:border-cyan-400 transition-all duration-100"
            aria-label="Select"
          >
            <span className="text-xs uppercase font-extrabold text-slate-100">OK</span>
          </button>
        </div>

        {/* 5. BACK, HOME, MENU */}
        <div className="w-full grid grid-cols-3 gap-3 my-2.5">
          <button
            onClick={() => pressBtn('BACK', 'Back', activeDevice.id)}
            className="flex flex-col items-center justify-center py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/70 shadow-sm active:scale-90 transition"
            title="Back"
          >
            <RotateCcw className="w-5 h-5 mb-0.5 text-slate-300" />
            <span className="text-[10px] text-slate-400">Back</span>
          </button>

          <button
            onClick={() => pressBtn('HOME', 'Home', activeDevice.id)}
            className="flex flex-col items-center justify-center py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/40 shadow-sm active:scale-90 transition"
            title="Fire TV Home"
          >
            <Home className="w-5 h-5 mb-0.5 text-cyan-400" />
            <span className="text-[10px] font-semibold text-cyan-300">Home</span>
          </button>

          <button
            onClick={() => pressBtn('MENU', 'Menu', activeDevice.id)}
            className="flex flex-col items-center justify-center py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/70 shadow-sm active:scale-90 transition"
            title="Options / Menu"
          >
            <Menu className="w-5 h-5 mb-0.5 text-slate-300" />
            <span className="text-[10px] text-slate-400">Menu</span>
          </button>
        </div>

        {/* 6. MEDIA PLAYBACK */}
        <div className="w-full grid grid-cols-3 gap-3 my-2">
          <button
            onClick={() => pressBtn('REWIND', 'Rewind (-10s)', isStick ? 'firestick_4k' : 'toshiba_tv')}
            className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 flex items-center justify-center active:scale-90 transition"
            title="Rewind"
          >
            <Rewind className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => pressBtn('PLAY_PAUSE', isPlaying ? 'Pause' : 'Play', isStick ? 'firestick_4k' : 'toshiba_tv')}
            className="py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 flex items-center justify-center active:scale-90 transition shadow-sm"
            title="Play / Pause"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-cyan-400" />
            ) : (
              <Play className="w-4 h-4 fill-cyan-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => pressBtn('FAST_FORWARD', 'Fast Forward (+10s)', isStick ? 'firestick_4k' : 'toshiba_tv')}
            className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 flex items-center justify-center active:scale-90 transition"
            title="Fast Forward"
          >
            <FastForward className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* 7. VOLUME CONTROLS */}
        <div className="w-full bg-slate-850/90 border border-slate-750 rounded-2xl p-2.5 my-2 flex items-center justify-between gap-2 shadow-sm">
          <button
            onClick={() => pressBtn('VOLUME_DOWN', 'Volume Down (-)', 'toshiba_tv')}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-lg flex items-center justify-center border border-slate-700 active:scale-90 transition"
            title="Volume Down"
          >
            -
          </button>

          <button
            onClick={() => pressBtn('VOLUME_MUTE', 'Mute TV', 'toshiba_tv')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 flex items-center justify-center border border-slate-700 active:scale-90 transition"
            title="Mute TV"
          >
            <VolumeX className="w-4 h-4" />
          </button>

          <button
            onClick={() => pressBtn('VOLUME_UP', 'Volume Up (+)', 'toshiba_tv')}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-lg flex items-center justify-center border border-slate-700 active:scale-90 transition"
            title="Volume Up"
          >
            +
          </button>
        </div>

        {/* 8. KEYBOARD & VOICE BUTTON */}
        <div className="w-full my-2">
          <button
            onClick={onOpenKeyboard}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-xs font-medium flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span>Type with Phone Keyboard / Voice</span>
          </button>
        </div>

        {/* 9. ONE-TAP APP SHORTCUTS */}
        <div className="w-full pt-2 border-t border-slate-800/80 mt-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">
            One-Tap Apps (Firestick 4K Max)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => pressBtn('LAUNCH_APP', 'Launched Prime Video', 'firestick_4k')}
              className="py-3 px-3 rounded-xl bg-[#002f6c] hover:bg-[#003b87] border border-blue-400/40 text-white text-xs font-bold tracking-tight shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span>prime video</span>
            </button>

            <button
              onClick={() => pressBtn('LAUNCH_APP', 'Launched Netflix', 'firestick_4k')}
              className="py-3 px-3 rounded-xl bg-black hover:bg-slate-900 border border-red-600/50 text-[#e50914] text-xs font-black tracking-wider shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span>NETFLIX</span>
            </button>

            <button
              onClick={() => pressBtn('LAUNCH_APP', 'Launched YouTube', 'firestick_4k')}
              className="py-3 px-3 rounded-xl bg-[#282828] hover:bg-[#333333] border border-red-500/40 text-white text-xs font-bold tracking-tight shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>YouTube</span>
            </button>

            <button
              onClick={() => pressBtn('LAUNCH_APP', 'Launched Disney+', 'firestick_4k')}
              className="py-3 px-3 rounded-xl bg-[#0b1437] hover:bg-[#121f52] border border-cyan-400/40 text-cyan-200 text-xs font-bold tracking-tight shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <span>Disney+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle feedback toast at the bottom */}
      <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>{lastAction}</span>
      </div>

      {/* 10. DOWNLOAD GUIDE & BRIDGE WIDGET CARD */}
      <div className="w-full mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                bridgeStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-200">
              {bridgeStatus === 'connected'
                ? `Bridge Connected (${bridgeLatency}ms)`
                : 'Mobile Wi-Fi Auto-Engine'}
            </span>
          </div>

          <button
            onClick={onOpenWizard}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            Setup &amp; Help
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Download to Desktop Link */}
          <a
            href="/AI_MIGRATION_GUIDE.md"
            download="AI_MIGRATION_GUIDE.md"
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-800/50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            title="Download full technical migration guide to desktop"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Guide to Desktop</span>
          </a>

          {/* Open Wizard */}
          <button
            onClick={onOpenWizard}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Bridge Scripts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
