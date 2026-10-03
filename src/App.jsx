import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EdgeAiCard from './components/EdgeAiCard';
import BehavioralBaseline from './components/BehavioralBaseline';
import AnomalyScoreCard from './components/AnomalyScoreCard';
import BehaviorRadar from './components/BehaviorRadar';
import LiveTelemetryChart from './components/LiveTelemetryChart';
import ProcessRiskTable from './components/ProcessRiskTable';
import ActivityTimeline from './components/ActivityTimeline';
import IncidentCorrelationList from './components/IncidentCorrelationList';
import ProtectionCenterView from './components/ProtectionCenterView';
import AiCenterView from './components/AiCenterView';
import DriveHealthView from './components/DriveHealthView';
import PrivacyView from './components/PrivacyView';
import IncidentDetailDrawer from './components/IncidentDetailDrawer';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import SearchModal from './components/SearchModal';
import NotificationDrawer from './components/NotificationDrawer';
import HowItWorksFlow from './components/HowItWorksFlow';
import WhatShouldIDoCard from './components/WhatShouldIDoCard';
import GettingStartedCard from './components/GettingStartedCard';
import LearnDrawer from './components/LearnDrawer';
import QuickTourModal from './components/QuickTourModal';
import EdgeAiStatusModal from './components/EdgeAiStatusModal';
import BaselineToAiFlow from './components/BaselineToAiFlow';
import AiPipelineDiagram from './components/AiPipelineDiagram';
import { getEdgeAiScenarioData, getUnifiedDiskGuardState, SIMULATED_DRIVES } from './data/edgeAiSimulation';
import { diskguardApi } from './services/diskguardApi';
import { ShieldCheck, ShieldAlert, Info, HardDrive, Plus, Play, Square } from 'lucide-react';

import UserJourneyBar from './components/UserJourneyBar';
import AddDriveModal from './components/AddDriveModal';
import StartMonitoringModal from './components/StartMonitoringModal';
import DriveDetailDrawer from './components/DriveDetailDrawer';
import StopMonitoringModal from './components/StopMonitoringModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [scenario, setScenario] = useState('normal'); // Default to normal active simulation
  const [detectionMode, setDetectionMode] = useState('balanced');
  const [viewMode, setViewMode] = useState('simple'); // 'simple' | 'technical'

  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [learnTopic, setLearnTopic] = useState(null);
  const [quickTourOpen, setQuickTourOpen] = useState(false);
  const [edgeAiModalOpen, setEdgeAiModalOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // DRIVE CONNECTION & MULTI-DRIVE MONITORING STATE
  const [monitoredDriveIds, setMonitoredDriveIds] = useState(['drive_d']); // Default DATA SSD monitored
  const [activeDriveId, setActiveDriveId] = useState('drive_d');
  
  // Modals state
  const [addDriveOpen, setAddDriveOpen] = useState(false);
  const [startMonitoringDrive, setStartMonitoringDrive] = useState(null);
  const [stopMonitoringDrive, setStopMonitoringDrive] = useState(null);
  const [detailDrive, setDetailDrive] = useState(null);

  // REAL BACKEND HARDWARE DISCOVERY & MONITORING STATE
  const [discoveredDevices, setDiscoveredDevices] = useState(SIMULATED_DRIVES);
  const [monitoringState, setMonitoringState] = useState('MONITORING');
  const [backendOnline, setBackendOnline] = useState(true);
  const [realTelemetryEvents, setRealTelemetryEvents] = useState([]);
  const [realAiInference, setRealAiInference] = useState(null);
  const [realAnalysis, setRealAnalysis] = useState(null);
  const [realIncidents, setRealIncidents] = useState([]);

  // Combined drives list: real discovered storage devices + simulated demo devices
  const allKnownDrives = [
    ...discoveredDevices,
    ...SIMULATED_DRIVES.filter(sd => !discoveredDevices.some(dd => dd.id === sd.id))
  ];

  // Derive Central Unified DiskGuard State
  const isDriveMonitored = monitoredDriveIds.includes(activeDriveId);
  const isRealDrive = activeDriveId && !['drive_c', 'drive_d', 'drive_e'].includes(activeDriveId);
  const isRealMonitoring = Boolean(isRealDrive && isDriveMonitored && scenario === 'none' && backendOnline);
  const hasActiveIncidents = realIncidents.some(i => i.status === 'open' || i.status === 'investigating');

  const currentSetupStage = startMonitoringDrive 
    ? 'preparing' 
    : (hasActiveIncidents ? 'investigation' : (isDriveMonitored ? 'active' : 'selected'));

  const unifiedState = getUnifiedDiskGuardState({
    activeDriveId,
    monitoredDriveIds,
    scenario,
    setupStage: currentSetupStage,
    allDevices: discoveredDevices,
    realAnalysis: isRealMonitoring ? realAnalysis : null,
    isRealMonitoring,
    backendOnline
  });

  // Fetch initial devices and incidents from local agent backend on mount
  useEffect(() => {
    let isMounted = true;
    diskguardApi.getDevices().then((res) => {
      if (!isMounted || !res) return;
      if (res.devices && res.devices.length > 0) {
        setDiscoveredDevices(res.devices);
      }
    });

    diskguardApi.getIncidents().then((res) => {
      if (!isMounted || !res) return;
      if (res.incidents && res.incidents.length > 0) {
        setRealIncidents(res.incidents);
      }
    });

    const cleanupWs = diskguardApi.connectTelemetryStream((msg) => {
      if (!isMounted) return;
      if (msg.type === 'BACKEND_STATUS') {
        setBackendOnline(msg.payload.online);
      } else if (msg.type === 'DEVICES_UPDATE') {
        if (msg.payload.devices && msg.payload.devices.length > 0) {
          setDiscoveredDevices(msg.payload.devices);
        }
      } else if (msg.type === 'TELEMETRY_EVENT') {
        setRealTelemetryEvents((prev) => [msg.payload, ...prev].slice(0, 100));
      } else if (msg.type === 'AI_INFERENCE') {
        setRealAiInference(msg.payload);
        if (msg.payload?.realAnalysis) {
          setRealAnalysis(msg.payload.realAnalysis);
        }
      } else if (msg.type === 'REAL_ANALYSIS_UPDATE') {
        setRealAnalysis(msg.payload);
      } else if (msg.type === 'INCIDENTS_UPDATE') {
        setRealIncidents(msg.payload?.incidents || msg.payload || []);
      }
    });

    return () => {
      isMounted = false;
      cleanupWs();
    };
  }, []);

  // Handlers for Drive Connection Flow
  const handleOpenAddDrive = () => {
    setAddDriveOpen(true);
  };

  const handleSelectDriveFromModal = (driveId) => {
    setAddDriveOpen(false);
    const drv = allKnownDrives.find(d => d.id === driveId) || SIMULATED_DRIVES.find(d => d.id === driveId);
    if (drv) {
      setStartMonitoringDrive(drv);
    }
  };

  const handleCompleteStartMonitoring = (driveId) => {
    setStartMonitoringDrive(null);
    setMonitoredDriveIds(prev => Array.from(new Set([...prev, driveId])));
    setActiveDriveId(driveId);
    setMonitoringState('MONITORING');
    const isReal = !['drive_c', 'drive_d', 'drive_e'].includes(driveId);
    if (isReal) {
      setScenario('none');
    }
    diskguardApi.startMonitoring(driveId);
  };

  const handleConfirmStopMonitoring = (driveId) => {
    setStopMonitoringDrive(null);
    setMonitoredDriveIds(prev => prev.filter(id => id !== driveId));
    if (activeDriveId === driveId) {
      const remaining = monitoredDriveIds.filter(id => id !== driveId);
      setActiveDriveId(remaining.length > 0 ? remaining[0] : null);
    }
    if (monitoredDriveIds.length <= 1) {
      setMonitoringState('NO_DEVICE');
    }
    diskguardApi.stopMonitoring(driveId);
  };

  const handleScenarioChange = async (newScenario) => {
    setScenario(newScenario);
    await diskguardApi.setSimulationScenario(newScenario);
    if (newScenario !== 'none' && monitoredDriveIds.length === 0) {
      setMonitoredDriveIds(['drive_d']);
      setActiveDriveId('drive_d');
    }
  };

  const handleAcknowledgeIncident = async (incidentId) => {
    await diskguardApi.acknowledgeIncident(incidentId);
    const res = await diskguardApi.getIncidents();
    if (res?.incidents) setRealIncidents(res.incidents);
  };

  const handleResolveIncident = async (incidentId) => {
    await diskguardApi.resolveIncident(incidentId);
    const res = await diskguardApi.getIncidents();
    if (res?.incidents) setRealIncidents(res.incidents);
  };

  const activeDrive = allKnownDrives.find(d => d.id === activeDriveId) || allKnownDrives[0];
  const monitoredDrivesList = allKnownDrives.filter(d => monitoredDriveIds.includes(d.id));

  // Centralized Simulated or Real Edge AI Data Engine
  const isSimulating = scenario !== 'none';
  const edgeAiData = isSimulating ? getEdgeAiScenarioData(scenario) : {
    riskScore: realAnalysis ? realAnalysis.risk_score : (realAiInference?.riskScore != null ? realAiInference.riskScore : null),
    anomalyScore: realAnalysis ? realAnalysis.anomaly_score : (realAiInference?.anomalyScore != null ? realAiInference.anomalyScore : null),
    writeSpeed: realAnalysis?.features?.write_frequency != null
      ? `${(realAnalysis.features.write_frequency / 60).toFixed(1)} ops/s`
      : (realAiInference?.features ? `${realAiInference.features.writeRate} ops/s` : '0 ops/s'),
    ioActivity: realAnalysis?.classification
      ? realAnalysis.classification
      : (realAiInference?.classification === 'RANSOMWARE_SUSPECT' ? 'High Burst Velocity' : 'Nominal'),
    confidence: realAnalysis?.confidence != null
      ? `${Math.round(realAnalysis.confidence * 100)}%`
      : (realAiInference?.confidence != null ? `${(realAiInference.confidence * 100).toFixed(1)}%` : null)
  };

  const isAttack = unifiedState.code === 'MONITORING_ACTIVE_HIGH_RISK' || unifiedState.code === 'INCIDENT_INVESTIGATION' || hasActiveIncidents;
  
  const isNoDriveSelected = !activeDriveId;

  const notifications = isNoDriveSelected ? [] : [
    { id: 1, time: new Date().toLocaleTimeString(), category: isAttack ? 'ANOMALY DETECTED' : 'SYSTEM MONITORING', title: isAttack ? `${activeDrive?.device} Write Velocity Breach` : `Monitoring Active on ${activeDrive?.name}`, body: isAttack ? `Local Edge AI identified high entropy write patterns on ${activeDrive?.name}.` : `DiskGuard AI local backend is actively capturing filesystem telemetry on ${activeDrive?.name}.`, type: isAttack ? 'threat' : 'info' }
  ];

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        scenario={scenario}
        onSelectScenario={handleScenarioChange}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(prev => prev === 'simple' ? 'technical' : 'simple')}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenTour={() => setQuickTourOpen(true)}
        onOpenAddDrive={handleOpenAddDrive}
        monitoredDrives={monitoredDrivesList}
        activeDriveId={activeDriveId}
        onSelectDrive={(id) => setActiveDriveId(id)}
        unreadCount={isAttack ? 2 : isNoDriveSelected ? 0 : 1}
        unifiedState={unifiedState}
      />

      <div className="main-layout">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="main-content">

          {/* VIEW 1: OVERVIEW — HOME EXPERIENCE & USER JOURNEY */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* 1. ONE-SENTENCE PRODUCT MISSION STATEMENT */}
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Info size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>DiskGuard AI:</strong> DiskGuard watches how files and processes use your drive and uses Edge AI to identify behavior that may indicate ransomware or other suspicious activity.
                  </div>
                </div>

                <button
                  onClick={handleOpenAddDrive}
                  className="btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}
                >
                  <Plus size={14} /> Add Drive
                </button>
              </div>

              {/* BACKEND OFFLINE ALERT BANNER */}
              {!backendOnline && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)'
                }}>
                  <span className="status-dot danger" style={{ animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--danger)' }}>DiskGuard Local Agent Offline:</strong> The backend at <code>http://127.0.0.1:8000</code> is currently unreachable. Real hardware monitoring is paused; auto-reconnecting...
                  </div>
                </div>
              )}

              {/* 2. HERO HOME STATUS CARD */}
              <div className="dg-card" style={{
                background: '#FFFFFF',
                border: `1px solid ${isAttack ? 'var(--danger-border)' : 'var(--border)'}`,
                boxShadow: isAttack ? '0 4px 12px rgba(185, 28, 28, 0.1)' : 'var(--shadow-sm)',
                padding: '1.25rem'
              }}>
                {!unifiedState.activeDrive ? (
                  /* NO DRIVE SELECTED STATE */
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        background: '#F1F5F9',
                        color: 'var(--text-muted)',
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex'
                      }}>
                        <HardDrive size={28} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                            NO DRIVE SELECTED
                          </h2>
                          <span className="badge badge-warning" style={{ fontSize: '0.675rem', fontWeight: '700' }}>
                            DEMO MODE
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                          Connect a hard drive or SSD to begin monitoring disk behavior.
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: 0 }}>
                          DiskGuard monitors storage activity such as reads, writes, file modifications, renames and behavioral changes.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenAddDrive}
                      className="btn-primary"
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Plus size={16} /> Add Drive
                    </button>
                  </div>
                ) : (
                  /* MONITORING ACTIVE, DRIVE SELECTED, OR ATTACK STATE */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isAttack ? '1rem' : '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isAttack ? (
                          <ShieldAlert size={28} style={{ color: 'var(--danger)' }} />
                        ) : (
                          <ShieldCheck size={28} style={{ color: unifiedState.protectedStatus.isProtected ? 'var(--success)' : 'var(--text-muted)' }} />
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                              TARGET DRIVE:
                            </span>
                            <span className="mono" style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {unifiedState.driveLabel}
                            </span>
                            <span className={`badge badge-${unifiedState.cardStatusBadge.variant}`} style={{ fontSize: '0.675rem', fontWeight: '700' }}>
                              {unifiedState.cardStatusBadge.label}
                            </span>
                          </div>

                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: isAttack ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {isAttack 
                              ? `⚠ SUSPICIOUS BEHAVIOR DETECTED ON ${activeDrive?.device}` 
                              : (unifiedState.protectedStatus.isProtected ? '● PROTECTED' : unifiedState.protectedStatus.label)}
                          </div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {unifiedState.ai.explanationText}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isAttack ? (
                          <button onClick={() => setActiveTab('incidents')} className="btn-danger" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                            Investigate Incident →
                          </button>
                        ) : (
                          <button onClick={() => setActiveTab('drives')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                            Manage Drives →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* WHAT CHANGED? STORY BLOCK */}
                    {isAttack && (
                      <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.725rem', fontWeight: '800', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                          WHAT CHANGED ON {activeDrive?.device}?
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.775rem' }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Write Activity</div>
                            <div className="mono" style={{ fontWeight: '700', color: 'var(--danger)' }}>42 → 630 ops/min</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Modifications</div>
                            <div className="mono" style={{ fontWeight: '700', color: 'var(--danger)' }}>18 → 591 files/12s</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Rename Velocity</div>
                            <div className="mono" style={{ fontWeight: '700', color: 'var(--danger)' }}>4 → 410 renames/4s</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Buffer Entropy</div>
                            <div className="mono" style={{ fontWeight: '700', color: 'var(--danger)' }}>1.2 → 5.4 Shannon</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. GUIDED USER JOURNEY BAR */}
              <UserJourneyBar scenario={scenario} activeTab={activeTab} onNavigate={setActiveTab} unifiedState={unifiedState} />

              {/* 4. DEMO SCENARIO EXPLANATION CARD */}
              {isSimulating && (
                <div className="dg-card" style={{ background: '#F8FAFC', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    DEMO SCENARIO EXPLANATION — APPLIED TO {activeDrive?.device} {activeDrive?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    {scenario === 'ransomware' && `DiskGuard simulated rapid write velocity, mass file modifications, and Shannon entropy spikes on ${activeDrive?.name}.`}
                    {scenario === 'mass-rename' && `DiskGuard simulated a burst of 410 sequential file extension renames on ${activeDrive?.name}.`}
                    {scenario === 'high-entropy' && `DiskGuard simulated block payload writes with a +4.2 Shannon entropy deviation on ${activeDrive?.name}.`}
                    {scenario === 'normal' && `DiskGuard simulated everyday computer activity on ${activeDrive?.name}.`}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span><strong>Why Edge AI Responded:</strong> {isAttack ? 'Multiple behavioral signals exceeded learned thresholds.' : 'All signals matched learned machine baseline.'}</span>
                    <span><strong>What You Should Do:</strong> {isAttack ? 'Review the process in the Incident drawer or Process table.' : 'No action required.'}</span>
                  </div>
                </div>
              )}

              {/* 5. WHAT SHOULD I DO NOW? PANEL */}
              <WhatShouldIDoCard
                scenario={scenario}
                onNavigate={setActiveTab}
                unifiedState={unifiedState}
                onStartMonitoring={() => {
                  const drv = allKnownDrives.find(d => d.id === activeDriveId) || SIMULATED_DRIVES.find(d => d.id === activeDriveId);
                  if (drv) setStartMonitoringDrive(drv);
                }}
              />

              {/* 6. HOW DISKGUARD WORKS DIAGRAM */}
              <HowItWorksFlow />

              {/* 7. LIVE TELEMETRY STREAM & BEHAVIOR BREAKDOWN */}
              <LiveTelemetryChart scenario={scenario} realEvents={realTelemetryEvents} unifiedState={unifiedState} />

              {/* TELEMETRY TO EDGE AI PIPELINE FLOW */}
              <BaselineToAiFlow data={edgeAiData} scenario={scenario} activeDrive={activeDrive} unifiedState={unifiedState} />

              <div className="grid-2">
                <AnomalyScoreCard anomalyScore={edgeAiData.anomalyScore} riskScore={edgeAiData.riskScore} scenario={scenario} unifiedState={unifiedState} />
                <BehavioralBaseline scenario={scenario} unifiedState={unifiedState} />
              </div>

              {/* 8. EDGE AI ANALYSIS BREAKDOWN */}
              <EdgeAiCard scenario={scenario} activeDrive={activeDrive} unifiedState={unifiedState} />

              {/* 9. PROCESSES & INCIDENTS DETAIL TABLES */}
              <ProcessRiskTable scenario={scenario} onSelectProcess={setSelectedProcess} unifiedState={unifiedState} />
              <IncidentCorrelationList scenario={scenario} realIncidents={realIncidents} onSelectIncident={setSelectedIncident} unifiedState={unifiedState} />
            </div>
          )}

          {/* VIEW 2: INCIDENTS */}
          {activeTab === 'incidents' && (
            <IncidentCorrelationList scenario={scenario} realIncidents={realIncidents} onSelectIncident={setSelectedIncident} unifiedState={unifiedState} />
          )}

          {/* VIEW 3: DISK ACTIVITY */}
          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <LiveTelemetryChart scenario={scenario} realEvents={realTelemetryEvents} unifiedState={unifiedState} />
              <ActivityTimeline scenario={scenario} />
            </div>
          )}

          {/* VIEW 4: PROCESSES */}
          {activeTab === 'processes' && (
            <ProcessRiskTable scenario={scenario} onSelectProcess={setSelectedProcess} unifiedState={unifiedState} />
          )}

          {/* VIEW 5: BEHAVIOR */}
          {activeTab === 'behavior' && (
            <div className="grid-main-side">
              <BehavioralBaseline scenario={scenario} unifiedState={unifiedState} />
              <BehaviorRadar scenario={scenario} />
            </div>
          )}

          {/* VIEW 6: AI MODEL */}
          {activeTab === 'ai-model' && (
            <AiCenterView
              scenario={scenario}
              data={edgeAiData}
              activeDrive={activeDrive}
              onSelectScenario={handleScenarioChange}
              onOpenAddDrive={handleOpenAddDrive}
              unifiedState={unifiedState}
            />
          )}

          {/* VIEW 7: PROTECTION */}
          {activeTab === 'protection' && (
            <ProtectionCenterView
              detectionMode={detectionMode}
              setDetectionMode={setDetectionMode}
            />
          )}

          {/* VIEW 8: DRIVES */}
          {activeTab === 'drives' && (
            <DriveHealthView
              discoveredDevices={discoveredDevices}
              selectedDeviceId={activeDriveId}
              monitoredDriveIds={monitoredDriveIds}
              onSelectDevice={(id) => setActiveDriveId(id)}
              onStartMonitoringModal={(id) => {
                const drv = allKnownDrives.find(d => d.id === id) || SIMULATED_DRIVES.find(d => d.id === id);
                if (drv) setStartMonitoringDrive(drv);
              }}
              onStopMonitoringModal={(id) => {
                const drv = allKnownDrives.find(d => d.id === id) || SIMULATED_DRIVES.find(d => d.id === id);
                if (drv) setStopMonitoringDrive(drv);
              }}
              onViewDetails={(id) => {
                const drv = allKnownDrives.find(d => d.id === id) || SIMULATED_DRIVES.find(d => d.id === id);
                if (drv) setDetailDrive(drv);
              }}
              onOpenAddDrive={handleOpenAddDrive}
              scenario={scenario}
              unifiedState={unifiedState}
            />
          )}

          {/* VIEW 9: TIMELINE */}
          {activeTab === 'timeline' && (
            <ActivityTimeline scenario={scenario} />
          )}

          {/* VIEW 10: PRIVACY */}
          {activeTab === 'privacy' && (
            <PrivacyView />
          )}

        </main>
      </div>

      {/* Drawers, Educational Guides & Modals */}
      <AddDriveModal
        isOpen={addDriveOpen}
        onClose={() => setAddDriveOpen(false)}
        monitoredDriveIds={monitoredDriveIds}
        selectedDeviceId={activeDriveId}
        onSelectDrive={handleSelectDriveFromModal}
        onViewDrive={(id) => {
          setActiveDriveId(id);
          const drv = allKnownDrives.find(d => d.id === id) || SIMULATED_DRIVES.find(d => d.id === id);
          if (drv) setDetailDrive(drv);
        }}
      />

      <StartMonitoringModal
        isOpen={!!startMonitoringDrive}
        drive={startMonitoringDrive}
        onComplete={handleCompleteStartMonitoring}
        onClose={() => setStartMonitoringDrive(null)}
      />

      <DriveDetailDrawer
        drive={detailDrive}
        isOpen={!!detailDrive}
        onClose={() => setDetailDrive(null)}
        isMonitored={detailDrive ? monitoredDriveIds.includes(detailDrive.id) : false}
        securityStatus={isAttack ? 'Suspicious' : 'Normal'}
        riskLevel={isAttack ? 'High' : 'Low'}
        anomalyScore={edgeAiData.anomalyScore || 12}
        scenario={scenario}
        onStartMonitoring={(id) => {
          const drv = allKnownDrives.find(d => d.id === id) || SIMULATED_DRIVES.find(d => d.id === id);
          if (drv) setStartMonitoringDrive(drv);
        }}
        onStopMonitoring={(id) => {
          const drv = allKnownDrives.find(d => d.id === id) || SIMULATED_DRIVES.find(d => d.id === id);
          if (drv) setStopMonitoringDrive(drv);
        }}
      />

      <StopMonitoringModal
        isOpen={!!stopMonitoringDrive}
        drive={stopMonitoringDrive}
        onConfirm={handleConfirmStopMonitoring}
        onCancel={() => setStopMonitoringDrive(null)}
      />

      <IncidentDetailDrawer
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onAcknowledge={handleAcknowledgeIncident}
        onResolve={handleResolveIncident}
      />

      <ProcessDetailDrawer
        process={selectedProcess}
        onClose={() => setSelectedProcess(null)}
      />

      <LearnDrawer
        topic={learnTopic}
        onClose={() => setLearnTopic(null)}
      />

      <QuickTourModal
        isOpen={quickTourOpen}
        onClose={() => setQuickTourOpen(false)}
      />

      <EdgeAiStatusModal
        isOpen={edgeAiModalOpen}
        onClose={() => setEdgeAiModalOpen(false)}
        data={edgeAiData}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProcess={setSelectedProcess}
        onSelectIncident={setSelectedIncident}
      />

      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}
