import React, { useState } from 'react';
import { Officer, OfficerTask } from '../types';
import { X, Sparkles, Plus, AlertCircle, RefreshCw } from 'lucide-react';

interface TaskAssignmentModalProps {
  officers: Officer[];
  selectedOfficer?: Officer;
  onClose: () => void;
  onAssignTask: (task: OfficerTask) => void;
}

export const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
  officers,
  selectedOfficer,
  onClose,
  onAssignTask,
}) => {
  const [officerId, setOfficerId] = useState(selectedOfficer?.id || officers[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [assignedBy, setAssignedBy] = useState('Circle Incharge, Islamabad Zone');

  // AI Task generation state
  const [isGeneratingSop, setIsGeneratingSop] = useState(false);
  const [aiObjective, setAiObjective] = useState('');

  const targetOfficer = officers.find((o) => o.id === officerId) || officers[0];

  const handleGenerateAiSop = async () => {
    if (!aiObjective.trim() || !targetOfficer) return;
    setIsGeneratingSop(true);

    try {
      const response = await fetch('/api/generate-task-directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerName: targetOfficer.name,
          rank: targetOfficer.rank,
          cadre: targetOfficer.cadre,
          objective: aiObjective.trim(),
          circle: targetOfficer.circle,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate SOP directive');
      const data = await response.json();

      if (data.taskTitle) setTitle(data.taskTitle);
      if (data.standardOperatingProcedures && data.deliverables) {
        const desc = `${aiObjective.trim()}\n\nSOP MANDATES:\n${data.standardOperatingProcedures.map((s: string, i: number) => `${i+1}. ${s}`).join('\n')}\n\nKEY DELIVERABLES:\n${data.deliverables.join('; ')}\n\nLEGAL BASIS: ${data.legalMandate || 'FIA Act 1974'}`;
        setDescription(desc);
      }
      if (data.priority) setPriority(data.priority);
    } catch (e) {
      console.warn('AI SOP generator fallback', e);
      setTitle(`Task Directive: ${aiObjective.slice(0, 50)}`);
      setDescription(`Objective: ${aiObjective}\n\nAdhere to FIA operational guidelines and submit compliance report within allocated timeline.`);
    } finally {
      setIsGeneratingSop(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetOfficer) return;

    const newTask: OfficerTask = {
      id: `tsk-${Date.now()}`,
      officerId: targetOfficer.id,
      officerName: targetOfficer.name,
      cadre: targetOfficer.cadre,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'In Progress',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate,
      assignedBy,
      circle: targetOfficer.circle,
    };

    onAssignTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden my-8">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <h3 className="text-base font-bold text-white tracking-tight">
            Assign Operational SOP Task
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Assign To Officer</label>
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

          {/* AI SOP Quick Generator Box */}
          <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI SOP Directive Generator</span>
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiObjective}
                onChange={(e) => setAiObjective(e.target.value)}
                placeholder="e.g. Conduct forensic verification on 4 suspicious bank accounts in Blue Area"
                className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleGenerateAiSop}
                disabled={isGeneratingSop || !aiObjective.trim()}
                className="px-3 py-1.5 font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded disabled:opacity-50 whitespace-nowrap"
              >
                {isGeneratingSop ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate SOP'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Directive Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scrutiny of Import Documents & Custody of Record"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Operational Instructions & Mandate</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact field tasks, coordinate with forensic unit, ensure 161 CrPC statement recording..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              >
                <option value="CRITICAL">CRITICAL (Immediate Cordon / Arrest)</option>
                <option value="HIGH">HIGH (48h Turnaround)</option>
                <option value="MEDIUM">MEDIUM (7-14 Days)</option>
                <option value="LOW">LOW (Routine Review)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Completion Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Authorizing Official</label>
            <input
              type="text"
              value={assignedBy}
              onChange={(e) => setAssignedBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
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
              Assign & Record in Duty Roster
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
