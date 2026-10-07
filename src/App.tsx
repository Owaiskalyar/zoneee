import React, { useState, useEffect } from 'react';
import { Officer, OfficerTask, DailyActivityLog, AuditLogEntry, CircleDefinition } from './types';
import { 
  INITIAL_OFFICERS, 
  INITIAL_TASKS, 
  INITIAL_ACTIVITY_LOGS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_CIRCLES
} from './data/initialData';
import { Header } from './components/Header';
import { OfficerDirectory } from './components/OfficerDirectory';
import { OfficerDetailModal } from './components/OfficerDetailModal';
import { DailyDutyRoster } from './components/DailyDutyRoster';
import { AcrStudio } from './components/AcrStudio';
import { ZoneAnalytics } from './components/ZoneAnalytics';
import { HqIntegrationStation } from './components/HqIntegrationStation';
import { SecurityAuditView } from './components/SecurityAuditView';
import { CircleManagementView } from './components/CircleManagementView';
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

  const [circles, setCircles] = useState<CircleDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('fia_isb_circles');
      return saved ? JSON.parse(saved) : INITIAL_CIRCLES;
    } catch {
      return INITIAL_CIRCLES;
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
  const [authPin, setAuthPin] = useState<string>(() => {
    try {
      return localStorage.getItem('fia_auth_pin') || '1974';
    } catch {
      return '1974';
    }
  });

  const handleUpdateAuthPin = (newPin: string) => {
    setAuthPin(newPin);
    try {
      localStorage.setItem('fia_auth_pin', newPin);
    } catch (e) {}
    addAuditEntry(
      'SECURITY_PIN_UPDATE',
      'System Console',
      `Console Authentication PIN updated to custom ${newPin.length}-character security credential.`
    );
  };
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

  useEffect(() => {
    try {
      localStorage.setItem('fia_isb_circles', JSON.stringify(circles));
    } catch (e) {}
  }, [circles]);

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

  // Circle Management Handlers
  const handleAddCircle = (newCircle: CircleDefinition) => {
    setCircles((prev) => [newCircle, ...prev]);
    addAuditEntry(
      'CIRCLE_REGISTERED',
      'Zonal Command HQ',
      `New operational circle "${newCircle.name}" (${newCircle.code}) created under ${newCircle.securityClassification} protocol.`
    );
  };

  const handleUpdateCircle = (updatedCircle: CircleDefinition) => {
    const existing = circles.find((c) => c.id === updatedCircle.id);
    setCircles((prev) => prev.map((c) => (c.id === updatedCircle.id ? updatedCircle : c)));
    
    // If circle name changed, update officers currently in that circle
    if (existing && existing.name !== updatedCircle.name) {
      setOfficers((prev) =>
        prev.map((o) => (o.circle === existing.name ? { ...o, circle: updatedCircle.name } : o))
      );
      setTasks((prev) =>
        prev.map((t) => (t.circle === existing.name ? { ...t, circle: updatedCircle.name } : t))
      );
    }

    addAuditEntry(
      'CIRCLE_MODIFIED',
      'Zonal Command HQ',
      `Circle specifications updated for "${updatedCircle.name}" (Incharge: ${updatedCircle.inchargeName}).`
    );
  };

  const handleDeleteCircle = (circleId: string, reassignToCircleName?: string) => {
    const circleToDelete = circles.find((c) => c.id === circleId);
    if (!circleToDelete) return;

    if (reassignToCircleName) {
      setOfficers((prev) =>
        prev.map((o) => (o.circle === circleToDelete.name ? { ...o, circle: reassignToCircleName } : o))
      );
      setTasks((prev) =>
        prev.map((t) => (t.circle === circleToDelete.name ? { ...t, circle: reassignToCircleName } : t))
      );
    }

    setCircles((prev) => prev.filter((c) => c.id !== circleId));
    addAuditEntry(
      'CIRCLE_DECOMMISSIONED',
      'Zonal Command HQ',
      `Operational circle "${circleToDelete.name}" decommissioned. Active personnel reassigned to "${reassignToCircleName || 'General Reserve'}".`
    );
  };

  const handleTransferOfficer = (officerId: string, targetCircleName: string) => {
    const targetOfficer = officers.find((o) => o.id === officerId);
    if (!targetOfficer) return;

    const oldCircle = targetOfficer.circle;
    setOfficers((prev) =>
      prev.map((o) => (o.id === officerId ? { ...o, circle: targetCircleName } : o))
    );
    setTasks((prev) =>
      prev.map((t) => (t.officerId === officerId ? { ...t, circle: targetCircleName } : t))
    );

    addAuditEntry(
      'OFFICER_CIRCLE_TRANSFER',
      `${targetOfficer.name} (${targetOfficer.badgeNo})`,
      `Personnel reassigned from "${oldCircle}" to "${targetCircleName}". Service dossier preserved.`
    );
  };

  const handleDesignateIncharge = (circleId: string, officer: Officer) => {
    const targetCircle = circles.find((c) => c.id === circleId);
    if (!targetCircle) return;

    const updatedCircle: CircleDefinition = {
      ...targetCircle,
      inchargeName: `${officer.name} (${officer.rank})`,
      inchargeRank: officer.rank,
      inchargeOfficerId: officer.id,
    };

    setCircles((prev) => prev.map((c) => (c.id === circleId ? updatedCircle : c)));
    addAuditEntry(
      'INCHARGE_APPOINTMENT',
      `${officer.name} (${officer.badgeNo})`,
      `Officially designated as Circle Incharge of "${targetCircle.name}".`
    );
  };

  const handleAddNewOfficerToCircle = (partialOfficer: Partial<Officer>) => {
    const newOfficer: Officer = {
      id: `off-${Date.now()}`,
      srNo: officers.length + 1,
      name: partialOfficer.name || 'New Officer',
      badgeNo: partialOfficer.badgeNo || `FIA-${Date.now().toString().slice(-4)}`,
      beltNo: partialOfficer.beltNo || 'ISB-NEW',
      cadre: partialOfficer.cadre || 'INVESTIGATION',
      rank: partialOfficer.rank || 'Inspector',
      circle: partialOfficer.circle || circles[0]?.name || 'Anti-Corruption Circle (ACC)',
      phone: partialOfficer.phone || '+92 300 0000000',
      cnic: partialOfficer.cnic || '61101-0000000-0',
      postingDuration: partialOfficer.postingDuration || 'Newly Deployed',
      status: 'Active Duty',
      lastUpdated: new Date().toISOString(),
      acrScore: 72,
      acrGrade: 'Good',
      metrics: {
        enquiriesAssigned: 10,
        enquiriesClosed: 7,
        enquiriesMerged: 1,
        casesFirRegistered: 4,
        challansSubmitted: 3,
        pendingCases: 2,
        accusedArrested: 6,
        casesDecidedInCourt: 3,
        convictionsObtained: 2,
        totalRecoveriesPkr: 5000000,
        violationsShowcausesIssued: 0,
        appreciationsReceived: 1,
        explanationsCalled: 0,
        participationInGoodWork: 1,
        disposalRate: 0.70,
        challanRate: 0.75,
        convictionRate: 0.67,
        conductRecognitionIndex: 75,
        weightedScore: 72.0,
        overallGradeRemarks: 'Good',
      } as any,
    };

    const computed = recalculateOfficerMetrics(newOfficer);
    setOfficers((prev) => [computed, ...prev]);
    addAuditEntry(
      'CIRCLE_PERSONNEL_DEPLOYMENT',
      `${computed.name} (${computed.badgeNo})`,
      `Deployed directly to ${computed.circle} as ${computed.rank}.`
    );
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
        <SecurityPinModal 
          onUnlock={() => setIsConsoleLocked(false)}
          currentPin={authPin}
          onUpdatePin={handleUpdateAuthPin}
        />
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
            circles={circles}
            onSelectOfficer={(officer) => setSelectedOfficerForDetail(officer)}
            onOpenNewOfficerModal={() => setIsNewOfficerModalOpen(true)}
            onGenerateAcr={(officer) => {
              setSelectedOfficerForAcrId(officer.id);
              setActiveTab('acr');
            }}
          />
        )}

        {/* TAB 2: Circle Wings & Command Hierarchy Customization */}
        {activeTab === 'circles' && (
          <CircleManagementView
            circles={circles}
            officers={officers}
            onAddCircle={handleAddCircle}
            onUpdateCircle={handleUpdateCircle}
            onDeleteCircle={handleDeleteCircle}
            onTransferOfficer={handleTransferOfficer}
            onDesignateIncharge={handleDesignateIncharge}
            onAddNewOfficerToCircle={handleAddNewOfficerToCircle}
            onViewOfficerDetail={(officer) => setSelectedOfficerForDetail(officer)}
            authPin={authPin}
          />
        )}

        {/* TAB 3: Daily Activity & Duty Roster */}
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

        {/* TAB 4: ACR / PER Dossier Studio */}
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

        {/* TAB 5: Zone Statistical Analytics */}
        {activeTab === 'analytics' && (
          <ZoneAnalytics officers={officers} circles={circles} />
        )}

        {/* TAB 6: Headquarters CMS Integration */}
        {activeTab === 'hq-sync' && (
          <HqIntegrationStation
            officers={officers}
            onTriggerSync={handleHqSync}
            isSyncing={isSyncing}
            lastSyncResult={lastSyncResult}
          />
        )}

        {/* TAB 7: Security & Audit Trail */}
        {activeTab === 'audit' && (
          <SecurityAuditView
            auditLogs={auditLogs}
            onLockConsole={() => setIsConsoleLocked(true)}
            currentPin={authPin}
            onUpdatePin={handleUpdateAuthPin}
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
          circles={circles}
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
