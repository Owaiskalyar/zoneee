import React, { useState } from 'react';
import { Officer, DailyActivityLog } from '../types';
import { X, Clock, CheckCircle2 } from 'lucide-react';

interface DailyActivityModalProps {
  officers: Officer[];
  selectedOfficer?: Officer;
  onClose: () => void;
  onLogActivity: (activity: DailyActivityLog) => void;
}

export const DailyActivityModal: React.FC<DailyActivityModalProps> = ({
  officers,
  selectedOfficer,
  onClose,
  onLogActivity,
}) => {
  const [officerId, setOfficerId] = useState(selectedOfficer?.id || officers[0]?.id || '');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(4);
  const [category, setCategory] = useState('Field Investigation & Raids');

  const targetOfficer = officers.find((o) => o.id === officerId) || officers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetOfficer) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const newLog: DailyActivityLog = {
      id: `log-${Date.now()}`,
      officerId: targetOfficer.id,
      officerName: targetOfficer.name,
      cadre: targetOfficer.cadre,
      date: dateStr,
      time: timeStr,
      activityTitle: title.trim(),
      details: details.trim(),
      hoursSpent: Number(hoursSpent) || 1,
      category,
      verificationStatus: 'Verified by Incharge',
    };

    onLogActivity(newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden my-8">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Log Day-to-Day Duty Activity
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Officer Conducting Duty</label>
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.rank}) — {o.circle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Activity Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            >
              <option value="Field Investigation & Raids">Field Investigation & Tactical Raids</option>
              <option value="Asset Recovery & Pay-Orders">Asset Recovery & Voluntary Restitution</option>
              <option value="Field Verifications">Enquiry & Financial Verifications</option>
              <option value="Court Trial & Legal Pleading">Court Trial & Legal Pleading</option>
              <option value="Judicial Summons Execution">Judicial Summons Execution (Naib Court)</option>
              <option value="Airport Liaison & Deportees">Airport Liaison & Deportee Processing</option>
              <option value="Custody Escort & Protocol">Suspect Escort & Court Transit</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Brief Activity Heading</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conducted raid at Sector G-9 and arrested 1 absconder"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Detailed Activity Record</label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Include case FIR/Enquiry number, recovered amount, seized items, or court orders..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Hours Spent on this Activity</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              required
              value={hoursSpent}
              onChange={(e) => setHoursSpent(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded transition-colors"
            >
              Post to Daily Roster Feed
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
