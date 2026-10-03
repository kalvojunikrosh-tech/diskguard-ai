import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Shield, Activity, Cpu, Compass } from 'lucide-react';

export default function QuickTourModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Primary Security State',
      desc: 'The top Overview banner immediately answers "AM I SAFE?". It displays your system protection status, Risk level, and active Edge AI engine state.',
      icon: Shield
    },
    {
      title: '2. Edge AI & Local Inference',
      desc: 'DiskGuard AI simulates local behavioral evaluation on your device. Zero file contents or private documents are uploaded to the cloud.',
      icon: Cpu
    },
    {
      title: '3. Real-Time Telemetry & Event Pins',
      desc: 'The Disk Activity chart streams read/write MB/s and IOPS. Interactive flags (▲ Write Spike, ▲ Mass Modification) connect telemetry directly to security events.',
      icon: Activity
    },
    {
      title: '4. Behavioral Baseline & Health',
      desc: 'DiskGuard AI compares current disk activity against the learned normal workload of your machine. Understand deviation (+1399%) within 3 seconds.',
      icon: Compass
    },
    {
      title: '5. "What Should I Do?" Action Panel',
      desc: 'When suspicious behavior occurs, DiskGuard AI recommends appropriate investigation steps and groups hundreds of raw events into correlated incidents.',
      icon: CheckCircle2
    }
  ];

  const step = steps[currentStep];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge-ai">QUICK TOUR ({currentStep + 1} / {steps.length})</span>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem 0.4rem', fontSize: '0.725rem' }}>
            <X size={14} /> Skip Tour
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
            {React.createElement(step.icon, { size: 20 })}
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {step.title}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '380px', margin: '0 auto' }}>
            {step.desc}
          </p>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentStep(i)}
              style={{
                width: i === currentStep ? '16px' : '6px',
                height: '6px',
                borderRadius: '999px',
                background: i === currentStep ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className="btn-secondary"
            disabled={currentStep === 0}
            style={{ opacity: currentStep === 0 ? 0.5 : 1, fontSize: '0.775rem' }}
          >
            <ArrowLeft size={13} /> Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="btn-primary"
              style={{ fontSize: '0.775rem' }}
            >
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button onClick={onClose} className="btn-primary" style={{ fontSize: '0.775rem' }}>
              Finish Tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
