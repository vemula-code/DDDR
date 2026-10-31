/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Apple, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

  // If already installed and running standalone
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 text-xs font-semibold shadow-sm">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Installed App</span>
        <span className="sm:hidden">Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      try {
        const success = await install();
        if (success) return;
      } catch (err) {
        console.warn('Native install prompt failed, opening guide modal:', err);
      }
    }
    // If native prompt unavailable or declined, open guided installation sheet
    setActiveTab(isIOS ? 'ios' : 'android');
    setShowInstallGuide(true);
  };

  return (
    <>
      {/* 1. ULTRA-PROMINENT INSTALL BUTTON FOR MOBILE & DESKTOP */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold px-3 py-1.5 text-xs shadow-md shadow-cyan-900/40 active:scale-95 transition"
        title="Install DRemote app onto your mobile home screen"
      >
        <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      {/* 2. COMPREHENSIVE PWA INSTALL GUIDE & TROUBLESHOOTING MODAL */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install DRemote on Mobile</h3>
                  <p className="text-[11px] text-slate-400">Add to your home screen for instant remote access</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex items-center p-2 bg-slate-950/40 border-b border-slate-800 gap-2">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'android'
                    ? 'bg-cyan-500 text-slate-950 shadow font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Android / Chrome</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'ios'
                    ? 'bg-cyan-500 text-slate-950 shadow font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 space-y-4 overflow-y-auto text-xs text-slate-300">
              {activeTab === 'android' ? (
                <>
                  {/* Native Prompt Trigger Button */}
                  {isInstallable && (
                    <button
                      onClick={async () => {
                        await install();
                        setShowInstallGuide(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Click Here to Trigger Android Install Prompt</span>
                    </button>
                  )}

                  {/* Standard Android Chrome Steps */}
                  <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Standard Chrome Installation:
                    </p>
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                        <span>Tap the <strong>three dots menu (⋮)</strong> in the top-right corner of Google Chrome.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                        <span>Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                        <span>Confirm by tapping <strong>Install</strong>. DRemote will appear on your phone home screen!</span>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting "Cannot be installed" error */}
                  <div className="bg-amber-950/30 p-3 rounded-2xl border border-amber-600/40 space-y-2">
                    <p className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      Did Android say &quot;This app cannot be installed&quot;?
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Android WebAPK servers sometimes fail due to phone cache or previous test versions. Here is how to fix it in 5 seconds:
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>
                        <strong>Select &quot;Add to Home screen&quot;</strong> in Chrome menu ⋮ (this bypasses Google WebAPK compilation and installs an instant standalone web app).
                      </li>
                      <li>
                        If an older version of DRemote exists on your phone, uninstall/remove that icon first, then reinstall.
                      </li>
                      <li>
                        DRemote also functions with <strong>100% full features</strong> right inside your browser window without installing!
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                /* iOS Safari Steps */
                <div className="space-y-3">
                  <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-slate-200" />
                      Install on iPhone / iPad (Safari):
                    </p>
                    <div className="space-y-2.5 text-[11px] text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                        <span>Open this page in <strong>Safari</strong> and tap the <strong>Share button</strong> (square icon with an arrow pointing up at the bottom).</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                        <span>Scroll down the menu and tap <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                        <span>Tap <strong>Add</strong> in the top-right corner. DRemote will open like a native app with zero browser bars!</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Runs full-screen with offline support</span>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
