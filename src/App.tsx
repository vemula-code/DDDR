/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FireTVDevice,
  getSavedDevices,
  saveDevices,
  autoDiscoverWifiDevices,
} from './services/wifiDiscovery';
import {
  getStoredPairing,
  saveStoredPairing,
  launchStreamingApp,
  pingFireTV,
} from './services/firetvRestApi';
import {
  bridgeManager,
  ConnectionStatus,
} from './services/bridgeClient';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { CleanHeaderBar } from './components/CleanHeaderBar';
import { CleanFireRemote } from './components/CleanFireRemote';
import { SimpleKeyboardModal } from './components/SimpleKeyboardModal';
import { FireTVPairingModal } from './components/FireTVPairingModal';
import { AutoDiscoveryModal } from './components/AutoDiscoveryModal';
import { NetworkConfigModal } from './components/NetworkConfigModal';
import { FireTVConnectionWizard } from './components/FireTVConnectionWizard';
import { DeviceState, CommandLogEntry, TargetDeviceType } from './types/remote';
import { INITIAL_DEVICES } from './services/remoteBridge';
import { WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Devices & Auto-Discovery State
  const [devices, setDevices] = useState<FireTVDevice[]>(getSavedDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<'firestick_4k' | 'toshiba_tv'>('firestick_4k');
  const [isScanningWifi, setIsScanningWifi] = useState(false);

  // Modals
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isAutoDiscoveryOpen, setIsAutoDiscoveryOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [pairingTargetId, setPairingTargetId] = useState<'firestick_4k' | 'toshiba_tv'>('firestick_4k');

  // Preferences (no sound by default)
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Bridge Status & Latency
  const [bridgeStatus, setBridgeStatus] = useState<ConnectionStatus>('disconnected');
  const [bridgeLatency, setBridgeLatency] = useState(0);

  // TV State simulation
  const [tvVolume, setTvVolume] = useState(20);
  const [tvCurrentInput, setTvCurrentInput] = useState('HDMI 3');

  // Command Telemetry & Logs
  const [commandLogs, setCommandLogs] = useState<CommandLogEntry[]>([]);
  const [isTestingPing, setIsTestingPing] = useState(false);

  // Subscribe to Bridge Manager
  useEffect(() => {
    const unsub = bridgeManager.addStatusListener((status, latency) => {
      setBridgeStatus(status);
      if (latency !== undefined) setBridgeLatency(latency);
    });
    return unsub;
  }, []);

  // Auto-discover on mount
  useEffect(() => {
    setIsScanningWifi(true);
    autoDiscoverWifiDevices().then((discovered) => {
      const synced = discovered.map((d) => {
        const stored = getStoredPairing(d.id);
        return stored ? { ...d, ip: stored.ip } : d;
      });
      setDevices(synced);
      setIsScanningWifi(false);
    });
  }, []);

  const handleRefreshWifi = () => {
    setIsAutoDiscoveryOpen(true);
  };

  // Convert UI Command Key to Fire TV Lightning REST Action
  const mapCommandToAction = (cmd: string): string => {
    switch (cmd) {
      case 'UP': return 'up';
      case 'DOWN': return 'down';
      case 'LEFT': return 'left';
      case 'RIGHT': return 'right';
      case 'SELECT': return 'select';
      case 'BACK': return 'back';
      case 'HOME': return 'home';
      case 'MENU': return 'menu';
      case 'PLAY_PAUSE': return 'play';
      case 'REWIND': return 'rewind';
      case 'FAST_FORWARD': return 'fast_forward';
      case 'VOLUME_UP': return 'volume_up';
      case 'VOLUME_DOWN': return 'volume_down';
      case 'VOLUME_MUTE': return 'mute';
      case 'POWER': return 'power';
      case 'INPUT_HDMI2':
      case 'INPUT_HDMI3': return 'source';
      default: return cmd.toLowerCase();
    }
  };

  // Primary Dispatch Command to Fire TV
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
    } else if (cmd === 'INPUT_HDMI3' || cmd === 'INPUT_HDMI2') {
      setTvCurrentInput('HDMI 3');
    }

    const action = mapCommandToAction(cmd);
    let appPackage: string | undefined;

    if (cmd === 'LAUNCH_APP') {
      if (label.includes('Netflix')) appPackage = 'com.netflix.ninja';
      else if (label.includes('Prime Video')) appPackage = 'com.amazon.amazonvideo.livingroom';
      else if (label.includes('YouTube')) appPackage = 'com.amazon.firetv.youtube';
      else if (label.includes('Disney+')) appPackage = 'com.disney.disneyplus';
      await launchStreamingApp(targetDevice.ip, label.replace('Launched ', ''));
    }

    // Dispatch via Bridge Client (WebSocket / ADB / DIAL / Express proxy)
    const result = await bridgeManager.sendCommand({
      target: targetId,
      ip: targetDevice.ip,
      key: cmd,
      packageName: appPackage,
      text: cmd === 'TEXT_INPUT' ? label.replace('Searched: "', '').replace('"', '') : undefined,
    });

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
      protocol: bridgeStatus === 'connected' ? 'adb_bridge' : 'direct_wifi',
      status: result.success ? 'success' : 'failed',
      latencyMs: result.latencyMs || Math.floor(Math.random() * 10) + 5,
      payload: { action, ip: targetDevice.ip, error: result.error },
    };
    setCommandLogs((prev) => [logEntry, ...prev.slice(0, 30)]);
  };

  // Legacy map for advanced settings modal
  const legacyDevicesMap: Record<TargetDeviceType, DeviceState> = {
    firestick_4k: {
      ...INITIAL_DEVICES.firestick_4k,
      ip: devices.find((d) => d.id === 'firestick_4k')?.ip || '192.168.1.156',
    },
    toshiba_tv: {
      ...INITIAL_DEVICES.toshiba_tv,
      ip: devices.find((d) => d.id === 'toshiba_tv')?.ip || '192.168.1.166',
    },
  };

  const handleUpdateLegacyDevice = (id: TargetDeviceType, updates: Partial<DeviceState>) => {
    setDevices((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ip: updates.ip || d.ip } : d));
      saveDevices(next);
      return next;
    });
    if (updates.ip) {
      saveStoredPairing(id, updates.ip);
    }
  };

  const handleTestPing = async (id: TargetDeviceType) => {
    setIsTestingPing(true);
    const dev = devices.find((d) => d.id === id);
    if (dev) {
      const res = await bridgeManager.testPing(dev.ip);
      handleSendCommand('PING', res.alive ? `Ping OK (${res.latencyMs}ms)` : `No response from ${dev.ip}`, id);
    }
    setIsTestingPing(false);
  };

  const handleOpenPairingModal = (deviceId: 'firestick_4k' | 'toshiba_tv') => {
    setPairingTargetId(deviceId);
    setIsPairingModalOpen(true);
  };

  const handleSavePairedDevice = (ip: string, token?: string) => {
    setDevices((prev) => {
      const next = prev.map((d) => (d.id === pairingTargetId ? { ...d, ip, status: 'connected' as const } : d));
      saveDevices(next);
      return next;
    });
    saveStoredPairing(pairingTargetId, ip, token);
  };

  const activeDeviceForPairing = devices.find((d) => d.id === pairingTargetId) || devices[0];

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
        onOpenWizard={() => setIsWizardOpen(true)}
        bridgeConnected={bridgeStatus === 'connected'}
      />

      {/* 2. MAIN USER INTERFACE (Authentic, simple Fire TV remote) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 flex flex-col items-center">
        <CleanFireRemote
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          devices={devices}
          onSendCommand={handleSendCommand}
          onOpenKeyboard={() => setIsKeyboardOpen(true)}
          onOpenPairing={handleOpenPairingModal}
          onOpenAutoDetect={() => setIsAutoDiscoveryOpen(true)}
          onOpenWizard={() => setIsWizardOpen(true)}
          bridgeStatus={bridgeStatus}
          bridgeLatency={bridgeLatency}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          tvCurrentInput={tvCurrentInput}
          tvVolume={tvVolume}
        />
      </main>

      {/* 3. AUTO-DISCOVERY WI-FI & RADAR MODAL */}
      <AutoDiscoveryModal
        isOpen={isAutoDiscoveryOpen}
        onClose={() => setIsAutoDiscoveryOpen(false)}
        onApplyDevices={(newDevs) => {
          setDevices(newDevs);
        }}
      />

      {/* 4. FIRE TV CONNECTION WIZARD & AI GUIDE DOWNLOAD MODAL */}
      <FireTVConnectionWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        devices={devices}
      />

      {/* 5. FIRE TV PAIRING & PIN CODE MODAL */}
      <FireTVPairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        deviceType={pairingTargetId}
        deviceName={activeDeviceForPairing.name}
        currentIp={activeDeviceForPairing.ip}
        onSaveIp={handleSavePairedDevice}
      />

      {/* 6. SIMPLE SEARCH KEYBOARD & VOICE MODAL */}
      <SimpleKeyboardModal
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onSendText={(txt) => handleSendCommand('TEXT_INPUT', `Searched: "${txt}"`, 'firestick_4k')}
        onSendKey={(k) => handleSendCommand(k, `Key: ${k}`, 'firestick_4k')}
      />

      {/* 7. ADVANCED SETTINGS MODAL */}
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

      {/* 8. OFFLINE INDICATOR */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-lg">
          <WifiOff className="w-4 h-4 text-slate-950" />
          <span>Offline — Using cached Wi-Fi controllers.</span>
        </div>
      )}
    </div>
  );
}
