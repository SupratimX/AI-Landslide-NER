import React, { useState, useEffect } from 'react';
import { predictRisk } from '../api_client/api';

export default function SimulationControls() {
  const [rainfall, setRainfall] = useState(130);
  const [soilMoisture, setSoilMoisture] = useState(78);
  const [slope, setSlope] = useState(42);
  const [vulnerability, setVulnerability] = useState(85);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await predictRisk({
        rainfall_24h_mm: parseFloat(rainfall),
        rainfall_72h_mm: parseFloat(rainfall) * 2.3,
        soil_moisture_pct: parseFloat(soilMoisture),
        slope_angle_deg: parseFloat(slope),
        vulnerability_index: parseFloat(vulnerability)
      });
      setPrediction(res.prediction);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 200);
    return () => clearTimeout(timer);
  }, [rainfall, soilMoisture, slope, vulnerability]);

  const probPct = Math.round((prediction?.risk_probability || 0) * 100);

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
            Interactive AI Risk Sandbox
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Simulate extreme monsoonal cloudbursts & test live ONNX inference
          </p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
          Real-time ONNX
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
        {/* Rainfall Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>24h Rain Storm:</span>
            <span className="font-mono" style={{ color: '#38bdf8', fontWeight: 700 }}>{rainfall} mm</span>
          </div>
          <input
            type="range"
            min="0"
            max="300"
            value={rainfall}
            onChange={(e) => setRainfall(e.target.value)}
            style={{ width: '100%', accentColor: '#38bdf8' }}
          />
        </div>

        {/* Soil Moisture Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Soil Saturation:</span>
            <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>{soilMoisture} %</span>
          </div>
          <input
            type="range"
            min="15"
            max="98"
            value={soilMoisture}
            onChange={(e) => setSoilMoisture(e.target.value)}
            style={{ width: '100%', accentColor: '#34d399' }}
          />
        </div>

        {/* Slope Angle Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Slope Gradient:</span>
            <span className="font-mono" style={{ color: '#fbbf24', fontWeight: 700 }}>{slope} deg</span>
          </div>
          <input
            type="range"
            min="15"
            max="65"
            value={slope}
            onChange={(e) => setSlope(e.target.value)}
            style={{ width: '100%', accentColor: '#fbbf24' }}
          />
        </div>

        {/* Geological Vulnerability */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>GSI Fragility:</span>
            <span className="font-mono" style={{ color: '#c084fc', fontWeight: 700 }}>{vulnerability}/100</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={vulnerability}
            onChange={(e) => setVulnerability(e.target.value)}
            style={{ width: '100%', accentColor: '#c084fc' }}
          />
        </div>
      </div>

      {/* Real-time Output Banner */}
      {prediction && (
        <div style={{
          background: probPct > 80 ? 'rgba(239, 68, 68, 0.15)' : probPct > 50 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${probPct > 80 ? 'rgba(239, 68, 68, 0.4)' : probPct > 50 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Live ONNX Inference Output
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
              Level: <span style={{ textTransform: 'uppercase', color: probPct > 80 ? '#fca5a5' : probPct > 50 ? '#fdba74' : '#86efac' }}>{prediction.alert_status}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Driver: {prediction.primary_driver}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 900, color: probPct > 80 ? '#ef4444' : probPct > 50 ? '#f97316' : '#10b981' }}>
              {probPct}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Risk Probability</div>
          </div>
        </div>
      )}
    </div>
  );
}
