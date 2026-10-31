/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { probeFireTvIp } from '../services/subnetScanner';
import { bridgeManager } from '../services/bridgeClient';
import { saveStoredPairing } from '../services/firetvRestApi';
import { sendDialCommandViaForm } from '../services/wifiDiscovery';
import {
  X,
  Tv,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface FireTVPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: 'firestick_4k' | 'toshiba_tv';
  deviceName: string;
  currentIp: string;
  onSaveIp: (ip: string, token?: string) => void;
}

export const FireTVPairingModal: React.FC<FireTVPairingModalProps> = ({
  isOpen,
  onClose,
  deviceType,
  deviceName,
  currentIp,
  onSaveIp,
}) => {
  const [ip, setIp] = useState(currentIp || '');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ alive: boolean; latencyMs?: number; protocol?: string } | null>(null);
  const [testPulseSent, setTestPulseSent] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setTestResult(null);

    // 1. Test via DIAL port 8008
    const dialRes = await probeFireTvIp(ip.trim(), 800);
    if (dialRes) {
      setTestResult({ alive: true, latencyMs: dialRes.responseTimeMs, protocol: 'DIAL (8008)' });
      setLoading(false);
      return;
    }

    // 2. Test via bridge ping (ADB port 5555)
    const bridgePing = await bridgeManager.testPing(ip.trim());
    if (bridgePing.alive) {
      setTestResult({ alive: true, latencyMs: bridgePing.latencyMs, protocol: 'ADB (5555)' });
      setLoading(false);
      return;
    }

    setTestResult({ alive: false });
    setLoading(false);
  };

  const handleSendTestPulse = async () => {
    if (!ip.trim()) return;
    setTestPulseSent(true);
    await bridgeManager.sendCommand({
      target: deviceType,
      ip: ip.trim(),
      key: 'SELECT',
    });
    setTimeout(() => setTestPulseSent(false), 2000);
  };

  const handleWake = () => {
    if (!ip.trim()) return;
    setTestPulseSent(true);
    sendDialCommandViaForm(ip.trim(), 'system');
    setTimeout(() => setTestPulseSent(false), 2000);
  };

  const handleLaunchYouTube = () => {
    if (!ip.trim()) return;
    setTestPulseSent(true);
    sendDialCommandViaForm(ip.trim(), 'YouTube');
    setTimeout(() => setTestPulseSent(false), 2000);
  };

  const handleSave = () => {
    if (!ip.trim()) return;
    saveStoredPairing(deviceType, ip.trim());
    onSaveIp(ip.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Fire TV Setup</h3>
              <p className="text-xs text-slate-400">{deviceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IP Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Device IP Address on Local Wi-Fi
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 192.168.1.106"
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleTestConnection}
              disabled={loading || !ip.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Test
            </button>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              testResult.alive
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.alive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {testResult.alive
                  ? `Device Online via ${testResult.protocol} (${testResult.latencyMs}ms)`
                  : 'Device not responding on this IP. Check Wi-Fi.'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleWake}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] active:scale-95 transition"
                title="Wake Fire TV via DIAL protocol"
              >
                Wake TV
              </button>
              <button
                onClick={handleLaunchYouTube}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] active:scale-95 transition"
                title="Launch YouTube on TV"
              >
                YouTube
              </button>
              {testResult.alive && (
                <button
                  onClick={handleSendTestPulse}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[10px] active:scale-95 transition"
                >
                  {testPulseSent ? 'Sent!' : 'Pulse Test'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ADB & Permission Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Fire TV Developer Authorization</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ensure <strong className="text-white">ADB Debugging</strong> is ON in TV Settings &gt; My Fire TV &gt; Developer Options. If a popup appears on TV: check <em>"Always allow from this computer"</em> and click OK.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!ip.trim()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs disabled:opacity-50 transition active:scale-95 shadow-md"
          >
            Save &amp; Use Device
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
