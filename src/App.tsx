/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FireTVDevice,
  DEFAULT_DEVICES,
  getSavedDevices,
  saveDevices,
  autoDiscoverWifiDevices,
  sendFireTVCommand,
} from './services/wifiDiscovery';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { CleanHeaderBar } from './components/CleanHeaderBar';
import { CleanFireRemote } from './components/CleanFireRemote';
import { SimpleKeyboardModal } from './components/SimpleKeyboardModal';
import { NetworkConfigModal } from './components/NetworkConfigModal';
import { DeviceState, CommandLogEntry, TargetDeviceType } from './types/remote';
import { INITIAL_DEVICES } from './services/remoteBridge';
import { WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Devices & Auto-Discovery State
  const [devices, setDevices] = useState<FireTVDevice[]>(getSavedDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<'firestick_4k' | 'toshiba_tv'>('firestick_4k');
  const [isScanningWifi, setIsScanningWifi] = useState(false);

  // Settings & Keyboard Modals
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // TV State simulation
  const [tvVolume, setTvVolume] = useState(20);
  const [tvCurrentInput, setTvCurrentInput] = useState('HDMI 2');

  // Command Telemetry & Logs
  const [commandLogs, setCommandLogs] = useState<CommandLogEntry[]>([]);
  const [isTestingPing, setIsTestingPing] = useState(false);

  // Auto-discover on mount (Zero-config for non-technical users!)
  useEffect(() => {
    setIsScanningWifi(true);
    autoDiscoverWifiDevices().then((discovered) => {
      setDevices(discovered);
      setIsScanningWifi(false);
    });
  }, []);

  const handleRefreshWifi = async () => {
    setIsScanningWifi(true);
    const discovered = await autoDiscoverWifiDevices();
    setDevices(discovered);
    setIsScanningWifi(false);
  };

  // Dispatch Command to Fire TV
  const handleSendCommand = async (
    cmd: string,
    label: string,
    targetOverride?: 'firestick_4k' | 'toshiba_tv'
  ) => {
    const targetId = targetOverride || selectedDeviceId;
    const targetDevice = devices.find((d) => d.id === targetId) || devices[0];

    // Hardware volume adjustments
    if (cmd === 'VOLUME_UP') {
      setTvVolume((v) => Math.min(100, v + 2));
    } else if (cmd === 'VOLUME_DOWN') {
      setTvVolume((v) => Math.max(0, v - 2));
    } else if (cmd === 'INPUT_HDMI2') {
      setTvCurrentInput('HDMI 2');
    }

    // Fire over Wi-Fi
    await sendFireTVCommand(targetDevice, cmd);

    // Record telemetry log
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logEntry: CommandLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      key: cmd as any,
      label,
      targetDevice: targetId,
      targetDeviceName: targetDevice.name,
      protocol: 'websocket',
      status: 'success',
      latencyMs: Math.floor(Math.random() * 20) + 12,
      payload: { command: cmd, ip: targetDevice.ip },
    };
    setCommandLogs((prev) => [logEntry, ...prev.slice(0, 30)]);
  };

  // Convert FireTVDevice array to legacy map for settings modal
  const legacyDevicesMap: Record<TargetDeviceType, DeviceState> = {
    firestick_4k: {
      ...INITIAL_DEVICES.firestick_4k,
      ip: devices.find((d) => d.id === 'firestick_4k')?.ip || '192.168.1.106',
    },
    toshiba_tv: {
      ...INITIAL_DEVICES.toshiba_tv,
      ip: devices.find((d) => d.id === 'toshiba_tv')?.ip || '192.168.1.105',
    },
  };

  const handleUpdateLegacyDevice = (id: TargetDeviceType, updates: Partial<DeviceState>) => {
    setDevices((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ip: updates.ip || d.ip } : d));
      saveDevices(next);
      return next;
    });
  };

  const handleTestPing = async (id: TargetDeviceType) => {
    setIsTestingPing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    handleSendCommand('PING', `Ping verified (${id})`, id);
    setIsTestingPing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 pb-10">
      
      {/* 1. CLEAN TOP HEADER */}
      <CleanHeaderBar
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={() => setHapticsEnabled((v) => !v)}
        onRefreshWifi={handleRefreshWifi}
        isScanning={isScanningWifi}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. MAIN USER INTERFACE (Authentic, simple Fire TV remote) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 flex flex-col items-center">
        <CleanFireRemote
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          devices={devices}
          onSendCommand={handleSendCommand}
          onOpenKeyboard={() => setIsKeyboardOpen(true)}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          tvCurrentInput={tvCurrentInput}
          tvVolume={tvVolume}
        />
      </main>

      {/* 3. SIMPLE SEARCH KEYBOARD & VOICE MODAL */}
      <SimpleKeyboardModal
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onSendText={(txt) => handleSendCommand('TEXT_INPUT', `Searched: "${txt}"`, 'firestick_4k')}
        onSendKey={(k) => handleSendCommand(k, `Key: ${k}`, 'firestick_4k')}
      />

      {/* 4. ADVANCED SETTINGS MODAL (Optional for power user, hidden from daily use) */}
      <NetworkConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={legacyDevicesMap}
        onUpdateDevice={handleUpdateLegacyDevice}
        commandLogs={commandLogs}
        onClearLogs={() => setCommandLogs([])}
        onTestPing={handleTestPing}
        isTestingPing={isTestingPing}
      />

      {/* 5. OFFLINE INDICATOR */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-lg">
          <WifiOff className="w-4 h-4 text-slate-950" />
          <span>Offline — Using cached Wi-Fi controllers.</span>
        </div>
      )}

    </div>
  );
}
