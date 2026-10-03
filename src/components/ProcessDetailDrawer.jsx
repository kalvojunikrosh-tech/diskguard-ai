import React from 'react';
import { X, Terminal, Cpu } from 'lucide-react';

export default function ProcessDetailDrawer({ process, onClose }) {
  if (!process) return null;

  const isHigh = process.risk === 'High';

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PID {process.pid}</span>
              {isHigh ? <span className="badge badge-danger">High Risk</span> : <span className="badge badge-neutral">Normal Risk</span>}
            </div>
            <h2 className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: isHigh ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.25rem' }}>
              {process.name}
            </h2>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* WHY IS THIS PROCESS SUSPICIOUS? */}
        <div style={{ background: isHigh ? 'var(--danger-bg)' : 'var(--bg-app)', border: `1px solid ${isHigh ? 'var(--danger-border)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isHigh ? 'var(--danger)' : 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Cpu size={15} style={{ color: isHigh ? 'var(--danger)' : 'var(--accent)' }} />
            <span>{isHigh ? 'WHY IS THIS PROCESS SUSPICIOUS?' : 'PROCESS BEHAVIOR SUMMARY'}</span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {isHigh 
              ? 'This process is generating disk behavior significantly above the established machine baseline, exhibiting rapid write bursts and mass file renames.'
              : process.aiExplanation
            }
          </p>
        </div>

        {/* Telemetry Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WRITE ACTIVITY</div>
            <div className="mono" style={{ fontWeight: '600', color: isHigh ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.1rem', fontSize: '0.85rem' }}>{process.write}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FILES MODIFIED</div>
            <div className="mono" style={{ fontWeight: '600', color: isHigh ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.1rem', fontSize: '0.85rem' }}>{process.modified} files</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FILE RENAMES</div>
            <div className="mono" style={{ fontWeight: '600', color: isHigh ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.1rem', fontSize: '0.85rem' }}>{process.renames || 0} renames</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI RISK SCORE</div>
            <div className="mono" style={{ fontWeight: '700', color: isHigh ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.1rem', fontSize: '0.85rem' }}>{process.riskScore} / 100</div>
          </div>
        </div>

        {/* Behavioral Indicators */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Observed Behavioral Signals
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {process.indicators.map((ind, i) => (
              <span key={i} className={`badge ${isHigh ? 'badge-danger' : 'badge-neutral'}`}>
                {ind}
              </span>
            ))}
          </div>
        </div>

        {/* File Operation Counts */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
          <div>Read Ops: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{process.reads}</strong></div>
          <div>Write Ops: <strong className="mono" style={{ color: isHigh ? 'var(--danger)' : 'var(--text-primary)' }}>{process.writes}</strong></div>
          <div>Renames: <strong className="mono" style={{ color: isHigh ? 'var(--danger)' : 'var(--text-primary)' }}>{process.renames}</strong></div>
          <div>Modifications: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{process.modified}</strong></div>
        </div>
      </div>
    </div>
  );
}
