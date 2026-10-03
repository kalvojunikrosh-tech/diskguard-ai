import React, { useState } from 'react';
import { Activity, Compass, Cpu, ShieldAlert, Lock, ArrowRight, Info, X } from 'lucide-react';

export default function HowItWorksFlow() {
  const [selectedStage, setSelectedStage] = useState(null);

  const stages = [
    {
      id: 'activity',
      num: '01',
      title: 'Disk Activity',
      desc: 'Observes file reads, writes, modifications & renames.',
      icon: Activity,
      details: {
        heading: 'Stage 1: Real-Time Disk Activity Telemetry',
        summary: 'DiskGuard AI continuously observes low-level file system operation vectors using local kernel telemetry hooks.',
        points: [
          'Monitors read velocity, write throughput, and IOPS.',
          'Tracks file creation, deletion, rename, and modification events.',
          'Measures burstiness and I/O density patterns across all attached drives.',
          'Operates completely locally on the device with zero cloud upload.'
        ]
      }
    },
    {
      id: 'baseline',
      num: '02',
      title: 'Behavior Analysis',
      desc: 'Compares real-time operations with machine baseline.',
      icon: Compass,
      details: {
        heading: 'Stage 2: Behavioral Baseline Comparison',
        summary: 'Observed disk operations are continuously compared against the learned normal activity baseline of your machine.',
        points: [
          'Establishes normal write rates, rename frequencies, and buffer entropy levels.',
          'Calculates statistical deviation percentages (+61%, +1399%).',
          'Flags non-standard process access to sensitive user document folders.',
          'Ignores known signature databases to focus on actual behavior.'
        ]
      }
    },
    {
      id: 'ai',
      num: '03',
      title: 'Edge AI Inference',
      desc: 'Simulated Edge AI evaluates the current behavioral signals.',
      icon: Cpu,
      details: {
        heading: 'Stage 3: Simulated Edge AI Model',
        summary: 'Simulated Edge AI processes 6 behavioral signals directly based on behavioral patterns.',
        points: [
          'Evaluates write velocity, rename velocity, modification density, and Shannon entropy.',
          'Calculates model confidence score (e.g. 91% confidence).',
          'Performs simulated on-device analysis without cloud connectivity.',
          'Protects user privacy by analyzing metadata vectors rather than document text.'
        ]
      }
    },
    {
      id: 'risk',
      num: '04',
      title: 'Risk Assessment',
      desc: 'Combines signals to compute Risk and Anomaly scores.',
      icon: ShieldAlert,
      details: {
        heading: 'Stage 4: Risk & Anomaly Score Computation',
        summary: 'DiskGuard AI correlates multiple behavioral signals to compute separate Anomaly and Risk scores.',
        points: [
          'Anomaly Score (0–100): How different activity is from the baseline.',
          'Risk Score (0–100): Overall threat probability from a security perspective.',
          'Differentiates routine backup tasks from suspicious ransomware behavior.',
          'Generates itemized explainable AI evidence breakdown.'
        ]
      }
    },
    {
      id: 'protection',
      num: '05',
      title: 'Alert & Protection',
      desc: 'Groups events into incidents and enables containment.',
      icon: Lock,
      details: {
        heading: 'Stage 5: Incident Correlation & Protection',
        summary: 'Correlates hundreds of raw disk events into a single incident and supports defensive containment actions.',
        points: [
          'Groups raw file writes and renames into correlated incidents (e.g. INC-00124).',
          'Provides clear "What Should I Do?" action recommendations.',
          'Supports process containment and false-positive user feedback loops.',
          'Enforces clear AVAILABLE / DEMO / COMING SOON operational status tags.'
        ]
      }
    }
  ];

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Info size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">How DiskGuard AI Works</span>
          <span className="badge badge-neutral">INTERACTIVE FLOW — CLICK ANY STAGE</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
        {stages.map((stg, idx) => {
          const IconComp = stg.icon;
          return (
            <div
              key={stg.id}
              onClick={() => setSelectedStage(stg)}
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 0.65rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '700' }}>
                  {stg.num}
                </span>
                <IconComp size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stg.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: '1.3' }}>
                {stg.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal when a Stage is Clicked */}
      {selectedStage && (
        <div className="modal-overlay" onClick={() => setSelectedStage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div>
                <span className="badge badge-ai">STAGE {selectedStage.num}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {selectedStage.details.heading}
                </h3>
              </div>
              <button onClick={() => setSelectedStage(null)} className="btn-secondary" style={{ padding: '0.3rem' }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              {selectedStage.details.summary}
            </p>

            <div style={{ background: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                KEY CAPABILITIES AT THIS STAGE
              </div>
              <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                {selectedStage.details.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setSelectedStage(null)} className="btn-primary" style={{ fontSize: '0.775rem' }}>
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
