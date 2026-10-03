import React from 'react';
import { Activity, ShieldAlert, Info } from 'lucide-react';

export default function AnomalyScoreCard({ unifiedState, anomalyScore, riskScore, scenario }) {
  const isMonitored = unifiedState ? unifiedState.isMonitored : (scenario !== 'none');
  const setupStage = unifiedState?.setupStage || (isMonitored ? 'active' : 'selected');
  const isScoresActive = isMonitored && setupStage === 'active' && unifiedState?.ai?.riskScore !== null;
  
  const displayRisk = isScoresActive ? (unifiedState?.ai?.riskScore ?? riskScore ?? 18) : null;
  const displayAnomaly = isScoresActive ? (unifiedState?.ai?.anomalyScore ?? anomalyScore ?? 12) : null;
  const isAttack = isScoresActive && (displayRisk > 50 || scenario === 'ransomware');

  const getRiskBadge = (score) => {
    if (!isScoresActive || score === null) return <span className="badge badge-neutral">NOT YET SCORED</span>;
    if (score > 70) return <span className="badge badge-danger">HIGH RISK</span>;
    if (score > 40) return <span className="badge badge-warning">ELEVATED</span>;
    return <span className="badge badge-success">LOW RISK</span>;
  };

  const getAnomalyBadge = (score) => {
    if (!isScoresActive || score === null) return <span className="badge badge-neutral">WAITING</span>;
    if (score > 70) return <span className="badge badge-warning">HIGH DEVIATION</span>;
    if (score > 40) return <span className="badge badge-ai">MODERATE SHIFT</span>;
    return <span className="badge badge-neutral">NORMAL BASELINE</span>;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
      {/* Risk Score Card */}
      <div className="dg-card">
        <div className="card-header">
          <div className="card-title-group">
            <ShieldAlert size={16} style={{ color: isAttack ? 'var(--danger)' : !isScoresActive ? 'var(--text-muted)' : 'var(--success)' }} />
            <span className="card-title">Risk Score</span>
            <div className="tooltip-container">
              <Info size={13} style={{ color: 'var(--text-muted)' }} />
              <div className="tooltip-text">
                Overall security threat probability derived from correlated behavioral telemetry.
              </div>
            </div>
          </div>
          {getRiskBadge(displayRisk)}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
          {displayRisk !== null ? (
            <>
              <span className="mono" style={{ fontSize: '1.8rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>
                {displayRisk}
              </span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100</span>
            </>
          ) : (
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              Not yet scored
            </span>
          )}
        </div>

        <div className="progress-bar-bg" style={{ marginTop: '0.65rem', marginBottom: '0.65rem' }}>
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${displayRisk !== null ? displayRisk : 0}%`, 
              background: displayRisk > 70 ? 'var(--danger)' : displayRisk > 40 ? 'var(--warning)' : 'var(--success)' 
            }} 
          />
        </div>

        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          {!isScoresActive ? 'Score available once drive monitoring and baseline are active.' : 'Risk = Security threat severity based on threat likelihood.'}
        </p>
      </div>

      {/* Anomaly Score Card */}
      <div className="dg-card">
        <div className="card-header">
          <div className="card-title-group">
            <Activity size={16} style={{ color: 'var(--accent)' }} />
            <span className="card-title">Anomaly Score</span>
            <div className="tooltip-container">
              <Info size={13} style={{ color: 'var(--text-muted)' }} />
              <div className="tooltip-text">
                Statistical distance between current disk activity and machine baseline.
              </div>
            </div>
          </div>
          {getAnomalyBadge(displayAnomaly)}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
          {displayAnomaly !== null ? (
            <>
              <span className="mono" style={{ fontSize: '1.8rem', fontWeight: '800', color: isAttack ? 'var(--warning)' : 'var(--text-primary)' }}>
                {displayAnomaly}
              </span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100</span>
            </>
          ) : (
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              Waiting
            </span>
          )}
        </div>

        <div className="progress-bar-bg" style={{ marginTop: '0.65rem', marginBottom: '0.65rem' }}>
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${displayAnomaly !== null ? displayAnomaly : 0}%`, 
              background: displayAnomaly > 70 ? 'var(--warning)' : 'var(--accent)' 
            }} 
          />
        </div>

        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          {!isScoresActive ? 'Observation required before computing anomaly deviation.' : 'Anomaly = Mathematical deviation from learned baseline behavior.'}
        </p>
      </div>
    </div>
  );
}


