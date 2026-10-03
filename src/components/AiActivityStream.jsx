import React from 'react';
import { Cpu, Terminal } from 'lucide-react';

export default function AiActivityStream({ logs }) {
  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Terminal size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Edge AI Activity Stream</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: '500' }}>Real-Time Inference Log</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '220px', overflowY: 'auto' }}>
        {logs.map((log, idx) => {
          let dotColor = 'var(--text-muted)';
          if (log.type === 'danger') dotColor = 'var(--danger)';
          if (log.type === 'warning') dotColor = 'var(--warning)';
          if (log.type === 'info') dotColor = 'var(--accent)';

          return (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.4rem 0.6rem',
              background: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.775rem'
            }}>
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '75px' }}>
                {log.time}
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              <span style={{ color: log.type === 'danger' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                {log.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
