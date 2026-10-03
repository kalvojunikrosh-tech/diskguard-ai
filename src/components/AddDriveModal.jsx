import React, { useState, useEffect } from 'react';
import { HardDrive, X, Loader2, CheckCircle2, AlertCircle, Info, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { SIMULATED_DRIVES } from '../data/edgeAiSimulation';
import { diskguardApi } from '../services/diskguardApi';

export default function AddDriveModal({
  isOpen,
  onClose,
  monitoredDriveIds = [],
  selectedDeviceId = null,
  onSelectDrive,
  onViewDrive
}) {
  const [isScanning, setIsScanning] = useState(true);
  const [showNoDevices, setShowNoDevices] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [realDevices, setRealDevices] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setSelectedCardId(null);
      diskguardApi.getDevices().then((res) => {
        if (res && res.realDevices && res.realDevices.length > 0) {
          setRealDevices(res.realDevices);
          setIsBackendConnected(true);
        } else {
          setRealDevices([]);
          setIsBackendConnected(false);
        }
        setIsScanning(false);
      }).catch(() => {
        setRealDevices([]);
        setIsBackendConnected(false);
        setIsScanning(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScanAgain = () => {
    setIsScanning(true);
    setShowNoDevices(false);
    setSelectedCardId(null);
    diskguardApi.getDevices().then((res) => {
      if (res && res.realDevices && res.realDevices.length > 0) {
        setRealDevices(res.realDevices);
        setIsBackendConnected(true);
      } else {
        setRealDevices([]);
        setIsBackendConnected(false);
      }
      setIsScanning(false);
    }).catch(() => {
      setRealDevices([]);
      setIsBackendConnected(false);
      setIsScanning(false);
    });
  };

  const handleSelectCard = (driveId) => {
    setSelectedCardId(driveId);
  };

  const handleStartMonitoring = (driveId) => {
    if (onSelectDrive) {
      onSelectDrive(driveId);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="modal-card" style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '580px',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex'
              }}>
                <HardDrive size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                  ADD A DRIVE
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem', margin: 0 }}>
                  Select a storage device for DiskGuard to monitor.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-warning" style={{ fontSize: '0.675rem', fontWeight: '700' }}>
              DEMO MODE · Simulated devices
            </span>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Honest Demo / Real Detection Notice Banner */}
        <div style={{
          padding: '0.65rem 1.5rem',
          background: isBackendConnected && realDevices.length > 0 ? '#F0FDF4' : '#F1F5F9',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.735rem',
          color: isBackendConnected && realDevices.length > 0 ? '#15803D' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          {isBackendConnected && realDevices.length > 0 ? (
            <>
              <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span>
                <strong>FastAPI Backend Connected:</strong> Real macOS storage devices discovered via read-only system APIs.
              </span>
            </>
          ) : (
            <>
              <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span>
                Running in Simulation Mode. Start FastAPI backend (port 8000) for real macOS device detection.
              </span>
            </>
          )}
        </div>

        {/* Discovery Scan Status Header */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: isScanning ? '#EFF6FF' : showNoDevices ? '#FEF2F2' : '#F0FDF4',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.775rem'
        }}>
          {isScanning ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E40AF', fontWeight: '700' }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              <span>SCANNING FOR DRIVES...</span>
            </div>
          ) : showNoDevices ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C', fontWeight: '700' }}>
              <AlertCircle size={15} />
              <span>NO STORAGE DEVICES FOUND</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803D', fontWeight: '700' }}>
              <CheckCircle2 size={15} />
              <span>
                {realDevices.length > 0
                  ? `${realDevices.length} REAL + ${SIMULATED_DRIVES.length} SIMULATED DEVICES FOUND`
                  : `${SIMULATED_DRIVES.length} DEVICES FOUND`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => setShowNoDevices(!showNoDevices)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {showNoDevices ? 'Show Available Devices' : 'Simulate Empty State'}
            </button>
            <button
              onClick={handleScanAgain}
              disabled={isScanning}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <RefreshCw size={11} /> Scan Again
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '420px', overflowY: 'auto' }}>

          {isScanning ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Scanning local storage system...</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Identifying active SSDs, HDDs, and external volumes</div>
            </div>
          ) : showNoDevices ? (
            /* NO STORAGE DEVICES FOUND STATE */
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <AlertCircle size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                NO STORAGE DEVICES FOUND
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: '340px', margin: '0 auto 1.25rem', lineHeight: '1.4' }}>
                Connect a storage device and scan again.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <button onClick={handleScanAgain} className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1.1rem', fontSize: '0.775rem' }}>
                  Scan Again
                </button>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Demo environment</span>
              </div>
            </div>
          ) : (
            /* AVAILABLE DEVICES LIST */
            <div>
              {/* REAL DEVICES SECTION */}
              {realDevices.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>REAL STORAGE DEVICES (macOS API)</span>
                    <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>FASTAPI BACKEND</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {realDevices.map((drv) => {
                      const isMonitored = monitoredDriveIds.includes(drv.id);
                      const isSelectedCard = selectedCardId === drv.id;
                      let stateLabel = isMonitored ? 'MONITORING ACTIVE' : isSelectedCard ? 'SELECTED' : 'REAL DEVICE';
                      let stateBadgeClass = isMonitored ? 'badge-success' : isSelectedCard ? 'badge-primary' : 'badge-success';

                      return (
                        <div
                          key={drv.id}
                          style={{
                            border: isSelectedCard
                              ? '2px solid var(--accent)'
                              : isMonitored
                              ? '1px solid var(--success-border)'
                              : '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            background: isSelectedCard
                              ? '#EFF6FF'
                              : isMonitored
                              ? '#F0FDF4'
                              : '#FFFFFF',
                            boxShadow: isSelectedCard ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <HardDrive size={22} style={{ color: isMonitored ? 'var(--success)' : isSelectedCard ? 'var(--accent)' : 'var(--success)' }} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ fontWeight: '800', fontSize: '0.925rem', color: 'var(--text-primary)' }}>{drv.name}</span>
                                  <span className="mono" style={{
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    color: isSelectedCard ? '#1D4ED8' : 'var(--accent)',
                                    background: isSelectedCard ? '#DBEAFE' : 'var(--accent-light)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px'
                                  }}>
                                    {drv.device}
                                  </span>
                                  <span className="badge badge-neutral" style={{ fontSize: '0.625rem', fontWeight: '700' }}>
                                    {drv.filesystem?.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                  {drv.driveType} · {drv.capacity} · {drv.role}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className={`badge ${stateBadgeClass}`} style={{ fontSize: '0.7rem', fontWeight: '700' }}>
                                {stateLabel}
                              </span>
                            </div>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.5rem',
                            fontSize: '0.725rem',
                            background: isSelectedCard ? '#FFFFFF' : 'var(--bg-app)',
                            padding: '0.6rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            marginBottom: '0.75rem'
                          }}>
                            <div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', fontWeight: '600', textTransform: 'uppercase' }}>Health</div>
                              <div style={{ fontWeight: '700', color: 'var(--success)', marginTop: '0.1rem' }}>
                                {drv.health}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', fontWeight: '600', textTransform: 'uppercase' }}>Security</div>
                              <div style={{ fontWeight: '700', color: isMonitored ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.1rem' }}>
                                {isMonitored ? 'Normal' : 'Not monitored'}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</div>
                              <div style={{ fontWeight: '700', color: isMonitored ? 'var(--success)' : isSelectedCard ? 'var(--accent)' : 'var(--text-primary)', marginTop: '0.1rem' }}>
                                {isMonitored ? 'Monitoring Active' : isSelectedCard ? 'Selected' : 'Available'}
                              </div>
                            </div>
                          </div>

                          {isSelectedCard && !isMonitored && (
                            <div style={{
                              background: '#DBEAFE',
                              border: '1px solid #93C5FD',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.5rem 0.75rem',
                              marginBottom: '0.75rem',
                              fontSize: '0.725rem',
                              color: '#1E40AF',
                              fontWeight: '500'
                            }}>
                              DiskGuard backend will observe this real storage device.
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {isMonitored ? (
                              <button
                                onClick={() => {
                                  onClose();
                                  if (onViewDrive) onViewDrive(drv.id);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', fontWeight: '600' }}
                              >
                                View Drive
                              </button>
                            ) : isSelectedCard ? (
                              <button
                                onClick={() => handleStartMonitoring(drv.id)}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <span>Start Monitoring</span>
                                <ArrowRight size={13} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSelectCard(drv.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', fontWeight: '600' }}
                              >
                                Select Drive
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SIMULATION DRIVES SECTION */}
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>SIMULATION / DEMO DRIVES</span>
                <span className="badge badge-warning" style={{ fontSize: '0.625rem' }}>DEMO MODE</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {SIMULATED_DRIVES.map((drv) => {
                  const isMonitored = monitoredDriveIds.includes(drv.id);
                  const isSelectedCard = selectedCardId === drv.id;

                  // Determine state badge
                  let stateLabel = 'AVAILABLE';
                  let stateBadgeClass = 'badge-neutral';

                  if (isMonitored) {
                    stateLabel = 'MONITORING ACTIVE';
                    stateBadgeClass = 'badge-success';
                  } else if (isSelectedCard) {
                    stateLabel = 'SELECTED';
                    stateBadgeClass = 'badge-primary';
                  }

                  const securityLabel = isMonitored ? 'Normal' : 'Not monitored';
                  const healthLabel = drv.health || 'Healthy';

                  return (
                    <div
                      key={drv.id}
                      style={{
                        border: isSelectedCard
                          ? '2px solid var(--accent)'
                          : isMonitored
                          ? '1px solid var(--success-border)'
                          : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        background: isSelectedCard
                          ? '#EFF6FF'
                          : isMonitored
                          ? '#F0FDF4'
                          : '#FFFFFF',
                        boxShadow: isSelectedCard ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Card Header: Device Name, Letter, Role */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <HardDrive size={22} style={{ color: isMonitored ? 'var(--success)' : isSelectedCard ? 'var(--accent)' : 'var(--text-secondary)' }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{ fontWeight: '800', fontSize: '0.925rem', color: 'var(--text-primary)' }}>{drv.name}</span>
                              <span className="mono" style={{
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                color: isSelectedCard ? '#1D4ED8' : 'var(--accent)',
                                background: isSelectedCard ? '#DBEAFE' : 'var(--accent-light)',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px'
                              }}>
                                {drv.device}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {drv.driveType} · {drv.capacity} · {drv.role}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className={`badge ${stateBadgeClass}`} style={{ fontSize: '0.7rem', fontWeight: '700' }}>
                            {stateLabel}
                          </span>
                        </div>
                      </div>

                      {/* Separated Specs & Status Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                        fontSize: '0.725rem',
                        background: isSelectedCard ? '#FFFFFF' : 'var(--bg-app)',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', fontWeight: '600', textTransform: 'uppercase' }}>Health</div>
                          <div style={{ fontWeight: '700', color: 'var(--success)', marginTop: '0.1rem' }}>
                            {healthLabel}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', fontWeight: '600', textTransform: 'uppercase' }}>Security</div>
                          <div style={{ fontWeight: '700', color: isMonitored ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.1rem' }}>
                            {securityLabel}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.675rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</div>
                          <div style={{ fontWeight: '700', color: isMonitored ? 'var(--success)' : isSelectedCard ? 'var(--accent)' : 'var(--text-primary)', marginTop: '0.1rem' }}>
                            {isMonitored ? 'Monitoring Active' : isSelectedCard ? 'Selected' : 'Available'}
                          </div>
                        </div>
                      </div>

                      {/* Selection Guidance Notice (When Selected) */}
                      {isSelectedCard && !isMonitored && (
                        <div style={{
                          background: '#DBEAFE',
                          border: '1px solid #93C5FD',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem 0.75rem',
                          marginBottom: '0.75rem',
                          fontSize: '0.725rem',
                          color: '#1E40AF',
                          fontWeight: '500'
                        }}>
                          DiskGuard will begin observing this drive's simulated activity.
                        </div>
                      )}

                      {/* Action Button Section */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {isMonitored ? (
                          <button
                            onClick={() => {
                              onClose();
                              if (onViewDrive) onViewDrive(drv.id);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', fontWeight: '600' }}
                          >
                            View Drive
                          </button>
                        ) : isSelectedCard ? (
                          <button
                            onClick={() => handleStartMonitoring(drv.id)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <span>Start Monitoring</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectCard(drv.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', fontWeight: '600' }}
                          >
                            Select Drive
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Safety & Demo Assurance Footer Banner */}
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            marginTop: '1.25rem',
            fontSize: '0.725rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.45'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
              <span>Observe Drive Behavioral Patterns</span>
            </div>
            <div>
              DiskGuard monitors drive activity such as reads, writes, file modifications, renames and behavioral changes. It does NOT format, delete, or upload physical files.
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ fontWeight: '600' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

