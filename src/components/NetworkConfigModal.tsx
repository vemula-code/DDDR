/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CommandLogEntry, DeviceState, ProtocolType, TargetDeviceType } from '../types/remote';
import { generateLocalBridgeScript } from '../services/remoteBridge';
import {
  X,
  Wifi,
  Bluetooth,
  Terminal,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertCircle,
  HelpCircle,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface NetworkConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Record<TargetDeviceType, DeviceState>;
  onUpdateDevice: (id: TargetDeviceType, updates: Partial<DeviceState>) => void;
  commandLogs: CommandLogEntry[];
  onClearLogs: () => void;
  onTestPing: (id: TargetDeviceType) => Promise<void>;
  isTestingPing: boolean;
}

export const NetworkConfigModal: React.FC<NetworkConfigModalProps> = ({
  isOpen,
  onClose,
  devices,
  onUpdateDevice,
  commandLogs,
  onClearLogs,
  onTestPing,
  isTestingPing,
}) => {
  const [activeTab, setActiveTab] = useState<'devices' | 'bluetooth' | 'bridge_scripts' | 'packet_logs'>('devices');
  const [scriptLanguage, setScriptLanguage] = useState<'python' | 'node'>('python');
  const [copied, setCopied] = useState(false);
  const [btStatus, setBtStatus] = useState<string>('Ready to scan');
  const [isScanningBt, setIsScanningBt] = useState(false);

  if (!isOpen) return null;

  const scriptCode = generateLocalBridgeScript(scriptLanguage, devices);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const filename = scriptLanguage === 'python' ? 'dremote-bridge.py' : 'dremote-bridge.js';
    const blob = new Blob([scriptCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBluetoothPairing = async () => {
    const nav = navigator as any;
    if (typeof window === 'undefined' || !nav.bluetooth) {
      setBtStatus('Web Bluetooth is supported on Android Chrome, Edge, and Mac Chrome. (iOS Safari requires PWA Wi-Fi/WebSocket mode).');
      return;
    }

    try {
      setIsScanningBt(true);
      setBtStatus('Scanning for nearby Fire TV / Firestick BLE devices...');
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', '00001812-0000-1000-8000-00805f9b34fb'],
      });

      setBtStatus(`Discovered: "${device.name || 'Fire TV Device'}" (${device.id.slice(0, 8)}...). Connecting...`);
      const server = await device.gatt?.connect();
      if (server) {
        setBtStatus(`Successfully paired with ${device.name || 'Fire TV'}! Ready to send BLE HID keys.`);
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setBtStatus('Pairing cancelled by user.');
      } else {
        setBtStatus(`Bluetooth info: ${err.message || 'Device pairing standby.'}`);
      }
    } finally {
      setIsScanningBt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">DRemote Bridge & Network Setup</h3>
              <p className="text-xs text-slate-400">Manage device IP addresses, protocols & bridge scripts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Dual Devices (IPs)</span>
          </button>

          <button
            onClick={() => setActiveTab('bridge_scripts')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'bridge_scripts'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Local Bridge Daemon</span>
          </button>

          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'bluetooth'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>Web Bluetooth</span>
          </button>

          <button
            onClick={() => setActiveTab('packet_logs')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'packet_logs'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Packets ({commandLogs.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: DEVICE IP CONFIGURATION */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  Both your <strong>Toshiba Fire TV</strong> and <strong>Firestick 4K Max</strong> must be connected to the same Wi-Fi router. Enter their local IP addresses below (found on TV under <em>Settings &gt; My Fire TV &gt; About &gt; Network</em>).
                </p>
              </div>

              {/* Toshiba TV Card */}
              <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Device 1: Toshiba Fire TV Edition</h4>
                      <p className="text-[11px] text-slate-400">4 GB Internal RAM (Handles Power, Volume & HDMI Switcher)</p>
                    </div>
                  </div>
                  <button
                    disabled={isTestingPing}
                    onClick={() => onTestPing('toshiba_tv')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-medium transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingPing ? 'animate-spin' : ''}`} />
                    <span>Test Ping</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Local IP Address</label>
                    <input
                      type="text"
                      value={devices.toshiba_tv.ip}
                      onChange={(e) => onUpdateDevice('toshiba_tv', { ip: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">WebSocket Bridge Port</label>
                    <input
                      type="number"
                      value={devices.toshiba_tv.wsPort}
                      onChange={(e) => onUpdateDevice('toshiba_tv', { wsPort: parseInt(e.target.value) || 8080 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">ADB Wi-Fi Port</label>
                    <input
                      type="number"
                      value={devices.toshiba_tv.adbPort}
                      onChange={(e) => onUpdateDevice('toshiba_tv', { adbPort: parseInt(e.target.value) || 5555 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Firestick 4K Max Card */}
              <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Device 2: Fire TV Stick 4K Max</h4>
                      <p className="text-[11px] text-slate-400">16 GB Wi-Fi 6E (Handles D-Pad, Navigation, 4K Apps & Keyboard)</p>
                    </div>
                  </div>
                  <button
                    disabled={isTestingPing}
                    onClick={() => onTestPing('firestick_4k')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-medium transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingPing ? 'animate-spin' : ''}`} />
                    <span>Test Ping</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Local IP Address</label>
                    <input
                      type="text"
                      value={devices.firestick_4k.ip}
                      onChange={(e) => onUpdateDevice('firestick_4k', { ip: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">WebSocket Bridge Port</label>
                    <input
                      type="number"
                      value={devices.firestick_4k.wsPort}
                      onChange={(e) => onUpdateDevice('firestick_4k', { wsPort: parseInt(e.target.value) || 8080 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">ADB Wi-Fi Port</label>
                    <input
                      type="number"
                      value={devices.firestick_4k.adbPort}
                      onChange={(e) => onUpdateDevice('firestick_4k', { adbPort: parseInt(e.target.value) || 5555 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LOCAL BRIDGE DAEMON SCRIPT */}
          {activeTab === 'bridge_scripts' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-white mb-1">How Local WebSocket + ADB Control Works:</p>
                <p className="text-slate-400 leading-relaxed">
                  Fire TV uses standard Android ADB / WebSocket on port 5555/8080. If you want zero-lag physical key injection right from your browser or phone without rooting, run this 1-file script on any computer, Mac, or Raspberry Pi connected to your Wi-Fi!
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setScriptLanguage('python')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      scriptLanguage === 'python' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Python 3
                  </button>
                  <button
                    onClick={() => setScriptLanguage('node')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      scriptLanguage === 'node' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Node.js
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              <pre className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-64 leading-relaxed">
                {scriptCode}
              </pre>
            </div>
          )}

          {/* TAB 3: WEB BLUETOOTH */}
          {activeTab === 'bluetooth' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-white mb-1.5">
                  <Bluetooth className="w-4 h-4 text-blue-400" />
                  <span>Web Bluetooth Low Energy (BLE) Bridge</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Fire TV devices feature built-in Bluetooth receivers. You can pair your Android phone or Chrome browser directly as a Bluetooth Remote Controller without going through your local router!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                  <Bluetooth className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">Direct BLE Pairing</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{btStatus}</p>

                <button
                  disabled={isScanningBt}
                  onClick={handleBluetoothPairing}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>{isScanningBt ? 'Scanning for Fire TV...' : 'Scan & Pair Bluetooth Remote'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PACKET LOGS */}
          {activeTab === 'packet_logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Real-time transmitted keycodes & network packet telemetry:</span>
                <button
                  onClick={onClearLogs}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Clear Logs
                </button>
              </div>

              {commandLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-mono bg-slate-950 rounded-2xl border border-slate-800">
                  No packets transmitted yet. Press any remote button to see live packets!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {commandLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-500">{log.timestamp}</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            log.targetDevice === 'toshiba_tv'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : log.targetDevice === 'firestick_4k'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          {log.targetDevice === 'toshiba_tv' ? 'TOSHIBA TV' : log.targetDevice === 'firestick_4k' ? 'STICK 4K' : 'SYNC BOTH'}
                        </span>
                        <span className="text-white font-semibold truncate">{log.label}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-400">{log.protocol.toUpperCase()}</span>
                        <span className="text-emerald-400">{log.latencyMs}ms</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>DRemote Auto-Saves to Device LocalStorage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
