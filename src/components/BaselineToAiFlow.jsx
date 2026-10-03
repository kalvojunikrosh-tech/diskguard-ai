import React from 'react';
import { ArrowRight, Cpu, Activity, HardDrive } from 'lucide-react';

export default function BaselineToAiFlow({ data, scenario, activeDrive, unifiedState }) {
  const driveLabel = unifiedState?.driveLabel || (activeDrive ? `${activeDrive.device} ${activeDrive.name}` : 'SELECTED DRIVE');
  
  const pipeline = unifiedState?.pipeline || {
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

  return (
    <div className="dg-card" style={{ padding: '0.9rem 1.1rem' }}>
      <div className="card-header" style={{ marginBottom: '0.65rem' }}>
        <div className="card-title-group">
          <Activity size={15} style={{ color: 'var(--accent)' }} />
          <span className="card-title" style={{ fontSize: '0.825rem' }}>
            Drive Telemetry → Behavioral Analysis Pipeline
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className="badge badge-accent" style={{ fontSize: '0.675rem', fontWeight: '700' }}>
            {pipeline.targetDrive}
          </span>
          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: '500' }}>I/O Pipeline</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.35rem',
        background: 'var(--bg-app)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.65rem 0.85rem'
      }}>
        {/* Step 1: Selected Drive */}
        <div style={{ textAlign: 'center', flex: 1.1 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Drive</div>
          <div style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <HardDrive size={13} style={{ color: 'var(--accent)' }} />
            <span>{pipeline.targetDrive}</span>
          </div>
        </div>

        <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        {/* Step 2: Disk Activity */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Disk Activity</div>
          <div className="mono" style={{ fontSize: '0.8rem', fontWeight: '700', color: pipeline.diskActivityColor, marginTop: '0.1rem' }}>
            {pipeline.diskActivity}
          </div>
        </div>

        <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        {/* Step 3: Behavioral Features */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Behavioral Vector</div>
          <div className="mono" style={{ fontSize: '0.8rem', fontWeight: '700', color: pipeline.behavioralVectorColor, marginTop: '0.1rem' }}>
            {pipeline.behavioralVector}
          </div>
        </div>

        <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        {/* Step 4: Edge AI */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Edge AI Model</div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: pipeline.edgeAiModelColor, marginTop: '0.1rem' }}>
            {pipeline.edgeAiModel}
          </div>
        </div>

        <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        {/* Step 5: Risk Correlation */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Risk Level</div>
          <div style={{ fontSize: '0.775rem', fontWeight: '800', color: pipeline.riskLevelColor, marginTop: '0.1rem' }}>
            {pipeline.riskLevel}
          </div>
        </div>
      </div>
    </div>
  );
}


