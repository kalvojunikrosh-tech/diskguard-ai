import React from 'react';
import { AlertTriangle, Square, X, ShieldCheck } from 'lucide-react';

export default function StopMonitoringModal({
  isOpen,
  drive,
  onConfirm,
  onCancel
}) {
  if (!isOpen || !drive) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1020,
      padding: '1rem'
    }}>
      <div className="modal-card" style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: '#FEF2F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: '#FEE2E2',
              color: '#B91C1C',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex'
            }}>
              <AlertTriangle size={20} />
            </div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#991B1B', margin: 0 }}>
              STOP MONITORING?
            </h2>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
            DiskGuard will stop behavioral monitoring for <strong>{drive.name} ({drive.device})</strong>.
          </p>

          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span>No files will be deleted or modified. DiskGuard observation is completely read-only.</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: '#F8FAFC',
          display: 'flex',
          justify: 'flex-end',
          gap: '0.6rem'
        }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm" style={{ padding: '0.45rem 0.85rem' }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(drive.id)}
            className="btn-danger"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Square size={13} /> Stop Monitoring
          </button>
        </div>
      </div>
    </div>
  );
}
