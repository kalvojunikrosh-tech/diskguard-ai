import React from 'react';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';

export default function PrivacyView() {
  return (
    <div className="grid-2">
      {/* Analyzed Locally */}
      <div className="dg-card">
        <div className="card-header">
          <div className="card-title-group">
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            <span className="card-title">Analyzed Locally (On Device)</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: '700' }}>✓</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Disk I/O Vectors:</strong> Read/Write throughput, operation counts, IOPS velocity.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: '700' }}>✓</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>File Activity Metadata:</strong> Timestamps, operation types (rename, delete, modify).
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: '700' }}>✓</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Entropy Statistical Shifts:</strong> Shannon entropy measurements of block buffers.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: '700' }}>✓</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Process IDs & Paths:</strong> System process execution telemetry.
            </div>
          </div>
        </div>
      </div>

      {/* Never Uploaded */}
      <div className="dg-card">
        <div className="card-header">
          <div className="card-title-group">
            <XCircle size={16} style={{ color: 'var(--danger)' }} />
            <span className="card-title">NEVER Uploaded to Cloud</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--danger)', fontWeight: '700' }}>✕</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>File Contents & Raw Text:</strong> DiskGuard AI never reads or inspects raw document text.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--danger)', fontWeight: '700' }}>✕</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Personal Documents & Photos:</strong> Zero access to user media or private folders.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--danger)', fontWeight: '700' }}>✕</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Cloud Telemetry Logs:</strong> Ransomware detection functions completely offline.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
