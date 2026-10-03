import React, { useState } from 'react';
import { X, ShieldAlert, Lock, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';

export default function IncidentDetailDrawer({ incident, onClose, onAcknowledge, onResolve }) {
  const [status, setStatus] = useState(incident?.status || 'Investigating');
  const [feedback, setFeedback] = useState(null);

  if (!incident) return null;

  const isHigh = incident.riskScore > 70;

  const handleContainOrAck = async () => {
    setStatus('Acknowledged');
    if (onAcknowledge && incident.id) {
      await onAcknowledge(incident.id);
    }
  };

  const handleResolve = async () => {
    setStatus('Resolved');
    if (onResolve && incident.id) {
      await onResolve(incident.id);
    }
  };

  const storySteps = [
    { title: 'NORMAL', desc: 'Baseline Workload' },
    { title: 'BEHAVIOR CHANGED', desc: '+1399% Write Velocity' },
    { title: 'DEVIATION ESCALATED', desc: '591 Files Modified' },
    { title: 'PATTERN FLAGGED', desc: '410 File Renames' },
    { title: 'INCIDENT CREATED', desc: `${incident.id} Active` }
  ];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: '500' }}>Incident <span className="mono">#{incident.id}</span></span>
              {isHigh ? <span className="badge badge-danger">High Risk</span> : <span className="badge badge-neutral">Low Risk</span>}
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {incident.title}
            </h2>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Status & Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>STATUS</div>
            <div style={{ fontWeight: '600', color: 'var(--warning)', marginTop: '0.1rem', fontSize: '0.85rem' }}>{status}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>RISK SCORE</div>
            <div className="mono" style={{ fontWeight: '700', color: isHigh ? 'var(--danger)' : 'var(--text-primary)', fontSize: '0.95rem' }}>
              {incident.riskScore} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>AI CONFIDENCE</div>
            <div className="mono" style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '0.95rem' }}>{incident.confidence}%</div>
          </div>
        </div>

        {/* Security Story Progression Timeline */}
        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            SECURITY STORY — Threat Escalation Sequence
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.2rem' }}>
            {storySteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: idx === storySteps.length - 1 ? 'var(--danger)' : idx > 0 ? 'var(--warning)' : 'var(--success)',
                    margin: '0 auto 0.25rem auto'
                  }} />
                  <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>{step.title}</div>
                  <div style={{ fontSize: '0.575rem', color: 'var(--text-muted)' }}>{step.desc}</div>
                </div>
                {idx < storySteps.length - 1 && <ArrowRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Affected Context */}
        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div><strong>Detection Time:</strong> <span className="mono">{incident.detectedAt}</span></div>
          <div><strong>Affected Process:</strong> <span className="mono" style={{ color: isHigh ? 'var(--danger)' : 'var(--text-primary)' }}>{incident.affectedProcess}</span></div>
          <div><strong>Affected Drive:</strong> <span className="mono">{incident.affectedDrive}</span></div>
        </div>

        {/* Explainable AI Evidence */}
        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={14} style={{ color: 'var(--warning)' }} />
            <span>Why this is suspicious (Explainable AI)</span>
          </div>

          <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {incident.whySuspicious.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>

        {/* Correlated Event Counts */}
        <div>
          <div style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Correlated Event Counts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.75rem' }}>
            <div style={{ background: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              Reads: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{incident.eventCounts.reads}</strong>
            </div>
            <div style={{ background: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              Writes: <strong className="mono" style={{ color: 'var(--danger)' }}>{incident.eventCounts.writes}</strong>
            </div>
            <div style={{ background: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              Modifications: <strong className="mono" style={{ color: 'var(--warning)' }}>{incident.eventCounts.modifications}</strong>
            </div>
            <div style={{ background: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              Renames: <strong className="mono" style={{ color: 'var(--danger)' }}>{incident.eventCounts.renames}</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleContainOrAck}
              className="btn-danger"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Lock size={14} /> Acknowledge Threat
            </button>
            <button
              onClick={handleResolve}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Mark Resolved
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFeedback('Looks Safe')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', justifyContent: 'center' }}
            >
              <ThumbsUp size={12} /> Looks Safe
            </button>
            <button
              onClick={() => setFeedback('Confirm Threat')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', justifyContent: 'center' }}
            >
              <ThumbsDown size={12} /> Confirm Threat
            </button>
          </div>
          {feedback && (
            <div style={{ fontSize: '0.7rem', color: 'var(--success)', textAlign: 'center' }}>
              Feedback saved: <strong>{feedback}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
