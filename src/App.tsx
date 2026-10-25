/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CommandLogEntry,
  DeviceState,
  MacroAction,
  RemoteKey,
  RoutingMode,
  TargetDeviceType,
} from './types/remote';
import {
  INITIAL_DEVICES,
  getSmartTarget,
  getAndroidKeyCode,
} from './services/remoteBridge';
import { playClickSound, triggerHaptic } from './utils/feedback';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { HeaderBar } from './components/HeaderBar';
import { PhysicalRemote } from './components/PhysicalRemote';
import { TrackpadMode } from './components/TrackpadMode';
import { KeyboardInputMode } from './components/KeyboardInputMode';
import { AppLauncherMode } from './components/AppLauncherMode';
import { MacrosMode } from './components/MacrosMode';
import { DualDeviceScreenPreview } from './components/DualDeviceScreenPreview';
import { NetworkConfigModal } from './components/NetworkConfigModal';
import { MobileTestingModal } from './components/MobileTestingModal';
import {
  Tv,
  MousePointer,
  Keyboard,
  PlaySquare,
  Zap,
  Info,
  CheckCircle2,
  Sparkles,
  WifiOff,
  Smartphone,
} from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Load persisted devices or fallback to initial presets
  const [devices, setDevices] = useState<Record<TargetDeviceType, DeviceState>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dremote_devices');
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_DEVICES;
  });

  // Routing Mode: Smart Hybrid by default!
  const [routingMode, setRoutingMode] = useState<RoutingMode>('smart_hybrid');

  // Audio & Haptic preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Active Remote View Tab: 'remote' | 'trackpad' | 'keyboard' | 'apps' | 'macros'
  const [activeTab, setActiveTab] = useState<'remote' | 'trackpad' | 'keyboard' | 'apps' | 'macros'>('remote');

  // Preview visualizer state
  const [showPreview, setShowPreview] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileTestOpen, setIsMobileTestOpen] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);

  // Command Execution & Telemetry
  const [commandLogs, setCommandLogs] = useState<CommandLogEntry[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastTarget, setLastTarget] = useState<TargetDeviceType | 'both' | null>('firestick_4k');
  const [lastCommandLabel, setLastCommandLabel] = useState<string>('Ready');
  const [executingMacroId, setExecutingMacroId] = useState<string | null>(null);

  // Simulated TV & Stick internal state
  const [cursorPosition, setCursorPosition] = useState({ row: 0, col: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeApp, setActiveApp] = useState('Home Screen');
  const [volumeOSDVisible, setVolumeOSDVisible] = useState(false);
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save devices on changes
  useEffect(() => {
    try {
      localStorage.setItem('dremote_devices', JSON.stringify(devices));
    } catch {
      // Storage error
    }
  }, [devices]);

  // Handle TV Volume OSD hide timer
  const triggerVolumeOSD = () => {
    setVolumeOSDVisible(true);
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = setTimeout(() => {
      setVolumeOSDVisible(false);
    }, 2400);
  };

  // Primary Command Dispatcher
  const handleSendKey = (
    key: RemoteKey,
    label: string,
    customTarget?: TargetDeviceType | 'both',
    param?: string | number
  ) => {
    // 1. Determine Target Device based on Routing Mode & Key
    let target: TargetDeviceType | 'both' = 'firestick_4k';
    if (customTarget) {
      target = customTarget;
    } else if (routingMode === 'smart_hybrid') {
      target = getSmartTarget(key);
    } else if (routingMode === 'dual_sync') {
      target = 'both';
    } else if (routingMode === 'toshiba_tv_only') {
      target = 'toshiba_tv';
    } else {
      target = 'firestick_4k';
    }

    // 2. Audio & Haptics
    const isSpecial = key === 'SELECT' || key === 'POWER' || key === 'LAUNCH_APP';
    playClickSound(isSpecial ? 'select' : 'click', soundEnabled);
    triggerHaptic(isSpecial ? 'medium' : 'light', hapticsEnabled);

    // 3. Visual Transmission LED
    setIsTransmitting(true);
    setLastTarget(target);
    setLastCommandLabel(label);
    setTimeout(() => setIsTransmitting(false), 220);

    // 4. Update Simulated Hardware State
    if (target === 'toshiba_tv' || target === 'both') {
      setDevices((prev) => {
        const tv = { ...prev.toshiba_tv };
        if (key === 'VOLUME_UP') {
          tv.volume = Math.min(100, tv.volume + 2);
          tv.muted = false;
          triggerVolumeOSD();
        } else if (key === 'VOLUME_DOWN') {
          tv.volume = Math.max(0, tv.volume - 2);
          triggerVolumeOSD();
        } else if (key === 'VOLUME_MUTE') {
          tv.muted = !tv.muted;
          triggerVolumeOSD();
        } else if (key === 'INPUT_HDMI1') {
          tv.currentInput = 'HDMI 1';
        } else if (key === 'INPUT_HDMI2') {
          tv.currentInput = 'HDMI 2 (Stick)';
        } else if (key === 'INPUT_HDMI3') {
          tv.currentInput = 'HDMI 3';
        } else if (key === 'INPUT_LIVE_TV') {
          tv.currentInput = 'Live TV';
        } else if (key === 'TV_POWER' || key === 'POWER') {
          tv.power = tv.power === 'on' ? 'standby' : 'on';
        }
        return { ...prev, toshiba_tv: tv };
      });
    }

    if (target === 'firestick_4k' || target === 'both') {
      if (key === 'PLAY_PAUSE') {
        setIsPlaying((prev) => !prev);
      } else if (key === 'UP') {
        setCursorPosition((p) => ({ ...p, row: (p.row - 1 + 3) % 3 }));
      } else if (key === 'DOWN') {
        setCursorPosition((p) => ({ ...p, row: (p.row + 1) % 3 }));
      } else if (key === 'LEFT') {
        setCursorPosition((p) => ({ ...p, col: (p.col - 1 + 4) % 4 }));
      } else if (key === 'RIGHT') {
        setCursorPosition((p) => ({ ...p, col: (p.col + 1) % 4 }));
      } else if (key === 'HOME') {
        setActiveApp('Home Screen');
      } else if (key === 'LAUNCH_APP' && typeof param === 'string') {
        setActiveApp(param);
        setIsPlaying(true);
      }
    }

    // 5. Append to Packet Telemetry Log
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const latency = Math.floor(Math.random() * 24) + 12; // 12-36ms realistic Wi-Fi latency
    const targetName =
      target === 'toshiba_tv'
        ? devices.toshiba_tv.shortName
        : target === 'firestick_4k'
        ? devices.firestick_4k.shortName
        : 'Dual Sync';

    const logEntry: CommandLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      key,
      label,
      targetDevice: target,
      targetDeviceName: targetName,
      protocol: 'websocket',
      status: 'success',
      latencyMs: latency,
      payload: {
        keycode: getAndroidKeyCode(key),
        ip: target === 'toshiba_tv' ? devices.toshiba_tv.ip : devices.firestick_4k.ip,
        param,
      },
    };

    setCommandLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
  };

  // Execute multi-step Macro
  const handleExecuteMacro = async (macro: MacroAction) => {
    if (executingMacroId) return;
    setExecutingMacroId(macro.id);
    playClickSound('macro', soundEnabled);
    triggerHaptic('double', hapticsEnabled);

    for (const step of macro.steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delayMs));
      handleSendKey(step.key, step.label, step.target, step.param?.toString());
    }

    setExecutingMacroId(null);
  };

  // Test Ping to simulated/real device IP
  const handleTestPing = async (id: TargetDeviceType) => {
    setIsTestingPing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const device = devices[id];
    handleSendKey('GUIDE', `Ping Acknowledged (${device.ip})`, id);
    setIsTestingPing(false);
  };

  const handleUpdateDevice = (id: TargetDeviceType, updates: Partial<DeviceState>) => {
    setDevices((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16 selection:bg-cyan-500">
      
      {/* Top Header Bar */}
      <HeaderBar
        routingMode={routingMode}
        onSetRoutingMode={setRoutingMode}
        devices={devices}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={() => setHapticsEnabled((v) => !v)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        onOpenMobileTest={() => setIsMobileTestOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col items-center">
        
        {/* Quick Mobile Test Callout */}
        <div className="w-full max-w-2xl mb-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-800/40 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Want to control from your phone?</p>
              <p className="text-[11px] text-slate-400">Scan QR or open directly in iPhone Safari / Android Chrome</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileTestOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow active:scale-95 whitespace-nowrap"
          >
            <span>📱 Open Mobile QR</span>
          </button>
        </div>

        {/* Dual-Device Screen Preview (collapsible / toggleable) */}
        {showPreview && (
          <DualDeviceScreenPreview
            tvState={devices.toshiba_tv}
            stickState={devices.firestick_4k}
            activeApp={activeApp}
            cursorPosition={cursorPosition}
            isPlaying={isPlaying}
            volumeOSDVisible={volumeOSDVisible}
            onClose={() => setShowPreview(false)}
          />
        )}

        {/* Smart Routing Explanation Banner (when in Smart Hybrid Mode) */}
        {routingMode === 'smart_hybrid' && (
          <div className="w-full max-w-md mb-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-cyan-950/30 border border-slate-800 rounded-2xl p-2.5 px-3.5 flex items-center justify-between text-xs text-slate-300 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                <strong className="text-amber-400">TV</strong> handles Vol/Input/Power. <strong className="text-cyan-400">Stick 4K</strong> handles D-Pad & Apps!
              </span>
            </div>
            <span className="text-[10px] font-mono bg-slate-800/80 px-2 py-0.5 rounded-full text-slate-400">
              Zero-Swap
            </span>
          </div>
        )}

        {/* ACTIVE CONTROLLER VIEWPORT */}
        <div className="w-full flex justify-center">
          {activeTab === 'remote' && (
            <PhysicalRemote
              routingMode={routingMode}
              onSendKey={handleSendKey}
              lastTarget={lastTarget}
              lastCommandLabel={lastCommandLabel}
              isTransmitting={isTransmitting}
              tvCurrentInput={devices.toshiba_tv.currentInput}
              tvVolume={devices.toshiba_tv.volume}
              isPlaying={isPlaying}
            />
          )}

          {activeTab === 'trackpad' && (
            <TrackpadMode onSendKey={handleSendKey} />
          )}

          {activeTab === 'keyboard' && (
            <KeyboardInputMode onSendKey={handleSendKey} />
          )}

          {activeTab === 'apps' && (
            <AppLauncherMode onSendKey={handleSendKey} activeApp={activeApp} />
          )}

          {activeTab === 'macros' && (
            <MacrosMode
              onExecuteMacro={handleExecuteMacro}
              executingMacroId={executingMacroId}
            />
          )}
        </div>

      </main>

      {/* FIXED BOTTOM NAVIGATION BAR FOR REMOTE MODES */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 py-1.5 px-3">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          
          <button
            onClick={() => setActiveTab('remote')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'remote'
                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Remote</span>
          </button>

          <button
            onClick={() => setActiveTab('trackpad')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'trackpad'
                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Trackpad</span>
          </button>

          <button
            onClick={() => setActiveTab('keyboard')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'keyboard'
                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Keyboard</span>
          </button>

          <button
            onClick={() => setActiveTab('apps')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'apps'
                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlaySquare className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">4K Apps</span>
          </button>

          <button
            onClick={() => setActiveTab('macros')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'macros'
                ? 'text-cyan-400 bg-cyan-500/15 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Macros</span>
          </button>

        </div>
      </nav>

      {/* NETWORK / DEVICE CONFIG MODAL */}
      <NetworkConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        onUpdateDevice={handleUpdateDevice}
        commandLogs={commandLogs}
        onClearLogs={() => setCommandLogs([])}
        onTestPing={handleTestPing}
        isTestingPing={isTestingPing}
      />

      {/* MOBILE TESTING & QR CODE MODAL */}
      <MobileTestingModal
        isOpen={isMobileTestOpen}
        onClose={() => setIsMobileTestOpen(false)}
      />

      {/* OFFLINE INDICATOR (PWA requirement) */}
      {!isOnline && (
        <div className="fixed bottom-16 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-lg animate-in slide-in-from-bottom duration-200">
          <WifiOff className="w-4 h-4 text-slate-950" />
          <span>Offline Mode — Cached local bridge controls active.</span>
        </div>
      )}

    </div>
  );
}
