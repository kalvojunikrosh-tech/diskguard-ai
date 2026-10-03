import React from 'react';
import { Clock, Filter } from 'lucide-react';

export default function ActivityTimeline({ scenario }) {
  const isNone = scenario === 'none';
  const isAttack = scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy';

  const rawLogs = isNone ? [] : isAttack ? [
    { time: '10:42:20', op: 'AI ANALYSIS', path: 'Threat pattern correlated (INC-00124)', pid: '4821', proc: 'unknown_payload.exe', size: '--', entropy: '5.4 Shannon', type: 'danger' },
    { time: '10:42:19', op: 'RENAME', path: '/Users/nikrosh/Documents/report.pdf → report.pdf.enc', pid: '4821', proc: 'unknown_payload.exe', size: '42 KB', entropy: '5.4 Shannon', type: 'danger' },
    { time: '10:42:19', op: 'RENAME', path: '/Users/nikrosh/Documents/financials.xlsx → financials.xlsx.enc', pid: '4821', proc: 'unknown_payload.exe', size: '128 KB', entropy: '5.2 Shannon', type: 'danger' },
    { time: '10:42:18', op: 'MODIFY', path: '/Users/nikrosh/Documents/report.pdf', pid: '4821', proc: 'unknown_payload.exe', size: '42 KB', entropy: '5.4 Shannon', type: 'warning' },
    { time: '10:42:18', op: 'WRITE', path: '/Users/nikrosh/Documents/report.pdf', pid: '4821', proc: 'unknown_payload.exe', size: '42 KB', entropy: '4.8 Shannon', type: 'warning' },
    { time: '10:42:16', op: 'WRITE', path: '/Users/nikrosh/Library/Caches/cache.bin', pid: '1042', proc: 'chrome.exe', size: '18 KB', entropy: '1.2 Shannon', type: 'normal' },
    { time: '10:42:14', op: 'READ', path: '/Users/nikrosh/Projects/app/src/index.css', pid: '2840', proc: 'Code.exe', size: '14 KB', entropy: '1.3 Shannon', type: 'normal' },
    { time: '10:41:12', op: 'AI INFERENCE', path: 'Baseline vector evaluation completed', pid: 'kernel', proc: 'diskguard_hook', size: '--', entropy: '1.1 Shannon', type: 'normal' }
  ] : [
    { time: '10:42:16', op: 'WRITE', path: '/Users/nikrosh/Library/Caches/cache.bin', pid: '1042', proc: 'chrome.exe', size: '18 KB', entropy: '1.2 Shannon', type: 'normal' },
    { time: '10:42:14', op: 'READ', path: '/Users/nikrosh/Projects/app/src/index.css', pid: '2840', proc: 'Code.exe', size: '14 KB', entropy: '1.3 Shannon', type: 'normal' },
    { time: '10:41:12', op: 'AI INFERENCE', path: 'Baseline vector evaluation completed', pid: 'kernel', proc: 'diskguard_hook', size: '--', entropy: '1.1 Shannon', type: 'normal' },
    { time: '10:15:00', op: 'INIT', path: 'Behavioral Model v0.1 loaded on local NPU', pid: 'kernel', proc: 'diskguard_hook', size: '--', entropy: '--', type: 'normal' }
  ];

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Clock size={15} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Filesystem Event Stream & Telemetry Log</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            {isNone ? 'Live Sampling Filter: Standby' : 'Live Sampling Filter: Enabled'}
          </span>
        </div>
      </div>

      {rawLogs.length === 0 ? (
        <div className="empty-state">
          <Clock size={24} style={{ color: 'var(--text-muted)' }} />
          <div className="empty-state-title">No Filesystem Events</div>
          <div className="empty-state-desc">
            Waiting for storage telemetry stream. Connect a drive or select a simulation scenario to view real-time I/O activity logs.
          </div>
        </div>
      ) : (
        <div className="dg-table-container">
          <table className="dg-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operation</th>
                <th>Target Path / Detail</th>
                <th>PID / Process</th>
                <th>Payload</th>
                <th>Entropy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rawLogs.map((log, i) => {
                const isDanger = log.type === 'danger';
                const isWarning = log.type === 'warning';
                return (
                  <tr key={i}>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{log.time}</td>
                    <td>
                      <span className={`badge ${isDanger ? 'badge-danger' : isWarning ? 'badge-warning' : 'badge-neutral'}`}>
                        {log.op}
                      </span>
                    </td>
                    <td className="mono" style={{ color: isDanger ? 'var(--danger)' : 'var(--text-primary)', fontWeight: isDanger ? '600' : '400', fontSize: '0.75rem' }}>
                      {log.path}
                    </td>
                    <td className="mono">
                      {log.proc} <span style={{ color: 'var(--text-muted)' }}>({log.pid})</span>
                    </td>
                    <td className="mono">{log.size}</td>
                    <td className="mono" style={{ color: isDanger ? 'var(--danger)' : 'var(--text-secondary)' }}>{log.entropy}</td>
                    <td>
                      <span className="status-indicator">
                        <span className={`status-dot ${isDanger ? 'danger' : isWarning ? 'warning' : 'success'}`}></span>
                        <span style={{ fontSize: '0.725rem' }}>{isDanger ? 'Threat' : isWarning ? 'Elevated' : 'Nominal'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

