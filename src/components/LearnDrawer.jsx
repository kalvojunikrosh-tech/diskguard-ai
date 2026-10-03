import React from 'react';
import { X, BookOpen, ShieldCheck, Cpu, Compass, Activity, Lock } from 'lucide-react';

export default function LearnDrawer({ topic, onClose }) {
  if (!topic) return null;

  const topics = {
    'edge-ai': {
      title: 'Understanding Edge AI & Local Inference',
      icon: Cpu,
      summary: 'Edge AI means machine learning models run directly on your device rather than uploading data to cloud servers.',
      sections: [
        {
          heading: 'Why Local Inference Matters for Security',
          content: 'Traditional antivirus platforms upload suspicious files to cloud analysis centers, introducing response latency and potential privacy leaks. DiskGuard AI runs a compact behavioral classification model locally on your device CPU/NPU in 18 milliseconds.'
        },
        {
          heading: 'Metadata Vectors vs File Contents',
          content: 'DiskGuard AI never reads your private documents, photos, or code files. It analyzes low-level disk I/O metadata vectors: read/write rates, file modification counts, rename frequency, and block buffer entropy.'
        }
      ]
    },
    'baseline': {
      title: 'Understanding Behavioral Baselining',
      icon: Compass,
      summary: 'A behavioral baseline is the learned mathematical pattern of what normal disk activity looks like for your machine.',
      sections: [
        {
          heading: 'Why Behavior Outperforms Signatures',
          content: 'New zero-day ransomware threats constantly obfuscate their code binary signatures to bypass traditional antivirus scanners. However, ransomware MUST read, encrypt, and overwrite files to operate. DiskGuard AI detects the behavioral pattern regardless of binary signature.'
        },
        {
          heading: 'Learning & Deviation Tracking',
          content: 'DiskGuard AI observes everyday tasks (browsing, code compilation, backup runs) to establish baseline thresholds. When a process deviates significantly (e.g. +1399% write velocity), an anomaly alert is flagged.'
        }
      ]
    },
    'anomaly-score': {
      title: 'Understanding Anomaly Score vs Risk Score',
      icon: Activity,
      summary: 'Anomaly Score measures mathematical deviation from normal baseline, while Risk Score estimates security threat probability.',
      sections: [
        {
          heading: 'Anomaly Score (0–100)',
          content: 'Measures how different current disk operations are compared to learned baseline behavior. A large backup scan will generate a high Anomaly Score because it reads many files, but may have a low Risk Score if no mass renames or entropy spikes occur.'
        },
        {
          heading: 'Risk Score (0–100)',
          content: 'Combines multiple correlated behavioral signals (high write velocity + mass file renames + Shannon entropy shift) to compute the actual probability of ransomware or malicious behavior.'
        }
      ]
    },
    'ransomware': {
      title: 'Understanding Ransomware Disk Behavior Patterns',
      icon: ShieldCheck,
      summary: 'Ransomware exhibits distinct sequential disk operation signatures during file encryption phases.',
      sections: [
        {
          heading: 'Key Ransomware Indicators',
          content: '1. Rapid file read & write velocity (encrypting file handles in parallel).\n2. Mass file extension renames (appending .locked, .crypto).\n3. Sharp increase in file buffer Shannon entropy (encrypted data has maximum mathematical randomness).'
        },
        {
          heading: 'Correlated Event Containment',
          content: 'Instead of alerting on every individual file write, DiskGuard AI groups hundreds of raw operations into a single correlated incident (e.g. INC-00124) for rapid investigation and sandbox containment.'
        }
      ]
    },
    'entropy': {
      title: 'Understanding Shannon Buffer Entropy',
      icon: Lock,
      summary: 'Shannon entropy measures the mathematical randomness of byte buffers written to disk.',
      sections: [
        {
          heading: 'Plain Text vs Encrypted Entropy',
          content: 'Normal files (text documents, source code, HTML) have predictable byte patterns and lower entropy (1.0–2.5 Shannon). Encrypted or compressed files have maximum byte randomness (5.0–8.0 Shannon).'
        },
        {
          heading: 'Entropy Shift Detection',
          content: 'When an unknown process overwrites thousands of low-entropy document files with high-entropy encrypted blocks within seconds, DiskGuard AI flags an immediate entropy shift deviation.'
        }
      ]
    }
  };

  const curr = topics[topic] || topics['edge-ai'];
  const IconComp = curr.icon;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <IconComp size={16} />
            </div>
            <div>
              <span className="badge badge-ai">EDUCATIONAL GUIDE</span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {curr.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {curr.summary}
        </div>

        {/* Detail Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {curr.sections.map((sec, idx) => (
            <div key={idx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {sec.heading}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', textAlign: 'right' }}>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: '0.775rem' }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
