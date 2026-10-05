import React, { useState } from 'react';
import { Officer, OfficerTask, DailyActivityLog } from '../types';
import { formatDateTime } from '../utils/formatters';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar, 
  Shield, 
  FileCheck, 
  Sparkles, 
  ArrowUpRight,
  Filter,
  Printer,
  FileDown
} from 'lucide-react';
import { downloadRosterPdf } from '../utils/printDocket';

interface DailyDutyRosterProps {
  tasks: OfficerTask[];
  activities: DailyActivityLog[];
  officers: Officer[];
  onToggleTaskStatus: (taskId: string, newStatus: 'Completed' | 'In Progress' | 'Pending') => void;
  onOpenAssignTaskModal: () => void;
  onOpenLogActivityModal: () => void;
  onVerifyActivity: (activityId: string) => void;
}

export const DailyDutyRoster: React.FC<DailyDutyRosterProps> = ({
  tasks,
  activities,
  officers,
  onToggleTaskStatus,
  onOpenAssignTaskModal,
  onOpenLogActivityModal,
  onVerifyActivity,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'TASKS' | 'ACTIVITIES'>('TASKS');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('ALL');

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = taskStatusFilter === 'ALL' || t.status === taskStatusFilter;
    const matchesPriority = taskPriorityFilter === 'ALL' || t.priority === taskPriorityFilter;
    return matchesStatus && matchesPriority;
  });

  const handlePrintRoster = () => {
    try {
      window.print();
    } catch (e) {
      downloadRosterPdf(tasks, activities, officers);
    }
  };

  const handleDownloadPdf = () => {
    downloadRosterPdf(tasks, activities, officers);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Daily Duty Roster & Task Wing</span>
            <span className="text-xs font-mono text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              ISLAMABAD ZONE
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time task allocations, active investigation directives, and daily duty performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 rounded transition-colors whitespace-nowrap cursor-pointer"
            title="Download Roster PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF Roster</span>
          </button>
          <button
            onClick={handlePrintRoster}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap cursor-pointer"
            title="Print Daily Duty Roster"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Roster</span>
          </button>
          <button
            onClick={onOpenLogActivityModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Daily Duty</span>
          </button>
          <button
            onClick={onOpenAssignTaskModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign SOP Task</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('TASKS')}
            className={`pb-2 transition-colors border-b-2 ${
              activeSubTab === 'TASKS'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Operational Tasks Assigned ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('ACTIVITIES')}
            className={`pb-2 transition-colors border-b-2 ${
              activeSubTab === 'ACTIVITIES'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Real-Life Activity Log Stream ({activities.length})
          </button>
        </div>

        {/* Task Specific Filters */}
        {activeSubTab === 'TASKS' && (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        )}
      </div>

      {/* TASKS VIEW */}
      {activeSubTab === 'TASKS' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded">
              <p className="text-slate-400 text-xs">No tasks match your selected filter.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        task.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                        task.priority === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-slate-300 font-semibold">{task.officerName}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400">{task.circle}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-500 font-mono text-[11px]">Due: {task.dueDate}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">{task.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{task.description}</p>
                    
                    <div className="text-[11px] text-slate-500 pt-1">
                      Assigned by: <span className="text-slate-400">{task.assignedBy}</span> on {task.assignedDate}
                    </div>
                  </div>

                  {/* Task Status Changer */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(task.id, 'Pending')}
                        className={`px-2 py-1 rounded transition-colors ${
                          task.status === 'Pending' 
                            ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(task.id, 'In Progress')}
                        className={`px-2 py-1 rounded transition-colors ${
                          task.status === 'In Progress' 
                            ? 'bg-blue-950 text-blue-300 font-semibold border border-blue-800' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(task.id, 'Completed')}
                        className={`px-2 py-1 rounded transition-colors ${
                          task.status === 'Completed' 
                            ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DAILY ACTIVITY LOG STREAM */}
      {activeSubTab === 'ACTIVITIES' && (
        <div className="space-y-3">
          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Official Daily Duty Activity Register — Verified by Circle Incharge</span>
            <span className="text-amber-400 font-mono">Real-Life Feed</span>
          </div>

          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{activity.officerName}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400 font-mono">{activity.date} at {activity.time} PKT</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-cyan-400 font-medium">{activity.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {activity.hoursSpent} hrs logged
                  </span>
                  <button
                    type="button"
                    onClick={() => onVerifyActivity(activity.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      activity.verificationStatus === 'Verified by Incharge'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-emerald-950'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{activity.verificationStatus}</span>
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-white">{activity.activityTitle}</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded border border-slate-850">
                {activity.details}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
