import React from 'react';
import { Cpu, AlertTriangle, Info, CheckCircle2, HardDrive } from 'lucide-react';

export default function EdgeAiCard({ unifiedState, scenario, activeDrive }) {
  const isMonitored = unifiedState ? unifiedState.isMonitored : false;
  const isAttack = unifiedState
    ? (unifiedState.code === 'MONITORING_ACTIVE_HIGH_RISK' || unifiedState.code === 'INCIDENT_INVESTIGATION')
    : (scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy');

  const driveTitle = unifiedState?.driveLabel || (activeDrive ? `${activeDrive.name} (${activeDrive.device})` : 'SELECTED DRIVE');
  const aiState = unifiedState?.ai;

  const isReal = unifiedState?.isRealMonitoring;
  const realFeat = unifiedState?.realAnalysis?.features;
  const isElevated = unifiedState?.realAnalysis && unifiedState.realAnalysis.risk_score > 30;

  const analysisItems = isReal ? [
    {
      name: 'Write activity',
      status: realFeat?.write_frequency != null
        ? `${isElevated ? 'High' : 'Normal'} (${Math.round(realFeat.write_frequency)} ops/min)`
        : 'Measuring...',
      isHigh: isElevated
    },
    {
      name: 'File modifications',
      status: realFeat?.file_modification_rate != null
        ? `${isElevated ? 'High' : 'Normal'} (${Math.round(realFeat.file_modification_rate)} files/min)`
        : 'Measuring...',
      isHigh: isElevated
    },
    {
      name: 'Rename activity',
      status: realFeat?.rename_rate != null
        ? `${realFeat.rename_rate > 10 ? 'Spike' : 'Normal'} (${Math.round(realFeat.rename_rate)} renames/min)`
        : 'Measuring...',
      isHigh: realFeat?.rename_rate > 10
    },
    {
      name: 'Entropy (file randomness)',
      status: realFeat?.mean_sample_entropy != null
        ? `Sampled (${realFeat.mean_sample_entropy.toFixed(2)} Shannon)`
        : 'Measuring...',
      isHigh: realFeat?.entropy_change != null && realFeat.entropy_change > 1.5
    },
    {
      name: 'Access pattern',
      status: realFeat?.io_burstiness != null
        ? `${realFeat.io_burstiness.toFixed(1)}x burst ratio`
        : 'Normal Baseline',
      isHigh: realFeat?.io_burstiness != null && realFeat.io_burstiness > 3.0
    }
  ] : [
    { name: 'Write activity', status: isMonitored ? (isAttack ? 'Unusually High (+1399%)' : 'Normal (48 ops/min)') : 'Standby', isHigh: isMonitored && isAttack },
    { name: 'File modifications', status: isMonitored ? (isAttack ? 'Unusually High (591 files/12s)' : 'Normal (22 files/min)') : 'Standby', isHigh: isMonitored && isAttack },
    { name: 'Rename activity', status: isMonitored ? (scenario === 'mass-rename' || scenario === 'ransomware' ? 'Rapid Spike (410 renames/4s)' : 'Normal (6 renames/min)') : 'Standby', isHigh: isMonitored && (scenario === 'mass-rename' || scenario === 'ransomware') },
    { name: 'Entropy (file randomness)', status: isMonitored ? (scenario === 'high-entropy' || scenario === 'ransomware' ? 'Encryption Shift (+4.2 Shannon)' : 'Normal (1.3 Shannon)') : 'Standby', isHigh: isMonitored && (scenario === 'high-entropy' || scenario === 'ransomware') },
    { name: 'Access pattern', status: isMonitored ? (isAttack ? 'Path Irregularity (82% variance)' : 'Normal Baseline (8% variance)') : 'Standby', isHigh: isMonitored && isAttack }
  ];

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Cpu size={15} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Edge AI Intelligence</span>
          <div className="tooltip-container">
            <Info size={13} style={{ color: 'var(--text-muted)' }} />
            <div className="tooltip-text">
              {isReal ? 'Local Edge AI evaluates on-device storage I/O and filesystem telemetry in real-time.' : 'DiskGuard uses simulated behavioral signals to demonstrate how the future local Edge AI inference pipeline will work.'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="badge badge-accent" style={{ fontSize: '0.675rem', fontWeight: '700' }}>
            {driveTitle}
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.675rem', fontWeight: '700' }}>
            {aiState?.badge || 'SIMULATED EDGE AI'}
          </span>
        </div>
      </div>

      {/* 1. What is it doing? */}
      <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 0.85rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {isReal ? 'LOCAL EDGE AI STATUS' : 'SIMULATED EDGE AI STATUS'}
          </div>
          <div style={{ fontSize: '0.725rem', fontWeight: '700', color: isMonitored ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <HardDrive size={12} />
            <span>{aiState?.status || 'Waiting for monitoring'}</span>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          {aiState?.explanationText || 'DiskGuard is using simulated behavioral signals to demonstrate how the future local Edge AI inference pipeline will work.'}
        </div>
      </div>

      {/* 2. 5 Evaluated Signals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
        {analysisItems.map((item, idx) => (
          <div key={idx} style={{ background: 'var(--bg-app)', padding: '0.55rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.675rem', fontWeight: '600', color: 'var(--text-muted)' }}>{item.name}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: item.isHigh ? 'var(--danger)' : !isMonitored ? 'var(--text-muted)' : 'var(--success)', marginTop: '0.15rem' }}>
              {item.status}
            </div>
          </div>
        ))}
      </div>

      {/* 3. AI Assessment & Explanation */}
      <div style={{
        background: !isMonitored ? '#F8FAFC' : isAttack ? 'var(--danger-bg)' : 'var(--bg-app)',
        border: `1px solid ${!isMonitored ? 'var(--border)' : isAttack ? 'var(--danger-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem'
      }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: '700', color: !isMonitored ? 'var(--text-muted)' : isAttack ? 'var(--danger)' : 'var(--success)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {isAttack ? <AlertTriangle size={15} style={{ color: 'var(--danger)' }} /> : <CheckCircle2 size={15} style={{ color: !isMonitored ? 'var(--text-muted)' : 'var(--success)' }} />}
          <span>{aiState?.assessmentTitle || 'Waiting for Monitoring'}</span>
        </div>

        {!isMonitored ? (
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            Start monitoring on <strong>{driveTitle}</strong> to activate simulated Edge AI behavioral analysis.
          </div>
        ) : isAttack ? (
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Why was this flagged?</div>
            <ul style={{ paddingLeft: '1.1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <li>Write activity increased significantly above baseline</li>
              <li>Many files modified rapidly in a short window</li>
              <li>File extension renames detected across directories</li>
              <li>Payload block Shannon entropy shifted towards encrypted values</li>
            </ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid var(--danger-border)', fontSize: '0.75rem' }}>
              <span>Anomaly Index: <strong className="mono" style={{ color: 'var(--danger)' }}>{aiState?.anomalyScore || 78} / 100</strong></span>
              <span>Risk: <strong style={{ color: 'var(--danger)' }}>{aiState?.riskScore || 87} / 100 (HIGH)</strong></span>
              <span>Confidence: <strong className="mono" style={{ color: 'var(--danger)' }}>91%</strong></span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            {isReal && unifiedState?.realAnalysis?.explanation?.summary
              ? unifiedState.realAnalysis.explanation.summary
              : `All monitored disk operation vectors on ${driveTitle} match learned normal machine operation patterns. Zero ransomware signatures or behavioral deviations observed.`}
          </div>
        )}
      </div>
    </div>
  );
}




