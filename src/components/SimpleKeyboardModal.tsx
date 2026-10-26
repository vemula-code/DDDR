/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, Delete, CornerDownLeft, Clipboard, Mic, MicOff, Keyboard } from 'lucide-react';

interface SimpleKeyboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendText: (text: string) => void;
  onSendKey: (key: string) => void;
}

export const SimpleKeyboardModal: React.FC<SimpleKeyboardModalProps> = ({
  isOpen,
  onClose,
  onSendText,
  onSendKey,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    onSendText(text);
    setText('');
    onClose();
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip) {
          setText(clip);
          onSendText(clip);
          onClose();
        }
      }
    } catch {
      // Clipboard denied
    }
  };

  const handleVoice = () => {
    try {
      const SpeechClass = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
      if (!SpeechClass) return;

      const recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const result = e.results[0][0].transcript;
        if (result) {
          setText(result);
          onSendText(result);
          onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">TV Search Keyboard</h3>
              <p className="text-[11px] text-slate-400">Type on phone to search on Fire TV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="relative">
          <input
            autoFocus
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type movie name or password..."
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 px-3.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleVoice}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'
            }`}
            title="Voice search"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handlePaste}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Paste</span>
          </button>

          <button
            onClick={() => onSendKey('BACKSPACE')}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Delete className="w-3.5 h-3.5 text-amber-400" />
            <span>Delete</span>
          </button>

          <button
            onClick={handleSend}
            className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>

        <button
          onClick={() => {
            onSendKey('ENTER');
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <CornerDownLeft className="w-4 h-4 text-cyan-400" />
          <span>Press Enter / Search</span>
        </button>

      </div>
    </div>
  );
};
