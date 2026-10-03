import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Terminal, AlertTriangle, ChevronRight } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, onSelectProcess, onSelectIncident }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mockDatabase = [
    { type: 'incident', id: 'DG-00124', title: 'Suspicious Mass File Modification', tag: 'INCIDENT' },
    { type: 'process', id: '4821', title: 'unknown_payload.exe', tag: 'PROCESS (CRITICAL)' },
    { type: 'process', id: '1042', title: 'chrome.exe', tag: 'PROCESS (NORMAL)' },
    { type: 'process', id: '2840', title: 'Code.exe', tag: 'PROCESS (NORMAL)' },
    { type: 'process', id: '6120', title: 'backup_agent.exe', tag: 'PROCESS (WARNING)' },
    { type: 'event', id: 'EVT-908', title: 'Entropy Shift (+4.2 Shannon deviation logged)', tag: 'SECURITY EVENT' },
    { type: 'event', id: 'EVT-904', title: 'Mass Rename Velocity (410 files encrypted)', tag: 'SECURITY EVENT' }
  ];

  const filtered = query.trim() === '' 
    ? mockDatabase 
    : mockDatabase.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.id.toLowerCase().includes(query.toLowerCase()) ||
        item.tag.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            autoFocus
            placeholder="Search processes, incidents, drives, alert IDs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              width: '100%'
            }}
          />
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}>
            ESC
          </button>
        </div>

        {/* Results */}
        <div style={{ marginTop: '0.75rem', maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matches found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.type === 'incident') {
                    onSelectIncident({ id: item.id, title: item.title, riskScore: 87, severity: 'HIGH', confidence: 91, detectedAt: '09:42:18 AM', affectedProcess: 'unknown_payload.exe', affectedDrive: '/dev/disk0s1', eventCounts: { reads: 847, writes: 623, modifications: 591, renames: 410 }, whySuspicious: ['Write activity increased sharply', 'Mass rename behavior detected'] });
                  } else if (item.type === 'process') {
                    onSelectProcess({ pid: item.id, name: item.title, risk: item.tag.includes('CRITICAL') ? 'High' : 'Low', riskScore: item.tag.includes('CRITICAL') ? 87 : 12, read: '14.2 MB/s', write: '98.4 MB/s', affectedFiles: 623, reads: 847, writes: 623, renames: 410, modified: 591, indicators: ['Mass Rename'], aiExplanation: 'Process exhibited abnormal rename velocity' });
                  }
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {item.type === 'incident' ? (
                    <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
                  ) : item.type === 'process' ? (
                    <Terminal size={15} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Layers size={15} style={{ color: 'var(--warning)' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                      <span>ID: </span>
                      <span className="mono">{item.id}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-neutral">{item.tag}</span>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
