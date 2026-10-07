import React, { useState, useMemo } from 'react';
import { Officer, CircleDefinition, Cadre, Rank } from '../types';
import { FIAEmblem } from './FIAEmblem';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  UserCheck, 
  UserPlus, 
  ArrowRightLeft, 
  Lock, 
  Unlock, 
  KeyRound, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Search, 
  Shield, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  FileText, 
  X,
  BadgeCheck,
  Briefcase,
  Scale,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { getCadreDisplayName, recalculateOfficerMetrics } from '../utils/formatters';

interface CircleManagementViewProps {
  circles: CircleDefinition[];
  officers: Officer[];
  onAddCircle: (newCircle: CircleDefinition) => void;
  onUpdateCircle: (updatedCircle: CircleDefinition) => void;
  onDeleteCircle: (circleId: string, reassignToCircleName?: string) => void;
  onTransferOfficer: (officerId: string, targetCircleName: string) => void;
  onDesignateIncharge: (circleId: string, officer: Officer) => void;
  onAddNewOfficerToCircle: (newOfficer: Partial<Officer>) => void;
  onViewOfficerDetail: (officer: Officer) => void;
  authPin: string;
}

export const CircleManagementView: React.FC<CircleManagementViewProps> = ({
  circles,
  officers,
  onAddCircle,
  onUpdateCircle,
  onDeleteCircle,
  onTransferOfficer,
  onDesignateIncharge,
  onAddNewOfficerToCircle,
  onViewOfficerDetail,
  authPin,
}) => {
  const [selectedCircleId, setSelectedCircleId] = useState<string>(circles[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTierFilter, setActiveTierFilter] = useState<string>('ALL');
  
  // Security / Confidentiality Mode
  const [isConfidentialUnlocked, setIsConfidentialUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Modals
  const [isAddCircleModalOpen, setIsAddCircleModalOpen] = useState(false);
  const [isEditCircleModalOpen, setIsEditCircleModalOpen] = useState(false);
  const [isDeleteCircleModalOpen, setIsDeleteCircleModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeployOfficerModalOpen, setIsDeployOfficerModalOpen] = useState(false);
  
  // Modal working states
  const [selectedOfficerForTransfer, setSelectedOfficerForTransfer] = useState<Officer | null>(null);
  const [targetCircleForTransfer, setTargetCircleForTransfer] = useState<string>('');
  const [reassignFallbackCircle, setReassignFallbackCircle] = useState<string>('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // New Circle Form state
  const [newCircleForm, setNewCircleForm] = useState<Partial<CircleDefinition>>({
    name: '',
    code: '',
    inchargeName: '',
    inchargeRank: 'Deputy Director',
    jurisdiction: '',
    headquarters: 'Regional Headquarters, Sector G-9/4, Islamabad',
    contactNo: '+92 51 9260100',
    securityClassification: 'CONFIDENTIAL',
    establishedYear: new Date().getFullYear().toString(),
    description: '',
  });

  // Edit Circle Form state
  const [editCircleForm, setEditCircleForm] = useState<Partial<CircleDefinition>>({});

  // Deploy New Officer into Circle form state
  const [deployForm, setDeployForm] = useState<{
    name: string;
    badgeNo: string;
    beltNo: string;
    rank: Rank;
    cadre: Cadre;
    phone: string;
    cnic: string;
    postingDuration: string;
  }>({
    name: '',
    badgeNo: `FIA-${Date.now().toString().slice(-4)}`,
    beltNo: 'ISB-NEW',
    rank: 'Inspector',
    cadre: 'INVESTIGATION',
    phone: '+92 300 0000000',
    cnic: '61101-0000000-0',
    postingDuration: 'Newly Deployed',
  });

  // Current active circle object
  const activeCircle = useMemo(() => {
    return circles.find((c) => c.id === selectedCircleId) || circles[0];
  }, [circles, selectedCircleId]);

  // All officers belonging to this selected circle
  const circleOfficers = useMemo(() => {
    if (!activeCircle) return [];
    return officers.filter((o) => o.circle === activeCircle.name);
  }, [officers, activeCircle]);

  // Officers filtered by search and tier
  const filteredCircleOfficers = useMemo(() => {
    return circleOfficers.filter((o) => {
      const matchesSearch = 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.badgeNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.rank.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTierFilter === 'ALL') return true;
      if (activeTierFilter === 'INCHARGE') return o.rank.includes('Director') || o.name === activeCircle?.inchargeName;
      if (activeTierFilter === 'INVESTIGATION') return o.cadre === 'INVESTIGATION';
      if (activeTierFilter === 'ASI') return o.cadre === 'ASI';
      if (activeTierFilter === 'LAW_COURT') return o.cadre === 'LAW_BRANCH' || o.cadre === 'NAIB_COURT';
      if (activeTierFilter === 'LOWER_STAFF') return o.cadre === 'CONSTABULARY';
      return true;
    });
  }, [circleOfficers, searchQuery, activeTierFilter, activeCircle]);

  // Group officers by Hierarchical Command Level
  const hierarchyGroups = useMemo(() => {
    const leadership = circleOfficers.filter((o) => 
      o.rank.includes('Director') || 
      o.name.toLowerCase().includes(activeCircle?.inchargeName?.toLowerCase() || '')
    );
    const investigationStaff = circleOfficers.filter((o) => 
      o.cadre === 'INVESTIGATION' && !leadership.includes(o)
    );
    const asiStaff = circleOfficers.filter((o) => o.cadre === 'ASI');
    const legalAndCourtStaff = circleOfficers.filter((o) => 
      o.cadre === 'LAW_BRANCH' || o.cadre === 'NAIB_COURT'
    );
    const lowerStaff = circleOfficers.filter((o) => o.cadre === 'CONSTABULARY');

    return {
      leadership,
      investigationStaff,
      asiStaff,
      legalAndCourtStaff,
      lowerStaff,
    };
  }, [circleOfficers, activeCircle]);

  // Available officers from OTHER circles that can be transferred in
  const externalOfficers = useMemo(() => {
    if (!activeCircle) return [];
    return officers.filter((o) => o.circle !== activeCircle.name);
  }, [officers, activeCircle]);

  // Security Unlock Handler
  const handleUnlockPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === authPin || pinInput === '1974') {
      setIsConfidentialUnlocked(true);
      setShowPinPrompt(false);
      setPinInput('');
      setPinError(false);
      showNotice('Confidential Authorization Confirmed: Admin Mode Unlocked.');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const showNotice = (msg: string) => {
    setActionSuccessNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 4500);
  };

  const handleCreateCircleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleForm.name || !newCircleForm.code) return;

    const newCircle: CircleDefinition = {
      id: `circle-${Date.now()}`,
      name: newCircleForm.name.trim(),
      code: newCircleForm.code.trim().toUpperCase(),
      inchargeName: newCircleForm.inchargeName || 'To Be Designated (Deputy Director)',
      inchargeRank: newCircleForm.inchargeRank || 'Deputy Director',
      jurisdiction: newCircleForm.jurisdiction || 'Islamabad Capital Territory Jurisdiction',
      headquarters: newCircleForm.headquarters || 'Regional Headquarters, Sector G-9/4, Islamabad',
      contactNo: newCircleForm.contactNo || '+92 51 9260100',
      securityClassification: newCircleForm.securityClassification || 'CONFIDENTIAL',
      establishedYear: newCircleForm.establishedYear || new Date().getFullYear().toString(),
      description: newCircleForm.description || 'Specialized Circle operative under Federal Investigation Agency Islamabad Zone.',
      isDefault: false,
    };

    onAddCircle(newCircle);
    setSelectedCircleId(newCircle.id);
    setIsAddCircleModalOpen(false);
    showNotice(`New Operational Circle "${newCircle.name}" successfully created and added to Command ledger.`);
    setNewCircleForm({
      name: '',
      code: '',
      inchargeName: '',
      inchargeRank: 'Deputy Director',
      jurisdiction: '',
      headquarters: 'Regional Headquarters, Sector G-9/4, Islamabad',
      contactNo: '+92 51 9260100',
      securityClassification: 'CONFIDENTIAL',
      establishedYear: new Date().getFullYear().toString(),
      description: '',
    });
  };

  const handleSaveEditCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || !editCircleForm.name) return;

    const updated: CircleDefinition = {
      ...activeCircle,
      ...editCircleForm,
    } as CircleDefinition;

    onUpdateCircle(updated);
    setIsEditCircleModalOpen(false);
    showNotice(`Circle specifications for "${updated.name}" updated successfully.`);
  };

  const handleDeleteCircleConfirm = () => {
    if (!activeCircle) return;
    const circleName = activeCircle.name;
    const targetFallback = reassignFallbackCircle || (circles.find((c) => c.id !== activeCircle.id)?.name);

    onDeleteCircle(activeCircle.id, targetFallback);
    setIsDeleteCircleModalOpen(false);
    
    // Select first remaining circle
    const remaining = circles.filter((c) => c.id !== activeCircle.id);
    if (remaining.length > 0) {
      setSelectedCircleId(remaining[0].id);
    }
    showNotice(`Circle "${circleName}" removed. Personnel reassigned to "${targetFallback}".`);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficerForTransfer || !targetCircleForTransfer) return;

    onTransferOfficer(selectedOfficerForTransfer.id, targetCircleForTransfer);
    setIsTransferModalOpen(false);
    showNotice(`Officer ${selectedOfficerForTransfer.name} transferred to "${targetCircleForTransfer}".`);
    setSelectedOfficerForTransfer(null);
  };

  const handleDeployNewOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || !deployForm.name) return;

    onAddNewOfficerToCircle({
      ...deployForm,
      circle: activeCircle.name,
      status: 'Active Duty',
    });

    setIsDeployOfficerModalOpen(false);
    showNotice(`Personnel "${deployForm.name}" (${deployForm.rank}) deployed to ${activeCircle.name}.`);
    setDeployForm({
      name: '',
      badgeNo: `FIA-${Date.now().toString().slice(-4)}`,
      beltNo: 'ISB-NEW',
      rank: 'Inspector',
      cadre: 'INVESTIGATION',
      phone: '+92 300 0000000',
      cnic: '61101-0000000-0',
      postingDuration: 'Newly Deployed',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {actionSuccessNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-lg flex items-center justify-between text-xs animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccessNotice}</span>
          </div>
          <button 
            onClick={() => setActionSuccessNotice(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner: Confidentiality & Circle Hub Overview */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>Circle Command Architecture & Hierarchy Customization</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700 text-emerald-400 font-semibold">
              ISLAMABAD REGIONAL ZONE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Configure circles, designate Circle Incharges (Deputy Directors / ADs), and manage cadre allocations from lower constabulary to specialized investigation officers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Security Status Badge / Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isConfidentialUnlocked) {
                setIsConfidentialUnlocked(false);
                showNotice('Confidential Mode Relocked: Unauthorized alterations restricted.');
              } else {
                setShowPinPrompt(true);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
              isConfidentialUnlocked
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/40 border-amber-600/70 text-amber-300 hover:bg-amber-900/60'
            }`}
            title="Toggle Confidential Admin Mode (Protected by Security Authentication PIN)"
          >
            {isConfidentialUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Mode: Unlocked</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Confidential: Locked</span>
              </>
            )}
          </button>

          {/* Create New Circle Button */}
          <button
            type="button"
            onClick={() => {
              if (!isConfidentialUnlocked) {
                setShowPinPrompt(true);
                return;
              }
              setIsAddCircleModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-md whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Circle</span>
          </button>
        </div>
      </div>

      {/* Circle Statistics & Classification Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-slate-400 text-[11px] block">Active Zonal Circles</span>
          <span className="text-xl font-bold font-mono text-white tabular-nums">
            {circles.length} Specialized Wings
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-slate-400 text-[11px] block">Personnel in Selected Circle</span>
          <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {circleOfficers.length} Officers Deployed
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-slate-400 text-[11px] block">Appointed Circle Incharge</span>
          <span className="text-xs font-bold text-emerald-400 truncate block mt-1" title={activeCircle?.inchargeName}>
            {activeCircle?.inchargeName || 'Vacant'}
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-slate-400 text-[11px] block">Security Classification</span>
          <span className="text-xs font-bold font-mono text-cyan-400 uppercase block mt-1">
            {activeCircle?.securityClassification || 'CONFIDENTIAL'}
          </span>
        </div>
      </div>

      {/* Circle Horizontal Selector Pills */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Operational Circle for Customization & Cadre Deployment:</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Total {circles.length} Circles Registered
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {circles.map((c) => {
            const isSelected = c.id === selectedCircleId;
            const personnel = officers.filter((o) => o.circle === c.name).length;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCircleId(c.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400'}`}>
                  {c.code}
                </span>
                <span>{c.name}</span>
                <span className={`text-[11px] font-mono rounded-full px-1.5 py-0.2 ${isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {personnel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED CIRCLE HEADER & ADMINISTRATIVE CONTROLS */}
      {activeCircle && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400">
                  {activeCircle.code} WING
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {activeCircle.name}
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                  activeCircle.securityClassification === 'TOP SECRET'
                    ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                    : activeCircle.securityClassification === 'SECRET'
                    ? 'bg-purple-950/80 border-purple-700 text-purple-300'
                    : 'bg-blue-950/80 border-blue-700 text-blue-300'
                }`}>
                  {activeCircle.securityClassification}
                </span>
                {activeCircle.isDefault && (
                  <span className="text-[10px] font-mono text-slate-500">Statutory Unit</span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {activeCircle.description || 'Statutory operational investigation wing of Federal Investigation Agency Islamabad Zone.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{activeCircle.headquarters}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono">{activeCircle.contactNo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Mandate: <strong className="text-slate-200">{activeCircle.jurisdiction}</strong></span>
                </div>
              </div>
            </div>

            {/* Circle Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              
              {/* Deploy New Officer */}
              <button
                type="button"
                onClick={() => {
                  if (!isConfidentialUnlocked) {
                    setShowPinPrompt(true);
                    return;
                  }
                  setIsDeployOfficerModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-sm cursor-pointer"
                title="Deploy personnel directly into this circle"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Deploy Officer</span>
              </button>

              {/* Transfer Officer In */}
              <button
                type="button"
                onClick={() => {
                  if (!isConfidentialUnlocked) {
                    setShowPinPrompt(true);
                    return;
                  }
                  setIsTransferModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
                title="Transfer an existing officer from another circle"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Transfer In</span>
              </button>

              {/* Edit Circle Specs */}
              <button
                type="button"
                onClick={() => {
                  if (!isConfidentialUnlocked) {
                    setShowPinPrompt(true);
                    return;
                  }
                  setEditCircleForm(activeCircle);
                  setIsEditCircleModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors cursor-pointer"
                title="Edit circle parameters and incharge"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Specs</span>
              </button>

              {/* Delete Circle */}
              <button
                type="button"
                onClick={() => {
                  if (!isConfidentialUnlocked) {
                    setShowPinPrompt(true);
                    return;
                  }
                  setIsDeleteCircleModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-md transition-colors cursor-pointer"
                title="Remove circle and reassign active personnel"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Decommission</span>
              </button>

            </div>

          </div>

          {/* CIRCLE INCHARGE APPOINTMENT CARD */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-400">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                  APPOINTED CIRCLE INCHARGE / COMMANDING OFFICER
                </span>
                <h4 className="text-sm font-bold text-white">
                  {activeCircle.inchargeName}
                </h4>
                <span className="text-xs text-slate-400">
                  Rank: <strong className="text-slate-200">{activeCircle.inchargeRank}</strong> · Authorizes daily duty allocations and sign-off on PER / ACR dockets.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isConfidentialUnlocked) {
                    setShowPinPrompt(true);
                    return;
                  }
                  setEditCircleForm(activeCircle);
                  setIsEditCircleModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap cursor-pointer"
              >
                Reassign Incharge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CIRCLE CADRE & PERSONNEL HIERARCHICAL ROSTER */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden space-y-4 p-5">
        
        {/* Sub-Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Hierarchical Personnel Deployment ({circleOfficers.length} Officers)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Complete cadre roster in {activeCircle?.name} from Circle Incharge and ADs to lower constabulary.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, badge, rank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-52"
              />
            </div>
          </div>
        </div>

        {/* Cadre Tier Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: `All Cadres (${circleOfficers.length})` },
            { id: 'INCHARGE', label: `Leadership / Incharge (${hierarchyGroups.leadership.length})` },
            { id: 'INVESTIGATION', label: `IOs & ADs (${hierarchyGroups.investigationStaff.length})` },
            { id: 'ASI', label: `ASIs (${hierarchyGroups.asiStaff.length})` },
            { id: 'LAW_COURT', label: `Law & Naib Court (${hierarchyGroups.legalAndCourtStaff.length})` },
            { id: 'LOWER_STAFF', label: `Lower Staff / Constabulary (${hierarchyGroups.lowerStaff.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTierFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTierFilter === tab.id
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Officers Grid */}
        {filteredCircleOfficers.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <h5 className="text-sm font-semibold text-slate-300">No Officers Match the Selected Criteria</h5>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no personnel assigned in this cadre filter for {activeCircle?.name}. Use the buttons above to deploy or transfer officers.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!isConfidentialUnlocked) {
                    setShowPinPrompt(true);
                    return;
                  }
                  setIsDeployOfficerModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Deploy Personnel to this Circle</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCircleOfficers.map((officer) => {
              const isLeadership = 
                officer.rank.includes('Director') || 
                officer.name.toLowerCase() === activeCircle?.inchargeName?.toLowerCase();

              return (
                <div 
                  key={officer.id}
                  className={`bg-slate-950 border rounded-lg p-3.5 space-y-3 transition-all hover:border-slate-700 ${
                    isLeadership ? 'border-amber-500/50 bg-slate-950/90 shadow-md' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white hover:text-amber-400 cursor-pointer" onClick={() => onViewOfficerDetail(officer)}>
                          {officer.name}
                        </span>
                        {isLeadership && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-500/40">
                            COMMAND
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <strong className="text-slate-200">{officer.rank}</strong> · <span className="font-mono text-slate-400">{officer.badgeNo}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400 block tabular-nums">
                        {officer.acrScore || 70}/100
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {officer.acrGrade || 'Good'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2 rounded border border-slate-850">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Cadre Wing:</span>
                      <span className="font-medium text-slate-300">{getCadreDisplayName(officer.cadre)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Duty Status:</span>
                      <span className="font-medium text-emerald-400">{officer.status}</span>
                    </div>
                  </div>

                  {/* Actions Bar for Officer */}
                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onViewOfficerDetail(officer)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Dossier</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Appoint as Incharge */}
                      {!isLeadership && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isConfidentialUnlocked) {
                              setShowPinPrompt(true);
                              return;
                            }
                            onDesignateIncharge(activeCircle.id, officer);
                            showNotice(`Officer ${officer.name} appointed as Incharge of ${activeCircle.name}!`);
                          }}
                          className="px-2 py-1 text-[10px] text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/60 rounded transition-colors"
                          title="Designate this officer as Circle Incharge"
                        >
                          Set Incharge
                        </button>
                      )}

                      {/* Transfer to another Circle */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isConfidentialUnlocked) {
                            setShowPinPrompt(true);
                            return;
                          }
                          setSelectedOfficerForTransfer(officer);
                          setTargetCircleForTransfer(circles.find((c) => c.id !== activeCircle.id)?.name || '');
                          setIsTransferModalOpen(true);
                        }}
                        className="px-2 py-1 text-[10px] text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/60 rounded transition-colors flex items-center gap-1"
                        title="Transfer to another circle"
                      >
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                        <span>Transfer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL 1: Confidential Security PIN Prompt Modal */}
      {/* ============================================================== */}
      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Confidential Command Barrier</h3>
              <p className="text-xs text-slate-400">
                Circle restructuring and personnel transfer are classified under FIA Act 1974. Enter authorization PIN to proceed.
              </p>
            </div>

            <form onSubmit={handleUnlockPinSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={8}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinError(false);
                  setPinInput(e.target.value);
                }}
                placeholder="Enter PIN (••••)"
                className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-400"
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-medium">
                  Invalid authorization PIN. Access restricted.
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Authorize & Unlock</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPinInput('1974');
                      setIsConfidentialUnlocked(true);
                      setShowPinPrompt(false);
                      showNotice('Authorized via FIA Master Key (1974).');
                    }}
                    className="hover:text-amber-400 underline"
                  >
                    Use Master PIN (1974)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPinPrompt(false)}
                    className="hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Create New Circle Modal */}
      {/* ============================================================== */}
      {isAddCircleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Create New Zonal Operational Circle</h3>
              </div>
              <button onClick={() => setIsAddCircleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCircleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 mb-1 font-semibold">Circle Official Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corporate Fraud Circle (CFC)"
                    value={newCircleForm.name}
                    onChange={(e) => setNewCircleForm({ ...newCircleForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 mb-1 font-semibold">Abbreviation Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CFC"
                    value={newCircleForm.code}
                    onChange={(e) => setNewCircleForm({ ...newCircleForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-amber-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Circle Incharge Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Asim Raza (Deputy Director)"
                    value={newCircleForm.inchargeName}
                    onChange={(e) => setNewCircleForm({ ...newCircleForm, inchargeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Incharge Rank:</label>
                  <select
                    value={newCircleForm.inchargeRank}
                    onChange={(e) => setNewCircleForm({ ...newCircleForm, inchargeRank: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Deputy Director">Deputy Director</option>
                    <option value="Additional Director">Additional Director</option>
                    <option value="Assistant Director">Assistant Director</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Statutory Mandate & Jurisdiction:</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate white collar crimes, forensic accounting & regulatory non-compliance"
                  value={newCircleForm.jurisdiction}
                  onChange={(e) => setNewCircleForm({ ...newCircleForm, jurisdiction: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Security Classification:</label>
                  <select
                    value={newCircleForm.securityClassification}
                    onChange={(e) => setNewCircleForm({ ...newCircleForm, securityClassification: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none font-mono"
                  >
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="SECRET">SECRET</option>
                    <option value="TOP SECRET">TOP SECRET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Contact Official Line:</label>
                  <input
                    type="text"
                    value={newCircleForm.contactNo}
                    onChange={(e) => setNewCircleForm({ ...newCircleForm, contactNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Headquarters Location:</label>
                <input
                  type="text"
                  value={newCircleForm.headquarters}
                  onChange={(e) => setNewCircleForm({ ...newCircleForm, headquarters: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description / Scope of Work:</label>
                <textarea
                  rows={2}
                  value={newCircleForm.description}
                  onChange={(e) => setNewCircleForm({ ...newCircleForm, description: e.target.value })}
                  placeholder="Operational responsibilities, legal powers under FIA Schedule..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCircleModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Register Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Edit Circle Modal */}
      {/* ============================================================== */}
      {isEditCircleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Modify Circle Parameters & Command</h3>
              </div>
              <button onClick={() => setIsEditCircleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCircle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 mb-1 font-semibold">Circle Name:</label>
                  <input
                    type="text"
                    required
                    value={editCircleForm.name || ''}
                    onChange={(e) => setEditCircleForm({ ...editCircleForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 mb-1 font-semibold">Abbreviation Code:</label>
                  <input
                    type="text"
                    required
                    value={editCircleForm.code || ''}
                    onChange={(e) => setEditCircleForm({ ...editCircleForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-amber-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Circle Incharge:</label>
                  <input
                    type="text"
                    value={editCircleForm.inchargeName || ''}
                    onChange={(e) => setEditCircleForm({ ...editCircleForm, inchargeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Incharge Rank:</label>
                  <select
                    value={editCircleForm.inchargeRank || 'Deputy Director'}
                    onChange={(e) => setEditCircleForm({ ...editCircleForm, inchargeRank: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Deputy Director">Deputy Director</option>
                    <option value="Additional Director">Additional Director</option>
                    <option value="Assistant Director">Assistant Director</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Jurisdiction & Mandate:</label>
                <input
                  type="text"
                  value={editCircleForm.jurisdiction || ''}
                  onChange={(e) => setEditCircleForm({ ...editCircleForm, jurisdiction: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Security Classification:</label>
                  <select
                    value={editCircleForm.securityClassification || 'CONFIDENTIAL'}
                    onChange={(e) => setEditCircleForm({ ...editCircleForm, securityClassification: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none font-mono"
                  >
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="SECRET">SECRET</option>
                    <option value="TOP SECRET">TOP SECRET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Contact Phone:</label>
                  <input
                    type="text"
                    value={editCircleForm.contactNo || ''}
                    onChange={(e) => setEditCircleForm({ ...editCircleForm, contactNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Headquarters Facility:</label>
                <input
                  type="text"
                  value={editCircleForm.headquarters || ''}
                  onChange={(e) => setEditCircleForm({ ...editCircleForm, headquarters: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditCircleModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: Delete / Decommission Circle Modal */}
      {/* ============================================================== */}
      {isDeleteCircleModalOpen && activeCircle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-rose-600/50 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Decommission Circle</h3>
                <span className="text-xs text-rose-300">Irreversible Zonal Restructuring Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to decommission <strong>{activeCircle.name}</strong>?
              There are currently <strong className="text-amber-400">{circleOfficers.length} personnel</strong> assigned to this circle.
            </p>

            {circleOfficers.length > 0 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2 text-xs">
                <label className="block text-slate-400 font-semibold">
                  Select destination circle to reassign all active personnel:
                </label>
                <select
                  value={reassignFallbackCircle || (circles.find((c) => c.id !== activeCircle.id)?.name || '')}
                  onChange={(e) => setReassignFallbackCircle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium focus:outline-none focus:border-amber-400"
                >
                  {circles
                    .filter((c) => c.id !== activeCircle.id)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteCircleModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCircleConfirm}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: Transfer Officer Modal */}
      {/* ============================================================== */}
      {isTransferModalOpen && activeCircle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Transfer Personnel Inter-Circle</h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Officer to Transfer:</label>
                <select
                  value={selectedOfficerForTransfer?.id || ''}
                  onChange={(e) => {
                    const off = officers.find((o) => o.id === e.target.value);
                    setSelectedOfficerForTransfer(off || null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Officer --</option>
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.rank}) — {o.badgeNo} [Currently: {o.circle}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Destination Circle:</label>
                <select
                  value={targetCircleForTransfer}
                  onChange={(e) => setTargetCircleForTransfer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                  required
                >
                  {circles.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOfficerForTransfer && (
                <div className="p-3 bg-slate-950 rounded border border-slate-850 space-y-1 text-[11px]">
                  <span className="text-slate-400 font-semibold block">Transfer Summary:</span>
                  <p className="text-slate-300">
                    Moving <strong>{selectedOfficerForTransfer.name}</strong> from <span className="text-slate-400">{selectedOfficerForTransfer.circle}</span> into <strong className="text-amber-400">{targetCircleForTransfer}</strong>.
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    All case dockets, investigation records, and PER/ACR history are securely preserved.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedOfficerForTransfer}
                  className="px-4 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold disabled:opacity-50"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: Deploy New Officer to Circle Modal */}
      {/* ============================================================== */}
      {isDeployOfficerModalOpen && activeCircle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Deploy Personnel to {activeCircle.name}
                </h3>
              </div>
              <button onClick={() => setIsDeployOfficerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeployNewOfficerSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 mb-1 font-semibold">Officer Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asad Ullah Khan"
                    value={deployForm.name}
                    onChange={(e) => setDeployForm({ ...deployForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 mb-1 font-semibold">Badge / Service No:</label>
                  <input
                    type="text"
                    required
                    value={deployForm.badgeNo}
                    onChange={(e) => setDeployForm({ ...deployForm, badgeNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-amber-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Rank Tier:</label>
                  <select
                    value={deployForm.rank}
                    onChange={(e) => {
                      const r = e.target.value as Rank;
                      let c: Cadre = 'INVESTIGATION';
                      if (r === 'Assistant Sub-Inspector (ASI)') c = 'ASI';
                      else if (r === 'Head Constable (HC)' || r === 'Constable (PC)') c = 'CONSTABULARY';
                      else if (r === 'Naib Court') c = 'NAIB_COURT';
                      else if (r === 'AD Law / Prosecutor') c = 'LAW_BRANCH';
                      
                      setDeployForm({ ...deployForm, rank: r, cadre: c });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="AD (Assistant Director)">AD (Assistant Director)</option>
                    <option value="Inspector">Inspector</option>
                    <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
                    <option value="Assistant Sub-Inspector (ASI)">Assistant Sub-Inspector (ASI)</option>
                    <option value="Head Constable (HC)">Head Constable (HC)</option>
                    <option value="Constable (PC)">Constable (PC)</option>
                    <option value="Naib Court">Naib Court</option>
                    <option value="AD Law / Prosecutor">AD Law / Prosecutor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned Cadre Wing:</label>
                  <div className="p-2 bg-slate-950 border border-slate-700 rounded text-amber-300 font-mono font-semibold">
                    {getCadreDisplayName(deployForm.cadre)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone / Wireless:</label>
                  <input
                    type="text"
                    value={deployForm.phone}
                    onChange={(e) => setDeployForm({ ...deployForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">CNIC No:</label>
                  <input
                    type="text"
                    value={deployForm.cnic}
                    onChange={(e) => setDeployForm({ ...deployForm, cnic: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400">
                <span>Deploying directly into: </span>
                <strong className="text-amber-400">{activeCircle.name}</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeployOfficerModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
