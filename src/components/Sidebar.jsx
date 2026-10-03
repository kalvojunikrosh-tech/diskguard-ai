import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Activity, 
  Terminal, 
  Compass, 
  Cpu, 
  ShieldCheck, 
  HardDrive, 
  Clock, 
  Lock,
  Settings,
  Shield
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const sections = [
    {
      title: 'HOME',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      title: 'MONITOR',
      items: [
        { id: 'activity', label: 'Disk Activity', icon: Activity },
        { id: 'drives', label: 'Drives', icon: HardDrive },
        { id: 'processes', label: 'Processes', icon: Terminal }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'ai-model', label: 'Edge AI', icon: Cpu },
        { id: 'behavior', label: 'Behavior', icon: Compass }
      ]
    },
    {
      title: 'SECURITY',
      items: [
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
        { id: 'protection', label: 'Protection', icon: ShieldCheck }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'timeline', label: 'Timeline', icon: Clock },
        { id: 'privacy', label: 'Privacy', icon: Lock }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Shield size={14} />
        </div>
        <div>
          <div className="sidebar-brand-name">
            <span>Disk</span>
            <strong>Guard</strong>
            <span className="sidebar-brand-tag">AI</span>
          </div>
          <div className="mono" style={{ fontSize: '0.625rem', color: '#64748B', marginTop: '0.05rem' }}>ENDPOINT AGENT v0.1</div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {sections.map((sec, idx) => (
          <div key={idx} style={{ marginBottom: '0.35rem' }}>
            <div className="sidebar-section-header">{sec.title}</div>
            {sec.items.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <IconComp size={14} style={{ color: isActive ? 'var(--accent)' : '#64748B' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.55rem', borderRadius: 'var(--radius-sm)', background: '#1F2937', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="status-dot success"></span>
            <span style={{ fontSize: '0.725rem', fontWeight: '500', color: '#E5E7EB', fontFamily: 'var(--font-ui)' }}>Observation Mode Active</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} title="Settings">
            <Settings size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}


