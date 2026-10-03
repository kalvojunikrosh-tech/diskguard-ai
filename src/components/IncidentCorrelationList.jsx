import React from 'react';
import { AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function IncidentCorrelationList({ scenario, realIncidents = [], onSelectIncident }) {
  const isAttack = scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy';

  const simulatedIncidents = isAttack ? [
    {
      id: 'DG-00124',
      title: 'Suspicious Mass File Modification',
      severity: 'HIGH',
      detectedAt: '09:42:18 AM',
      affectedProcess: 'unknown_payload.exe',
      affectedDrive: '/dev/disk0s1 (System NVMe)',
      riskScore: 87,
      confidence: 91,
      status: 'Investigating',
      affectedFiles: 623,
      eventCounts: { reads: 847, writes: 623, modifications: 591, renames: 410 },
      whySuspicious: [
        'Write activity increased sharply above baseline (+1399%).',
        'A large number of files (591) were modified within a 12-second window.',
        'Mass-renaming behavior (410 files) was observed.',
        'File entropy changed significantly across payload buffers (+4.2 Shannon).'
      ]
    },
    {
      id: 'DG-00119',
      title: 'High Entropy Burst Vector',
      severity: 'ELEVATED',
      detectedAt: '08:15:02 AM',
      affectedProcess: 'backup_agent.exe',
      affectedDrive: '/dev/disk1s2 (Backup SSD)',
      riskScore: 48,
      confidence: 82,
      status: 'Resolved',
      affectedFiles: 140,
      eventCounts: { reads: 1200, writes: 140, modifications: 120, renames: 0 },
      whySuspicious: [
        'Compressed archive file write burst.',
        'Slight Shannon entropy deviation detected during archive compression.'
      ]
    }
  ] : [];

  const formattedReal = (realIncidents || []).map(inc => ({
    id: inc.id,
    title: inc.title || 'Ransomware-Like Behavioral Pattern',
    severity: (inc.severity || 'HIGH').toUpperCase(),
    detectedAt: inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
    affectedProcess: 'macOS Storage Subsystem',
    affectedDrive: inc.device_id,
    riskScore: inc.risk_score,
    confidence: inc.confidence || 90,
    status: inc.status === 'open' ? 'Investigating' : inc.status === 'investigating' ? 'Investigating' : 'Resolved',
    affectedFiles: inc.feature_deviations?.file_modification_rate ? Math.round(inc.feature_deviations.file_modification_rate) : 120,
    eventCounts: {
      reads: Math.round(inc.feature_deviations?.read_frequency || 45),
      writes: Math.round(inc.feature_deviations?.write_frequency || 180),
      modifications: Math.round(inc.feature_deviations?.file_modification_rate || 65),
      renames: Math.round(inc.feature_deviations?.rename_rate || 25)
    },
    whySuspicious: inc.signals && inc.signals.length > 0
      ? inc.signals.map(s => `Suspicious indicator: ${s}`)
      : [inc.explanation?.summary || 'Sustained behavioral deviation from machine baseline.'],
    rawIncident: inc
  }));

  const incidents = formattedReal.length > 0 ? formattedReal : simulatedIncidents;

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <AlertTriangle size={16} style={{ color: isAttack ? 'var(--danger)' : 'var(--accent)' }} />
          <span className="card-title">Correlated Security Incidents</span>
        </div>
        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: '500' }}>
          Grouping Hundreds of Raw Disk Events
        </span>
      </div>

      {incidents.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
          <div className="empty-state-title">No Active Incidents</div>
          <div className="empty-state-desc">
            All disk operations match the learned behavioral baseline. Zero ransomware-like patterns or anomalous write patterns observed.
          </div>
        </div>
      ) : (
        <div className="dg-table-container">
          <table className="dg-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Title</th>
                <th>Detected</th>
                <th>Process</th>
                <th>Files Affected</th>
                <th>Confidence</th>
                <th>Risk</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => {
                const isHigh = inc.severity === 'HIGH';
                return (
                  <tr key={inc.id} className="clickable" onClick={() => onSelectIncident(inc)}>
                    <td className="mono" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{inc.id}</td>
                    <td style={{ fontWeight: '600', color: isHigh ? 'var(--danger)' : 'var(--text-primary)' }}>{inc.title}</td>
                    <td className="mono">{inc.detectedAt}</td>
                    <td className="mono">{inc.affectedProcess}</td>
                    <td className="mono">{inc.affectedFiles}</td>
                    <td className="mono">{inc.confidence}%</td>
                    <td>
                      {isHigh ? (
                        <span className="badge badge-danger">High ({inc.riskScore})</span>
                      ) : (
                        <span className="badge badge-neutral">Low ({inc.riskScore})</span>
                      )}
                    </td>
                    <td>
                      <span className="status-indicator">
                        <span className={`status-dot ${isHigh ? 'danger' : 'success'}`}></span>
                        <span>{inc.status}</span>
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
