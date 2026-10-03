import React, { useState, useEffect } from 'react';
import { HardDrive, Play, CheckCircle2, ShieldCheck, Loader2, ArrowRight, Activity, Cpu } from 'lucide-react';

export default function StartMonitoringModal({
  isOpen,
  drive,
  onComplete,
  onClose
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [baselineProgress, setBaselineProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setBaselineProgress(0);

      // Step 1 -> Step 2 after 700ms
      const t1 = setTimeout(() => {
        setCurrentStep(2);
      }, 700);

      return () => clearTimeout(t1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep === 2) {
      const interval = setInterval(() => {
        setBaselineProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setCurrentStep(3);
            setTimeout(() => setCurrentStep(4), 800);
            return 100;
          }
          return prev + 5;
        });
      }, 80);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  if (!isOpen || !drive) return null;

  const observedSignals = [
    { name: 'Read activity', desc: 'Capturing baseline throughput' },
    { name: 'Write activity', desc: 'Capturing burst frequency' },
    { name: 'File modification', desc: 'Tracking handle density' },
    { name: 'File renaming', desc: 'Measuring extension velocity' },
    { name: 'Entropy', desc: 'Calculating block Shannon entropy' },
    { name: 'Access patterns', desc: 'Evaluating directory path vectors' }
  ];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1010,
      padding: '1rem'
    }}>
      <div className="modal-card" style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '540px',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Header */}
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
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex'
            }}>
              <Play size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                START MONITORING SETUP
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                {drive.name} ({drive.device}) · {drive.capacity} {drive.driveType}
              </div>
            </div>
          </div>

          <span className="badge badge-warning" style={{ fontSize: '0.675rem', fontWeight: '700' }}>
            DEMO / SIMULATION
          </span>
        </div>

        {/* Step Indicator Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.25rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--bg-app)',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.7rem',
          fontWeight: '700'
        }}>
          {[
            { num: 1, label: 'Prepare' },
            { num: 2, label: 'Baseline' },
            { num: 3, label: 'AI Ready' },
            { num: 4, label: 'Active' }
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <div
                key={s.num}
                style={{
                  padding: '0.4rem 0.25rem',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  background: isDone ? '#F0FDF4' : isActive ? '#EFF6FF' : 'transparent',
                  color: isDone ? '#15803D' : isActive ? '#1D4ED8' : 'var(--text-muted)',
                  border: isActive ? '1px solid #93C5FD' : '1px solid transparent'
                }}
              >
                {isDone ? `✓ STEP ${s.num}` : `STEP ${s.num}`}
                <div style={{ fontWeight: '500', fontSize: '0.65rem' }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>

          {/* STEP 1: PREPARING */}
          {currentStep === 1 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                STEP 1 — Preparing monitoring
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
                Preparing {drive.name} ({drive.device}) for behavioral observation.
              </p>
            </div>
          )}

          {/* STEP 2: LEARNING BASELINE */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    ESTABLISHING BASELINE
                  </span>
                  <span className="mono" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)' }}>
                    {baselineProgress}%
                  </span>
                </div>
                <div className="progress-bar-bg" style={{ height: '10px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${baselineProgress}%`,
                      background: 'var(--accent)',
                      transition: 'width 0.1s linear'
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  DiskGuard is observing normal activity to establish a behavioral baseline. DiskGuard needs to understand normal activity before it can identify unusual behavior.
                </p>
              </div>

              {/* Signals Observed */}
              <div style={{ background: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Activity size={12} /> SIGNALS BEING OBSERVED
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                  {observedSignals.map((sig, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={13} style={{ color: baselineProgress > (idx * 15) ? 'var(--success)' : 'var(--text-muted)' }} />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{sig.name}</div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{sig.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: EDGE AI READY & MONITORING ACTIVE */}
          {(currentStep === 3 || currentStep === 4) && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: '#F0FDF4',
                color: '#15803D',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '1px solid #DCFCE7'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {currentStep === 3 ? 'Edge AI Ready' : 'Monitoring Active'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 1rem', lineHeight: '1.45' }}>
                {currentStep === 3
                  ? 'Behavioral analysis is ready. Baseline parameters configured for local inference.'
                  : `DiskGuard is now monitoring ${drive.name} (${drive.device}).`}
              </p>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Baseline State</div>
                  <div style={{ fontWeight: '700', color: 'var(--success)' }}>BASELINE READY</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Edge AI Engine</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Behavioral Model v0.1</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Mode</div>
                  <div style={{ fontWeight: '700', color: 'var(--accent)' }}>Read-Only Observer</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: '#F8FAFC',
          display: 'flex',
          justify: 'flex-end'
        }}>
          {currentStep === 4 ? (
            <button
              onClick={() => {
                if (onComplete) onComplete(drive.id);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', fontSize: '0.825rem' }}
            >
              <span>Continue to Dashboard</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button disabled className="btn btn-secondary btn-sm" style={{ opacity: 0.6 }}>
              Preparing Monitoring...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
