/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MACRO_ACTIONS } from '../services/remoteBridge';
import { MacroAction } from '../types/remote';
import { Zap, Tv, Film, Moon, RefreshCw, CheckCircle2, Play } from 'lucide-react';

interface MacrosModeProps {
  onExecuteMacro: (macro: MacroAction) => void;
  executingMacroId: string | null;
}

export const MacrosMode: React.FC<MacrosModeProps> = ({ onExecuteMacro, executingMacroId }) => {
  const [activeStepText, setActiveStepText] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Tv': return <Tv className="w-5 h-5 text-cyan-400" />;
      case 'Film': return <Film className="w-5 h-5 text-red-400" />;
      case 'Moon': return <Moon className="w-5 h-5 text-purple-400" />;
      case 'RefreshCw': return <RefreshCw className="w-5 h-5 text-amber-400" />;
      default: return <Zap className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="w-full max-w-[360px] mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Smart Dual Macros</h3>
            <p className="text-[11px] text-slate-400">Automate TV + Firestick sequences</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-purple-300 bg-purple-950 border border-purple-800/80 px-2 py-0.5 rounded-full">
          Multi-Device
        </span>
      </div>

      {/* Macro items */}
      <div className="space-y-3">
        {MACRO_ACTIONS.map((macro) => {
          const isRunning = executingMacroId === macro.id;

          return (
            <div
              key={macro.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isRunning
                  ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner flex-shrink-0">
                    {getIcon(macro.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{macro.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {macro.description}
                    </p>
                  </div>
                </div>

                <button
                  disabled={isRunning}
                  onClick={() => onExecuteMacro(macro)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow flex-shrink-0 ${
                    isRunning
                      ? 'bg-purple-500 text-white cursor-wait'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>Running</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Run</span>
                    </>
                  )}
                </button>
              </div>

              {/* Steps preview */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400 overflow-x-auto">
                <span className="text-slate-500 font-semibold uppercase">Steps:</span>
                {macro.steps.map((step, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 whitespace-nowrap"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        step.target === 'toshiba_tv' ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                    />
                    <span>{step.label}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
