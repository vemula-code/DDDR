/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { scanLocalNetworkForFireTVs, DiscoveredFireTV, probeFireTvIp } from '../services/subnetScanner';
import { FireTVDevice, saveDevices } from '../services/wifiDiscovery';
import {
  Wifi,
  Search,
  CheckCircle2,
  Tv,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Zap,
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
  const [progress, setProgress] = useState({ scanned: 0, total: 26 });
  const [foundDevices, setFoundDevices] = useState<DiscoveredFireTV[]>([]);
  const [manualIp, setManualIp] = useState('');
  const [manualTestResult, setManualTestResult] = useState<{ alive: boolean; latency?: number } | null>(null);
  const [isTestingManual, setIsTestingManual] = useState(false);

  const startScan = async () => {
    setIsScanning(true);
    setFoundDevices([]);
    setProgress({ scanned: 0, total: 26 });

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
    const tvDev = foundDevices.find((d) => d.type === 'tv' && d.ip !== stickDev.ip) || foundDevices[1] || stickDev;

    const newDevices: FireTVDevice[] = [
      {
        id: 'firestick_4k',
        name: 'Fire TV Stick 4K Max',
        type: 'stick',
        ip: stickDev.ip,
        port: 8008,
        status: 'connected',
        badge: `16GB (${stickDev.ip})`,
        lastPingMs: stickDev.responseTimeMs,
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
        lastPingMs: tvDev.responseTimeMs,
      },
    ];

    saveDevices(newDevices);
    onApplyDevices(newDevices);
    onClose();
  };

  const handleTestManualIp = async () => {
    if (!manualIp.trim()) return;
    setIsTestingManual(true);
    setManualTestResult(null);

    const res = await probeFireTvIp(manualIp.trim(), 800);
    setIsTestingManual(false);

    if (res) {
      setManualTestResult({ alive: true, latency: res.responseTimeMs });
      if (!foundDevices.some((d) => d.ip === res.ip)) {
        setFoundDevices((prev) => [res, ...prev]);
      }
    } else {
      setManualTestResult({ alive: false });
    }
  };

  const handleUseManualIp = (target: 'stick' | 'tv') => {
    if (!manualIp.trim()) return;
    const ip = manualIp.trim();

    const dev: DiscoveredFireTV = {
      ip,
      port: 8008,
      protocol: 'dial',
      name: target === 'stick' ? 'Fire TV Stick 4K Max' : 'Toshiba Fire TV',
      type: target,
      responseTimeMs: manualTestResult?.latency || 12,
    };

    setFoundDevices((prev) => [dev, ...prev.filter((d) => d.ip !== ip)]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Auto-Detect Fire TVs
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Fire TV Protocol
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scans Wi-Fi via DIAL (8008) and ADB (5555)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Status & Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`w-4 h-4 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`}
              />
              <span className="font-semibold text-slate-200">
                {isScanning ? 'Scanning home Wi-Fi...' : 'Scan Complete'}
              </span>
            </div>
            <span className="text-slate-400 font-mono">
              {progress.scanned} / {progress.total} checked
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((progress.scanned / Math.max(progress.total, 1)) * 100)
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Protocol: DIAL (8008) &amp; ADB (5555)</span>
            <button
              onClick={startScan}
              disabled={isScanning}
              className="text-cyan-400 hover:text-cyan-300 font-medium underline disabled:opacity-50"
            >
              Scan Again
            </button>
          </div>
        </div>

        {/* Found Devices List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Detected Devices on Wi-Fi</span>
            <span className="text-cyan-400 font-mono">
              {foundDevices.length} found
            </span>
          </div>

          {foundDevices.length === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Tv className="w-8 h-8 text-slate-600 stroke-[1.5]" />
              <p>
                {isScanning
                  ? 'Searching for Toshiba TV and Fire TV Stick 4K Max...'
                  : 'No Fire TV devices replied automatically.'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Make sure your TV is turned ON and connected to the same Wi-Fi. You can also enter the TV's IP below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {foundDevices.map((dev, idx) => (
                <div
                  key={dev.ip}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      {idx === 0 ? '4K' : 'TV'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {dev.name}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                          {dev.responseTimeMs}ms
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {dev.ip}:{dev.port} • Protocol: {dev.protocol.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick IP Input Helper (For quick pairing without waiting) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <label className="text-xs font-semibold text-slate-300 block">
            Already know your Fire TV's IP? (e.g. from TV Settings &gt; Network)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualIp}
              onChange={(e) => setManualIp(e.target.value)}
              placeholder="e.g. 192.168.1.106"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleTestManualIp}
              disabled={isTestingManual || !manualIp.trim()}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs disabled:opacity-50 transition"
            >
              {isTestingManual ? 'Testing...' : 'Test IP'}
            </button>
          </div>

          {manualTestResult && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span
                className={`font-medium ${
                  manualTestResult.alive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {manualTestResult.alive
                  ? `✓ Online! (${manualTestResult.latency}ms response)`
                  : '✕ No response on this IP. Check Wi-Fi.'}
              </span>
              {manualTestResult.alive && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleUseManualIp('stick')}
                    className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold"
                  >
                    Set as 4K Stick
                  </button>
                  <button
                    onClick={() => handleUseManualIp('tv')}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold"
                  >
                    Set as Toshiba TV
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex gap-2">
          {foundDevices.length > 0 && (
            <button
              onClick={handleApplyDiscovered}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition"
            >
              <Zap className="w-4 h-4" />
              <span>Connect &amp; Use Detected Devices</span>
            </button>
          )}

          <button
            onClick={onClose}
            className={`py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition ${
              foundDevices.length === 0 ? 'w-full' : ''
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
