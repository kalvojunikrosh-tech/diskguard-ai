// Centralized Simulated Edge AI Data & State Engine for DiskGuard AI

export const SIMULATED_DRIVES = [
  {
    id: 'drive_c',
    name: 'SYSTEM SSD',
    device: 'C:',
    mountPoint: 'C:\\',
    filesystem: 'NTFS (Simulated)',
    capacity: '512 GB',
    used: '280 GB',
    free: '232 GB',
    percentUsed: 54,
    driveType: 'SSD',
    role: 'System Drive',
    health: 'Healthy',
    smartStatus: 'Verified Healthy (Simulated)',
    removable: false,
    readOnly: false,
    status: 'Available',
    monitoringStatus: 'Available',
    readActivity: '142 ops/min',
    writeActivity: '48 ops/min',
    readSpeed: '18 MB/s',
    writeSpeed: '12 MB/s',
    iops: 240,
    risk: 'Low',
    securityStatus: 'Normal',
    anomalyScore: 12,
    baselineState: 'Established',
    aiState: 'Monitoring'
  },
  {
    id: 'drive_d',
    name: 'DATA SSD',
    device: 'D:',
    mountPoint: 'D:\\',
    filesystem: 'NTFS (Simulated)',
    capacity: '1 TB',
    used: '358 GB',
    free: '642 GB',
    percentUsed: 36,
    driveType: 'SSD',
    role: 'Data Drive',
    health: 'Healthy',
    smartStatus: 'Verified Healthy (Simulated)',
    removable: false,
    readOnly: false,
    status: 'Available',
    monitoringStatus: 'Available',
    readActivity: '12 ops/min',
    writeActivity: '8 ops/min',
    readSpeed: '12 MB/s',
    writeSpeed: '8 MB/s',
    iops: 184,
    risk: 'Low',
    securityStatus: 'Normal',
    anomalyScore: 10,
    baselineState: 'Established',
    aiState: 'Monitoring'
  },
  {
    id: 'drive_e',
    name: 'EXTERNAL SSD',
    device: 'E:',
    mountPoint: 'E:\\',
    filesystem: 'exFAT (Simulated)',
    capacity: '2 TB',
    used: '520 GB',
    free: '1,480 GB',
    percentUsed: 26,
    driveType: 'SSD',
    role: 'External Drive',
    health: 'Healthy',
    smartStatus: 'Verified Healthy (Simulated)',
    removable: true,
    readOnly: false,
    status: 'Available',
    monitoringStatus: 'Available',
    readActivity: '0 ops/min',
    writeActivity: '0 ops/min',
    readSpeed: '0 MB/s',
    writeSpeed: '0 MB/s',
    iops: 0,
    risk: 'Low',
    securityStatus: 'Normal',
    anomalyScore: 5,
    baselineState: 'Established',
    aiState: 'Monitoring'
  }
];

export const getEdgeAiScenarioData = (scenario) => {
  switch (scenario) {
    case 'ransomware':
      return {
        state: 'HIGH RISK DETECTED',
        aiStateTag: 'INCIDENT CORRELATED',
        aiStateVariant: 'danger',
        riskScore: 87,
        anomalyScore: 78,
        confidence: 91,
        latencyMs: 18,
        modelVersion: 'Behavioral Model v0.1 DEMO',
        inferenceLocation: 'Simulated On-Device (Local Execution)',
        signalsEvaluated: 6,
        dataMode: 'SIMULATED TELEMETRY',
        
        // 6 Behavioral Input Features
        features: [
          { key: 'writeFreq', name: 'Write Frequency', baseline: '42 ops/min', current: '630 ops/min', delta: '+1399%', contribution: 'Critical', val: 95 },
          { key: 'modRate', name: 'File Modification Density', baseline: '18 ops/min', current: '591 ops/min', delta: '+3183%', contribution: 'Critical', val: 90 },
          { key: 'renameVel', name: 'Rename Velocity Index', baseline: '4 ops/min', current: '410 ops/min', delta: '+10150%', contribution: 'High', val: 85 },
          { key: 'entropyShift', name: 'Buffer Shannon Entropy', baseline: '1.2 Shannon', current: '5.4 Shannon', delta: '+350%', contribution: 'High', val: 78 },
          { key: 'irregularAccess', name: 'Access Irregularity Vector', baseline: '5%', current: '82%', delta: '+1540%', contribution: 'Medium', val: 45 },
          { key: 'readFreq', name: 'Read Activity Pattern', baseline: '120 ops/min', current: '142 ops/min', delta: '+18%', contribution: 'Nominal', val: 20 }
        ],

        // Feature Importance Weights (For Chart)
        featureImportance: [
          { name: 'Write Frequency Vector', weight: 95, label: '630 ops/min' },
          { name: 'File Modification Density', weight: 90, label: '591 files / 12s' },
          { name: 'Rename Velocity Index', weight: 85, label: '410 renames / 4s' },
          { name: 'Payload Entropy Shift', weight: 78, label: '+4.2 Shannon' },
          { name: 'Access Irregularity Vector', weight: 45, label: '82% path variance' },
          { name: 'Read Activity Pattern', weight: 20, label: '142 ops/min' }
        ],

        // Explainable AI Assessment
        aiAssessment: {
          title: 'High Behavioral Anomaly Pattern Detected',
          summary: 'Multiple behavioral signals exceed learned machine baseline thresholds simultaneously.',
          reasons: [
            { num: '01', title: 'Write Velocity Breach', desc: 'Write throughput escalated to 4.8× learned baseline (+1399%).' },
            { num: '02', title: 'Modification Density Spike', desc: '591 file handles opened for sequential write access within 12 seconds.' },
            { num: '03', title: 'Mass File Extension Renames', desc: '410 file renames executed rapidly across user directories.' },
            { num: '04', title: 'Buffer Shannon Entropy Shift', desc: '+4.2 Shannon entropy deviation detected in write payload blocks.' }
          ]
        },

        // AI Activity Stream Logs
        activityLogs: [
          { time: '09:42:31 AM', text: 'Incident DG-00124 correlated from raw telemetry stream', type: 'danger' },
          { time: '09:42:29 AM', text: 'Risk classification updated to HIGH RISK (91% confidence)', type: 'danger' },
          { time: '09:42:27 AM', text: 'Behavioral anomaly score escalated to 78 / 100', type: 'warning' },
          { time: '09:42:24 AM', text: 'Shannon entropy deviation +4.2 logged across block writes', type: 'warning' },
          { time: '09:42:21 AM', text: 'Write frequency vector evaluated (+1399% above baseline)', type: 'warning' },
          { time: '09:42:18 AM', text: 'Learned machine baseline compared against live kernel telemetry', type: 'info' }
        ]
      };

    case 'mass-rename':
      return {
        state: 'RENAME ANOMALY DETECTED',
        aiStateTag: 'ANALYZING',
        aiStateVariant: 'warning',
        riskScore: 64,
        anomalyScore: 58,
        confidence: 86,
        latencyMs: 18,
        modelVersion: 'Behavioral Model v0.1 DEMO',
        inferenceLocation: 'Simulated On-Device (Local Execution)',
        signalsEvaluated: 6,
        dataMode: 'SIMULATED TELEMETRY',

        features: [
          { key: 'renameVel', name: 'Rename Velocity Index', baseline: '4 ops/min', current: '410 ops/min', delta: '+10150%', contribution: 'Critical', val: 92 },
          { key: 'modRate', name: 'File Modification Density', baseline: '18 ops/min', current: '180 ops/min', delta: '+900%', contribution: 'High', val: 70 },
          { key: 'writeFreq', name: 'Write Frequency', baseline: '42 ops/min', current: '120 ops/min', delta: '+185%', contribution: 'Medium', val: 55 },
          { key: 'entropyShift', name: 'Buffer Shannon Entropy', baseline: '1.2 Shannon', current: '1.5 Shannon', delta: '+25%', contribution: 'Nominal', val: 25 },
          { key: 'irregularAccess', name: 'Access Irregularity Vector', baseline: '5%', current: '45%', delta: '+800%', contribution: 'Medium', val: 40 },
          { key: 'readFreq', name: 'Read Activity Pattern', baseline: '120 ops/min', current: '135 ops/min', delta: '+12%', contribution: 'Nominal', val: 18 }
        ],

        featureImportance: [
          { name: 'Rename Velocity Index', weight: 92, label: '410 renames / 4s' },
          { name: 'File Modification Density', weight: 70, label: '180 files / 12s' },
          { name: 'Write Frequency Vector', weight: 55, label: '120 ops/min' },
          { name: 'Access Irregularity Vector', weight: 40, label: '45% path variance' },
          { name: 'Buffer Shannon Entropy', weight: 25, label: '+0.3 Shannon' },
          { name: 'Read Activity Pattern', weight: 18, label: '135 ops/min' }
        ],

        aiAssessment: {
          title: 'Mass File Extension Rename Anomaly',
          summary: 'Unusual rename velocity across 400+ files in a short time window.',
          reasons: [
            { num: '01', title: 'Mass File Extension Renames', desc: '410 file renames executed rapidly across system folders.' },
            { num: '02', title: 'Moderate Write Throughput', desc: 'Write velocity elevated 1.8× baseline.' }
          ]
        },

        activityLogs: [
          { time: '09:42:25 AM', text: 'Rename velocity breach evaluated (410 files / 4s)', type: 'warning' },
          { time: '09:42:21 AM', text: 'Behavioral anomaly score set to 58 / 100', type: 'warning' },
          { time: '09:42:18 AM', text: 'Learned machine baseline compared against live kernel telemetry', type: 'info' }
        ]
      };

    case 'high-entropy':
      return {
        state: 'ENTROPY SHIFT DETECTED',
        aiStateTag: 'ELEVATED',
        aiStateVariant: 'warning',
        riskScore: 76,
        anomalyScore: 82,
        confidence: 89,
        latencyMs: 18,
        modelVersion: 'Behavioral Model v0.1 DEMO',
        inferenceLocation: 'Simulated On-Device (Local Execution)',
        signalsEvaluated: 6,
        dataMode: 'SIMULATED TELEMETRY',

        features: [
          { key: 'entropyShift', name: 'Buffer Shannon Entropy', baseline: '1.2 Shannon', current: '5.4 Shannon', delta: '+350%', contribution: 'Critical', val: 96 },
          { key: 'writeFreq', name: 'Write Frequency', baseline: '42 ops/min', current: '380 ops/min', delta: '+804%', contribution: 'High', val: 78 },
          { key: 'modRate', name: 'File Modification Density', baseline: '18 ops/min', current: '220 ops/min', delta: '+1122%', contribution: 'High', val: 72 },
          { key: 'irregularAccess', name: 'Access Irregularity Vector', baseline: '5%', current: '60%', delta: '+1100%', contribution: 'Medium', val: 50 },
          { key: 'renameVel', name: 'Rename Velocity Index', baseline: '4 ops/min', current: '12 ops/min', delta: '+200%', contribution: 'Nominal', val: 20 },
          { key: 'readFreq', name: 'Read Activity Pattern', baseline: '120 ops/min', current: '150 ops/min', delta: '+25%', contribution: 'Nominal', val: 18 }
        ],

        featureImportance: [
          { name: 'Buffer Shannon Entropy', weight: 96, label: '+4.2 Shannon' },
          { name: 'Write Frequency Vector', weight: 78, label: '380 ops/min' },
          { name: 'File Modification Density', weight: 72, label: '220 files / 12s' },
          { name: 'Access Irregularity Vector', weight: 50, label: '60% path variance' },
          { name: 'Rename Velocity Index', weight: 20, label: '12 renames' },
          { name: 'Read Activity Pattern', weight: 18, label: '150 ops/min' }
        ],

        aiAssessment: {
          title: 'Buffer Shannon Entropy Shift Deviation',
          summary: 'Write payload entropy sharply shifted, indicating possible block encryption.',
          reasons: [
            { num: '01', title: 'Buffer Shannon Entropy Shift', desc: '+4.2 Shannon entropy deviation detected in write blocks.' },
            { num: '02', title: 'High Write Throughput Density', desc: 'Write velocity escalated 8.0× baseline.' }
          ]
        },

        activityLogs: [
          { time: '09:42:26 AM', text: 'Shannon entropy shift +4.2 logged across block writes', type: 'warning' },
          { time: '09:42:22 AM', text: 'Behavioral anomaly score set to 82 / 100', type: 'warning' },
          { time: '09:42:18 AM', text: 'Learned machine baseline compared against live kernel telemetry', type: 'info' }
        ]
      };

    case 'none':
      return {
        state: 'WAITING FOR DATA',
        aiStateTag: 'NO TELEMETRY',
        aiStateVariant: 'neutral',
        riskScore: 0,
        anomalyScore: 0,
        confidence: 0,
        latencyMs: 18,
        modelVersion: 'Behavioral Model v0.1 DEMO',
        inferenceLocation: 'Simulated On-Device (Local Execution)',
        signalsEvaluated: 6,
        dataMode: 'NO TELEMETRY SOURCE',
        classification: 'Awaiting Data',
        
        features: [
          { key: 'writeFreq', name: 'Write Frequency', baseline: '42 ops/min', current: '0 ops/min', delta: '0%', contribution: 'Nominal', val: 0 },
          { key: 'readFreq', name: 'Read Activity Pattern', baseline: '120 ops/min', current: '0 ops/min', delta: '0%', contribution: 'Nominal', val: 0 },
          { key: 'modRate', name: 'File Modification Density', baseline: '18 ops/min', current: '0 ops/min', delta: '0%', contribution: 'Nominal', val: 0 },
          { key: 'renameVel', name: 'Rename Velocity Index', baseline: '4 ops/min', current: '0 ops/min', delta: '0%', contribution: 'Nominal', val: 0 },
          { key: 'entropyShift', name: 'Buffer Shannon Entropy', baseline: '1.2 Shannon', current: '1.2 Shannon', delta: '0%', contribution: 'Nominal', val: 0 },
          { key: 'irregularAccess', name: 'Access Irregularity Vector', baseline: '5%', current: '0%', delta: '0%', contribution: 'Nominal', val: 0 }
        ],

        featureImportance: [
          { name: 'Write Frequency Vector', weight: 32, label: '0 ops/min' },
          { name: 'File Modification Density', weight: 24, label: '0 ops/min' },
          { name: 'Rename Velocity Index', weight: 18, label: '0 ops/min' },
          { name: 'Buffer Shannon Entropy', weight: 12, label: '0.0 Shannon' },
          { name: 'Access Irregularity Vector', weight: 9, label: '0% path variance' },
          { name: 'Read Activity Pattern', weight: 5, label: '0 ops/min' }
        ],
        
        aiAssessment: {
          title: 'Waiting for Telemetry Data',
          summary: 'No active disk telemetry stream connected. Select a drive or trigger a demo scenario from the top toolbar to begin AI behavioral evaluation.',
          reasons: [
            { num: '01', title: 'Idle State', desc: 'No active disk write or rename vectors detected on monitored storage device.' }
          ]
        },

        activityLogs: [
          { time: new Date().toLocaleTimeString(), text: 'Edge AI waiting for storage device telemetry stream', type: 'info' }
        ]
      };

    case 'normal':
    default:
      return {
        state: 'NORMAL MONITORING',
        aiStateTag: 'MONITORING',
        aiStateVariant: 'success',
        riskScore: 18,
        anomalyScore: 12,
        confidence: 94,
        latencyMs: 18,
        modelVersion: 'Behavioral Model v0.1 DEMO',
        inferenceLocation: 'Simulated On-Device (Local Execution)',
        signalsEvaluated: 6,
        dataMode: 'SIMULATED TELEMETRY',
        classification: 'Normal',
        
        features: [
          { key: 'writeFreq', name: 'Write Frequency', baseline: '42 ops/min', current: '48 ops/min', delta: '+14%', contribution: 'Nominal', val: 18 },
          { key: 'readFreq', name: 'Read Activity Pattern', baseline: '120 ops/min', current: '142 ops/min', delta: '+18%', contribution: 'Nominal', val: 20 },
          { key: 'modRate', name: 'File Modification Density', baseline: '18 ops/min', current: '22 ops/min', delta: '+22%', contribution: 'Nominal', val: 15 },
          { key: 'renameVel', name: 'Rename Velocity Index', baseline: '4 ops/min', current: '6 ops/min', delta: '+50%', contribution: 'Nominal', val: 8 },
          { key: 'entropyShift', name: 'Buffer Shannon Entropy', baseline: '1.2 Shannon', current: '1.3 Shannon', delta: '+8%', contribution: 'Nominal', val: 12 },
          { key: 'irregularAccess', name: 'Access Irregularity Vector', baseline: '5%', current: '8%', delta: '+60%', contribution: 'Nominal', val: 10 }
        ],

        featureImportance: [
          { name: 'Write Frequency Vector', weight: 32, label: '48 ops/min' },
          { name: 'File Modification Density', weight: 24, label: '22 ops/min' },
          { name: 'Rename Velocity Index', weight: 18, label: '6 renames' },
          { name: 'Buffer Shannon Entropy', weight: 12, label: '1.3 Shannon' },
          { name: 'Access Irregularity Vector', weight: 9, label: '8% path variance' },
          { name: 'Read Activity Pattern', weight: 5, label: '142 ops/min' }
        ],
        
        aiAssessment: {
          title: 'Normal Behavioral Workload (Simulation)',
          summary: 'Disk activity is currently within the expected behavioral range. No significant combination of abnormal signals has been detected.',
          reasons: [
            { num: '01', title: 'Baseline Alignment', desc: 'Simulated operations match normal learned machine operation vectors.' }
          ]
        },

        activityLogs: [
          { time: new Date().toLocaleTimeString(), text: 'Disk activity received and evaluated by Edge AI', type: 'info' }
        ]
      };
  }
};

export const getUnifiedDiskGuardState = ({
  activeDriveId = null,
  monitoredDriveIds = [],
  scenario = 'normal',
  setupStage = 'active',
  allDevices = [],
  realAnalysis = null,
  isRealMonitoring = false,
  backendOnline = true
}) => {
  const combinedDrives = [...allDevices, ...SIMULATED_DRIVES.filter(sd => !allDevices.some(ad => ad.id === sd.id))];
  const activeDrive = combinedDrives.find((d) => d.id === activeDriveId) || SIMULATED_DRIVES.find((d) => d.id === activeDriveId) || null;
  const isMonitored = activeDriveId ? monitoredDriveIds.includes(activeDriveId) : false;
  const isRealDrive = activeDriveId && !['drive_c', 'drive_d', 'drive_e'].includes(activeDriveId);
  const monitoredDrivesCount = monitoredDriveIds.length;

  // Determine state code
  let code = 'NO_DRIVE';

  if (!activeDriveId) {
    code = 'NO_DRIVE';
  } else if (isRealDrive && !backendOnline) {
    code = 'AGENT_OFFLINE';
  } else if (!isMonitored) {
    if (setupStage === 'preparing') code = 'PREPARING';
    else if (setupStage === 'learning') code = 'LEARNING_BASELINE';
    else if (setupStage === 'ai_ready') code = 'EDGE_AI_READY';
    else code = 'DRIVE_SELECTED';
  } else {
    if (setupStage === 'preparing') {
      code = 'PREPARING';
    } else if (setupStage === 'learning') {
      code = 'LEARNING_BASELINE';
    } else if (setupStage === 'investigation') {
      code = 'INCIDENT_INVESTIGATION';
    } else if (scenario === 'ransomware') {
      code = 'MONITORING_ACTIVE_HIGH_RISK';
    } else if (scenario === 'mass-rename' || scenario === 'high-entropy') {
      code = 'MONITORING_ACTIVE_ELEVATED';
    } else {
      code = 'MONITORING_ACTIVE_NORMAL';
    }
  }

  const driveLabel = activeDrive ? `${activeDrive.device} ${activeDrive.name}` : 'No Drive Selected';
  const scenarioData = getEdgeAiScenarioData(scenario);

  // Derived state fields
  let topBarBadge = { label: 'NO DRIVE MONITORED', variant: 'neutral' };
  let cardStatusBadge = { label: 'AVAILABLE', variant: 'neutral' };
  let protectedStatus = { label: 'NOT MONITORED', isProtected: false, variant: 'neutral' };
  
  let telemetry = {
    status: 'Not started',
    isLive: false,
    readSpeed: '—',
    writeSpeed: '—',
    iops: '—',
    burstiness: 'Standby',
    description: 'Start monitoring to begin simulated telemetry.'
  };

  let baseline = {
    status: 'Not established',
    isEstablished: false,
    writeBaseline: '—',
    modBaseline: '—',
    renameBaseline: '—',
    entropyBaseline: '—',
    description: 'Baseline observation will start after monitoring begins.'
  };

  let pipeline = {
    targetDrive: driveLabel,
    diskActivity: isMonitored ? 'ACTIVE' : 'STANDBY',
    behavioralVector: isMonitored ? 'ESTABLISHED' : 'NOT ESTABLISHED',
    edgeAiModel: isMonitored ? 'ANALYZING' : 'STANDBY',
    riskLevel: isMonitored ? 'LOW' : 'WAITING',
    diskActivityColor: isMonitored ? 'var(--text-primary)' : 'var(--text-muted)',
    behavioralVectorColor: isMonitored ? 'var(--success)' : 'var(--text-muted)',
    edgeAiModelColor: isMonitored ? 'var(--accent)' : 'var(--text-muted)',
    riskLevelColor: isMonitored ? 'var(--success)' : 'var(--text-muted)'
  };

  let ai = {
    badge: 'SIMULATED EDGE AI',
    status: 'Waiting',
    anomalyScore: null,
    riskScore: null,
    confidence: null,
    explanationText: 'No active telemetry stream. Select a drive to begin.',
    assessmentTitle: 'Waiting for Drive Selection',
    features: scenarioData.features,
    featureImportance: scenarioData.featureImportance,
    activityLogs: scenarioData.activityLogs,
    aiAssessment: scenarioData.aiAssessment
  };

  let recommendedAction = {
    title: 'No storage device selected',
    desc: 'Select a storage device for DiskGuard to monitor.',
    buttonLabel: 'Add Drive',
    actionType: 'ADD_DRIVE',
    targetTab: 'drives'
  };

  let userJourneyStage = { step: 1, name: 'MONITOR', desc: 'Select & start drive monitoring' };

  // State-specific Overrides
  if (code === 'DRIVE_SELECTED') {
    topBarBadge = { label: 'NO DRIVE MONITORED', variant: 'neutral' };
    cardStatusBadge = { label: 'SELECTED', variant: 'primary' };
    protectedStatus = { label: 'NOT PROTECTED YET', isProtected: false, variant: 'warning' };
    
    pipeline = {
      targetDrive: driveLabel,
      diskActivity: 'STANDBY',
      behavioralVector: 'NOT ESTABLISHED',
      edgeAiModel: 'STANDBY',
      riskLevel: 'WAITING',
      diskActivityColor: 'var(--text-muted)',
      behavioralVectorColor: 'var(--text-muted)',
      edgeAiModelColor: 'var(--text-muted)',
      riskLevelColor: 'var(--text-muted)'
    };
    
    telemetry = {
      status: 'Not started',
      isLive: false,
      readSpeed: '—',
      writeSpeed: '—',
      iops: '—',
      burstiness: 'Standby',
      description: 'Start monitoring to begin simulated telemetry.'
    };

    baseline = {
      status: 'Not established',
      isEstablished: false,
      writeBaseline: '—',
      modBaseline: '—',
      renameBaseline: '—',
      entropyBaseline: '—',
      description: 'Baseline observation will start after monitoring begins.'
    };

    ai = {
      ...ai,
      status: 'Waiting for monitoring',
      anomalyScore: null,
      riskScore: null,
      confidence: null,
      explanationText: `DiskGuard is using simulated behavioral signals to demonstrate how the future local Edge AI inference pipeline will work. Start monitoring to activate simulation.`,
      assessmentTitle: `Drive Selected — Monitoring Not Started (${driveLabel})`
    };

    recommendedAction = {
      title: `${driveLabel} is ready to be monitored.`,
      desc: 'DiskGuard will observe simulated drive activity after monitoring is started.',
      buttonLabel: 'Start Monitoring',
      actionType: 'START_MONITORING',
      targetTab: 'drives'
    };

    userJourneyStage = { step: 1, name: 'MONITOR', desc: 'Drive selected — ready to monitor' };
  }

  else if (code === 'AGENT_OFFLINE') {
    topBarBadge = { label: 'AGENT OFFLINE', variant: 'warning' };
    cardStatusBadge = { label: 'DISCONNECTED', variant: 'warning' };
    protectedStatus = { label: 'OFFLINE', isProtected: false, variant: 'neutral' };

    telemetry = {
      status: 'Offline',
      isLive: false,
      readSpeed: '—',
      writeSpeed: '—',
      iops: '—',
      burstiness: 'Offline',
      description: 'DiskGuard local agent offline. Attempting to reconnect to FastAPI backend...'
    };

    baseline = {
      status: 'Offline',
      isEstablished: false,
      writeBaseline: '—',
      modBaseline: '—',
      renameBaseline: '—',
      entropyBaseline: '—',
      description: 'Agent backend unreachable at http://127.0.0.1:8000.'
    };

    pipeline = {
      targetDrive: driveLabel,
      diskActivity: 'OFFLINE',
      behavioralVector: 'OFFLINE',
      edgeAiModel: 'OFFLINE',
      riskLevel: 'UNKNOWN',
      diskActivityColor: 'var(--text-muted)',
      behavioralVectorColor: 'var(--text-muted)',
      edgeAiModelColor: 'var(--text-muted)',
      riskLevelColor: 'var(--text-muted)'
    };

    ai = {
      ...ai,
      badge: 'LOCAL EDGE AI',
      status: 'Offline',
      anomalyScore: null,
      riskScore: null,
      confidence: null,
      explanationText: 'FastAPI agent backend is currently unreachable. Reconnecting automatically...',
      assessmentTitle: `Agent Offline (${driveLabel})`
    };

    recommendedAction = {
      title: 'DiskGuard local backend is offline.',
      desc: 'Please ensure the FastAPI backend is running at http://127.0.0.1:8000. Reconnecting in background...',
      buttonLabel: 'Reconnecting...',
      actionType: 'NONE'
    };

    userJourneyStage = { step: 1, name: 'CONNECT', desc: 'Awaiting local agent backend' };
  }

  else if (code === 'PREPARING') {
    topBarBadge = { label: 'PREPARING SESSION', variant: 'info' };
    cardStatusBadge = { label: 'PREPARING', variant: 'info' };
    protectedStatus = { label: 'PREPARING', isProtected: false, variant: 'info' };

    telemetry = {
      status: 'Preparing',
      isLive: false,
      readSpeed: '0 MB/s',
      writeSpeed: '0 MB/s',
      iops: 0,
      burstiness: 'Preparing',
      description: 'Preparing monitoring session...'
    };

    baseline = {
      status: 'Preparing',
      isEstablished: false,
      description: 'Preparing behavioral signal observation vectors.'
    };

    ai = {
      ...ai,
      status: 'Waiting',
      anomalyScore: null,
      riskScore: null,
      confidence: null,
      explanationText: 'Preparing Edge AI pipeline session...',
      assessmentTitle: 'Preparing Monitoring Session'
    };

    recommendedAction = {
      title: 'Preparing monitoring session...',
      desc: 'Configuring monitoring parameters for local observation.',
      buttonLabel: 'Preparing...',
      actionType: 'NONE'
    };

    pipeline = {
      targetDrive: driveLabel,
      diskActivity: 'STANDBY',
      behavioralVector: 'NOT ESTABLISHED',
      edgeAiModel: 'STANDBY',
      riskLevel: 'WAITING',
      diskActivityColor: 'var(--text-muted)',
      behavioralVectorColor: 'var(--text-muted)',
      edgeAiModelColor: 'var(--text-muted)',
      riskLevelColor: 'var(--text-muted)'
    };

    userJourneyStage = { step: 2, name: 'UNDERSTAND', desc: 'Preparing monitoring session' };
  }

  else if (code === 'LEARNING_BASELINE') {
    topBarBadge = { label: 'LEARNING BASELINE', variant: 'info' };
    cardStatusBadge = { label: 'LEARNING BASELINE', variant: 'info' };
    protectedStatus = { label: 'BASELINE LEARNING', isProtected: false, variant: 'info' };

    telemetry = {
      status: 'Collecting simulated activity',
      isLive: true,
      readSpeed: '12 MB/s',
      writeSpeed: '8 MB/s',
      iops: 95,
      burstiness: 'Nominal Baseline',
      description: 'DiskGuard is observing normal activity to establish a behavioral baseline.'
    };

    baseline = {
      status: 'Establishing',
      isEstablished: false,
      writeBaseline: '42 ops/min',
      modBaseline: '18 ops/min',
      renameBaseline: '4 ops/min',
      entropyBaseline: '1.2 Shannon',
      description: 'DiskGuard is observing normal activity to establish a behavioral baseline.'
    };

    ai = {
      ...ai,
      status: 'Learning baseline',
      anomalyScore: null,
      riskScore: null,
      confidence: null,
      explanationText: 'DiskGuard is observing normal activity to establish a behavioral baseline.',
      assessmentTitle: 'Establishing Behavioral Baseline'
    };

    recommendedAction = {
      title: 'Establishing behavioral baseline...',
      desc: 'DiskGuard is observing normal activity to establish a behavioral baseline before identifying deviations.',
      buttonLabel: 'Establishing Baseline...',
      actionType: 'NONE'
    };

    pipeline = {
      targetDrive: driveLabel,
      diskActivity: 'OBSERVING',
      behavioralVector: 'ESTABLISHING',
      edgeAiModel: 'LEARNING',
      riskLevel: 'WAITING',
      diskActivityColor: 'var(--text-primary)',
      behavioralVectorColor: 'var(--accent)',
      edgeAiModelColor: 'var(--accent)',
      riskLevelColor: 'var(--text-muted)'
    };

    userJourneyStage = { step: 2, name: 'UNDERSTAND', desc: 'Learn normal behavior' };
  }

  else if (code === 'EDGE_AI_READY') {
    topBarBadge = { label: 'EDGE AI READY', variant: 'info' };
    cardStatusBadge = { label: 'EDGE AI READY', variant: 'info' };
    protectedStatus = { label: 'READY', isProtected: false, variant: 'info' };

    telemetry = {
      status: 'Active',
      isLive: true,
      readSpeed: '18 MB/s',
      writeSpeed: '12 MB/s',
      iops: 140,
      burstiness: 'Nominal',
      description: 'Behavioral signals ready for local inference.'
    };

    baseline = {
      status: 'Established',
      isEstablished: true,
      writeBaseline: '42 ops/min',
      modBaseline: '18 ops/min',
      renameBaseline: '4 ops/min',
      entropyBaseline: '1.2 Shannon',
      description: 'Baseline parameters established and stored locally.'
    };

    ai = {
      ...ai,
      status: 'Ready',
      anomalyScore: 12,
      riskScore: 18,
      confidence: 94,
      explanationText: 'Behavioral signals are available for AI analysis.',
      assessmentTitle: 'Edge AI Ready'
    };

    pipeline = {
      targetDrive: driveLabel,
      diskActivity: 'ACTIVE',
      behavioralVector: 'ESTABLISHED',
      edgeAiModel: 'ANALYZING',
      riskLevel: 'LOW',
      diskActivityColor: 'var(--text-primary)',
      behavioralVectorColor: 'var(--success)',
      edgeAiModelColor: 'var(--accent)',
      riskLevelColor: 'var(--success)'
    };

    recommendedAction = {
      title: 'Behavioral signals are available for AI analysis.',
      desc: 'Edge AI baseline parameters established.',
      buttonLabel: 'View Dashboard',
      actionType: 'NONE'
    };

    userJourneyStage = { step: 3, name: 'DETECT', desc: 'Edge AI ready for analysis' };
  }

  else if (code === 'MONITORING_ACTIVE_NORMAL') {
    if (isRealMonitoring) {
      const baselineEst = realAnalysis?.baseline_status === 'established';
      const isElevated = realAnalysis && realAnalysis.risk_score > 30;
      const isHighRisk = realAnalysis && realAnalysis.risk_score > 60;

      topBarBadge = isHighRisk
        ? { label: 'REAL MONITORING · HIGH RISK', variant: 'danger' }
        : isElevated
        ? { label: 'REAL MONITORING · ELEVATED', variant: 'warning' }
        : { label: 'REAL MONITORING', variant: 'success' };

      cardStatusBadge = isHighRisk
        ? { label: 'SUSPICIOUS ACTIVITY', variant: 'danger' }
        : isElevated
        ? { label: 'ANOMALY DETECTED', variant: 'warning' }
        : { label: 'MONITORING ACTIVE', variant: 'success' };

      protectedStatus = isHighRisk
        ? { label: 'HIGH RISK DETECTED', isProtected: false, variant: 'danger' }
        : isElevated
        ? { label: 'ELEVATED RISK', isProtected: true, variant: 'warning' }
        : { label: 'PROTECTED', isProtected: true, variant: 'success' };

      telemetry = {
        status: 'Active',
        isLive: true,
        readSpeed: realAnalysis?.features?.read_frequency != null ? `${(realAnalysis.features.read_frequency / 60).toFixed(1)} ops/s` : '—',
        writeSpeed: realAnalysis?.features?.write_frequency != null ? `${(realAnalysis.features.write_frequency / 60).toFixed(1)} ops/s` : '—',
        iops: realAnalysis?.features ? Math.round(((realAnalysis.features.read_frequency || 0) + (realAnalysis.features.write_frequency || 0)) / 60) : '—',
        burstiness: realAnalysis?.features?.io_burstiness != null ? `${realAnalysis.features.io_burstiness.toFixed(1)}x` : 'Nominal',
        description: 'Real macOS filesystem and storage I/O telemetry active.'
      };

      baseline = {
        status: baselineEst ? 'Established' : 'Learning',
        isEstablished: baselineEst,
        writeBaseline: realAnalysis?.features?.write_frequency != null ? `${Math.round(realAnalysis.features.write_frequency)} ops/min` : 'Learning...',
        modBaseline: realAnalysis?.features?.file_modification_rate != null ? `${Math.round(realAnalysis.features.file_modification_rate)} ops/min` : 'Learning...',
        renameBaseline: realAnalysis?.features?.rename_rate != null ? `${Math.round(realAnalysis.features.rename_rate)} ops/min` : '0 ops/min',
        entropyBaseline: realAnalysis?.features?.mean_sample_entropy != null ? `${realAnalysis.features.mean_sample_entropy.toFixed(2)} Shannon` : 'Measuring...',
        description: baselineEst ? 'Activity matches learned on-device behavioral profile.' : 'Learning normal storage workload parameters.'
      };

      pipeline = {
        targetDrive: driveLabel,
        diskActivity: 'ACTIVE',
        behavioralVector: baselineEst ? 'ESTABLISHED' : 'LEARNING',
        edgeAiModel: baselineEst ? 'ANALYZING' : 'LEARNING',
        riskLevel: isHighRisk ? 'HIGH' : isElevated ? 'ELEVATED' : 'LOW',
        diskActivityColor: 'var(--text-primary)',
        behavioralVectorColor: baselineEst ? 'var(--success)' : 'var(--accent)',
        edgeAiModelColor: baselineEst ? 'var(--accent)' : 'var(--text-muted)',
        riskLevelColor: isHighRisk ? 'var(--danger)' : isElevated ? 'var(--warning)' : 'var(--success)'
      };

      ai = {
        ...ai,
        badge: 'LOCAL EDGE AI',
        status: baselineEst ? 'Analyzing' : 'Learning Baseline',
        anomalyScore: realAnalysis ? realAnalysis.anomaly_score : null,
        riskScore: realAnalysis ? realAnalysis.risk_score : null,
        confidence: realAnalysis ? Math.round(realAnalysis.confidence * 100) : null,
        explanationText: realAnalysis?.explanation?.summary || `Edge AI evaluates behavioral telemetry of ${driveLabel}.`,
        assessmentTitle: baselineEst ? `Real-Time Behavioral Analysis (${driveLabel})` : `Establishing Behavioral Baseline (${driveLabel})`
      };

      recommendedAction = {
        title: `${driveLabel} is protected by Real Monitoring.`,
        desc: realAnalysis?.explanation?.summary || 'Behavior is within the established normal baseline.',
        buttonLabel: 'View Activity',
        actionType: 'VIEW_ACTIVITY',
        targetTab: 'activity'
      };

      userJourneyStage = { step: baselineEst ? 4 : 2, name: baselineEst ? 'PREVENT' : 'UNDERSTAND', desc: baselineEst ? 'Continuous on-device protection' : 'Learn normal behavior' };
    } else {
      topBarBadge = { label: 'SIMULATION ACTIVE', variant: 'success' };
      cardStatusBadge = { label: 'MONITORING ACTIVE', variant: 'success' };
      protectedStatus = { label: 'PROTECTED', isProtected: true, variant: 'success' };

      telemetry = {
        status: 'Active',
        isLive: true,
        readSpeed: '35 MB/s',
        writeSpeed: '20 MB/s',
        iops: 184,
        burstiness: 'Nominal',
        description: 'Live simulated telemetry active.'
      };

      baseline = {
        status: 'Established',
        isEstablished: true,
        writeBaseline: '42 ops/min',
        modBaseline: '18 ops/min',
        renameBaseline: '4 ops/min',
        entropyBaseline: '1.2 Shannon',
        description: 'Activity matches learned machine baseline vectors.'
      };

      pipeline = {
        targetDrive: driveLabel,
        diskActivity: 'ACTIVE',
        behavioralVector: 'ESTABLISHED',
        edgeAiModel: 'ANALYZING',
        riskLevel: 'LOW',
        diskActivityColor: 'var(--text-primary)',
        behavioralVectorColor: 'var(--success)',
        edgeAiModelColor: 'var(--accent)',
        riskLevelColor: 'var(--success)'
      };

      ai = {
        ...ai,
        status: 'Analyzing',
        anomalyScore: 12,
        riskScore: 18,
        confidence: 94,
        explanationText: `Simulated Edge AI evaluates the current behavioral signals of ${driveLabel}.`,
        assessmentTitle: `Normal Behavioral Workload (${driveLabel})`
      };

      recommendedAction = {
        title: `${driveLabel} is currently being monitored.`,
        desc: 'Drive behavior matches learned baseline. Zero ransomware-like patterns or behavioral deviations observed.',
        buttonLabel: 'View Activity',
        actionType: 'VIEW_ACTIVITY',
        targetTab: 'activity'
      };

      userJourneyStage = { step: 2, name: 'UNDERSTAND', desc: 'Learn normal behavior' };
    }
  }

  else if (code === 'MONITORING_ACTIVE_ELEVATED') {
    topBarBadge = { label: 'DEMO MONITORING · ELEVATED', variant: 'warning' };
    cardStatusBadge = { label: 'ATTENTION', variant: 'warning' };
    protectedStatus = { label: '⚠ ATTENTION', isProtected: false, variant: 'warning' };

    telemetry = {
      status: 'Elevated Stream',
      isLive: true,
      readSpeed: '45 MB/s',
      writeSpeed: '180 ops/s',
      iops: 620,
      burstiness: 'Elevated Burst',
      description: 'Unusual rename or entropy shift stream detected.'
    };

    baseline = {
      status: 'Deviated',
      isEstablished: true,
      writeBaseline: '42 ops/min',
      modBaseline: '18 ops/min',
      renameBaseline: '4 ops/min',
      entropyBaseline: '1.2 Shannon',
      description: 'Behavioral signals exceed learned baseline thresholds.'
    };

    pipeline = {
      targetDrive: driveLabel,
      diskActivity: 'ELEVATED',
      behavioralVector: 'DEVIATED',
      edgeAiModel: 'ANALYZING',
      riskLevel: 'ELEVATED',
      diskActivityColor: 'var(--warning)',
      behavioralVectorColor: 'var(--warning)',
      edgeAiModelColor: 'var(--accent)',
      riskLevelColor: 'var(--warning)'
    };

    ai = {
      ...ai,
      status: 'Analyzing elevated behavior',
      anomalyScore: scenarioData.anomalyScore || 54,
      riskScore: scenarioData.riskScore || 52,
      confidence: 86,
      explanationText: `Unusual behavioral pattern identified on ${driveLabel}. High rename velocity or entropy shift detected.`,
      assessmentTitle: `Elevated Behavioral Deviation (${driveLabel})`
    };

    recommendedAction = {
      title: `Unusual behavior has been detected on ${driveLabel}.`,
      desc: 'Multiple behavioral signals exceed normal baseline thresholds.',
      buttonLabel: 'Investigate',
      actionType: 'INVESTIGATE',
      targetTab: 'incidents'
    };

    userJourneyStage = { step: 3, name: 'DETECT', desc: 'Edge AI identifies patterns' };
  }

  else if (code === 'MONITORING_ACTIVE_HIGH_RISK' || code === 'INCIDENT_INVESTIGATION') {
    topBarBadge = { label: 'DEMO MONITORING · HIGH RISK', variant: 'danger' };
    cardStatusBadge = { label: 'HIGH RISK', variant: 'danger' };
    protectedStatus = { label: '⚠ HIGH RISK', isProtected: false, variant: 'danger' };

    telemetry = {
      status: 'Critical Spikes',
      isLive: true,
      readSpeed: '18 MB/s',
      writeSpeed: '630 ops/s',
      iops: 4890,
      burstiness: 'Critical Burst',
      description: 'Rapid write velocity and mass rename burst detected.'
    };

    baseline = {
      status: 'Severely Breached',
      isEstablished: true,
      writeBaseline: '42 ops/min',
      modBaseline: '18 ops/min',
      renameBaseline: '4 ops/min',
      entropyBaseline: '1.2 Shannon',
      description: 'Write throughput (+1399%) and renames (+10150%) breached baseline.'
    };

    pipeline = {
      targetDrive: driveLabel,
      diskActivity: 'CRITICAL BURST',
      behavioralVector: 'BREACHED',
      edgeAiModel: 'CORRELATING',
      riskLevel: 'HIGH',
      diskActivityColor: 'var(--danger)',
      behavioralVectorColor: 'var(--danger)',
      edgeAiModelColor: 'var(--danger)',
      riskLevelColor: 'var(--danger)'
    };

    ai = {
      ...ai,
      status: 'High-risk behavior detected',
      anomalyScore: 78,
      riskScore: 87,
      confidence: 91,
      explanationText: `High-risk behavioral pattern detected on ${driveLabel}. Write velocity escalated and mass renames correlated.`,
      assessmentTitle: `High-Risk Ransomware-Like Behavioral Pattern Identified (${driveLabel})`
    };

    recommendedAction = {
      title: `DiskGuard detected a high-risk behavioral pattern on ${driveLabel}.`,
      desc: 'Rapid write velocity, mass modifications, and Shannon entropy spikes correlated.',
      buttonLabel: 'Investigate Incident',
      actionType: 'INVESTIGATE_INCIDENT',
      targetTab: 'incidents'
    };

    userJourneyStage = code === 'INCIDENT_INVESTIGATION'
      ? { step: 5, name: 'RESPOND', desc: 'Reviewing incident containment' }
      : { step: 4, name: 'INVESTIGATE', desc: 'Understand flagged activity' };
  }

  // Simulated Processes - Empty State per requirement 6
  let processes = [];

  // Simulated Incidents
  let incidents = [];
  if (isMonitored && (code === 'MONITORING_ACTIVE_HIGH_RISK' || code === 'INCIDENT_INVESTIGATION')) {
    incidents = [
      {
        id: 'DG-00124',
        title: 'Suspicious Mass File Rename & High-Velocity Write Burst',
        timestamp: 'Just now',
        severity: 'HIGH',
        drive: activeDrive?.device || 'C:',
        driveName: activeDrive?.name || 'SYSTEM SSD',
        process: 'svchost_update.exe (PID: 4912)',
        anomalyScore: 78,
        riskScore: 87,
        confidence: '91%',
        status: 'Active Alert',
        details: `DiskGuard Edge AI detected a rapid burst of 630 write operations/min and 410 file extension renames on ${driveLabel}. Shannon entropy shifted to +4.2.`
      }
    ];
  }

  return {
    code,
    activeDrive,
    activeDriveId,
    monitoredDriveIds,
    isMonitored,
    monitoredDrivesCount,
    scenario,
    setupStage,
    driveLabel,
    topBarBadge,
    cardStatusBadge,
    protectedStatus,
    telemetry,
    baseline,
    ai,
    pipeline,
    recommendedAction,
    userJourneyStage,
    processes,
    incidents
  };
};

