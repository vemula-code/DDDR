/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { scanLocalNetworkForFireTVs, DiscoveredFireTV, probeFireTvIp } from '../services/subnetScanner';
import { FireTVDevice, saveDevices, sendDialCommandViaForm } from '../services/wifiDiscovery';
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
  Play,
  Power,
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
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const startScan = async () => {
    setIsScanning(true);
    setFoundDevices([]);
    setProgress({ scanned: 0, total: 30 });

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
      showToast(`Toshiba TV responded in ${res.responseTimeMs}ms!`);
    } else {
      setManualTestResult({ alive: false });
      showToast('No response yet. Try sending a Wake pulse or check the IP.');
    }
  };

  // Direct Live Commands to Toshiba TV
  const handleDirectTvWake = (ipToUse: string) => {
    const ip = ipToUse.trim();
    if (!ip) return;
    sendDialCommandViaForm(ip, 'system');
    showToast(`Sent Wake Pulse to ${ip}! Look at your TV.`);
  };

  const handleDirectTvYouTube = (ipToUse: string) => {
    const ip = ipToUse.trim();
    if (!ip) return;
    sendDialCommandViaForm(ip, 'YouTube');
    showToast(`Launching YouTube on TV (${ip})!`);
  };

  const handleUseAsToshibaTv = (ipToUse: string) => {
    const ip = ipToUse.trim();
    if (!ip) return;

    const currentSaved = [
      {
        id: 'firestick_4k' as const,
        name: 'Fire TV Stick 4K Max',
        type: 'stick' as const,
        ip: '192.168.1.106',
        port: 8008,
        status: 'searching' as const,
        badge: '16GB (HDMI 2)',
      },
      {
        id: 'toshiba_tv' as const,
        name: 'Toshiba Fire TV',
        type: 'tv' as const,
        ip,
        port: 8008,
        status: 'connected' as const,
        inputPort: 'HDMI 2',
        badge: `TV & Sound (${ip})`,
        lastPingMs: manualTestResult?.latency || 12,
      },
    ];

    saveDevices(currentSaved);
    onApplyDevices(currentSaved);
    showToast(`Toshiba TV set to ${ip}!`);
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Toshiba Fire TV Auto-Detect
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  DIAL &amp; ADB
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Works across 2.4GHz &amp; 5GHz Wi-Fi on same router
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

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* STEP 1: DIRECT TOSHIBA TV TEST (FIRST STEP) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/40 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Step 1: Test Toshiba Fire TV First
              </h4>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-700/50">
              Recommended
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Find your Toshiba TV's IP in: <strong className="text-white">Settings &gt; My Fire TV &gt; About &gt; Network</strong>. Enter it here to test it instantly:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualIp}
              onChange={(e) => setManualIp(e.target.value)}
              placeholder="e.g. 192.168.1.105 (or your TV's IP)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleTestManualIp}
              disabled={isTestingManual || !manualIp.trim()}
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs disabled:opacity-50 transition"
            >
              {isTestingManual ? 'Testing...' : 'Test IP'}
            </button>
          </div>

          {/* Test Buttons that fire real DIAL commands immediately */}
          {manualIp.trim() && (
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                onClick={() => handleDirectTvWake(manualIp)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-600/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Wake TV</span>
              </button>

              <button
                onClick={() => handleDirectTvYouTube(manualIp)}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/50 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
              >
                <Play className="w-3.5 h-3.5 fill-red-400" />
                <span>Launch YouTube</span>
              </button>

              <button
                onClick={() => handleUseAsToshibaTv(manualIp)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition ml-auto shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save as Toshiba TV</span>
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: MULTI-SUBNET AUTO-SCAN */}
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`w-4 h-4 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`}
              />
              <span className="font-semibold text-slate-200">
                {isScanning ? 'Scanning Wi-Fi subnets (2.4G &amp; 5G)...' : 'Subnet Scan Complete'}
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {progress.scanned} / {progress.total} scanned
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((progress.scanned / Math.max(progress.total, 1)) * 100)
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Protocol: WebSocket &amp; Image Timing + DIAL</span>
            <button
              onClick={startScan}
              disabled={isScanning}
              className="text-cyan-400 hover:text-cyan-300 font-medium underline disabled:opacity-50"
            >
              Scan Subnets
            </button>
          </div>
        </div>

        {/* Detected Devices List */}
        {foundDevices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Discovered Fire TVs on Wi-Fi</span>
              <span className="text-emerald-400 font-mono font-bold">
                {foundDevices.length} online
              </span>
            </div>

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
                        {dev.ip}:{dev.port} • {dev.protocol.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUseAsToshibaTv(dev.ip)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs active:scale-95 transition"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex gap-2">
          {foundDevices.length > 0 && (
            <button
              onClick={handleApplyDiscovered}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition"
            >
              <Zap className="w-4 h-4" />
              <span>Connect All Detected Devices</span>
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
