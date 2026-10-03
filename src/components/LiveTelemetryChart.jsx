import React, { useState, useEffect, useRef } from 'react';
import { Activity, Info } from 'lucide-react';

export default function LiveTelemetryChart({ scenario, unifiedState }) {
  const [timeRange, setTimeRange] = useState('5m');
  const canvasRef = useRef(null);

  const isLive = unifiedState ? unifiedState.telemetry.isLive : (scenario !== 'none');
  const isAttack = unifiedState 
    ? (unifiedState.code === 'MONITORING_ACTIVE_ELEVATED' || unifiedState.code === 'MONITORING_ACTIVE_HIGH_RISK' || unifiedState.code === 'INCIDENT_INVESTIGATION') 
    : (scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw horizontal grid lines
    const gridRows = 4;
    ctx.strokeStyle = '#ECEEF1';
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!isLive) {
      // Draw centered empty state message when no telemetry source is connected
      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'center';
      ctx.fillText('No Active Storage Telemetry Stream — Start Monitoring or Select Monitored Drive', width / 2, height / 2 + 4);
      return;
    }

    // Points count for simulation
    const pointsCount = 40;
    const readPoints = [];
    const writePoints = [];

    for (let i = 0; i < pointsCount; i++) {
      const x = (width / (pointsCount - 1)) * i;
      let readY = height - 20 - Math.random() * 15;
      let writeY = height - 25 - Math.random() * 20;

      if (isAttack && i > 22) {
        writeY = height - 70 - Math.random() * 35;
      }

      readPoints.push({ x, y: readY });
      writePoints.push({ x, y: writeY });
    }

    // Draw Write line
    ctx.beginPath();
    writePoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = isAttack ? '#C53030' : '#2563EB';
    ctx.lineWidth = 1.75;
    ctx.stroke();

    // Draw Read line
    ctx.beginPath();
    readPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Anomaly Event Markers
    if (isAttack) {
      const eventMarkers = [
        { index: 24, label: 'Write Spike', type: 'warning' },
        { index: 30, label: 'Mass Modification', type: 'warning' },
        { index: 36, label: 'Anomaly Flagged', type: 'danger' }
      ];

      eventMarkers.forEach((m) => {
        const pt = writePoints[m.index];
        if (!pt) return;

        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x, 15);
        ctx.strokeStyle = m.type === 'danger' ? 'rgba(197, 48, 48, 0.4)' : 'rgba(161, 98, 7, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = m.type === 'danger' ? '#C53030' : '#A16207';
        ctx.fill();

        ctx.font = '600 9px Inter, sans-serif';
        ctx.fillStyle = m.type === 'danger' ? '#C53030' : '#A16207';
        ctx.textAlign = 'center';
        ctx.fillText(`▲ ${m.label}`, pt.x, 10);
      });
    }

  }, [scenario, isLive, isAttack, timeRange]);

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Activity size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Disk Activity Telemetry</span>
          <div className="tooltip-container">
            <Info size={13} style={{ color: 'var(--text-muted)' }} />
            <div className="tooltip-text">
              Real-time IOPS & MB/s disk throughput vectors sampled by local kernel filter hooks.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ● Read throughput
            </span>
            <span style={{ color: isAttack ? 'var(--danger)' : 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ● Write throughput
            </span>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.15rem' }}>
            {['1m', '5m', '15m', '1h'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  background: timeRange === range ? '#FFFFFF' : 'transparent',
                  color: timeRange === range ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: timeRange === range ? '1px solid var(--border)' : 'none',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.7rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: timeRange === range ? '600' : '400',
                  boxShadow: timeRange === range ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        <span>Read: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{!isLive ? '—' : '12.4 MB/s'}</strong></span>
        <span>Write: <strong className="mono" style={{ color: isAttack ? 'var(--danger)' : 'var(--text-primary)' }}>{!isLive ? '—' : isAttack ? '98.4 MB/s' : '18.2 MB/s'}</strong></span>
        <span>IOPS: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{!isLive ? '—' : isAttack ? '4,890 ops/sec' : '340 ops/sec'}</strong></span>
        <span>Burstiness: <strong style={{ color: !isLive ? 'var(--text-muted)' : isAttack ? 'var(--danger)' : 'var(--success)' }}>{!isLive ? 'STANDBY' : isAttack ? 'ELEVATED' : 'NOMINAL'}</strong></span>
      </div>

      <div style={{ width: '100%', height: '140px' }}>
        <canvas ref={canvasRef} width={800} height={140} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

