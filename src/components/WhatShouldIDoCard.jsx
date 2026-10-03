import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, HelpCircle, HardDrive } from 'lucide-react';

export default function WhatShouldIDoCard({ unifiedState, scenario, onNavigate, onStartMonitoring }) {
  const code = unifiedState?.code || 'NO_DRIVE';
  const driveLabel = unifiedState?.driveLabel || 'Selected Drive';

  let cardVariant = 'neutral';
  let badgeLabel = 'NO DRIVE SELECTED';
  let title = 'No storage device has been selected.';
  let desc = 'Select a storage device for DiskGuard to monitor.';
  let actionLabel = 'Add Drive';
  let targetTab = 'drives';
  let isStartMonitoring = false;

  if (code === 'DRIVE_SELECTED') {
    cardVariant = 'warning';
    badgeLabel = 'DRIVE SELECTED';
    title = `${driveLabel} is ready to be monitored.`;
    desc = 'DiskGuard will begin observing simulated activity after monitoring is started.';
    actionLabel = 'Start Monitoring';
    isStartMonitoring = true;
  } else if (code === 'PREPARING' || code === 'LEARNING_BASELINE') {
    cardVariant = 'info';
    badgeLabel = 'BASELINE LEARNING';
    title = `Establishing behavioral baseline for ${driveLabel}...`;
    desc = 'DiskGuard is observing normal activity to establish a behavioral baseline.';
    actionLabel = 'Setup in Progress';
  } else if (code === 'EDGE_AI_READY' || code === 'MONITORING_ACTIVE_NORMAL') {
    cardVariant = 'success';
    badgeLabel = 'MONITORING ACTIVE';
    title = `${driveLabel} is currently being monitored.`;
    desc = 'Drive behavior matches learned baseline. Zero ransomware-like patterns or deviations observed.';
    actionLabel = 'View Activity';
    targetTab = 'activity';
  } else if (code === 'MONITORING_ACTIVE_ELEVATED') {
    cardVariant = 'warning';
    badgeLabel = 'ATTENTION REQUIRED';
    title = `Unusual behavior has been detected on ${driveLabel}.`;
    desc = 'Multiple behavioral signals exceed normal baseline thresholds.';
    actionLabel = 'Investigate';
    targetTab = 'incidents';
  } else if (code === 'MONITORING_ACTIVE_HIGH_RISK' || code === 'INCIDENT_INVESTIGATION') {
    cardVariant = 'danger';
    badgeLabel = 'HIGH RISK THREAT';
    title = `DiskGuard detected a high-risk behavioral pattern on ${driveLabel}.`;
    desc = 'Rapid write velocity, mass modifications, and Shannon entropy spikes correlated.';
    actionLabel = 'Investigate Incident';
    targetTab = 'incidents';
  }

  const handleButtonClick = () => {
    if (isStartMonitoring && onStartMonitoring) {
      onStartMonitoring();
    } else if (onNavigate) {
      onNavigate(targetTab);
    }
  };

  return (
    <div className="dg-card" style={{
      border: `1px solid ${cardVariant === 'danger' ? 'var(--danger-border)' : cardVariant === 'warning' ? 'var(--warning-border)' : cardVariant === 'success' ? 'var(--success-border)' : 'var(--border)'}`,
      background: cardVariant === 'danger' ? 'var(--danger-bg)' : cardVariant === 'warning' ? '#FEFCE8' : '#FFFFFF'
    }}>
      <div className="card-header" style={{ marginBottom: '0.5rem' }}>
        <div className="card-title-group">
          {cardVariant === 'danger' ? (
            <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
          ) : cardVariant === 'warning' ? (
            <HelpCircle size={15} style={{ color: 'var(--warning)' }} />
          ) : (
            <ShieldCheck size={15} style={{ color: cardVariant === 'success' ? 'var(--success)' : 'var(--text-muted)' }} />
          )}
          <span className="card-title" style={{ fontSize: '0.8rem', color: cardVariant === 'danger' ? 'var(--danger)' : cardVariant === 'warning' ? 'var(--warning)' : 'var(--text-primary)' }}>
            RECOMMENDED RESPONSE ACTION
          </span>
        </div>
        <span className={`badge badge-${cardVariant === 'warning' ? 'warning' : cardVariant === 'danger' ? 'danger' : cardVariant === 'success' ? 'success' : 'neutral'}`}>
          {badgeLabel}
        </span>
      </div>

      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        {title}
      </div>

      <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
        {desc}
      </p>

      {/* State Context Metrics Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontSize: '0.725rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Target Drive: </span>
          <strong className="mono" style={{ color: 'var(--text-primary)' }}>{driveLabel}</strong>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontSize: '0.725rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Observed Devices: </span>
          <strong className="mono" style={{ color: 'var(--text-primary)' }}>{unifiedState?.monitoredDrivesCount || 0}</strong>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontSize: '0.725rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Telemetry: </span>
          <strong className="mono" style={{ color: unifiedState?.telemetry?.isLive ? 'var(--success)' : 'var(--text-muted)' }}>
            {unifiedState?.telemetry?.status || 'Not started'}
          </strong>
        </div>
      </div>

      <div>
        <button
          onClick={handleButtonClick}
          className={cardVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
          style={{ fontSize: '0.75rem', padding: '0.45rem 0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <span>{actionLabel}</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}


