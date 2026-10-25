/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RemoteKey, TargetDeviceType } from '../types/remote';
import {
  Keyboard,
  Send,
  Delete,
  CornerDownLeft,
  Clipboard,
  Mic,
  MicOff,
  Search,
  Sparkles,
} from 'lucide-react';

interface KeyboardInputModeProps {
  onSendKey: (key: RemoteKey, label: string, customTarget?: TargetDeviceType | 'both', param?: string) => void;
}

export const KeyboardInputMode: React.FC<KeyboardInputModeProps> = ({ onSendKey }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  });

  const handleSendText = (stringToSend?: string) => {
    const val = stringToSend !== undefined ? stringToSend : text;
    if (!val.trim()) return;
    onSendKey('TEXT_STRING', `Typed: "${val}"`, 'firestick_4k', val);
    setText('');
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip) {
          setText(clip);
          handleSendText(clip);
        }
      }
    } catch {
      // Clipboard denied
    }
  };

  const handleVoiceToggle = () => {
    if (!voiceSupported) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognitionClass = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
      
      if (!SpeechRecognitionClass) return;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText(transcript);
          handleSendText(transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const QUICK_QUERIES = [
    'Netflix 4K movies',
    'Action films',
    'YouTube 4K',
    'Live sports',
    'Weather forecast',
    'Chill lo-fi music',
  ];

  return (
    <div className="w-full max-w-[360px] mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Smart TV Keyboard</h3>
            <p className="text-[11px] text-slate-400">Direct text entry into Fire TV search</p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full">
          Stick 4K
        </span>
      </div>

      {/* Input box */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendText();
            }
          }}
          placeholder="Type movie name, URL or password..."
          rows={3}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
        />

        {/* Voice dictation button inside input area */}
        {voiceSupported && (
          <button
            onClick={handleVoiceToggle}
            className={`absolute right-3 bottom-3 p-2 rounded-xl transition ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_12px_#ef4444]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Speech to text dictation"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handlePasteClipboard}
          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition"
          title="Paste from mobile clipboard"
        >
          <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
          <span>Paste</span>
        </button>

        <button
          onClick={() => onSendKey('BACKSPACE', 'Backspace', 'firestick_4k')}
          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition"
          title="Delete character on TV"
        >
          <Delete className="w-3.5 h-3.5 text-amber-400" />
          <span>Delete</span>
        </button>

        <button
          onClick={() => handleSendText()}
          className="py-2 px-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow"
          title="Send text to Fire TV"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>

      {/* Enter / Submit Key */}
      <button
        onClick={() => onSendKey('ENTER', 'Press Enter / Submit', 'firestick_4k')}
        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
      >
        <CornerDownLeft className="w-4 h-4 text-cyan-400" />
        <span>Execute Search (Enter)</span>
      </button>

      {/* Quick Suggestions */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Search Suggestions</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleSendText(q)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-[11px] transition active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
