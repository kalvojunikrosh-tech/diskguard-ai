import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, HelpCircle } from 'lucide-react';

export default function GettingStartedCard({ onOpenTour }) {
  const [completed, setCompleted] = useState([true, true, true, false, false]);

  const steps = [
    { num: 1, title: 'Start Monitoring', desc: 'Select drive volumes (/dev/disk0s1, C:) for telemetry sampling.', status: 'SIMULATED DEMO' },
    { num: 2, title: 'Establish Baseline', desc: 'Allow DiskGuard AI to observe normal file read/write workload patterns.', status: 'SIMULATED DEMO' },
    { num: 3, title: 'Enable Behavioral Detection', desc: 'Activate local Edge AI model to evaluate statistical deviations.', status: 'AVAILABLE' },
    { num: 4, title: 'Review Alerts', desc: 'Inspect correlated incidents when write velocity or entropy breaches occur.', status: 'AVAILABLE' },
    { num: 5, title: 'Take Action', desc: 'Use process containment controls when suspicious behavior is confirmed.', status: 'DEMO MODE' }
  ];

  const toggleStep = (index) => {
    setCompleted(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <HelpCircle size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Getting Started with DiskGuard AI</span>
          <span className="badge badge-neutral">ONBOARDING GUIDE</span>
        </div>
        <button onClick={onOpenTour} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.725rem' }}>
          Take Quick Tour →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.65rem' }}>
        {steps.map((st, i) => {
          const isDone = completed[i];
          return (
            <div
              key={st.num}
              onClick={() => toggleStep(i)}
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 0.65rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: '500' }}>Step <span className="mono">0{st.num}</span></span>
                {isDone ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> : <Circle size={14} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {st.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: '1.3' }}>
                {st.desc}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{st.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
