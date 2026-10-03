import React from 'react';
import { Play, ShieldAlert, FileEdit, Lock, RefreshCw } from 'lucide-react';

export default function ScenarioControlBar({ activeScenario, onSelectScenario }) {
  const scenarios = [
    {
      id: 'normal',
      label: 'Normal Baseline Workload',
      desc: 'Standard desktop activity (Chrome, Code, background services)',
      icon: Play,
      variant: 'normal'
    },
    {
      id: 'ransomware',
      label: 'Simulate Ransomware Pattern',
      desc: 'Rapid file encryption, mass write & rename velocity, entropy spike',
      icon: ShieldAlert,
      variant: 'attack'
    },
    {
      id: 'mass-rename',
      label: 'Simulate Mass File Modification',
      desc: 'Abnormal rename velocity across 400+ files in short window',
      icon: FileEdit,
      variant: 'attack'
    },
    {
      id: 'high-entropy',
      label: 'Simulate High Entropy Burst',
      desc: 'Disk write payload entropy sharply deviates from learned baseline',
      icon: Lock,
      variant: 'attack'
    }
  ];

  return (
    <div className="scenario-bar">
      <div className="scenario-title">
        <RefreshCw size={16} style={{ color: 'var(--cyan-400)' }} />
        <span>Live Telemetry Simulation:</span>
        <span className="demo-badge">FRONTEND DEMO CONTROLS</span>
      </div>

      <div className="scenario-btns">
        {scenarios.map((sc) => {
          const IconComp = sc.icon;
          const isActive = activeScenario === sc.id;
          let btnClass = 'scenario-btn';
          if (isActive) {
            btnClass += sc.variant === 'attack' ? ' active-attack' : ' active-normal';
          }
          return (
            <button
              key={sc.id}
              className={btnClass}
              onClick={() => onSelectScenario(sc.id)}
              title={sc.desc}
            >
              <IconComp size={14} />
              <span>{sc.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
