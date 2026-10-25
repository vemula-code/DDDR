/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { RemoteKey, TargetDeviceType } from '../types/remote';
import { MousePointer, Hand, Move, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface TrackpadModeProps {
  onSendKey: (key: RemoteKey, label: string, customTarget?: TargetDeviceType | 'both') => void;
}

export const TrackpadMode: React.FC<TrackpadModeProps> = ({ onSendKey }) => {
  const [lastGesture, setLastGesture] = useState<string>('Touch to navigate');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartRef.current = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - touchStartRef.current.x;
    const dy = clientY - touchStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Tap detection (< 15px movement)
    if (dist < 15) {
      setLastGesture('Tap: Select / OK');
      onSendKey('SELECT', 'Trackpad Click (Select)', 'firestick_4k');
    } else {
      // Swipe direction
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 25) {
          setLastGesture('Swipe Right ->');
          onSendKey('RIGHT', 'Swipe Right', 'firestick_4k');
        } else if (dx < -25) {
          setLastGesture('Swipe Left <-');
          onSendKey('LEFT', 'Swipe Left', 'firestick_4k');
        }
      } else {
        if (dy > 25) {
          setLastGesture('Swipe Down ↓');
          onSendKey('DOWN', 'Swipe Down', 'firestick_4k');
        } else if (dy < -25) {
          setLastGesture('Swipe Up ↑');
          onSendKey('UP', 'Swipe Up', 'firestick_4k');
        }
      }
    }

    touchStartRef.current = null;
  };

  return (
    <div className="w-full max-w-[360px] mx-auto flex flex-col items-center">
      {/* Trackpad Surface */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className="w-full h-80 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl border-2 border-slate-700/80 shadow-2xl relative cursor-crosshair flex flex-col items-center justify-between p-6 select-none overflow-hidden touch-none"
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

        <div className="z-10 flex items-center justify-between w-full text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-cyan-400">
            <MousePointer className="w-3.5 h-3.5" />
            <span>Air Trackpad</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Firestick 4K Max</span>
        </div>

        <div className="z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2 shadow-inner animate-pulse">
            <Hand className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">{lastGesture}</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
            Swipe anywhere to navigate. Tap to click / select.
          </p>
        </div>

        {/* Direction indicators */}
        <div className="z-10 flex items-center justify-between w-full text-slate-600 text-xs px-2">
          <ArrowLeft className="w-4 h-4" />
          <div className="flex gap-4">
            <ArrowUp className="w-4 h-4" />
            <ArrowDown className="w-4 h-4" />
          </div>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Quick Action buttons below trackpad */}
      <div className="w-full grid grid-cols-3 gap-2.5 mt-3">
        <button
          onClick={() => onSendKey('BACK', 'Back', 'firestick_4k')}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition active:scale-95 shadow-sm"
        >
          Back
        </button>
        <button
          onClick={() => onSendKey('SELECT', 'Select / Click', 'firestick_4k')}
          className="py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition active:scale-95 shadow-sm"
        >
          Tap Click
        </button>
        <button
          onClick={() => onSendKey('HOME', 'Home', 'firestick_4k')}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition active:scale-95 shadow-sm"
        >
          Home
        </button>
      </div>
    </div>
  );
};
