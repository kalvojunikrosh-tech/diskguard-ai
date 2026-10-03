import React from 'react';
import { HardDrive, Database, Activity, AlertTriangle, ShieldCheck, Play, Square, Info, Plus, ChevronRight } from 'lucide-react';
import { SIMULATED_DRIVES } from '../data/edgeAiSimulation';

export default function DriveHealthView({
  discoveredDevices = [],
  selectedDeviceId = null,
  monitoredDriveIds = [],
  onSelectDevice,
  onStartMonitoringModal,
  onStopMonitoringModal,
  onViewDetails,
  onOpenAddDrive,
  scenario = 'none'
}) {
  const devicesToRender = (discoveredDevices && discoveredDevices.length > 0)
    ? discoveredDevices
    : SIMULATED_DRIVES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Drives Page Banner / Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex'
          }}>
            <HardDrive size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              DRIVES
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Monitor storage devices and their behavioral activity.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddDrive}
          className="btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>Add Drive</span>
        </button>
      </div>

      {/* Honest Demo Context Bar */}
      <div style={{
        background: 'var(--bg-app)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Info size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>
            DiskGuard monitors the behavior of selected storage devices. In the current demo, devices are simulated. Real HDD/SSD detection will be connected through the local system service.
          </span>
        </div>
        <span className="badge badge-warning" style={{ fontSize: '0.675rem', fontWeight: '700', flexShrink: 0 }}>
          DEMO MODE
        </span>
      </div>

      {/* Section Header */}
      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        CONNECTED DRIVES ({devicesToRender.length})
      </div>

      {/* Drives Grid */}
      <div className="grid-3">
        {devicesToRender.map((drv) => {
          const isSelected = selectedDeviceId === drv.id;
          const isMonitored = monitoredDriveIds.includes(drv.id);
          const isAttack = isMonitored && (scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy');

          let stateLabel = 'AVAILABLE';
          let stateBadgeClass = 'badge-neutral';

          if (isMonitored) {
            if (isAttack) {
              stateLabel = 'ATTENTION';
              stateBadgeClass = 'badge-danger';
            } else {
              stateLabel = 'MONITORING';
              stateBadgeClass = 'badge-success';
            }
          } else if (isSelected) {
            stateLabel = 'SELECTED';
            stateBadgeClass = 'badge-primary';
          }

          return (
            <div
              key={drv.id}
              className="dg-card"
              style={{
                border: isSelected
                  ? '2px solid var(--accent)'
                  : isMonitored
                  ? isAttack
                    ? '1px solid var(--danger-border)'
                    : '1px solid var(--success-border)'
                  : '1px solid var(--border)',
                background: isSelected ? '#EFF6FF' : '#FFFFFF',
                boxShadow: isMonitored || isSelected ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <HardDrive size={22} style={{ color: isMonitored ? (isAttack ? 'var(--danger)' : 'var(--success)') : 'var(--text-secondary)' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{drv.name}</span>
                        <span className="mono" style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                          {drv.device}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {drv.driveType || 'SSD'} · {drv.capacity} · {drv.role}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`badge ${stateBadgeClass}`} style={{ fontSize: '0.7rem', fontWeight: '700' }}>
                      {stateLabel}
                    </span>
                  </div>
                </div>

                {/* CAPACITY & USAGE GAUGE */}
                <div style={{ background: isSelected ? '#FFFFFF' : 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <span>Used: {drv.used || '358 GB'} / {drv.capacity || '1 TB'}</span>
                    <span className="mono" style={{ fontWeight: '700' }}>{drv.percentUsed || 36}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '6px', marginBottom: '0.5rem' }}>
                    <div className="progress-bar-fill" style={{ width: `${drv.percentUsed || 36}%`, background: 'var(--accent)' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Free Space: <strong>{drv.free || '642 GB'}</strong>
                  </div>
                </div>

                {/* DISTINCT METRICS: DRIVE HEALTH VS SECURITY STATUS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  fontSize: '0.725rem',
                  background: isSelected ? '#FFFFFF' : 'var(--bg-app)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', textTransform: 'uppercase', fontWeight: '700' }}>
                      HEALTH
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--success)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={13} /> {drv.health || 'Healthy'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      SMART Verified
                    </div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', textTransform: 'uppercase', fontWeight: '700' }}>
                      SECURITY
                    </div>
                    <div style={{ fontWeight: '700', color: isAttack ? 'var(--danger)' : isMonitored ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {isAttack ? 'Attention' : isMonitored ? 'Normal' : 'Not monitored'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {isMonitored ? 'Edge AI Active' : 'Observation Inactive'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.75rem', fontWeight: '600' }}
                  onClick={() => onViewDetails && onViewDetails(drv.id)}
                >
                  View Details
                </button>

                {isMonitored ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    onClick={() => onStopMonitoringModal && onStopMonitoringModal(drv.id)}
                  >
                    <Square size={13} /> Stop Monitoring
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    onClick={() => onStartMonitoringModal && onStartMonitoringModal(drv.id)}
                  >
                    <Play size={13} /> Start Monitoring
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

