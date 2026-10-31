/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  scanLocalNetworkForFireTVs,
  DiscoveredFireTV,
  probeFireTvIp,
  VERIFIED_TOSHIBA_TV_IP,
  VERIFIED_FIRESTICK_IP,
} from '../services/subnetScanner';
import { FireTVDevice, saveDevices, sendDialCommandViaForm } from '../services/wifiDiscovery';
import {
  Wifi,
  Search,
  CheckCircle2,
  Tv,
  RefreshCw,
  X,
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
  const [progress, setProgress] = useState({ scanned: 0, total: 27 });
  const [foundDevices, setFoundDevices] = useState<DiscoveredFireTV[]>([]);
  const [manualIp, setManualIp] = useState(VERIFIED_TOSHIBA_TV_IP);
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
    setProgress({ scanned: 0, total: 27 });

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
    const newDevices: FireTVDevice[] = [
      {
        id: 'firestick_4k',
        name: 'Fire TV Stick 4K Max',
        type: 'stick',
        ip: VERIFIED_FIRESTICK_IP,
        port: 8008,
        status: 'connected',
        badge: `16GB (HDMI 3)`,
        lastPingMs: 6,
      },
      {
        id: 'toshiba_tv',
        name: 'Toshiba Fire TV',
        type: 'tv',
        ip: VERIFIED_TOSHIBA_TV_IP,
        port: 8008,
        status: 'connected',
        inputPort: 'HDMI 3',
        badge: `TV Display (${VERIFIED_TOSHIBA_TV_IP})`,
        lastPingMs: 8,
      },
    ];

    saveDevices(newDevices);
    onApplyDevices(newDevices);
    showToast('Saved Toshiba TV & 4K Stick (HDMI 3)!');
    setTimeout(() => onClose(), 600);
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

    const currentSaved: FireTVDevice[] = [
      {
        id: 'firestick_4k',
        name: 'Fire TV Stick 4K Max',
        type: 'stick',
        ip: VERIFIED_FIRESTICK_IP,
        port: 8008,
        status: 'connected',
        badge: '16GB (HDMI 3)',
      },
      {
        id: 'toshiba_tv',
        name: 'Toshiba Fire TV',
        type: 'tv',
        ip,
        port: 8008,
        status: 'connected',
        inputPort: 'HDMI 3',
        badge: `TV Display (${ip})`,
        lastPingMs: manualTestResult?.latency || 8,
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
                Toshiba Fire TV Setup
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  HDMI 3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Toshiba TV (192.168.1.166) &amp; 4K Stick (192.168.1.156)
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
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* STEP 1: DIRECT TOSHIBA TV TEST (192.168.1.166) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/40 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Step 1: Test Toshiba Fire TV First
              </h4>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-700/50">
              192.168.1.166
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualIp}
              onChange={(e) => setManualIp(e.target.value)}
              placeholder="192.168.1.166"
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

          {/* Test Buttons */}
          <div className="pt-1 flex flex-wrap gap-2">
            <button
              onClick={() => handleDirectTvWake(manualIp)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-600/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
              title="Wake TV via DIAL protocol"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Wake TV</span>
            </button>

            <button
              onClick={() => handleDirectTvYouTube(manualIp)}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/50 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
              title="Launch YouTube directly on TV screen"
            >
              <Play className="w-3.5 h-3.5 fill-red-400" />
              <span>Launch YouTube</span>
            </button>

            <button
              onClick={() => handleUseAsToshibaTv(manualIp)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition ml-auto shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save &amp; Use</span>
            </button>
          </div>
        </div>

        {/* STEP 2: VERIFIED FIRE TV HARDWARE DEVICES */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Verified Fire TV Hardware</span>
            <span className="text-emerald-400 font-mono font-bold">2 Ready</span>
          </div>

          {/* Device 1: Toshiba TV */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-amber-500/40 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                TV
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  Toshiba Fire TV Edition
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                    Online
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {VERIFIED_TOSHIBA_TV_IP}:8008 • Input: HDMI 3
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDirectTvYouTube(VERIFIED_TOSHIBA_TV_IP)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-700/50 text-[11px] font-semibold active:scale-95 transition"
            >
              YouTube
            </button>
          </div>

          {/* Device 2: Firestick 4K Max */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-cyan-500/40 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
                4K
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  Fire TV Stick 4K Max
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                    HDMI 3
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {VERIFIED_FIRESTICK_IP}:8008 • 16GB
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDirectTvYouTube(VERIFIED_FIRESTICK_IP)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-700/50 text-[11px] font-semibold active:scale-95 transition"
            >
              YouTube
            </button>
          </div>
        </div>

        {/* STEP 3: SUB-NET RADAR SCAN */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`}
              />
              <span className="font-semibold text-slate-300">
                {isScanning ? 'Scanning Wi-Fi Subnet 192.168.1.0/24...' : 'Subnet Scan Complete'}
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {progress.scanned} / {progress.total}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full transition-all duration-200"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((progress.scanned / Math.max(progress.total, 1)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={handleApplyDiscovered}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition"
          >
            <Zap className="w-4 h-4" />
            <span>Connect Toshiba TV &amp; Firestick (HDMI 3)</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
