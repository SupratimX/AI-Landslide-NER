import React from 'react';

export default function TelemetryHud({ location, onOpenBroadcast }) {
  if (!location) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Select a hotspot on the GIS map to view real-time telemetry.</p>
      </div>
    );
  }

  const telemetry = location.latest_telemetry || {};
  const risk = location.latest_risk || { risk_probability: 0.1, alert_status: 'none' };
  const riskPct = Math.round((risk.risk_probability || 0) * 100);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'emergency': return 'badge-emergency';
      case 'warning': return 'badge-warning';
      case 'watch': return 'badge-watch';
      default: return 'badge-safe';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            {location.state} • {location.district}
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#fff' }}>
            {location.region_name}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Terrain: {location.terrain_type || 'Steep Folded Strata'}
          </p>
        </div>
        <span className={getStatusBadgeClass(risk.alert_status)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {risk.alert_status}
        </span>
      </div>

      {/* AI Risk Probability Progress Meter */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            AI Landslide Risk Probability (ONNX Model)
          </span>
          <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: riskPct > 75 ? 'var(--color-emergency)' : riskPct > 50 ? 'var(--color-warning)' : 'var(--color-safe)' }}>
            {riskPct}%
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${riskPct}%`,
              height: '100%',
              background: riskPct > 75 ? 'linear-gradient(90deg, #f97316, #ef4444)' : riskPct > 50 ? 'linear-gradient(90deg, #eab308, #f97316)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
              transition: 'width 0.6s ease',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Key Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* Rainfall 24h */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rainfall (24h)</div>
          <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {telemetry.rainfall_mm ?? 0} <span style={{ fontSize: '11px', fontWeight: 400 }}>mm</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            72h Acc: {telemetry.rainfall_72h_mm ?? 0} mm
          </div>
        </div>

        {/* Soil Moisture */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Soil Moisture</div>
          <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
            {telemetry.soil_moisture ?? 0} <span style={{ fontSize: '11px', fontWeight: 400 }}>%</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Pore Press: {telemetry.pore_water_pressure ?? 0} kPa
          </div>
        </div>

        {/* Slope Angle */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Slope Gradient</div>
          <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
            {telemetry.slope_angle ?? 0} <span style={{ fontSize: '11px', fontWeight: 400 }}>deg</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Relief: High Mountain
          </div>
        </div>

        {/* Vulnerability Index */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GSI Fragility Index</div>
          <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: '#c084fc', marginTop: '4px' }}>
            {location.vulnerability_index ?? 0} <span style={{ fontSize: '11px', fontWeight: 400 }}>/100</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Source: NGDR Lithology
          </div>
        </div>
      </div>

      {/* Action Trigger Button */}
      <button
        onClick={() => onOpenBroadcast(location)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: risk.alert_status === 'emergency' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
          color: '#fff',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
        }}
      >
        <span>Broadcast Multilingual Emergency Alert (SMS/Voice)</span>
      </button>
    </div>
  );
}
