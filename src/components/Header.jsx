import React from 'react';
import { Search, Bell, Play, ShieldAlert, FileEdit, Lock, HelpCircle, Eye } from 'lucide-react';

export default function Header({ 
  activeTab, 
  scenario, 
  onSelectScenario, 
  viewMode,
  onToggleViewMode,
  onOpenSearch, 
  onOpenNotifications, 
  onOpenTour,
  onOpenAddDrive,
  monitoredDrives = [],
  activeDriveId = null,
  onSelectDrive,
  unreadCount,
  unifiedState
}) {
  const titles = {
    overview: { title: 'Overview', desc: 'Real-time disk behavior intelligence & security posture' },
    incidents: { title: 'Incidents', desc: 'Correlated security events and threat containment' },
    activity: { title: 'Disk Activity', desc: 'Real-time throughput streams and IOPS telemetry' },
    processes: { title: 'Processes', desc: 'Process disk risk analysis and execution monitoring' },
    behavior: { title: 'Behavioral Baseline', desc: 'Local learned behavior vs real-time deviations' },
    'ai-model': { title: 'Edge AI Model', desc: 'Local model metrics and feature importance explainability' },
    protection: { title: 'Protection Center', desc: 'Detection sensitivity and real-time defense controls' },
    drives: { title: 'Drives', desc: 'Monitor storage devices and their behavioral activity' },
    timeline: { title: 'Security Timeline', desc: 'Chronological telemetry and incident event log' },
    privacy: { title: 'Edge Privacy', desc: 'On-device telemetry audit matrix' }
  };

  const current = titles[activeTab] || titles.overview;

  const scenarios = [
    { id: 'normal', label: 'Normal Activity', desc: 'Typical everyday computer activity', icon: Play, variant: 'normal' },
    { id: 'ransomware', label: 'Ransomware Pattern', desc: 'Rapid file modification & encryption-like behavior', icon: ShieldAlert, variant: 'attack' },
    { id: 'mass-rename', label: 'Mass Rename', desc: 'Large increase in file rename operations', icon: FileEdit, variant: 'warning' },
    { id: 'high-entropy', label: 'High Entropy', desc: 'Large change in file entropy', icon: Lock, variant: 'warning' }
  ];

  const activeDrive = monitoredDrives.find(d => d.id === activeDriveId) || monitoredDrives[0];

  return (
    <header className="top-header">
      {/* Page Title Group */}
      <div className="header-title-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 className="header-page-title">{current.title}</h1>
          <p className="header-page-desc">{current.desc}</p>
        </div>

        {/* Global Contextual Drive Switcher */}
        {monitoredDrives.length > 0 && activeDrive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--accent-light)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '0.3rem 0.65rem',
            fontSize: '0.75rem'
          }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Monitoring:</span>
            <select
              value={activeDrive.id}
              onChange={(e) => {
                if (e.target.value === '__add__') {
                  if (onOpenAddDrive) onOpenAddDrive();
                } else if (onSelectDrive) {
                  onSelectDrive(e.target.value);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                fontWeight: '700',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.775rem',
                outline: 'none'
              }}
            >
              {monitoredDrives.map((d) => (
                <option key={d.id} value={d.id} style={{ background: '#FFFFFF', color: 'var(--text-primary)' }}>
                  {d.device} {d.name}
                </option>
              ))}
              <option value="__add__" style={{ background: '#FFFFFF', color: 'var(--accent)' }}>
                + Add Drive...
              </option>
            </select>
          </div>
        )}
      </div>

      {/* Center/Right Controls */}
      <div className="header-actions">
        {/* Prominent + Add Drive Action */}
        <button
          onClick={onOpenAddDrive}
          className="btn-primary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          title="Connect a storage device (HDD or SSD) for DiskGuard to monitor"
        >
          <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>+</span>
          <span>Add Drive</span>
        </button>

        {/* View Mode Toggle (Simple vs Technical) */}
        <button
          onClick={onToggleViewMode}
          className="btn-secondary"
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
          title="Toggle between Simple plain-language mode and Technical telemetry mode"
        >
          <Eye size={12} style={{ color: 'var(--accent)' }} />
          <span>View: <strong style={{ color: 'var(--text-primary)' }}>{viewMode === 'simple' ? 'Simple' : 'Technical'}</strong></span>
        </button>

        {/* Quick Tour Button */}
        <button
          onClick={onOpenTour}
          className="btn-secondary"
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
          title="Take a quick tour of DiskGuard AI"
        >
          <HelpCircle size={12} style={{ color: 'var(--accent)' }} />
          <span>Tour</span>
        </button>

        {/* Telemetry Source Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.55rem',
          background: 'var(--bg-app)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.725rem',
          color: 'var(--text-secondary)'
        }} title={unifiedState?.topBarBadge?.label || 'Simulation Status'}>
          <span className={`status-dot ${unifiedState?.topBarBadge?.variant || 'neutral'}`}></span>
          <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            {unifiedState?.topBarBadge?.label || 'NO DRIVE MONITORED'}
          </span>
        </div>


        {/* Simulation Toolbar */}
        <div className="sim-toolbar">
          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', paddingLeft: '0.35rem', paddingRight: '0.15rem', fontWeight: '600', fontFamily: 'var(--font-ui)' }}>
            DEMO SCENARIOS:
          </span>
          {scenarios.map((sc) => {
            const IconComp = sc.icon;
            const isActive = scenario === sc.id;
            let btnClass = 'sim-btn';
            if (isActive) {
              if (sc.variant === 'attack') btnClass += ' active-attack';
              else if (sc.variant === 'warning') btnClass += ' active-warning';
              else btnClass += ' active-normal';
            }
            return (
              <button
                key={sc.id}
                className={btnClass}
                onClick={() => onSelectScenario(isActive ? 'none' : sc.id)}
                title={`${sc.label}: ${sc.desc}`}
              >
                <IconComp size={11} />
                <span>{sc.label}</span>
              </button>
            );
          })}
          {scenario !== 'none' && (
            <button
              className="sim-btn"
              onClick={() => onSelectScenario('none')}
              title="Stop demo simulation and clear telemetry"
              style={{ color: 'var(--danger)', fontWeight: '600' }}
            >
              Stop Demo
            </button>
          )}
        </div>

        {/* Search & Notifications */}
        <button 
          onClick={onOpenSearch} 
          className="btn-secondary" 
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          title="Search processes, incidents, events (Cmd + K)"
        >
          <Search size={14} />
          <kbd className="mono" style={{ fontSize: '0.65rem', background: 'var(--bg-subtle)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>⌘K</kbd>
        </button>

        <button 
          onClick={onOpenNotifications} 
          className="btn-secondary" 
          style={{ position: 'relative', padding: '0.4rem' }}
          title="Notifications"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: 'var(--danger)',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: '800',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
