import React from 'react';
import { Compass, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

export default function BehavioralBaseline({ unifiedState, scenario }) {
  const isMonitored = unifiedState ? unifiedState.isMonitored : (scenario !== 'none');
  const isAttack = isMonitored && (scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy');

  const driveLabel = unifiedState?.driveLabel || 'Selected Drive';
  const isReal = unifiedState?.isRealMonitoring;
  const realFeat = unifiedState?.realAnalysis?.features;
  const baseStatus = unifiedState?.realAnalysis?.baseline_status || 'learning';
  const isEstablished = baseStatus === 'established';

  const metrics = !isMonitored ? [
    { name: 'Write Frequency', baseline: '—', current: '—', delta: '—', status: 'Standby', isHigh: false },
    { name: 'File Modifications', baseline: '—', current: '—', delta: '—', status: 'Standby', isHigh: false },
    { name: 'Rename Velocity', baseline: '—', current: '—', delta: '—', status: 'Standby', isHigh: false },
    { name: 'Buffer Entropy', baseline: '—', current: '—', delta: '—', status: 'Standby', isHigh: false },
    { name: 'Access Irregularity', baseline: '—', current: '—', delta: '—', status: 'Standby', isHigh: false },
    { name: 'Read Activity', baseline: '—', current: '—', delta: '—', status: 'Standby', isHigh: false }
  ] : isReal ? [
    {
      name: 'Write Frequency',
      baseline: isEstablished ? `${unifiedState?.baseline?.writeBaseline || 'Baseline'}` : 'Learning...',
      current: realFeat?.write_frequency != null ? `${Math.round(realFeat.write_frequency)} ops/min` : 'Measuring...',
      delta: isEstablished ? 'Nominal' : 'Learning',
      status: 'Normal',
      isHigh: false
    },
    {
      name: 'File Modifications',
      baseline: isEstablished ? `${unifiedState?.baseline?.modBaseline || 'Baseline'}` : 'Learning...',
      current: realFeat?.file_modification_rate != null ? `${Math.round(realFeat.file_modification_rate)} files/min` : 'Measuring...',
      delta: isEstablished ? 'Nominal' : 'Learning',
      status: 'Normal',
      isHigh: false
    },
    {
      name: 'Rename Velocity',
      baseline: isEstablished ? `${unifiedState?.baseline?.renameBaseline || 'Baseline'}` : 'Learning...',
      current: realFeat?.rename_rate != null ? `${Math.round(realFeat.rename_rate)} renames/min` : 'Measuring...',
      delta: isEstablished ? 'Nominal' : 'Learning',
      status: 'Normal',
      isHigh: false
    },
    {
      name: 'Buffer Entropy',
      baseline: isEstablished ? `${unifiedState?.baseline?.entropyBaseline || 'Baseline'}` : 'Measuring...',
      current: realFeat?.mean_sample_entropy != null ? `${realFeat.mean_sample_entropy.toFixed(2)} Shannon` : 'Measuring...',
      delta: realFeat?.entropy_change != null ? `+${realFeat.entropy_change.toFixed(2)}` : 'Nominal',
      status: 'Normal',
      isHigh: false
    },
    {
      name: 'Access Irregularity',
      baseline: 'Dynamic CV',
      current: realFeat?.access_irregularity != null ? `${(realFeat.access_irregularity * 100).toFixed(0)}% var` : 'Measuring...',
      delta: 'Nominal',
      status: 'Normal',
      isHigh: false
    },
    {
      name: 'Read Activity',
      baseline: isEstablished ? 'Baseline' : 'Learning...',
      current: realFeat?.read_frequency != null ? `${Math.round(realFeat.read_frequency)} ops/min` : 'Measuring...',
      delta: 'Nominal',
      status: 'Normal',
      isHigh: false
    }
  ] : [
    { name: 'Write Frequency', baseline: '42 ops/min', current: isAttack ? '630 ops/min' : '48 ops/min', delta: isAttack ? '+1399%' : '+14%', status: isAttack ? 'Elevated' : 'Normal', isHigh: isAttack },
    { name: 'File Modifications', baseline: '18 ops/min', current: isAttack ? '591 ops/min' : '22 ops/min', delta: isAttack ? '+3183%' : '+22%', status: isAttack ? 'Critical' : 'Normal', isHigh: isAttack },
    { name: 'Rename Velocity', baseline: '4 ops/min', current: scenario === 'mass-rename' || scenario === 'ransomware' ? '410 ops/min' : '6 ops/min', delta: scenario === 'mass-rename' || scenario === 'ransomware' ? '+10150%' : '+50%', status: scenario === 'mass-rename' || scenario === 'ransomware' ? 'Critical' : 'Normal', isHigh: scenario === 'mass-rename' || scenario === 'ransomware' },
    { name: 'Buffer Entropy', baseline: '1.2 Shannon', current: scenario === 'high-entropy' || scenario === 'ransomware' ? '5.4 Shannon' : '1.3 Shannon', delta: scenario === 'high-entropy' || scenario === 'ransomware' ? '+350%' : '+8%', status: scenario === 'high-entropy' || scenario === 'ransomware' ? 'Critical' : 'Normal', isHigh: scenario === 'high-entropy' || scenario === 'ransomware' },
    { name: 'Access Irregularity', baseline: '5%', current: isAttack ? '82%' : '8%', delta: isAttack ? '+1540%' : '+60%', status: isAttack ? 'Elevated' : 'Normal', isHigh: isAttack },
    { name: 'Read Activity', baseline: '120 ops/min', current: '142 ops/min', delta: '+18%', status: 'Normal', isHigh: false }
  ];

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Compass size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Behavioral Baseline</span>
          <div className="tooltip-container">
            <Info size={13} style={{ color: 'var(--text-muted)' }} />
            <div className="tooltip-text">
              Learned normal machine operation vectors compared against current telemetry in real time.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="status-indicator">
            <span className={`status-dot ${!isMonitored ? 'neutral' : 'success'}`}></span>
            <span>{!isMonitored ? 'Standby' : isReal ? (isEstablished ? 'Established' : 'Learning Baseline') : 'Monitoring deviation'}</span>
          </span>
          <span className="badge badge-neutral">
            {!isMonitored ? 'NOT ESTABLISHED' : (unifiedState?.baseline?.status || 'ESTABLISHED').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Behavioral Health Summary Card */}
      <div style={{
        background: !isMonitored ? '#F8FAFC' : isAttack ? 'var(--danger-bg)' : 'var(--bg-app)',
        border: `1px solid ${!isMonitored ? 'var(--border)' : isAttack ? 'var(--danger-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAttack ? (
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
          ) : (
            <ShieldCheck size={16} style={{ color: !isMonitored ? 'var(--text-muted)' : 'var(--success)' }} />
          )}
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>BEHAVIORAL BASELINE</div>
            <div style={{ fontWeight: '700', color: !isMonitored ? 'var(--text-muted)' : isAttack ? 'var(--danger)' : 'var(--success)', fontSize: '0.85rem' }}>
              {!isMonitored ? 'Not Established' : isReal ? (isEstablished ? 'Established Baseline' : 'Learning Normal Workload') : isAttack ? 'Anomalous Deviation Detected' : 'Stable'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {!isMonitored
            ? 'Baseline observation will start after monitoring begins.'
            : isReal
            ? (unifiedState?.baseline?.description || (isEstablished ? 'Activity matches learned on-device behavioral profile.' : 'Learning normal storage workload parameters.'))
            : isAttack 
            ? `4 of 6 monitored behavioral signals exceed learned thresholds on ${driveLabel}.`
            : `6 of 6 monitored signals within expected machine ranges on ${driveLabel}.`
          }
        </div>
      </div>

      {/* Baseline vs Current Metric List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1.4fr 1fr 1fr',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.775rem'
          }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{m.name}</div>
            <div style={{ color: 'var(--text-muted)' }}>
              <span className="mono" style={{ color: '#8A919B' }}>{m.baseline}</span>
              {' → '}
              <span className="mono" style={{ color: m.isHigh ? 'var(--danger)' : isMonitored ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '600' }}>{m.current}</span>
            </div>
            <div className="mono" style={{ fontWeight: '600', color: m.isHigh ? 'var(--danger)' : 'var(--text-secondary)' }}>{m.delta}</div>
            <div style={{ textAlign: 'right' }}>
              {!isMonitored ? (
                <span className="badge badge-neutral">Standby</span>
              ) : m.isHigh ? (
                <span className="badge badge-danger">{m.status}</span>
              ) : (
                <span className="badge badge-neutral">Normal</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


