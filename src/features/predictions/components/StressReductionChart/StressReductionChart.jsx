import { useRef, useEffect, useMemo } from 'react';
import { TrendingDown, Droplets } from 'lucide-react';

export default function StressReductionChart({ plan, previewActive, sensorLectura }) {
  const canvasRef = useRef(null);

  const data = useMemo(() => {
    const days = 14;
    const points = [];
    const humedadInicial = plan?.humedad_actual || sensorLectura?.humedad || 18;
    const umbral = plan?.umbral_cultivo || 20;

    for (let i = 0; i < days; i++) {
      const progress = i / (days - 1);
      const baseline = Math.max(0, humedadInicial - progress * humedadInicial * 1.2);
      const withPlan = previewActive
        ? Math.min(umbral * 1.5, humedadInicial + (umbral - humedadInicial) * 0.8 + progress * 5)
        : baseline;
      points.push({ day: i + 1, baseline: Math.round(baseline * 10) / 10, withPlan: Math.round(withPlan * 10) / 10 });
    }
    return points;
  }, [plan, previewActive, sensorLectura]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const allVals = data.flatMap((d) => [d.baseline, d.withPlan]);
    const maxVal = Math.max(...allVals, 30);
    const minVal = Math.max(0, Math.min(...allVals) - 5);

    const xScale = (i) => pad.left + (i / (data.length - 1)) * chartW;
    const yScale = (v) => pad.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
    }

    // Threshold line
    const umbral = plan?.umbral_cultivo || 20;
    const thresholdY = yScale(umbral);
    ctx.strokeStyle = '#ba1a1a';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, thresholdY);
    ctx.lineTo(pad.left + chartW, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ba1a1a';
    ctx.font = '10px Manrope, sans-serif';
    ctx.fillText(`Umbral: ${umbral}%`, pad.left + 4, thresholdY - 4);

    // Baseline line (red)
    ctx.strokeStyle = '#ba1a1a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.baseline);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // With plan line (green) - only if preview active
    if (previewActive) {
      ctx.strokeStyle = '#0f5238';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = xScale(i);
        const y = yScale(d.withPlan);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill under green line
      ctx.fillStyle = 'rgba(15,82,56,0.08)';
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = xScale(i);
        const y = yScale(d.withPlan);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(xScale(data.length - 1), pad.top + chartH);
      ctx.lineTo(xScale(0), pad.top + chartH);
      ctx.closePath();
      ctx.fill();
    }

    // Axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Manrope, sans-serif';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(maxVal - (i / 4) * (maxVal - minVal));
      const y = pad.top + (i / 4) * chartH;
      ctx.fillText(`${val}%`, 2, y + 3);
    }
    ctx.fillText('Dias de proyeccion', width / 2 - 40, height - 2);

    // Legend
    const legendY = pad.top + 2;
    ctx.fillStyle = '#ba1a1a';
    ctx.fillRect(pad.left, legendY, 12, 3);
    ctx.fillStyle = '#374151';
    ctx.font = '10px Manrope, sans-serif';
    ctx.fillText('Sin plan', pad.left + 16, legendY + 4);

    if (previewActive) {
      ctx.fillStyle = '#0f5238';
      ctx.fillRect(pad.left + 70, legendY, 12, 3);
      ctx.fillStyle = '#374151';
      ctx.fillText('Con plan', pad.left + 86, legendY + 4);
    }
  }, [data, previewActive, plan]);

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)' }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown size={18} style={{ color: '#0f5238' }} />
        <h3 className="text-sm font-bold text-[#1A1C1A]">Proyeccion de Estres Hidrico</h3>
        {previewActive && (
          <span className="text-xs px-2 py-0.5 rounded-full text-[#0f5238]" style={{ background: 'rgba(15,82,56,0.1)' }}>
            Beneficio previsualizado
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 220 }}
      />
      <div className="flex items-center gap-1 mt-2 text-xs text-[#6b7280]">
        <Droplets size={12} />
        <span>
          Humedad inicial: {plan?.humedad_actual || sensorLectura?.humedad || 18}% —
          Umbral critico: {plan?.umbral_cultivo || 20}%
        </span>
      </div>
    </div>
  );
}
