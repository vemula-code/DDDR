/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { requestTvPinDisplay, verifyTvPin, pingFireTV, saveStoredPairing } from '../services/firetvRestApi';
import { X, Tv, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, KeyRound, ArrowRight } from 'lucide-react';

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
  const [ip, setIp] = useState(currentIp || '192.168.1.106');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'ip' | 'pin' | 'success'>('ip');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [needsCert, setNeedsCert] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setLoading(true);
    setPingResult('Testing connection to TV...');
    const res = await pingFireTV(ip.trim());
    if (res.alive) {
      setPingResult(`Connected! (${res.latencyMs} ms)`);
    } else {
      setPingResult('No response. Please check that TV is turned on and on the same Wi-Fi.');
    }
    setLoading(false);
  };

  const handleRequestPin = async () => {
    setLoading(true);
    setStatusMsg('Waking TV and requesting 4-digit code...');
    setNeedsCert(false);

    const res = await requestTvPinDisplay(ip.trim());
    setLoading(false);

    if (res.success) {
      setStatusMsg(res.message);
      setStep('pin');
    } else if (res.requiresCertAcceptance) {
      setNeedsCert(true);
      setStatusMsg('Your phone browser needs 1-time permission to connect directly to your Fire TV.');
    } else {
      setStatusMsg(res.message);
    }
  };

  const handleVerifyPin = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    setStatusMsg('Verifying code with Fire TV...');

    const res = await verifyTvPin(ip.trim(), pin.trim());
    setLoading(false);

    if (res.success && res.token) {
      saveStoredPairing(deviceType, ip.trim(), res.token);
      onSaveIp(ip.trim(), res.token);
      setStep('success');
      setStatusMsg(`Successfully paired with ${deviceName}!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMsg(res.error || 'Failed to verify PIN. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pair with {deviceName}</h3>
              <p className="text-[11px] text-slate-400">1-time setup over home Wi-Fi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Confirm IP Address */}
        {step === 'ip' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter your TV's real IP address:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="e.g. 192.168.1.106"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleTestPing}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 active:scale-95 transition"
                >
                  Ping
                </button>
              </div>
              {pingResult && (
                <p className={`text-[11px] mt-1 font-medium ${pingResult.includes('Connected') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pingResult}
                </p>
              )}
            </div>

            {/* How to find IP on TV guide */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-[11px] text-slate-300 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>How to check your TV IP in 5 seconds:</span>
              </p>
              <p className="text-slate-400">
                On your Fire TV screen, go to:
              </p>
              <p className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-2 py-1 rounded">
                Settings &gt; My Fire TV &gt; About &gt; Network
              </p>
              <p className="text-slate-400">
                It will display: <strong>IP Address: 192.168.x.x</strong>
              </p>
            </div>

            {/* Browser SSL Authorization Notice if needed */}
            {needsCert && (
              <div className="bg-amber-950/40 border border-amber-600/50 rounded-2xl p-3 text-xs text-amber-200 space-y-2 animate-in fade-in">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>1-Time Browser Security Permission</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  Because Fire TV uses a local secure connection, tap below once to approve:
                </p>
                <a
                  href={`https://${ip}:8080/v1/FireTV/pin/display`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <span>1. Tap to Authorize in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[10px] text-slate-400">
                  *(Tap "Advanced" &gt; "Proceed to {ip} (unsafe)", then return here and tap "Request Code" below!)*
                </p>
              </div>
            )}

            {statusMsg && !needsCert && (
              <p className="text-xs text-cyan-400 text-center font-medium">{statusMsg}</p>
            )}

            <button
              onClick={handleRequestPin}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Show 4-Digit Code on TV</span>
            </button>
          </div>
        )}

        {/* Step 2: Enter 4-Digit PIN */}
        {step === 'pin' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-300">
                Look at your TV screen! Enter the 4-digit code displayed:
              </p>
            </div>

            <div className="flex justify-center">
              <input
                autoFocus
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-36 text-center tracking-[1em] font-mono text-2xl font-bold bg-slate-950 border-2 border-cyan-400 rounded-2xl py-2 px-3 text-white focus:outline-none shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              />
            </div>

            {statusMsg && (
              <p className="text-xs text-center text-amber-300">{statusMsg}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep('ip')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Back
              </button>
              <button
                onClick={handleVerifyPin}
                disabled={loading || pin.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow active:scale-95 disabled:opacity-40"
              >
                {loading ? 'Verifying...' : 'Pair & Connect'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="py-6 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Paired Successfully!</h4>
            <p className="text-xs text-slate-400">{statusMsg}</p>
          </div>
        )}

      </div>
    </div>
  );
};
