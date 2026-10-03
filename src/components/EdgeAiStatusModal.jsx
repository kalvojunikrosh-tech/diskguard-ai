import React from 'react';
import { X, Cpu, ShieldCheck, Zap, Layers, Activity } from 'lucide-react';

export default function EdgeAiStatusModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '520px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <Cpu size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>Edge AI Intelligence Core</h3>
                <span className="badge badge-ai">LOCAL MODEL</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-device behavioral classification engine</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Specifications Table */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', margin: '1rem 0' }}>
          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>MODEL VERSION</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{data.modelVersion}</div>
          </div>

          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>INFERENCE LOCATION</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--success)', marginTop: '0.15rem' }}>{data.inferenceLocation}</div>
          </div>

          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>INFERENCE LATENCY</div>
            <div className="mono" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{data.latencyMs} ms</div>
          </div>

          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>SIGNALS ANALYZED</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{data.signalsEvaluated} Behavioral Features</div>
          </div>
        </div>

        {/* Operational Intent Banner */}
        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Zap size={14} style={{ color: 'var(--accent)' }} /> Architected for Local On-Device Protection
          </div>
          DiskGuard AI is architected to evaluate low-level file I/O operations locally on your machine. Behavioral classification operates without cloud transmission, protecting file contents.
        </div>

        {/* Simulation Indicator */}
        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <span>Telemetry Source: <strong style={{ color: 'var(--accent)' }}>SIMULATED DEMO DATA</strong></span>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: '0.75rem' }}>
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
}
