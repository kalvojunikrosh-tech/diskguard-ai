import React, { useState } from 'react';
import { Terminal, ChevronRight, Filter } from 'lucide-react';

export default function ProcessRiskTable({ scenario, onSelectProcess, unifiedState }) {
  const [filter, setFilter] = useState('all');

  // Requirement 6 & 7: Leave "No Active Processes Monitored" as empty state without fake process entries
  const processes = unifiedState?.processes || [];

  const filtered = filter === 'high' 
    ? processes.filter(p => p.risk === 'High') 
    : filter === 'elevated' 
    ? processes.filter(p => p.risk === 'Elevated' || p.risk === 'High') 
    : processes;

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Terminal size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Process Risk Telemetry</span>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button 
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({processes.length})
          </button>
          <button 
            className={`filter-chip ${filter === 'high' ? 'active' : ''}`}
            onClick={() => setFilter('high')}
          >
            High Risk
          </button>
          <button 
            className={`filter-chip ${filter === 'elevated' ? 'active' : ''}`}
            onClick={() => setFilter('elevated')}
          >
            Elevated
          </button>
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="empty-state">
          <Terminal size={24} style={{ color: 'var(--text-muted)' }} />
          <div className="empty-state-title">No Active Processes Monitored</div>
          <div className="empty-state-desc">
            Waiting for process disk I/O telemetry. Connect a storage device or select a simulation scenario above to inspect process execution risk.
          </div>
        </div>
      ) : (
        <div className="dg-table-container">
          <table className="dg-table">
            <thead>
              <tr>
                <th>Process</th>
                <th>PID</th>
                <th>Read</th>
                <th>Write</th>
                <th>Modified</th>
                <th>Behavior</th>
                <th>Risk</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isHigh = p.risk === 'High';
                const isElevated = p.risk === 'Elevated';
                return (
                  <tr key={p.pid} className="clickable" onClick={() => onSelectProcess(p)}>
                    <td style={{ fontWeight: '600', color: isHigh ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {p.name}
                    </td>
                    <td className="mono">{p.pid}</td>
                    <td className="mono">{p.read}</td>
                    <td className="mono" style={{ color: isHigh ? 'var(--danger)' : 'var(--text-secondary)' }}>{p.write}</td>
                    <td className="mono">{p.modified}</td>
                    <td style={{ fontSize: '0.75rem' }}>{p.behavior}</td>
                    <td>
                      {isHigh ? (
                        <span className="badge badge-danger">High ({p.riskScore})</span>
                      ) : isElevated ? (
                        <span className="badge badge-warning">Elevated</span>
                      ) : (
                        <span className="badge badge-neutral">Low</span>
                      )}
                    </td>
                    <td>
                      <span className="status-indicator">
                        <span className={`status-dot ${isHigh ? 'danger' : isElevated ? 'warning' : 'success'}`}></span>
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
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
