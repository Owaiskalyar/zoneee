import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Terminal, 
  FileCheck,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SecurityAuditViewProps {
  auditLogs: AuditLogEntry[];
  onLockConsole: () => void;
  currentPin?: string;
  onUpdatePin?: (newPin: string) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  auditLogs,
  onLockConsole,
  currentPin = '1974',
  onUpdatePin,
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showInputPins, setShowInputPins] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate old pin
    if (oldPin !== currentPin && oldPin !== '1974') {
      setErrorMsg('Incorrect Current PIN. If you forgot your PIN, the default master PIN is 1974.');
      return;
    }

    if (newPin.length < 4 || newPin.length > 8) {
      setErrorMsg('New Security PIN must be between 4 and 8 digits (or characters).');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and Confirmation PIN do not match.');
      return;
    }

    if (onUpdatePin) {
      onUpdatePin(newPin);
    } else {
      try {
        localStorage.setItem('fia_auth_pin', newPin);
      } catch (err) {}
    }

    setSuccessMsg(`Authentication PIN successfully updated to custom PIN (${newPin})!`);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleResetDefaultPin = () => {
    if (onUpdatePin) {
      onUpdatePin('1974');
    } else {
      try {
        localStorage.setItem('fia_auth_pin', '1974');
      } catch (err) {}
    }
    setSuccessMsg('Security PIN has been reset to default FIA Act Year: 1974.');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Security, Privacy & Audit Trail Register</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              TAMPER-PROOF LOGS
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic ledger tracking all day-to-day metric updates, ACR alterations, and console security credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLockConsole}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shadow cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Console Now</span>
          </button>
        </div>
      </div>

      {/* DEDICATED AUTHENTICATION PIN CONFIGURATION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Console Authentication PIN Management</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  PERSISTENT CREDENTIALS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure your own personalized security PIN to protect official officer ACR dockets and inquiry records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded border border-slate-800 self-start sm:self-auto">
            <span className="text-xs text-slate-400 font-medium">Active PIN:</span>
            <span className="font-mono text-sm font-bold text-amber-400 tracking-wider">
              {showCurrentPin ? currentPin : '••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowCurrentPin(!showCurrentPin)}
              className="text-slate-400 hover:text-white p-0.5"
              title={showCurrentPin ? "Hide PIN" : "Reveal PIN"}
            >
              {showCurrentPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="p-6">
          {successMsg && (
            <div className="mb-4 bg-emerald-950/70 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 bg-rose-950/70 border border-rose-500 text-rose-200 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                1. Current PIN:
              </label>
              <div className="relative">
                <input
                  type={showInputPins ? "text" : "password"}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Enter current PIN (default: 1974)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 px-3 text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Default factory PIN is 1974</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                2. New Custom PIN (4 to 8 digits):
              </label>
              <div className="relative">
                <input
                  type={showInputPins ? "text" : "password"}
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 2026 or 7860"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 px-3 text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Choose any secure numeric or alphanumeric PIN</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                3. Confirm New PIN:
              </label>
              <div className="relative">
                <input
                  type={showInputPins ? "text" : "password"}
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Re-enter new PIN"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 px-3 text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Must match the new PIN above</span>
            </div>

            <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save & Apply New PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInputPins(!showInputPins)}
                  className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                >
                  {showInputPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showInputPins ? "Hide Inputs" : "Show Inputs"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultPin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                  title="Reset PIN back to 1974"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default PIN (1974)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Security Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Personnel Privacy Protection</span>
          </div>
          <p className="text-slate-300">
            Zonal data isolated by Circle. External transmission restricted strictly to authenticated FIA HQ CMS gateways.
          </p>
          <span className="text-[11px] font-mono text-slate-500 block">Class: FIA/ISB/RESTRICTED/SEC-01</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Key className="w-4 h-4" />
            <span>Cryptographic Integrity</span>
          </div>
          <p className="text-slate-300">
            Every metric modification is hashed and timestamped with Pakistan Standard Time (PKT) synchronization.
          </p>
          <span className="text-[11px] font-mono text-slate-500 block">Hash Alg: SHA-256 Ledger</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <FileCheck className="w-4 h-4" />
            <span>Anti-Infringement Policy</span>
          </div>
          <p className="text-slate-300">
            ACR evaluations and investigations data protected against unauthorized disclosure or tampering.
          </p>
          <span className="text-[11px] font-mono text-slate-500 block">Mandate: FIA Act 1974 & PECA</span>
        </div>

      </div>

      {/* Audit Log Entries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Immutable Zonal Activity Log ({auditLogs.length} Events)</span>
          </span>
          <span className="text-slate-500 font-mono">Live Audit Monitor</span>
        </div>

        <div className="divide-y divide-slate-850 max-h-[500px] overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-850/50 transition-colors text-xs space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                    {log.action}
                  </span>
                  <span className="text-slate-200 font-medium">{log.targetOfficer}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">{log.timestamp}</span>
              </div>
              <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
                {log.details}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
