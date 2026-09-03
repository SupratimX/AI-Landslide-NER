import React, { useState } from 'react';
import { verifyCitizenReport } from '../api_client/api';

export default function CitizenTriageQueue({ reports, onRefresh }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleAction = async (reportId, action) => {
    setUpdatingId(reportId);
    try {
      await verifyCitizenReport(reportId, {
        verified_by_authority: true,
        action_taken: action
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error updating report status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getHazardBadge = (type) => {
    switch (type) {
      case 'mudslide': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5', label: 'Mudslide / Flow' };
      case 'tension_crack': return { bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74', label: 'Tension Crack' };
      case 'rockfall': return { bg: 'rgba(234, 179, 8, 0.2)', text: '#fde047', label: 'Rockfall' };
      default: return { bg: 'rgba(6, 182, 212, 0.2)', text: '#67e8f9', label: 'Debris Flow' };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Citizen Hazard AI Triage Queue</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Offline-first reports validated by on-device Edge ONNX models</p>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)' }}>
          {reports?.length || 0} Reports
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(!reports || reports.length === 0) ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: 'auto' }}>
            No pending citizen hazard submissions.
          </p>
        ) : (
          reports.map((rep) => {
            const badge = getHazardBadge(rep.hazard_type);
            const severityPct = Math.round((rep.onnx_severity_score || 0) * 100);
            return (
              <div
                key={rep.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: rep.onnx_severity_score > 0.8 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Edge ONNX Score:</span>
                    <span className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: severityPct > 80 ? 'var(--color-emergency)' : 'var(--color-warning)' }}>
                      {severityPct}%
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {rep.description || 'Citizen captured hazard condition on slope.'}
                </p>

                {/* Coordinates & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>GPS: {rep.latitude?.toFixed(4)}, {rep.longitude?.toFixed(4)}</span>
                  <span>Status: <strong style={{ color: rep.action_taken === 'sdrf_dispatched' ? '#34d399' : '#fbbf24' }}>{rep.action_taken}</strong></span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleAction(rep.id, 'sdrf_dispatched')}
                    disabled={updatingId === rep.id || rep.action_taken === 'sdrf_dispatched'}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: rep.action_taken === 'sdrf_dispatched' ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: rep.action_taken === 'sdrf_dispatched' ? 'default' : 'pointer'
                    }}
                  >
                    {rep.action_taken === 'sdrf_dispatched' ? '✓ SDRF Dispatched' : '🚨 Dispatch SDRF Unit'}
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'verified_monitoring')}
                    disabled={updatingId === rep.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid var(--border-glass)',
                      cursor: 'pointer'
                    }}
                  >
                    Verify
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
