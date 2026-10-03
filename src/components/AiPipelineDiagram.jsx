import React, { useState } from 'react';
import { Activity, Layers, Cpu, Compass, ShieldAlert, AlertTriangle, ArrowRight, X } from 'lucide-react';

export default function AiPipelineDiagram() {
  const [selectedStage, setSelectedStage] = useState(null);

  const stages = [
    {
      id: 'disk',
      num: '01',
      title: 'Disk Activity',
      icon: Activity,
      desc: 'Raw file reads, writes & renames.',
      detail: 'Local kernel filter drivers capture real-time file I/O operations across disk volumes.'
    },
    {
      id: 'features',
      num: '02',
      title: 'Feature Extraction',
      icon: Layers,
      desc: 'Converts ops into 6 feature vectors.',
      detail: 'Translates raw IOPS into structured signals: write velocity, rename rate, Shannon entropy, and path irregularity.'
    },
    {
      id: 'model',
      num: '03',
      title: 'Edge AI Model',
      icon: Cpu,
      desc: '18 ms local behavioral classification.',
      detail: 'On-device machine learning model evaluates feature vectors against learned normal operation boundaries.'
    },
    {
      id: 'anomaly',
      num: '04',
      title: 'Anomaly Score',
      icon: Compass,
      desc: 'Measures deviation from baseline.',
      detail: 'Computes statistical distance (0–100) between current workload and machine baseline.'
    },
    {
      id: 'risk',
      num: '05',
      title: 'Risk Assessment',
      icon: ShieldAlert,
      desc: 'Evaluates security threat likelihood.',
      detail: 'Correlates behavioral anomalies into security risk classification (Low, Elevated, High, Critical).'
    },
    {
      id: 'incident',
      num: '06',
      title: 'Security Incident',
      icon: AlertTriangle,
      desc: 'Groups hundreds of events into alert.',
      detail: 'Consolidates related file operations into a single incident for rapid investigation and containment.'
    }
  ];

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Layers size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Edge AI Detection Pipeline</span>
          <span className="badge badge-neutral">CLICK ANY STAGE TO INSPECT</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {stages.map((st, i) => {
          const IconComp = st.icon;
          return (
            <React.Fragment key={st.id}>
              <div
                onClick={() => setSelectedStage(st)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--accent)', fontWeight: '700' }}>{st.num}</span>
                  <IconComp size={13} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-primary)' }}>{st.title}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: '1.2' }}>{st.desc}</div>
              </div>
              {i < stages.length - 1 && <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage Detail Popover Modal */}
      {selectedStage && (
        <div className="modal-overlay" onClick={() => setSelectedStage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="badge badge-ai">PIPELINE STAGE {selectedStage.num}</span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedStage.title}</h4>
              </div>
              <button onClick={() => setSelectedStage(null)} className="btn-secondary" style={{ padding: '0.25rem' }}>
                <X size={14} />
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>
              {selectedStage.detail}
            </p>
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setSelectedStage(null)} className="btn-primary" style={{ fontSize: '0.75rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
