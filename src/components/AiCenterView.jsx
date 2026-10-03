import React, { useState } from 'react';
import { Cpu, BarChart2, CheckCircle2, ThumbsUp, ThumbsDown, Layers, Activity, ShieldCheck, AlertTriangle, Info, HardDrive, ArrowRight, HelpCircle, Play } from 'lucide-react';
import AiActivityStream from './AiActivityStream';

export default function AiCenterView({
  scenario = 'none',
  data = null,
  activeDrive = null,
  onSelectScenario,
  onOpenAddDrive
}) {
  const [feedback, setFeedback] = useState(null);

  // Safe Fallback Data Structure to ensure the page NEVER renders blank
  const safeData = (data && data.features && data.features.length > 0) ? data : {
    state: 'WAITING FOR DATA',
    aiStateTag: 'NO TELEMETRY',
    aiStateVariant: 'neutral',
    riskScore: 18,
    anomalyScore: 12,
    confidence: 94,
    latencyMs: 18,
    modelVersion: 'Behavioral Model v0.1 DEMO',
    inferenceLocation: 'Simulated On-Device (Local Execution)',
    signalsEvaluated: 6,
    dataMode: 'SIMULATED TELEMETRY',
    classification: 'Normal',
    features: [
      { key: 'writeFreq', name: 'Write Frequency', baseline: '42 ops/min', current: '48 ops/min', delta: '+14%', contribution: 'Nominal', val: 18 },
      { key: 'readFreq', name: 'Read Activity Pattern', baseline: '120 ops/min', current: '142 ops/min', delta: '+18%', contribution: 'Nominal', val: 20 },
      { key: 'modRate', name: 'File Modification Density', baseline: '18 ops/min', current: '22 ops/min', delta: '+22%', contribution: 'Nominal', val: 15 },
      { key: 'renameVel', name: 'Rename Velocity Index', baseline: '4 ops/min', current: '6 ops/min', delta: '+50%', contribution: 'Nominal', val: 8 },
      { key: 'entropyShift', name: 'Buffer Shannon Entropy', baseline: '1.2 Shannon', current: '1.3 Shannon', delta: '+8%', contribution: 'Nominal', val: 12 },
      { key: 'irregularAccess', name: 'Access Irregularity Vector', baseline: '5%', current: '8%', delta: '+60%', contribution: 'Nominal', val: 10 }
    ],
    featureImportance: [
      { name: 'Write Frequency Vector', weight: 32, label: '48 ops/min' },
      { name: 'File Modification Density', weight: 24, label: '22 ops/min' },
      { name: 'Rename Velocity Index', weight: 18, label: '6 renames' },
      { name: 'Buffer Shannon Entropy', weight: 12, label: '1.3 Shannon' },
      { name: 'Access Irregularity Vector', weight: 9, label: '8% path variance' },
      { name: 'Read Activity Pattern', weight: 5, label: '142 ops/min' }
    ],
    aiAssessment: {
      title: 'Normal Behavioral Workload (Simulation)',
      summary: 'Disk activity is currently within the expected behavioral range. No significant combination of abnormal signals has been detected.',
      reasons: [
        { num: '01', title: 'Baseline Alignment', desc: 'Simulated operations match normal learned machine operation vectors.' }
      ]
    },
    activityLogs: [
      { time: new Date().toLocaleTimeString(), text: 'Disk activity received and evaluated by Edge AI', type: 'info' }
    ]
  };

  const isAttack = scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy';

  // Classification display mapping
  const classificationLabel = scenario === 'ransomware'
    ? 'Ransomware-like behavior'
    : scenario === 'mass-rename' || scenario === 'high-entropy'
    ? 'Anomalous behavior'
    : 'Normal';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* 1. PAGE HEADER */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex'
          }}>
            <Cpu size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                EDGE AI
              </h2>
              {activeDrive && (
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.15rem 0.45rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <HardDrive size={13} /> ANALYZING: {activeDrive.device} {activeDrive.name}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Behavioral intelligence for local disk activity. DiskGuard analyzes disk behavior using behavioral signals and Edge AI to identify activity that differs from the established baseline.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-warning" style={{ fontSize: '0.675rem', fontWeight: '700' }}>
            DEMO MODE
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
            Simulated AI inference
          </span>
        </div>
      </div>

      {/* 2. CURRENT AI STATUS GRID */}
      <div className="grid-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
        <div className="dg-card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>STATUS</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--success)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="status-dot success"></span> Running
          </div>
        </div>

        <div className="dg-card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MODEL</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            {safeData.modelVersion || 'Behavioral v0.1'}
          </div>
        </div>

        <div className="dg-card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>INFERENCE</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)', marginTop: '0.15rem' }}>
            Local / On Device
          </div>
        </div>

        <div className="dg-card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LATENCY</div>
          <div className="mono" style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            {safeData.latencyMs || 18} ms
          </div>
        </div>

        <div className="dg-card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SIGNALS</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            6 Vectors
          </div>
        </div>

        <div className="dg-card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CLASSIFICATION</div>
          <div style={{ fontSize: '0.825rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : 'var(--success)', marginTop: '0.15rem' }}>
            {classificationLabel}
          </div>
        </div>
      </div>

      {/* 3. AI PIPELINE VISUALIZATION (HOW EDGE AI WORKS) */}
      <div className="dg-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.04em' }}>
          HOW EDGE AI WORKS — PIPELINE ARCHITECTURE
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '0.5rem',
          alignItems: 'center',
          fontSize: '0.725rem'
        }}>
          {/* Step 1 */}
          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' }}>1. DISK ACTIVITY</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.2rem' }}>Raw Storage IO</div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Reads, Writes, Mods, Renames</div>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' }}>2. FEATURES</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.2rem' }}>Feature Vectors</div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>6 Behavioral Signals</div>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' }}>3. EDGE AI</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent)', marginTop: '0.2rem' }}>Model v0.1</div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Local Inference</div>
          </div>

          {/* Step 4 */}
          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>4. ANOMALY</div>
            <div className="mono" style={{ fontSize: '0.85rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
              {safeData.anomalyScore} / 100
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Deviation Index</div>
          </div>

          {/* Step 5 */}
          <div style={{ background: isAttack ? 'var(--danger-bg)' : '#F0FDF4', border: `1px solid ${isAttack ? 'var(--danger-border)' : '#DCFCE7'}`, borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : '#15803D', textTransform: 'uppercase' }}>5. RISK</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : '#15803D', marginTop: '0.2rem' }}>
              {isAttack ? 'HIGH' : 'LOW'}
            </div>
            <div style={{ fontSize: '0.675rem', color: isAttack ? 'var(--danger)' : '#15803D', marginTop: '0.15rem' }}>Security Posture</div>
          </div>

          {/* Step 6 */}
          <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>6. EXPLANATION</div>
            <div style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {isAttack ? 'Anomaly Alert' : 'Baseline Match'}
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Explainable AI</div>
          </div>
        </div>
      </div>

      {/* 4. ANOMALY SCORE & RISK SCORE CARDS */}
      <div className="grid-2">
        {/* Anomaly Score Card */}
        <div className="dg-card" style={{ padding: '1.25rem', border: isAttack ? '1px solid var(--danger-border)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ANOMALY SCORE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span className="mono" style={{ fontSize: '1.75rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {safeData.anomalyScore}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
                <span className={`badge ${isAttack ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.725rem' }}>
                  {isAttack ? 'Anomalous' : 'Normal'}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', maxWidth: '160px' }}>
              <strong>Tooltip:</strong> How different current drive behavior is from normal baseline.
            </div>
          </div>

          <div className="progress-bar-bg" style={{ height: '8px', marginBottom: '0.5rem' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${safeData.anomalyScore}%`,
                background: isAttack ? 'var(--danger)' : 'var(--accent)'
              }}
            />
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            {isAttack
              ? 'Current behavior differs significantly from the established baseline pattern.'
              : 'Current behavior is close to the established machine baseline.'}
          </div>
        </div>

        {/* Risk Score Card */}
        <div className="dg-card" style={{ padding: '1.25rem', border: isAttack ? '1px solid var(--danger-border)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                RISK SCORE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span className="mono" style={{ fontSize: '1.75rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {safeData.riskScore}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
                <span className={`badge ${isAttack ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.725rem' }}>
                  {isAttack ? 'Elevated Security Threat' : 'Low Risk'}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', maxWidth: '160px' }}>
              <strong>Tooltip:</strong> How concerning the behavior is from a security perspective.
            </div>
          </div>

          <div className="progress-bar-bg" style={{ height: '8px', marginBottom: '0.5rem' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${safeData.riskScore}%`,
                background: isAttack ? 'var(--danger)' : 'var(--success)'
              }}
            />
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            {isAttack
              ? 'Current activity indicates potential unauthorized process file operations.'
              : 'Current activity does not indicate significant security concern.'}
          </div>
        </div>
      </div>

      {/* 5. AI EXPLANATION SECTION */}
      <div className="dg-card" style={{
        padding: '1.25rem',
        border: isAttack ? '1px solid var(--danger-border)' : '1px solid var(--border)',
        background: isAttack ? '#FEF2F2' : '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: isAttack ? 'var(--danger)' : 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            WHY DID THE AI MAKE THIS DECISION? (EXPLAINABLE AI)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Confidence:</span>
            <span className="mono" style={{ fontSize: '0.775rem', fontWeight: '800', color: 'var(--text-primary)' }}>{safeData.confidence || 94}%</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>SIMULATED</span>
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
          {safeData.aiAssessment?.summary || 'Disk activity is currently within the expected behavioral range.'}
        </div>

        {safeData.aiAssessment?.reasons && safeData.aiAssessment.reasons.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginTop: '0.75rem' }}>
            {safeData.aiAssessment.reasons.map((r, idx) => (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.7)', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {r.num}. {r.title}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {r.desc}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. BEHAVIORAL SIGNALS TABLE */}
      <div className="dg-card" style={{ padding: '1.25rem' }}>
        <div className="card-header" style={{ marginBottom: '0.75rem' }}>
          <div className="card-title-group">
            <Layers size={16} style={{ color: 'var(--accent)' }} />
            <span className="card-title">BEHAVIORAL SIGNALS (6 FEATURE VECTORS)</span>
          </div>
          <span className="badge badge-neutral">REAL-TIME FEATURE EXTRACTION</span>
        </div>

        <div className="dg-table-container">
          <table className="dg-table">
            <thead>
              <tr>
                <th>Behavioral Signal</th>
                <th>Current Value</th>
                <th>Learned Baseline</th>
                <th>Deviation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {safeData.features.map((feat) => {
                const isCrit = feat.contribution === 'Critical';
                const isHigh = feat.contribution === 'High';
                return (
                  <tr key={feat.key || feat.name}>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{feat.name}</td>
                    <td className="mono" style={{ color: isCrit || isHigh ? 'var(--danger)' : 'var(--text-primary)', fontWeight: '700' }}>
                      {feat.current}
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{feat.baseline}</td>
                    <td className="mono" style={{ color: isCrit || isHigh ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '700' }}>
                      {feat.delta}
                    </td>
                    <td>
                      {isCrit ? (
                        <span className="badge badge-danger">Critical Deviation</span>
                      ) : isHigh ? (
                        <span className="badge badge-warning">High Shift</span>
                      ) : (
                        <span className="badge badge-success">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. FEATURE IMPORTANCE & ACTIVITY STREAM GRID */}
      <div className="grid-main-side">
        {/* Feature Importance Bar Visualization */}
        <div className="dg-card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <div className="card-title-group">
              <BarChart2 size={16} style={{ color: 'var(--accent)' }} />
              <span className="card-title">WHAT INFLUENCED THE AI?</span>
            </div>
            <span className="badge badge-neutral">SIMULATED FEATURE CONTRIBUTION</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {safeData.featureImportance.map((feat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600' }}>{feat.name}</span>
                  <span className="mono" style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                    {feat.weight}% ({feat.label})
                  </span>
                </div>
                <div className="progress-bar-bg" style={{ height: '7px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${feat.weight}%`,
                      background: feat.weight > 75 ? 'var(--danger)' : feat.weight > 40 ? 'var(--warning)' : 'var(--accent)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Activity Stream & Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AiActivityStream logs={safeData.activityLogs} />

          {/* Educational Explainers */}
          <div className="dg-card" style={{ padding: '1rem', background: '#F8FAFC' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} /> WHAT IS EDGE AI?
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: '0 0 0.75rem 0' }}>
              Edge AI means the AI analysis is designed to run close to where the data is generated — on the device — rather than requiring the core inference process to run in the cloud.
            </p>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              WHY DOES DISKGUARD USE IT?
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0 }}>
              Local behavioral analysis can reduce dependence on cloud connectivity and support fast analysis of disk activity.
            </p>
            <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'flex-end' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>SIMULATED EDGE AI EXPERIENCE</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
