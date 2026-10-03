import React, { useEffect, useRef } from 'react';
import { Compass } from 'lucide-react';

export default function BehaviorRadar({ scenario }) {
  const canvasRef = useRef(null);

  const isNone = scenario === 'none';
  const isAttack = scenario === 'ransomware' || scenario === 'mass-rename' || scenario === 'high-entropy';

  const getMetrics = () => {
    if (isNone) {
      return { read: 0, write: 0, modification: 0, rename: 0, entropy: 0, irregularity: 0 };
    }
    switch (scenario) {
      case 'ransomware':
        return { read: 85, write: 95, modification: 90, rename: 88, entropy: 92, irregularity: 80 };
      case 'mass-rename':
        return { read: 45, write: 70, modification: 80, rename: 96, entropy: 30, irregularity: 65 };
      case 'high-entropy':
        return { read: 40, write: 88, modification: 75, rename: 25, entropy: 98, irregularity: 70 };
      default:
        return { read: 20, write: 25, modification: 18, rename: 12, entropy: 15, irregularity: 10 };
    }
  };

  const baselineMetrics = isNone 
    ? { read: 0, write: 0, modification: 0, rename: 0, entropy: 0, irregularity: 0 }
    : { read: 20, write: 20, modification: 15, rename: 10, entropy: 12, irregularity: 10 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    ctx.clearRect(0, 0, width, height);

    const labels = ['Read Activity', 'Write Activity', 'File Modification', 'File Renaming', 'Entropy Change', 'Access Irregularity'];
    const currentData = getMetrics();
    const dataKeys = ['read', 'write', 'modification', 'rename', 'entropy', 'irregularity'];
    const totalSides = labels.length;
    const angleStep = (Math.PI * 2) / totalSides;

    // Background web grid (clean light borders)
    const webLevels = [0.25, 0.5, 0.75, 1.0];
    webLevels.forEach((level) => {
      ctx.beginPath();
      for (let i = 0; i < totalSides; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius * level);
        const y = centerY + Math.sin(angle) * (radius * level);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#E3E6EA';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Axis lines and labels
    for (let i = 0; i < totalSides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#ECEEF1';
      ctx.stroke();

      const labelRadius = radius + 22;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;

      ctx.font = '500 10px Inter, sans-serif';
      ctx.fillStyle = '#5F6670';
      ctx.textAlign = Math.abs(labelX - centerX) < 10 ? 'center' : labelX > centerX ? 'left' : 'right';
      ctx.textBaseline = Math.abs(labelY - centerY) < 10 ? 'middle' : labelY > centerY ? 'top' : 'bottom';
      ctx.fillText(labels[i], labelX, labelY);
    }

    const drawPolygon = (values, strokeColor, fillColor) => {
      ctx.beginPath();
      dataKeys.forEach((key, i) => {
        const val = values[key] / 100;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius * val);
        const y = centerY + Math.sin(angle) * (radius * val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Draw baseline (Gray)
    drawPolygon(baselineMetrics, '#64748B', 'rgba(100, 116, 139, 0.08)');

    // Draw current telemetry (Indigo for normal, Red for attack)
    if (isAttack) {
      drawPolygon(currentData, '#C53030', 'rgba(197, 48, 48, 0.12)');
    } else {
      drawPolygon(currentData, '#635BFF', 'rgba(99, 91, 255, 0.10)');
    }

  }, [scenario]);

  return (
    <div className="dg-card">
      <div className="card-header">
        <div className="card-title-group">
          <Compass size={16} style={{ color: 'var(--accent)' }} />
          <span className="card-title">Behavior Radar</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
          <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ● Baseline
          </span>
          <span style={{ color: isAttack ? 'var(--danger)' : 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ● Current
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0.25rem 0' }}>
        <canvas ref={canvasRef} width={320} height={260} />
      </div>
    </div>
  );
}

