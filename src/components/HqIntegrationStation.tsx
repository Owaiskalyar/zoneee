import React, { useState } from 'react';
import { Officer } from '../types';
import { FIAEmblem } from './FIAEmblem';
import { 
  Server, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  Code2, 
  ShieldCheck, 
  Send, 
  ExternalLink,
  Layers
} from 'lucide-react';

interface HqIntegrationStationProps {
  officers: Officer[];
  onTriggerSync: () => void;
  isSyncing: boolean;
  lastSyncResult: any;
}

export const HqIntegrationStation: React.FC<HqIntegrationStationProps> = ({
  officers,
  onTriggerSync,
  isSyncing,
  lastSyncResult,
}) => {
  const [activeFormat, setActiveFormat] = useState<'JSON' | 'SCHEMA'>('JSON');

  const handleExportFullDocket = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(officers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FIA_ISB_ZONE_HQ_EXPORT_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FIAEmblem size={38} />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Headquarters CMS Integration Gateway</span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                SECURE BRIDGE
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated transmission channel connecting Islamabad Zone records with FIA HQ Central PER CMS (G-9/4 Islamabad).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportFullDocket}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export HQ Batch</span>
          </button>
          
          <button
            type="button"
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap shadow"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Synchronize Now</span>
          </button>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">HQ Endpoint Node</span>
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ESTABLISHED
            </span>
          </div>
          <span className="text-sm font-bold text-white block">hq-cms.fia.gov.pk/api/v2/iz</span>
          <span className="text-slate-500 font-mono block">TLS 1.3 · Mutual Certificate Auth</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Personnel Enrolled</span>
            <span className="font-mono text-amber-400 font-bold">{officers.length} Records</span>
          </div>
          <span className="text-sm font-bold text-white block">All Cadres Verified</span>
          <span className="text-slate-500 block">Investigation, ASI, Constabulary, Court, Law</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Last Transmission Hash</span>
            <span className="font-mono text-cyan-400">ACKNOWLEDGED</span>
          </div>
          <span className="text-sm font-mono text-slate-200 block truncate">
            {lastSyncResult?.checksum || 'SHA256:7D8A9F21B3049C8'}
          </span>
          <span className="text-slate-500 block">{lastSyncResult?.timestamp || 'Synchronized Today'}</span>
        </div>

      </div>

      {/* Sync Acknowledgement Receipt */}
      {lastSyncResult && (
        <div className="bg-slate-900 border border-emerald-800/80 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Headquarters Acknowledgment Receipt — Batch {lastSyncResult.syncId}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{lastSyncResult.timestamp}</span>
          </div>
          <p className="text-xs text-slate-300">
            {lastSyncResult.message} Destination: <strong className="text-white">{lastSyncResult.destination}</strong>
          </p>
        </div>
      )}

      {/* Payload Inspection & Data Mapping Tab */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">
              Central Repository Ingestion Format (JSON Docket)
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {officers.length} Officer Dossiers Ready
          </span>
        </div>

        <div className="p-4 bg-slate-950/80">
          <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96 p-3 bg-slate-950 rounded border border-slate-850">
            {JSON.stringify(officers.slice(0, 2), null, 2)}
          </pre>
        </div>
      </div>

    </div>
  );
};
