import React, { useState } from 'react';
import { ShieldCheck, Sliders, ToggleLeft, ToggleRight, Lock } from 'lucide-react';

export default function ProtectionCenterView({ detectionMode, setDetectionMode }) {
  const [toggles, setToggles] = useState({
    realtime: true,
    behavioral: true,
    alerts: true,
    isolation: false,
    writeLock: false
  });

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const modes = [
    { id: 'balanced', label: 'Balanced', desc: 'Optimal trade-off between detection speed and false positive avoidance.' },
    { id: 'high-sensitivity', label: 'High Sensitivity', desc: 'Aggressive heuristic thresholds for critical data environments.' },
    { id: 'low-fp', label: 'Low False Positives', desc: 'Strict confidence validation before triggering incident alerts.' },
    { id: 'research', label: 'Research / Analysis', desc: 'Detailed telemetry logging with verbose AI feature extraction.' }
  ];

  const controls = [
    { key: 'realtime', name: 'Real-Time Disk Telemetry Monitoring', desc: 'Continuously stream file read, write, modification, and rename vectors.', status: 'ACTIVE', statusType: 'success' },
    { key: 'behavioral', name: 'Behavioral Anomaly Detection Shield', desc: 'Evaluate disk activity vectors against local learned machine baseline.', status: 'ACTIVE', statusType: 'success' },
    { key: 'alerts', name: 'Correlated Incident Alert Generation', desc: 'Group hundreds of raw disk operation events into unified security incidents.', status: 'AVAILABLE', statusType: 'neutral' },
    { key: 'isolation', name: 'Automated Process Sandbox Isolation', desc: 'Suspend suspicious process execution upon high entropy ransomware detection.', status: 'DEMO', statusType: 'warning' },
    { key: 'writeLock', name: 'Hardware Kernel Disk Write Protection', desc: 'Enforce immediate emergency read-only lock on affected drive volumes.', status: 'COMING SOON', statusType: 'neutral' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Detection Mode Selector */}
      <div className="dg-card">
        <div className="card-header">
          <div className="card-title-group">
            <Sliders size={16} style={{ color: 'var(--accent)' }} />
            <span className="card-title">Detection Sensitivity Mode</span>
          </div>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DEMO MODE CONTROLS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {modes.map((m) => {
            const isSel = detectionMode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setDetectionMode(m.id)}
                style={{
                  background: isSel ? 'var(--bg-surface-active)' : 'var(--bg-app)',
                  border: isSel ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: '600', color: isSel ? 'var(--accent)' : 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {m.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Protection Modules */}
      <div className="dg-card">
        <div className="card-header">
          <div className="card-title-group">
            <Lock size={16} style={{ color: 'var(--accent)' }} />
            <span className="card-title">Active Defense Modules</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {controls.map((ctrl) => {
            const isChecked = toggles[ctrl.key];
            return (
              <div
                key={ctrl.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{ctrl.name}</span>
                    <span className={`badge badge-${ctrl.statusType}`}>{ctrl.status}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {ctrl.desc}
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(ctrl.key)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isChecked ? 'var(--accent)' : 'var(--text-muted)' }}
                  disabled={ctrl.status === 'COMING SOON'}
                >
                  {isChecked ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
