/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Apple } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 text-xs font-medium transition shadow-sm active:scale-95"
        title="Install DRemote to home screen"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 text-xs font-medium transition shadow-sm active:scale-95"
          title="Install on iPhone"
        >
          <Apple className="w-3.5 h-3.5 text-slate-300" />
          <span>Add to iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-semibold text-white">Install DRemote on iPhone</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">1</span>
                  <p>In Safari, tap the <strong>Share</strong> icon (box with an arrow pointing up) at the bottom toolbar.</p>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">2</span>
                  <p>Scroll down the share sheet and tap <strong>Add to Home Screen</strong>.</p>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">3</span>
                  <p>Tap <strong>Add</strong> in the top right corner. DRemote will appear on your iPhone home screen just like a native app!</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-lg">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Runs full screen without Safari browser address bars.</span>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 text-sm transition shadow"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop install hint button
  return (
    <button
      onClick={() => {
        alert('To install DRemote on your phone:\n1. Open this link on your Android Chrome or iPhone Safari.\n2. Tap "Add to Home Screen" or Install.');
      }}
      className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 px-2.5 py-1 text-xs font-medium transition"
      title="Install as Progressive Web App"
    >
      <Download className="w-3 h-3 text-cyan-400" />
      <span>Install PWA</span>
    </button>
  );
};
