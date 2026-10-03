import React from 'react';
import { X, Bell, AlertTriangle, Info } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, notifications }) {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={16} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>System Notifications</h2>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
          {notifications.map((n) => {
            const isThreat = n.type === 'threat';
            return (
              <div
                key={n.id}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-app)',
                  border: `1px solid ${isThreat ? 'var(--danger-border)' : 'var(--border)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className={`badge ${isThreat ? 'badge-danger' : 'badge-neutral'}`}>{n.category}</span>
                  <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                </div>
                <div style={{ fontWeight: '600', color: isThreat ? 'var(--danger)' : 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {n.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
