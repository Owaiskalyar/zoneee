import React, { useState } from 'react';
import { FIAEmblem } from './FIAEmblem';
import { Lock, ShieldAlert, KeyRound, ArrowRight, Eye, EyeOff, CheckCircle2, RotateCcw, Settings } from 'lucide-react';

interface SecurityPinModalProps {
  onUnlock: () => void;
  currentPin?: string;
  onUpdatePin?: (newPin: string) => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({ 
  onUnlock, 
  currentPin = '1974',
  onUpdatePin 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  
  // Change PIN states
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [showPins, setShowPins] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Validates against configured custom PIN, plus master fallback 1974
    if (pin === currentPin || pin === '1974') {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (oldPinInput !== currentPin && oldPinInput !== '1974') {
      setChangeError('Current PIN is incorrect. (Default master PIN is 1974)');
      return;
    }

    if (newPinInput.length < 4 || newPinInput.length > 8) {
      setChangeError('New PIN must be between 4 and 8 digits.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setChangeError('New PIN and confirmation PIN do not match.');
      return;
    }

    if (onUpdatePin) {
      onUpdatePin(newPinInput);
    } else {
      try {
        localStorage.setItem('fia_auth_pin', newPinInput);
      } catch (err) {}
    }

    setChangeSuccess(true);
    setTimeout(() => {
      onUnlock();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-center space-y-6">
        
        <div className="flex flex-col items-center gap-3">
          <FIAEmblem size={56} />
          <div>
            <span className="text-xs font-mono text-amber-400 tracking-wider font-semibold block">
              RESTRICTED PERSONNEL RECORD
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isChangingPin ? 'Set Custom Authentication PIN' : 'FIA Islamabad Zone Security Barrier'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isChangingPin 
                ? 'Enter your current PIN and choose your new custom security PIN.'
                : 'Enter your authorized security PIN to access officer ACR dockets and operational logs.'}
            </p>
          </div>
        </div>

        {!isChangingPin ? (
          /* Normal Unlock Screen */
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative max-w-xs mx-auto">
              <input
                type={showPins ? "text" : "password"}
                maxLength={8}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setError(false);
                  setPin(e.target.value);
                }}
                placeholder="••••"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium">
                Invalid security PIN. Access denied to protect personnel privacy.
              </p>
            )}

            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Authenticate Console</span>
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPin('1974');
                    onUnlock();
                  }}
                  className="text-slate-400 hover:text-amber-400 text-[11px]"
                  title="Default master PIN for FIA Act 1974"
                >
                  Master PIN (1974)
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="text-amber-400 hover:text-amber-300 font-medium text-[11px] flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Change PIN</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Change PIN Form */
          <form onSubmit={handleChangePinSubmit} className="space-y-3 text-left max-w-xs mx-auto text-xs">
            {changeSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500 rounded-lg text-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="font-bold text-sm">Security PIN Updated!</p>
                <p className="text-[11px] text-emerald-300">Unlocking console with your new PIN...</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Current PIN:</label>
                  <input
                    type={showPins ? "text" : "password"}
                    value={oldPinInput}
                    onChange={(e) => setOldPinInput(e.target.value)}
                    placeholder="Enter current PIN (default: 1974)"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded text-amber-400 font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">New PIN (4-8 digits):</label>
                  <input
                    type={showPins ? "text" : "password"}
                    maxLength={8}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="e.g. 5678"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded text-amber-400 font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Confirm New PIN:</label>
                  <input
                    type={showPins ? "text" : "password"}
                    maxLength={8}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Confirm new PIN"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded text-amber-400 font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                {changeError && (
                  <p className="text-rose-400 text-[11px] font-medium leading-tight">
                    {changeError}
                  </p>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save New PIN & Unlock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPin(false);
                      setChangeError(null);
                    }}
                    className="w-full py-1.5 text-slate-400 hover:text-white text-center text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <div className="pt-4 border-t border-slate-850 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Section 5 FIA Act 1974 · Official Privacy Protected</span>
        </div>

      </div>
    </div>
  );
};
