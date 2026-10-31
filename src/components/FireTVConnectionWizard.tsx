/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Terminal,
  Wifi,
  Tv,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  HelpCircle,
  Radio,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import {
  bridgeManager,
  getBridgeConfig,
  saveBridgeConfig,
  BridgeConfig,
  ConnectionStatus,
} from '../services/bridgeClient';
import { FireTVDevice } from '../services/wifiDiscovery';

interface FireTVConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  devices: FireTVDevice[];
  onUpdateDevices?: (devices: FireTVDevice[]) => void;
}

export function FireTVConnectionWizard({
  isOpen,
  onClose,
  devices,
}: FireTVConnectionWizardProps) {
  const [activeTab, setActiveTab] = useState<'download' | 'bridge' | 'adb_guide' | 'ha'>('download');
  const [config, setConfig] = useState<BridgeConfig>(getBridgeConfig());
  const [bridgeStatus, setBridgeStatus] = useState<ConnectionStatus>('disconnected');
  const [bridgeLatency, setBridgeLatency] = useState<number>(0);
  const [bridgeMsg, setBridgeMsg] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { alive: boolean; latencyMs?: number; error?: string }>>({});
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = bridgeManager.addStatusListener((status, latency, msg) => {
      setBridgeStatus(status);
      if (latency !== undefined) setBridgeLatency(latency);
      if (msg) setBridgeMsg(msg);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveBridgeConfig = (updates: Partial<BridgeConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    saveBridgeConfig(updated);
    bridgeManager.updateConfig(updated);
  };

  const testPingAll = async () => {
    setIsPinging(true);
    const results: Record<string, any> = {};
    for (const dev of devices) {
      const res = await bridgeManager.testPing(dev.ip);
      results[dev.id] = res;
    }
    setPingResults(results);
    setIsPinging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Fire TV Connection & AI Guide
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct Wi-Fi auto-detection, local ADB bridge, and desktop migration files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'download'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Download to Desktop
          </button>
          <button
            onClick={() => setActiveTab('bridge')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'bridge'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Local Bridge
            <span
              className={`w-2 h-2 rounded-full ${
                bridgeStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </button>
          <button
            onClick={() => setActiveTab('adb_guide')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'adb_guide'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Fire TV ADB Setup
          </button>
          <button
            onClick={() => setActiveTab('ha')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'ha'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Home Assistant
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300 flex-1">
          {/* TAB 1: DOWNLOAD TO DESKTOP */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40">
                <div className="flex items-start gap-3">
                  <FileCode className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-cyan-200">
                      Save Migration File Directly to Your Desktop
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Download the complete <code className="text-cyan-300 bg-cyan-950/60 px-1 py-0.5 rounded font-mono">AI_MIGRATION_GUIDE.md</code> to your local desktop or mobile device. You can hand this file directly to any AI or inspect all the verified code files and architecture.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="/AI_MIGRATION_GUIDE.md"
                    download="AI_MIGRATION_GUIDE.md"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/20 text-xs transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download AI_MIGRATION_GUIDE.md
                  </a>

                  <a
                    href="/dremote-bridge.py"
                    download="dremote-bridge.py"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 text-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Python Bridge (.py)
                  </a>

                  <a
                    href="/dremote-bridge.js"
                    download="dremote-bridge.js"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 text-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Node Bridge (.js)
                  </a>
                </div>
              </div>

              {/* What this guide solves */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Why Fire TV Doesn't Respond In Pure Browsers & The Fix
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <span className="text-amber-400 font-medium block mb-1">
                      ⚠️ Root Problem
                    </span>
                    Amazon Fire OS does not expose an open HTTP REST API on port 8080 for navigation keys. Also, public web browsers block private network IPs (<code className="text-slate-300">192.168.x.x</code>) due to Private Network Access (PNA).
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <span className="text-emerald-400 font-medium block mb-1">
                      ✅ The 3 Working Solutions
                    </span>
                    1. <strong>Direct DIAL (Port 8008)</strong>: Launch apps & wake TVs over Wi-Fi without any tools.<br />
                    2. <strong>Local Bridge (Port 8080)</strong>: Zero-lag ADB navigation keys.<br />
                    3. <strong>Home Assistant</strong>: Standard smart home ADB integration.
                  </div>
                </div>
              </div>

              {/* Push to GitHub Commands */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Pushing to GitHub with Personal Access Token
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'git remote set-url origin https://<TOKEN>@github.com/vemula-code/DRemote.git\ngit push -u origin main',
                        'git-push'
                      )
                    }
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'git-push' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-2 bg-slate-900 rounded-lg">
                  git remote set-url origin https://&lt;YOUR_TOKEN&gt;@github.com/vemula-code/DRemote.git{'\n'}
                  git push -u origin main
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL ADB BRIDGE */}
          {activeTab === 'bridge' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div>
                  <span className="text-xs text-slate-400 block">Bridge Connection Status</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        bridgeStatus === 'connected'
                          ? 'bg-emerald-400 shadow-md shadow-emerald-500/50'
                          : bridgeStatus === 'connecting'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-sm font-semibold capitalize text-white">
                      {bridgeStatus}
                    </span>
                    {bridgeLatency > 0 && (
                      <span className="text-xs text-emerald-400 font-mono">
                        ({bridgeLatency}ms)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => bridgeManager.connectWebSocket()}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reconnect
                </button>
              </div>

              {bridgeMsg && (
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400">
                  {bridgeMsg}
                </div>
              )}

              {/* Host and Port Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">
                    Bridge Host IP (Your Computer's Wi-Fi IP)
                  </label>
                  <input
                    type="text"
                    value={config.wsHost}
                    onChange={(e) => handleSaveBridgeConfig({ wsHost: e.target.value })}
                    placeholder="localhost or 192.168.1.xxx"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Use <code className="text-cyan-400">localhost</code> if running browser on same PC, or your PC's IP (<code className="text-cyan-400">192.168.1.xxx</code>) when on phone.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">
                    Bridge Port
                  </label>
                  <input
                    type="number"
                    value={config.wsPort}
                    onChange={(e) => handleSaveBridgeConfig({ wsPort: parseInt(e.target.value) || 8080 })}
                    placeholder="8080"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Running the bridge instructions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">
                    How to Run in 1 Command on your PC / Mac / Raspberry Pi
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard('python3 public/dremote-bridge.py', 'py-run')
                    }
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'py-run' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs font-mono text-cyan-300 p-2 bg-slate-900 rounded-lg">
                  python3 dremote-bridge.py
                </pre>
                <p className="text-[11px] text-slate-400">
                  Or with Node.js: <code className="text-cyan-300 font-mono">node dremote-bridge.js</code>. This connects instantly over ADB to your Toshiba TV and Fire TV 4K Max!
                </p>
              </div>

              {/* Ping Devices */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Live Fire TV Device Connectivity
                  </span>
                  <button
                    onClick={testPingAll}
                    disabled={isPinging}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    Test Ping Now
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {devices.map((dev) => {
                    const result = pingResults[dev.id];
                    return (
                      <div
                        key={dev.id}
                        className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-white">{dev.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{dev.ip}:5555</div>
                        </div>
                        {result ? (
                          result.alive ? (
                            <span className="text-emerald-400 font-mono font-medium">
                              Online ({result.latencyMs}ms)
                            </span>
                          ) : (
                            <span className="text-rose-400 text-[11px]">No response</span>
                          )
                        ) : (
                          <span className="text-slate-500 text-[11px]">Not tested</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIRE TV ADB SETUP */}
          {activeTab === 'adb_guide' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-400" />
                  Enable ADB Debugging on Fire TV (1 Minute Setup)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                  <li>
                    On your Toshiba TV or Fire TV 4K Max remote, go to{' '}
                    <strong className="text-white">Settings</strong> (Gear Icon) &gt;{' '}
                    <strong className="text-white">My Fire TV</strong> (or{' '}
                    <strong className="text-white">Device & Software</strong>).
                  </li>
                  <li>
                    Click on <strong className="text-white">About</strong>.
                  </li>
                  <li>
                    Highlight the device name and click the{' '}
                    <strong className="text-cyan-300">Center (Select) button 7 times</strong>{' '}
                    until you see the notification: <em>"No need, you are already a developer"</em>.
                  </li>
                  <li>
                    Press <strong className="text-white">Back</strong> once and open the new{' '}
                    <strong className="text-amber-300">Developer Options</strong> menu.
                  </li>
                  <li>
                    Turn <strong className="text-emerald-400">ADB Debugging</strong> to{' '}
                    <strong className="text-emerald-400 font-bold">ON</strong>.
                  </li>
                  <li>
                    When your computer or app connects, a popup will appear on your TV screen:{' '}
                    <em>"Allow USB debugging?"</em>. Check{' '}
                    <strong className="text-white">"Always allow from this computer"</strong> and click{' '}
                    <strong className="text-cyan-300">OK</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-200">
                💡 <strong>HDMI 2 Switching Note</strong>: Toshiba Fire TV Edition accepts direct input switching to HDMI 2 (where your Fire TV 4K Max is plugged in). Press the <strong>HDMI 2</strong> shortcut button on DRemote to switch immediately!
              </div>
            </div>
          )}

          {/* TAB 4: HOME ASSISTANT */}
          {activeTab === 'ha' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                If you use Home Assistant at home, DRemote can route all Fire TV keypresses directly through your Home Assistant Android TV / ADB integration without needing any background scripts.
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-slate-400 mb-1 block">
                    Home Assistant URL
                  </label>
                  <input
                    type="text"
                    value={config.haUrl || ''}
                    onChange={(e) => handleSaveBridgeConfig({ haUrl: e.target.value })}
                    placeholder="http://homeassistant.local:8123"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-400 mb-1 block">
                    Long-Lived Access Token
                  </label>
                  <input
                    type="password"
                    value={config.haToken || ''}
                    onChange={(e) => handleSaveBridgeConfig({ haToken: e.target.value })}
                    placeholder="eyJhbGciOi..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-400 mb-1 block">
                      Toshiba TV Entity ID
                    </label>
                    <input
                      type="text"
                      value={config.haEntityToshiba || ''}
                      onChange={(e) => handleSaveBridgeConfig({ haEntityToshiba: e.target.value })}
                      placeholder="media_player.toshiba_fire_tv"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-400 mb-1 block">
                      Fire TV Stick 4K Max Entity ID
                    </label>
                    <input
                      type="text"
                      value={config.haEntityStick || ''}
                      onChange={(e) => handleSaveBridgeConfig({ haEntityStick: e.target.value })}
                      placeholder="media_player.fire_tv_stick_4k_max"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleSaveBridgeConfig({ mode: 'home_assistant' })}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      config.mode === 'home_assistant'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {config.mode === 'home_assistant'
                      ? '✓ Home Assistant Routing Active'
                      : 'Enable Home Assistant Routing'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>DRemote Dual Fire TV Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
