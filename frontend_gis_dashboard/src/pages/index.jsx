import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import GisMap from '../components/GisMap';
import TelemetryHud from '../components/TelemetryHud';
import CitizenTriageQueue from '../components/CitizenTriageQueue';
import PredictiveAnalytics from '../components/PredictiveAnalytics';
import SimulationControls from '../components/SimulationControls';
import AlertBroadcastModal from '../components/AlertBroadcastModal';
import {
  getLocations,
  getLocationHistory,
  getLiveAlerts,
  getCitizenReports,
  getFaultLines,
  getSusceptibilityZones,
  getHealth
} from '../api_client/api';

export default function DashboardPage() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState({ active_count: 0, alerts: [] });
  const [citizenReports, setCitizenReports] = useState([]);
  const [faults, setFaults] = useState(null);
  const [susceptibility, setSusceptibility] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState(null);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  // Initial Load
  const fetchDashboardData = async () => {
    try {
      const [locsRes, alertsRes, citRes, faultsRes, suscRes, healthRes] = await Promise.allSettled([
        getLocations(),
        getLiveAlerts(),
        getCitizenReports(),
        getFaultLines(),
        getSusceptibilityZones(),
        getHealth()
      ]);

      if (locsRes.status === 'fulfilled') {
        setLocations(locsRes.value.locations || []);
        if (!selectedLocation && locsRes.value.locations?.length > 0) {
          // Default to highest risk location
          const sorted = [...locsRes.value.locations].sort(
            (a, b) => (b.latest_risk?.risk_probability || 0) - (a.latest_risk?.risk_probability || 0)
          );
          setSelectedLocation(sorted[0]);
        }
      }
      if (alertsRes.status === 'fulfilled') setLiveAlerts(alertsRes.value);
      if (citRes.status === 'fulfilled') setCitizenReports(citRes.value.reports || []);
      if (faultsRes.status === 'fulfilled') setFaults(faultsRes.value);
      if (suscRes.status === 'fulfilled') setSusceptibility(suscRes.value);
      if (healthRes.status === 'fulfilled') setHealthStatus(healthRes.value);

      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching dashboard feeds:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch history when selected location changes
  useEffect(() => {
    if (selectedLocation?.id) {
      getLocationHistory(selectedLocation.id)
        .then(data => setHistoryData(data))
        .catch(err => console.error('Error fetching history:', err));
    }
  }, [selectedLocation?.id]);

  const handleOpenBroadcast = (loc) => {
    setBroadcastTarget(loc || selectedLocation);
    setIsBroadcastOpen(true);
  };

  return (
    <>
      <Head>
        <title>LANDSAFE NER — AI Early Warning & Landslide Risk Platform</title>
        <meta name="description" content="AI Early Warning & Landslide Risk Monitoring Platform for North Eastern Region (SIH 2026)" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
        {/* Tactical Command Navigation Bar */}
        <header style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(10, 16, 30, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
            }}>
              ⛰️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  LANDSAFE <span style={{ color: 'var(--color-cyan)' }}>NER</span>
                </h1>
                <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  SIH 2026 • SIH26001
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Geospatial Landslide Risk Monitoring & Early Warning Platform • North Eastern Region
              </p>
            </div>
          </div>

          {/* Center Stats Bar */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Active Emergencies */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '8px' }}>
              <span className="pulse-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: '#fca5a5', fontWeight: 700 }}>{liveAlerts.active_count} Active Alerts</span>
              </div>
            </div>

            {/* IoT Nodes */}
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Nodes: <strong style={{ color: '#38bdf8' }}>{locations.length} Stations</strong>
            </div>

            {/* ML Status */}
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              ONNX Engine: <strong style={{ color: '#34d399' }}>Sub-ms Active</strong>
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: lowBandwidthMode ? '1px solid #10b981' : '1px solid var(--border-glass)',
                background: lowBandwidthMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                color: lowBandwidthMode ? '#34d399' : 'var(--text-secondary)'
              }}
            >
              {lowBandwidthMode ? '🛰️ Satellite Low-Bandwidth Mode' : '📶 High-Speed Live Feed'}
            </button>

            <button
              onClick={() => handleOpenBroadcast(selectedLocation)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)'
              }}
            >
              📢 Emergency Broadcast
            </button>
          </div>
        </header>

        {/* Main Dashboard Workspace Grid */}
        <main style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
          {/* Left Column: Tactical Map & Predictive Analytics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* GIS Map */}
            <GisMap
              locations={locations}
              faults={faults}
              susceptibility={susceptibility}
              citizenReports={citizenReports}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
            />

            {/* Predictive Hydrological Timeline */}
            <PredictiveAnalytics historyData={historyData} />
          </div>

          {/* Right Column: Telemetry HUD, Citizen Triage & Real-time Sandbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Live Telemetry Gauge Card */}
            <TelemetryHud
              location={selectedLocation}
              onOpenBroadcast={(loc) => handleOpenBroadcast(loc)}
            />

            {/* Real-time Interactive AI Sandbox */}
            <SimulationControls />

            {/* Citizen AI Hazard Triage Queue */}
            <CitizenTriageQueue
              reports={citizenReports}
              onRefresh={fetchDashboardData}
            />
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-glass)',
          background: 'rgba(10, 16, 30, 0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div>
            Built for Smart India Hackathon 2026 • Problem ID: SIH26001 (Disaster Management & Geospatial AI)
          </div>
          <div>
            GSI NGDR • NRSC Landslide Atlas • NESAC NeSDR • Last Synced: {lastRefreshed}
          </div>
        </footer>

        {/* Alert Broadcast Modal */}
        <AlertBroadcastModal
          isOpen={isBroadcastOpen}
          onClose={() => setIsBroadcastOpen(false)}
          location={broadcastTarget}
        />
      </div>
    </>
  );
}
