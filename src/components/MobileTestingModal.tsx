/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Github,
  Zap,
  CheckCircle2,
  Tv,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface MobileTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileTestingModal: React.FC<MobileTestingModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'checklist' | 'vercel'>('scan');

  // Public shared URL that works without Google login on mobile phones
  const getPublicUrl = () => {
    if (typeof window === 'undefined') {
      return 'https://ais-pre-w5z5gbq34amtmo4ralbory-130558902802.asia-northeast1.run.app';
    }
    const origin = window.location.origin.replace('ais-dev-', 'ais-pre-');
    return origin + (window.location.pathname === '/' ? '' : window.location.pathname);
  };

  const [selectedUrlType, setSelectedUrlType] = useState<'public' | 'dev'>('public');
  const publicUrl = getPublicUrl();
  const devUrl = typeof window !== 'undefined' ? window.location.href : publicUrl;
  const mobileUrl = selectedUrlType === 'public' ? publicUrl : devUrl;

  useEffect(() => {
    if (mobileUrl) {
      QRCode.toDataURL(mobileUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [mobileUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Test DRemote on Mobile</h3>
              <p className="text-xs text-slate-400">Open on iPhone / Android or deploy to Vercel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-slate-950/60 text-xs">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition ${
              activeTab === 'scan'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition ${
              activeTab === 'checklist'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>How to Test</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition ${
              activeTab === 'vercel'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Vercel & GitHub Build</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: SCAN QR CODE */}
          {activeTab === 'scan' && (
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 text-[11px] font-semibold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Public Mobile Access (No Login Required)</span>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 mb-3">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Scan to open DRemote on mobile" className="w-48 h-48 sm:w-52 sm:h-52 object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-500 font-mono">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan with your iPhone Camera or Android Chrome</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mb-3">
                Uses the public preview URL (<code>ais-pre-</code>) so your phone won't get "access denied"!
              </p>

              {/* URL Bar & Copy */}
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-slate-300 truncate text-[11px] px-1">
                  {mobileUrl}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <a
                    href={mobileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Install PWA Hint */}
              <div className="w-full mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-left text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>How to install as full-screen app on phone:</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  • <strong>iPhone (Safari):</strong> Tap the <em>Share icon</em> (box with arrow up) &gt; Tap <em>"Add to Home Screen"</em>.
                </p>
                <p className="text-slate-400 text-[11px]">
                  • <strong>Android (Chrome):</strong> Tap <em>"Install App"</em> badge at the top of the header bar.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP TESTING CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-cyan-200">
                You can test every function right here on your screen using the <strong>Live Setup Monitor</strong>!
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-white">Test Toshiba TV Volume OSD</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Press <strong>Volume Up (+)</strong> or <strong>Volume Down (-)</strong>. Notice the Amber TV LED flashes and the TV volume bar pops up on the monitor.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-white">Test Firestick 4K Max D-Pad Navigation</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Press <strong>Up, Down, Left, Right</strong> on the circular D-Pad. Notice the Cyan Stick LED flashes and the focus cursor moves across the screen tiles!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-white">Test TV Source / Input Switching</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Tap <strong>"Source"</strong> at the top of the remote and select <em>"HDMI 1"</em> or <em>"HDMI 2 (Stick 4K)"</em>. The Toshiba TV display switches source feeds instantly.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0">4</span>
                  <div>
                    <h4 className="font-bold text-white">Test 1-Tap 4K Apps & Trackpad</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Tap <strong>4K Apps</strong> at the bottom bar &gt; Tap <em>Netflix</em> or <em>YouTube</em>. It switches active app and playback status on the Firestick.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center flex-shrink-0">5</span>
                  <div>
                    <h4 className="font-bold text-white">Test Dual Macros</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Tap <strong>Macros</strong> &gt; Run <em>"Watch Firestick 4K Max"</em>. It automatically wakes the TV, switches input to HDMI 2, and launches the Stick Home screen in one sequence!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL & GITHUB COMPILATION */}
          {activeTab === 'vercel' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Vercel Build Ready (`vercel.json` included)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  We added a production-tested <code>vercel.json</code> file configured with:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                  Build Command: npm run build<br />
                  Output Directory: dist<br />
                  Framework: Vite (Single Page App)
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white">How to Deploy to Vercel via GitHub:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px]">
                  <li>Push this codebase to your GitHub repository.</li>
                  <li>Log in to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">vercel.com</a> and click <strong>"Add New Project"</strong>.</li>
                  <li>Select your GitHub repository from the list.</li>
                  <li>Vercel automatically detects the Vite framework and builds into <code>dist</code> in under 30 seconds!</li>
                  <li>You get your own custom HTTPS domain (e.g. <code>dremote.vercel.app</code>) that you can open on your iPhone & Android anytime.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Current URL: <span className="font-mono text-cyan-400">{mobileUrl.replace('https://', '')}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
          >
            Start Testing
          </button>
        </div>

      </div>
    </div>
  );
};
