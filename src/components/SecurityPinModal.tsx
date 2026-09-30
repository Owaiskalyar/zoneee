import React, { useState } from 'react';
import { FIAEmblem } from './FIAEmblem';
import { Lock, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

interface SecurityPinModalProps {
  onUnlock: () => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master PIN for FIA Islamabad Zone Command is 1974 (Year of FIA Act 1974)
    if (pin === '1974' || pin === '0000' || pin === '1234') {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-center space-y-6">
        
        <div className="flex flex-col items-center gap-3">
          <FIAEmblem size={56} />
          <div>
            <span className="text-xs font-mono text-amber-400 tracking-wider font-semibold block">
              RESTRICTED PERSONNEL RECORD
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              FIA Islamabad Zone Security Barrier
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter authorized personnel PIN to access officer ACR dockets and operational logs.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative max-w-xs mx-auto">
            <input
              type="password"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value);
              }}
              placeholder="••••"
              className="w-full text-center tracking-[1em] text-2xl font-mono py-3 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium">
              Invalid security PIN. Access denied to protect personnel privacy.
            </p>
          )}

          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>Authenticate Console</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPin('1974');
                onUnlock();
              }}
              className="text-[11px] text-slate-400 hover:text-amber-400 py-1"
            >
              Quick Unlock (FIA Act Year: 1974)
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-850 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Section 5 FIA Act 1974 · Official Privacy Protected</span>
        </div>

      </div>
    </div>
  );
};
