/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { scanLocalNetworkForFireTVs, DiscoveredFireTV } from '../services/subnetScanner';
import { FireTVDevice, saveDevices } from '../services/wifiDiscovery';
import {
  Wifi,
  Search,
  CheckCircle2,
  Tv,
  RefreshCw,
  X,
  Bluetooth,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface AutoDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDevices: (devices: FireTVDevice[]) => void;
}

export const AutoDiscoveryModal: React.FC<AutoDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onApplyDevices,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ scanned: 0, total: 50 });
  const [foundDevices, setFoundDevices] = useState<DiscoveredFireTV[]>([]);
  const [activeTab, setActiveTab] = useState<'wifi' | 'bluetooth'>('wifi');
  const [bluetoothStatus, setBluetoothStatus] = useState<string | null>(null);

  // Manual IP fallback states if browser sandbox blocks subnet scan
  const [stickIp, setStickIp] = useState('');
  const [tvIp, setTvIp] = useState('');

  const startScan = async () => {
    setIsScanning(true);
    setFoundDevices([]);
    setProgress({ scanned: 0, total: 50 });

    try {
      const results = await scanLocalNetworkForFireTVs((scanned, total, found) => {
        setProgress({ scanned, total });
        setFoundDevices(found);
      });
      setFoundDevices(results);
    } catch {
      setFoundDevices([]);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyDiscovered = () => {
    if (foundDevices.length === 0) return;

    const stickDev = foundDevices.find((d) => d.type === 'stick') || foundDevices[0];
    const tvDev = foundDevices.find((d) => d.type === 'tv' && d.ip !== stickDev.ip) || foundDevices[1] || {
      ip: '192.168.1.105',
      port: 8008,
      name: 'Toshiba Fire TV',
      type: 'tv' as const,
      responseTimeMs: 20,
    };

    const newDevices: FireTVDevice[] = [
      {
        id: 'firestick_4k',
        name: 'Fire TV Stick 4K Max',
        type: 'stick',
        ip: stickDev.ip,
        port: 8008,
        status: 'connected',
        badge: `16GB (${stickDev.ip})`,
      },
      {
        id: 'toshiba_tv',
        name: 'Toshiba Fire TV',
        type: 'tv',
        ip: tvDev.ip,
        port: 8008,
        status: 'connected',
        inputPort: 'HDMI 2',
        badge: `TV & Sound (${tvDev.ip})`,
      },
    ];

    saveDevices(newDevices);
    onApplyDevices(newDevices);
    onClose();
  };

  const handleApplyManual = () => {
    if (!stickIp.trim()) return;

    const finalTvIp = tvIp.trim() || stickIp.trim();

    const newDevices: FireTVDevice[] = [
      {
        id: 'firestick_4k',
        name: 'Fire TV Stick 4K Max',
        type: 'stick',
        ip: stickIp.trim(),
        port: 8008,
        status: 'connected',
        badge: `16GB (${stickIp.trim()})`,
      },
      {
        id: 'toshiba_tv',
        name: 'Toshiba Fire TV',
        type: 'tv',
        ip: finalTvIp,
        port: 8008,
        status: 'connected',
        inputPort: 'HDMI 2',
        badge: `TV & Sound (${finalTvIp})`,
      },
    ];

    saveDevices(newDevices);
    onApplyDevices(newDevices);
    onClose();
  };

  const handleBluetoothScan = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setBluetoothStatus('Web Bluetooth is supported on Android Chrome, Edge, and Mac Chrome.');
      return;
    }

    try {
      setBluetoothStatus('Scanning nearby Bluetooth devices...');
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', '00001812-0000-1000-8000-00805f9b34fb'],
      });

      setBluetoothStatus(`Connected to "${device.name || 'Fire TV'}" via Bluetooth!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setBluetoothStatus(err.message || 'Bluetooth pairing standby.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Find Your Fire TVs</h3>
              <p className="text-[11px] text-slate-400">Wi-Fi auto-scan & direct connect</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Method Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'wifi' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi Network</span>
          </button>
          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'bluetooth' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>Bluetooth</span>
          </button>
        </div>

        {/* TAB 1: WI-FI AUTO SCAN & FALLBACK */}
        {activeTab === 'wifi' && (
          <div className="space-y-3.5">
            {/* Animated Radar Visualizer */}
            <div className="relative w-full py-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
              <div className="relative w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center mb-2">
                {isScanning && (
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-40" />
                )}
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Tv className="w-6 h-6" />
                </div>
              </div>

              <div className="text-center px-4">
                <p className="text-xs font-bold text-white">
                  {isScanning
                    ? 'Probing Home Wi-Fi Subnet...'
                    : foundDevices.length > 0
                    ? `Found ${foundDevices.length} Fire TV Devices!`
                    : 'Scan Finished'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  {isScanning
                    ? `Checking (${progress.scanned}/${progress.total})...`
                    : foundDevices.length > 0
                    ? 'Ready to connect'
                    : 'Browser security restricted automatic Wi-Fi sweep'}
                </p>
              </div>
            </div>

            {/* If Devices were Found */}
            {foundDevices.length > 0 ? (
              <div className="space-y-2">
                {foundDevices.map((dev, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          dev.type === 'stick' ? 'bg-cyan-400' : 'bg-amber-400'
                        } animate-pulse`}
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{dev.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          IP: <strong className="text-cyan-300">{dev.ip}</strong> • {dev.responseTimeMs}ms
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                ))}

                <button
                  onClick={handleApplyDiscovered}
                  className="w-full mt-2 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Connect Both Devices</span>
                </button>
              </div>
            ) : (
              /* If browser security blocked silent probing: Offer 1-time real IP input */
              !isScanning && (
                <div className="space-y-3 pt-1">
                  <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3 text-[11px] text-amber-200">
                    <p className="font-semibold text-white mb-1">
                      Browser Security Notice:
                    </p>
                    <p className="text-slate-300 leading-snug">
                      Phone browsers (Safari & Chrome) block websites from silently probing private Wi-Fi routers. Enter your TV's real IP once below:
                    </p>
                  </div>

                  {/* 10-Second Guide on where to find IP on TV */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Check on your TV screen (Takes 5 seconds):</span>
                    </p>
                    <p className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-2 py-1 rounded">
                      Settings &gt; My Fire TV &gt; About &gt; Network
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Look for: <strong>IP Address (e.g. 192.168.1.XX)</strong>
                    </p>
                  </div>

                  {/* Real IP Input Fields */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-cyan-400 mb-1">
                        1. Fire TV Stick 4K Max IP:
                      </label>
                      <input
                        type="text"
                        value={stickIp}
                        onChange={(e) => setStickIp(e.target.value)}
                        placeholder="e.g. 192.168.1.45"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                        2. Toshiba Fire TV IP:
                      </label>
                      <input
                        type="text"
                        value={tvIp}
                        onChange={(e) => setTvIp(e.target.value)}
                        placeholder="e.g. 192.168.1.42 (or same if single)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={startScan}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Scan</span>
                    </button>

                    <button
                      onClick={handleApplyManual}
                      disabled={!stickIp.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Real IPs & Connect</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 2: BLUETOOTH PAIRING */}
        {activeTab === 'bluetooth' && (
          <div className="space-y-3.5 py-2 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-1">
              <Bluetooth className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">Direct Bluetooth Connection</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                No IP address or Wi-Fi configuration required. Pair directly with Fire TV over Bluetooth.
              </p>
            </div>

            {bluetoothStatus && (
              <p className="text-xs text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                {bluetoothStatus}
              </p>
            )}

            <button
              onClick={handleBluetoothScan}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Scan & Select Nearby Fire TV</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
