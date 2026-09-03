import React, { useState, useEffect } from 'react';

export default function GisMap({ locations, faults, susceptibility, citizenReports, selectedLocation, onSelectLocation }) {
  const [activeLayer, setActiveLayer] = useState('all'); // all, hazards, faults, citizen
  const [hoveredItem, setHoveredItem] = useState(null);

  // Map coordinates projection helper for NER
  // Bounding box: Lon 88.0 to 96.0 (width 8.0 deg), Lat 23.0 to 28.5 (height 5.5 deg)
  const projectCoords = (lon, lat) => {
    const minLon = 88.0, maxLon = 96.0;
    const minLat = 23.0, maxLat = 28.5;
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const getColor = (status) => {
    switch (status) {
      case 'emergency': return '#ef4444';
      case 'warning': return '#f97316';
      case 'watch': return '#eab308';
      default: return '#10b981';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', position: 'relative', overflow: 'hidden', height: '100%', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Map HUD Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', zIndex: 10 }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗺️</span> North East India GIS Tactical Map
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            GSI NGDR Faults • NRSC Landslide Susceptibility • Real-time IoT Nodes
          </p>
        </div>

        {/* Layer Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Layers' },
            { id: 'hazards', label: 'NRSC Zones' },
            { id: 'faults', label: 'NGDR Faults' },
            { id: 'citizen', label: 'Citizen Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveLayer(tab.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: activeLayer === tab.id ? '1px solid var(--color-cyan)' : '1px solid var(--border-glass)',
                background: activeLayer === tab.id ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                color: activeLayer === tab.id ? 'var(--color-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tactical Map Viewport */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'radial-gradient(circle at 50% 50%, #0d1b2e 0%, #070c18 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Background Grid Lines & Regional Shading */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {/* Subtle Latitude/Longitude Grid */}
          {[20, 40, 60, 80].map(pct => (
            <React.Fragment key={pct}>
              <line x1={`${pct}%`} y1="0" x2={`${pct}%`} y2="100%" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 6" />
              <line x1="0" y1={`${pct}%`} x2="100%" y2={`${pct}%`} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 6" />
            </React.Fragment>
          ))}

          {/* Brahmaputra River Basin Guideline */}
          <path
            d="M 80 150 Q 200 130 320 180 T 550 220"
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="3"
            strokeDasharray="4 4"
          />

          {/* NGDR Fault Lines Overlay */}
          {(activeLayer === 'all' || activeLayer === 'faults') && faults?.features?.map((fault, fIdx) => {
            const coords = fault.geometry?.coordinates || [];
            const pointsStr = coords.map(([lon, lat]) => {
              const pos = projectCoords(lon, lat);
              return `${pos.x}%,${pos.y}%`;
            }).join(' ');

            return (
              <g key={'fault-' + fIdx}>
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  style={{ opacity: 0.8 }}
                />
              </g>
            );
          })}
        </svg>

        {/* State Boundaries & Region Labels */}
        <div style={{ position: 'absolute', top: '12px', left: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 800, letterSpacing: '2px' }}>
          SIKKIM • ASSAM • MEGHALAYA • ARUNACHAL • MIZORAM • NAGALAND • MANIPUR • TRIPURA
        </div>

        {/* Hotspot Pulsing Markers */}
        {locations?.map((loc) => {
          const pos = projectCoords(loc.longitude, loc.latitude);
          const status = loc.latest_risk?.alert_status || 'none';
          const color = getColor(status);
          const isSelected = selectedLocation?.id === loc.id;
          const isEmergency = status === 'emergency';

          return (
            <div
              key={'hotspot-' + loc.id}
              onClick={() => onSelectLocation(loc)}
              onMouseEnter={() => setHoveredItem(loc)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: isSelected ? 30 : 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Pulsing Radar Ring for Emergency */}
              {isEmergency && (
                <div
                  className="pulse-red"
                  style={{
                    position: 'absolute',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.4)',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Center Dot */}
              <div
                style={{
                  width: isSelected ? '18px' : '14px',
                  height: isSelected ? '18px' : '14px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: isSelected ? '3px solid #fff' : '2px solid #0f172a',
                  boxShadow: `0 0 12px ${color}`,
                  transition: 'all 0.2s ease'
                }}
              />

              {/* Short Label */}
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#f1f5f9',
                marginTop: '4px',
                whiteSpace: 'nowrap',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: isSelected ? '1px solid var(--color-cyan)' : '1px solid rgba(255,255,255,0.1)'
              }}>
                {loc.region_name.split('(')[0]}
              </span>
            </div>
          );
        })}

        {/* Citizen Hazard Markers */}
        {(activeLayer === 'all' || activeLayer === 'citizen') && citizenReports?.map((rep) => {
          const pos = projectCoords(rep.longitude, rep.latitude);
          return (
            <div
              key={'rep-' + rep.id}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
                background: 'rgba(249, 115, 22, 0.9)',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 800,
                boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>⚠️</span>
              <span>{(rep.onnx_severity_score * 100).toFixed(0)}%</span>
            </div>
          );
        })}

        {/* Hover Tooltip Card */}
        {hoveredItem && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-accent)',
            borderRadius: '8px',
            padding: '10px 14px',
            zIndex: 40,
            maxWidth: '280px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--color-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
              {hoveredItem.state} • {hoveredItem.district}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
              {hoveredItem.region_name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Alert: <strong style={{ color: getColor(hoveredItem.latest_risk?.alert_status), textTransform: 'uppercase' }}>{hoveredItem.latest_risk?.alert_status}</strong></span>
              <span>Risk: <strong>{((hoveredItem.latest_risk?.risk_probability || 0) * 100).toFixed(1)}%</strong></span>
            </div>
          </div>
        )}

        {/* Bottom Right Map Legend */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 10
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Emergency (Risk {'>'}85%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} /> Warning (65-85%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }} /> Watch (40-65%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Normal ({'<'}40%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', background: '#ec4899' }} /> NGDR Active Fault
          </div>
        </div>
      </div>
    </div>
  );
}
