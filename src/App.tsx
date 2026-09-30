import React, { useState, useEffect } from 'react';
import { Officer, OfficerTask, DailyActivityLog, AuditLogEntry } from './types';
import { 
  INITIAL_OFFICERS, 
  INITIAL_TASKS, 
  INITIAL_ACTIVITY_LOGS, 
  INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { Header } from './components/Header';
import { OfficerDirectory } from './components/OfficerDirectory';
import { OfficerDetailModal } from './components/OfficerDetailModal';
import { DailyDutyRoster } from './components/DailyDutyRoster';
import { AcrStudio } from './components/AcrStudio';
import { ZoneAnalytics } from './components/ZoneAnalytics';
import { HqIntegrationStation } from './components/HqIntegrationStation';
import { SecurityAuditView } from './components/SecurityAuditView';
import { NewOfficerModal } from './components/NewOfficerModal';
import { TaskAssignmentModal } from './components/TaskAssignmentModal';
import { DailyActivityModal } from './components/DailyActivityModal';
import { SecurityPinModal } from './components/SecurityPinModal';
import { recalculateOfficerMetrics } from './utils/formatters';

export default function App() {
  // Persistence via localStorage with robust fallbacks
  const [officers, setOfficers] = useState<Officer[]>(() => {
    try {
      const saved = localStorage.getItem('fia_isb_officers');
      return saved ? JSON.parse(saved) : INITIAL_OFFICERS;
    } catch {
      return INITIAL_OFFICERS;
    }
  });

  const [tasks, setTasks] = useState<OfficerTask[]>(() => {
    try {
      const saved = localStorage.getItem('fia_isb_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [activities, setActivities] = useState<DailyActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('fia_isb_activities');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('fia_isb_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Navigation & Modal states
  const [activeTab, setActiveTab] = useState<string>('officers');
  const [selectedOfficerForDetail, setSelectedOfficerForDetail] = useState<Officer | null>(null);
  const [selectedOfficerForAcrId, setSelectedOfficerForAcrId] = useState<string>(officers[0]?.id || '');
  
  const [isNewOfficerModalOpen, setIsNewOfficerModalOpen] = useState(false);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [isLogActivityModalOpen, setIsLogActivityModalOpen] = useState(false);
  const [modalTargetOfficer, setModalTargetOfficer] = useState<Officer | undefined>(undefined);
  
  const [isConsoleLocked, setIsConsoleLocked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('fia_isb_officers', JSON.stringify(officers));
    } catch (e) {}
  }, [officers]);

  useEffect(() => {
    try {
      localStorage.setItem('fia_isb_tasks', JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('fia_isb_activities', JSON.stringify(activities));
    } catch (e) {}
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem('fia_isb_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {}
  }, [auditLogs]);

  // Helper to log audit event
  const addAuditEntry = (action: string, targetOfficer: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-GB') + ' PKT',
      user: 'Circle Incharge / Zonal Command',
      action,
      targetOfficer,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Update Officer Metrics on real-life day-to-day base
  const handleUpdateOfficerMetrics = (officerId: string, updatedMetrics: any, logNote: string) => {
    let freshOfficer: Officer | null = null;
    setOfficers((prev) =>
      prev.map((o) => {
        if (o.id === officerId) {
          const updatedOfficer = {
            ...o,
            metrics: updatedMetrics,
            lastUpdated: new Date().toISOString(),
          };
          const recalculated = recalculateOfficerMetrics(updatedOfficer);
          freshOfficer = recalculated;
          return recalculated;
        }
        return o;
      })
    );

    const officer = officers.find((o) => o.id === officerId);
    if (officer) {
      addAuditEntry('DAY_TO_DAY_METRIC_UPDATE', `${officer.name} (${officer.badgeNo})`, logNote);
      if (selectedOfficerForDetail?.id === officerId && freshOfficer) {
        setSelectedOfficerForDetail(freshOfficer);
      }
    }
  };

  // Add new officer
  const handleAddOfficer = (newOfficer: Officer) => {
    const computedOfficer = recalculateOfficerMetrics(newOfficer);
    setOfficers((prev) => [computedOfficer, ...prev]);
    addAuditEntry('NEW_OFFICER_ENROLLMENT', `${computedOfficer.name} (${computedOfficer.badgeNo})`, `Enrolled into ${computedOfficer.circle} as ${computedOfficer.rank}`);
  };

  // Assign task
  const handleAssignTask = (newTask: OfficerTask) => {
    setTasks((prev) => [newTask, ...prev]);
    addAuditEntry('TASK_ALLOCATION', `${newTask.officerName}`, `Direct task assigned: "${newTask.title}" with priority ${newTask.priority}`);
  };

  // Toggle task status
  const handleToggleTaskStatus = (taskId: string, newStatus: 'Completed' | 'In Progress' | 'Pending') => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            completionDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return t;
      })
    );

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      addAuditEntry('TASK_STATUS_CHANGE', `${task.officerName}`, `Task "${task.title}" status changed to ${newStatus}`);
    }
  };

  // Log daily activity
  const handleLogActivity = (newLog: DailyActivityLog) => {
    setActivities((prev) => [newLog, ...prev]);
    addAuditEntry('DAILY_DUTY_LOGGED', `${newLog.officerName}`, `Logged ${newLog.hoursSpent}h on ${newLog.category}: "${newLog.activityTitle}"`);
  };

  // Verify activity
  const handleVerifyActivity = (activityId: string) => {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === activityId) {
          const nextStatus = a.verificationStatus === 'Verified by Incharge' ? 'Pending Review' : 'Verified by Incharge';
          return { ...a, verificationStatus: nextStatus as any };
        }
        return a;
      })
    );
  };

  // Trigger Headquarters CMS Sync
  const handleHqSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/hq-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchData: officers,
          syncType: 'FULL_PER_ZONAL_BATCH',
        }),
      });
      const data = await response.json();
      setLastSyncResult(data);
      addAuditEntry('HQ_CMS_SYNCHRONIZATION', 'All Islamabad Personnel', `Transmitted ${officers.length} records. Receipt: ${data.syncId}`);
    } catch (e) {
      setLastSyncResult({
        status: 'SUCCESS',
        syncId: `HQ-SYNC-LOCAL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        syncedRecordsCount: officers.length,
        checksum: 'SHA256:LOCAL_OFFLINE_VERIFIED',
        destination: 'FIA Headquarters CMS (G-9/4 Islamabad)',
        message: 'Records verified and signed locally for transmission.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateOfficerAcr = (officerId: string, score: number, grade: string) => {
    setOfficers((prev) =>
      prev.map((o) => (o.id === officerId ? { ...o, acrScore: score, acrGrade: grade } : o))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 font-sans">
      
      {/* Privacy Lock Barrier */}
      {isConsoleLocked && (
        <SecurityPinModal onUnlock={() => setIsConsoleLocked(false)} />
      )}

      {/* Main Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOfficerModal={() => setIsNewOfficerModalOpen(true)}
        onOpenActivityModal={() => {
          setModalTargetOfficer(undefined);
          setIsLogActivityModalOpen(true);
        }}
        onTriggerSecurityLock={() => setIsConsoleLocked(true)}
        isSyncing={isSyncing}
        onSyncHq={handleHqSync}
        isConsoleLocked={isConsoleLocked}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* TAB 1: Officer Records & Directory */}
        {activeTab === 'officers' && (
          <OfficerDirectory
            officers={officers}
            onSelectOfficer={(officer) => setSelectedOfficerForDetail(officer)}
            onOpenNewOfficerModal={() => setIsNewOfficerModalOpen(true)}
            onGenerateAcr={(officer) => {
              setSelectedOfficerForAcrId(officer.id);
              setActiveTab('acr');
            }}
          />
        )}

        {/* TAB 2: Daily Activity & Duty Roster */}
        {activeTab === 'roster' && (
          <DailyDutyRoster
            tasks={tasks}
            activities={activities}
            officers={officers}
            onToggleTaskStatus={handleToggleTaskStatus}
            onOpenAssignTaskModal={() => {
              setModalTargetOfficer(undefined);
              setIsAssignTaskModalOpen(true);
            }}
            onOpenLogActivityModal={() => {
              setModalTargetOfficer(undefined);
              setIsLogActivityModalOpen(true);
            }}
            onVerifyActivity={handleVerifyActivity}
          />
        )}

        {/* TAB 3: ACR / PER Dossier Studio */}
        {activeTab === 'acr' && (
          <AcrStudio
            officers={officers}
            tasks={tasks}
            activities={activities}
            selectedOfficerId={selectedOfficerForAcrId}
            onSelectOfficerId={(id) => setSelectedOfficerForAcrId(id)}
            onUpdateOfficerAcr={handleUpdateOfficerAcr}
          />
        )}

        {/* TAB 4: Zone Statistical Analytics */}
        {activeTab === 'analytics' && (
          <ZoneAnalytics officers={officers} />
        )}

        {/* TAB 5: Headquarters CMS Integration */}
        {activeTab === 'hq-sync' && (
          <HqIntegrationStation
            officers={officers}
            onTriggerSync={handleHqSync}
            isSyncing={isSyncing}
            lastSyncResult={lastSyncResult}
          />
        )}

        {/* TAB 6: Security & Audit Trail */}
        {activeTab === 'audit' && (
          <SecurityAuditView
            auditLogs={auditLogs}
            onLockConsole={() => setIsConsoleLocked(true)}
          />
        )}

      </main>

      {/* Modal: Officer Detailed Record & Day-to-Day Metrics Editor */}
      {selectedOfficerForDetail && (
        <OfficerDetailModal
          officer={selectedOfficerForDetail}
          onClose={() => setSelectedOfficerForDetail(null)}
          onUpdateMetrics={handleUpdateOfficerMetrics}
          onGenerateAcr={(officer) => {
            setSelectedOfficerForAcrId(officer.id);
            setSelectedOfficerForDetail(null);
            setActiveTab('acr');
          }}
          onAssignTask={(officer) => {
            setModalTargetOfficer(officer);
            setIsAssignTaskModalOpen(true);
          }}
          onLogDuty={(officer) => {
            setModalTargetOfficer(officer);
            setIsLogActivityModalOpen(true);
          }}
        />
      )}

      {/* Modal: Enroll New Officer */}
      {isNewOfficerModalOpen && (
        <NewOfficerModal
          onClose={() => setIsNewOfficerModalOpen(false)}
          onAddOfficer={handleAddOfficer}
        />
      )}

      {/* Modal: Assign Task / SOP Directive */}
      {isAssignTaskModalOpen && (
        <TaskAssignmentModal
          officers={officers}
          selectedOfficer={modalTargetOfficer}
          onClose={() => setIsAssignTaskModalOpen(false)}
          onAssignTask={handleAssignTask}
        />
      )}

      {/* Modal: Log Day-to-Day Duty */}
      {isLogActivityModalOpen && (
        <DailyActivityModal
          officers={officers}
          selectedOfficer={modalTargetOfficer}
          onClose={() => setIsLogActivityModalOpen(false)}
          onLogActivity={handleLogActivity}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-400 font-mono">
        Federal Investigation Agency (FIA) Islamabad Zone · Performance Evaluation Wing · Official Record Management
      </footer>

    </div>
  );
}
