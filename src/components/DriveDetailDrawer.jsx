import React from 'react';
import { X, HardDrive, Database, Activity, Cpu, ShieldCheck, AlertTriangle, Play, Square, Info, ArrowRight } from 'lucide-react';

export default function DriveDetailDrawer({
  drive,
  isOpen,
  onClose,
  isMonitored,
  securityStatus = 'Normal',
  riskLevel = 'Low',
  anomalyScore = 12,
  scenario = 'none',
  onStartMonitoring,
  onStopMonitoring
}) {
  if (!isOpen || !drive) return null;

  const isAttack = securityStatus === 'Suspicious' || securityStatus === 'Attention' || riskLevel === 'High' || scenario === 'ransomware';

  return (
    <div className="drawer-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 990
    }}>
      <div className="drawer-container" style={{
        width: '100%',
        maxWidth: '520px',
        background: '#FFFFFF',
        height: '100%',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex'
            }}>
              <HardDrive size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {drive.name}
                </h2>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {drive.device}
                </span>
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {drive.driveType || 'SSD'} · {drive.capacity} · {drive.role || 'Storage Device'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMonitored ? (
              <span className={`badge ${isAttack ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.725rem' }}>
                {isAttack ? '⚠ SUSPICIOUS' : '● MONITORING ACTIVE'}
              </span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                Available
              </span>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.2rem'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Body Scrollable */}
        <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. VISUAL PIPELINE DIAGRAM */}
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem'
          }}>
            <div style={{ fontSize: '0.675rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
              DRIVE SECURITY PIPELINE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: '700' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: '0.35rem 0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                <HardDrive size={13} style={{ color: 'var(--accent)', margin: '0 auto 0.1rem' }} />
                <div>{drive.device}</div>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: '0.35rem 0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                <Activity size={13} style={{ color: 'var(--accent)', margin: '0 auto 0.1rem' }} />
                <div>Activity</div>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: '0.35rem 0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                <Cpu size={13} style={{ color: 'var(--accent)', margin: '0 auto 0.1rem' }} />
                <div>Edge AI</div>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
              <div style={{ background: isAttack ? 'var(--danger-bg)' : '#F0FDF4', border: `1px solid ${isAttack ? 'var(--danger-border)' : '#DCFCE7'}`, padding: '0.35rem 0.5rem', borderRadius: '4px', textAlign: 'center', color: isAttack ? 'var(--danger)' : '#15803D' }}>
                <ShieldCheck size={13} style={{ margin: '0 auto 0.1rem' }} />
                <div>{isAttack ? 'Alert' : 'Normal'}</div>
              </div>
            </div>
          </div>

          {/* 2. HARDWARE & STORAGE SECTION */}
          <div className="dg-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={14} style={{ color: 'var(--accent)' }} /> STORAGE SPECIFICATIONS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Used</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{drive.used || '358 GB'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Free</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{drive.free || '642 GB'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Capacity</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{drive.capacity || '1 TB'}</div>
              </div>
            </div>

            <div className="progress-bar-bg" style={{ marginBottom: '0.5rem' }}>
              <div className="progress-bar-fill" style={{ width: `${drive.percentUsed || 36}%`, background: 'var(--accent)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              <span>Drive Health: <strong style={{ color: 'var(--success)' }}>{drive.health || 'Healthy'}</strong></span>
              <span>SMART: <strong style={{ color: 'var(--success)' }}>{drive.smartStatus || 'Verified Healthy'}</strong></span>
            </div>
          </div>

          {/* 3. ACTIVITY THROUGHPUT SECTION */}
          <div className="dg-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Activity size={14} style={{ color: 'var(--accent)' }} /> LIVE STORAGE THROUGHPUT
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-app)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Read Throughput</div>
                <div className="mono" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {isAttack ? '142 MB/s' : (drive.readSpeed || '12 MB/s')}
                </div>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Write Throughput</div>
                <div className="mono" style={{ fontSize: '0.9rem', fontWeight: '700', color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {isAttack ? '630 MB/s' : (drive.writeSpeed || '8 MB/s')}
                </div>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IOPS</div>
                <div className="mono" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {isAttack ? '4,890' : (drive.iops || '184')}
                </div>
              </div>
            </div>
          </div>

          {/* 4. BEHAVIOR & SECURITY POSTURE */}
          <div className="dg-card" style={{
            padding: '1rem',
            border: isAttack ? '1px solid var(--danger-border)' : '1px solid var(--border)',
            background: isAttack ? '#FEF2F2' : '#FFFFFF'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} style={{ color: isAttack ? 'var(--danger)' : 'var(--success)' }} /> BEHAVIORAL SECURITY POSTURE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.775rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Baseline State</div>
                <div style={{ fontWeight: '700', color: 'var(--success)' }}>Established</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Current Behavior</div>
                <div style={{ fontWeight: '700', color: isAttack ? 'var(--danger)' : 'var(--success)' }}>
                  {isAttack ? 'Suspicious Behavior' : 'Normal'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Anomaly Score</div>
                <div className="mono" style={{ fontWeight: '700', color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {isAttack ? '78 / 100' : `${anomalyScore} / 100`}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Risk Assessment</div>
                <div style={{ fontWeight: '700', color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {isAttack ? 'Elevated Threat' : riskLevel}
                </div>
              </div>
            </div>
          </div>

          {/* 5. EDGE AI INFERENCE DETAILS */}
          <div className="dg-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Cpu size={14} style={{ color: 'var(--accent)' }} /> LOCAL EDGE AI INFERENCE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.775rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Observation Mode:</span>
                <span style={{ fontWeight: '700', color: 'var(--success)' }}>Analyzing Activity</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Model Architecture:</span>
                <span className="mono" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Behavioral Model v0.1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Inference Location:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>Local / On Device</span>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            fontSize: '0.725rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              DiskGuard Safety Language
            </div>
            <div>
              DiskGuard monitors drive behavior. It does NOT format the drive, delete files, modify files, or upload the drive during simulation.
            </div>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: '#F8FAFC',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>

          {isMonitored ? (
            <button
              onClick={() => {
                onClose();
                if (onStopMonitoring) onStopMonitoring(drive.id);
              }}
              className="btn-danger"
              style={{ fontSize: '0.775rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Square size={13} /> Stop Monitoring
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onStartMonitoring) onStartMonitoring(drive.id);
              }}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Play size={13} /> Start Monitoring
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
