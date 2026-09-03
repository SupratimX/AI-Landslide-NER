import React from 'react';

export default function PredictiveAnalytics({ historyData }) {
  if (!historyData || !historyData.telemetry_history || historyData.telemetry_history.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Select a hotspot to render predictive risk analytics and 7-day hydro-meteorological curves.
        </p>
      </div>
    );
  }

  const { telemetry_history, risk_history, location } = historyData;

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
            Predictive Risk & Hydrological Timeline
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            7-Day Precipitation & Soil Saturation Infiltration Curve for {location.region_name}
          </p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
          24h AI Horizon
        </span>
      </div>

      {/* SVG Multi-axis Sparkline Graph */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ color: '#38bdf8' }}>● Rainfall (mm)</span>
          <span style={{ color: '#34d399' }}>● Soil Moisture (%)</span>
          <span style={{ color: '#f87171' }}>● Landslide Probability</span>
        </div>

        {/* Custom Responsive SVG Chart */}
        <div style={{ width: '100%', height: '140px' }}>
          <svg width="100%" height="100%" viewBox="0 0 500 120" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
            <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

            {/* Rainfall Bar / Area */}
            {telemetry_history.map((pt, i) => {
              const x = (i / Math.max(1, telemetry_history.length - 1)) * 480 + 10;
              const h = Math.min(100, (pt.rainfall_mm / 160) * 100);
              const y = 110 - h;
              return (
                <rect
                  key={'bar-' + i}
                  x={x - 8}
                  y={y}
                  width="16"
                  height={h}
                  fill="rgba(56, 189, 248, 0.35)"
                  rx="3"
                />
              );
            })}

            {/* Soil Moisture Line */}
            <polyline
              fill="none"
              stroke="#34d399"
              strokeWidth="2.5"
              points={telemetry_history
                .map((pt, i) => {
                  const x = (i / Math.max(1, telemetry_history.length - 1)) * 480 + 10;
                  const y = 110 - ((pt.soil_moisture || 40) / 100) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Risk Probability Line */}
            {risk_history && risk_history.length > 0 && (
              <polyline
                fill="none"
                stroke="#f87171"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                points={risk_history
                  .map((pt, i) => {
                    const x = (i / Math.max(1, risk_history.length - 1)) * 480 + 10;
                    const y = 110 - (pt.risk_probability || 0.1) * 100;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>7 Days Ago</span>
          <span>3 Days Ago</span>
          <span>Today (Live)</span>
          <span style={{ color: '#38bdf8' }}>+24h Predictive Forecast</span>
        </div>
      </div>

      {/* Geotechnical Drivers Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Infiltration Threshold</div>
          <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
            CRITICAL ({'>'}85mm)
          </div>
        </div>
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pore Water Pressure</div>
          <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
            {telemetry_history[telemetry_history.length - 1]?.pore_water_pressure || 24.5} kPa
          </div>
        </div>
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Safety Factor ($FS$)</div>
          <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginTop: '2px' }}>
            0.88 (Unstable)
          </div>
        </div>
      </div>
    </div>
  );
}
