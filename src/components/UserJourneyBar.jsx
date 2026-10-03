import React from 'react';
import { Eye, Compass, Cpu, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function UserJourneyBar({ scenario, activeTab, onNavigate, unifiedState }) {
  const isAttack = unifiedState 
    ? (unifiedState.code === 'MONITORING_ACTIVE_HIGH_RISK' || unifiedState.code === 'INCIDENT_INVESTIGATION')
    : (scenario === 'ransomware');

  // Requirement 2 & 7: Derive activeStep centrally from unifiedState
  let activeStep = unifiedState?.userJourneyStage?.step || 2;
  if (activeTab === 'behavior') {
    activeStep = 2;
  } else if (activeTab === 'ai-model') {
    activeStep = 3;
  } else if (activeTab === 'incidents' || activeTab === 'processes') {
    activeStep = 4;
  } else if (activeTab === 'protection') {
    activeStep = 5;
  } else if (activeTab === 'overview') {
    activeStep = unifiedState?.userJourneyStage?.step || 2;
  }

  const steps = [
    {
      step: 1,
      name: 'MONITOR',
      desc: 'Watch drive activity',
      icon: Eye,
      targetTab: 'activity'
    },
    {
      step: 2,
      name: 'UNDERSTAND',
      desc: 'Learn normal behavior',
      icon: Compass,
      targetTab: 'behavior'
    },
    {
      step: 3,
      name: 'DETECT',
      desc: 'Edge AI identifies patterns',
      icon: Cpu,
      targetTab: 'ai-model'
    },
    {
      step: 4,
      name: 'INVESTIGATE',
      desc: 'Understand flagged activity',
      icon: AlertTriangle,
      targetTab: 'incidents'
    },
    {
      step: 5,
      name: 'RESPOND',
      desc: 'Review protection actions',
      icon: ShieldCheck,
      targetTab: 'protection'
    }
  ];

  return (
    <div className="dg-card" style={{ padding: '0.75rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.675rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          DISKGUARD USER JOURNEY
        </span>
        <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)' }}>
          Stage <strong style={{ color: 'var(--accent)' }}>{activeStep} of 5</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
        {steps.map((stg, i) => {
          const Icon = stg.icon;
          const isActive = activeStep === stg.step;
          const isPassed = activeStep > stg.step;

          return (
            <React.Fragment key={stg.step}>
              <div
                onClick={() => onNavigate && onNavigate(stg.targetTab)}
                style={{
                  flex: 1,
                  background: isActive
                    ? isAttack
                      ? 'var(--danger-bg)'
                      : '#EEF2FF'
                    : isPassed
                    ? '#F8FAFC'
                    : 'var(--bg-app)',
                  border: `1px solid ${
                    isActive
                      ? isAttack
                        ? 'var(--danger-border)'
                        : 'var(--accent)'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.6rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      color: isActive ? (isAttack ? 'var(--danger)' : 'var(--accent)') : 'var(--text-muted)'
                    }}
                  >
                    {stg.step}
                  </span>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: '700',
                      color: isActive
                        ? isAttack
                          ? 'var(--danger)'
                          : 'var(--text-primary)'
                        : 'var(--text-primary)'
                    }}
                  >
                    {stg.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                  {stg.desc}
                </div>
              </div>

              {i < steps.length - 1 && (
                <ArrowRight size={12} style={{ color: 'var(--border)', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
