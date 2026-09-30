import React from 'react';
import { AuditLogEntry } from '../types';
import { Shield, Lock, CheckCircle2, AlertTriangle, Key, Terminal, FileCheck } from 'lucide-react';

interface SecurityAuditViewProps {
  auditLogs: AuditLogEntry[];
  onLockConsole: () => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  auditLogs,
  onLockConsole,
}) => {
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
            Cryptographic ledger tracking all day-to-day metric updates, ACR alterations, and personnel evaluations.
          </p>
        </div>

        <button
          type="button"
          onClick={onLockConsole}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shadow"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Console Now</span>
        </button>
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

              <p className="text-slate-300">{log.details}</p>
              
              <div className="text-[11px] text-slate-500">
                Authorized By: <span className="text-slate-400 font-medium">{log.user}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
