import React, { useState } from 'react';
import { broadcastAlert } from '../api_client/api';

export default function AlertBroadcastModal({ isOpen, onClose, location }) {
  if (!isOpen || !location) return null;

  const [selectedLang, setSelectedLang] = useState('as'); // Default to Assamese for NER
  const [phoneNumbers, setPhoneNumbers] = useState('+919876543210, +919863000000');
  const [alertLevel, setAlertLevel] = useState(location.latest_risk?.alert_status || 'emergency');
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  const probPct = Math.round((location.latest_risk?.risk_probability || 0.85) * 100);

  const previews = {
    as: `জৰুৰী সতৰ্কবাৰ্তা (LANDSAFE): ${location.region_name} অঞ্চলত বিপজ্জনক ভূমিস্খলনৰ আশংকা (${probPct}%) ধৰা পৰিছে। অনতিপলমে সুৰক্ষিত ওখ ঠাইলৈ স্থানান্তৰিত হওক। উদ্ধাৰকাৰী হেল্পলাইন: ১০৭০ / ১১২।`,
    hi: `आपातकालीन चेतावनी (LANDSAFE): ${location.region_name} के पास अत्यधिक भूस्खलन जोखिम (${probPct}%) का पता चला है। कृपया तुरंत सुरक्षित स्थानों पर जाएं। हेल्पलाइन: 1070 / 112।`,
    en: `EMERGENCY LANDSAFE ALERT: Critical landslide risk (${probPct}%) detected near ${location.region_name}. Immediate evacuation advised. Move to designated high-ground shelter. Helpline: 1070 / 112.`,
    bn: `জরুরী সতর্কতা (LANDSAFE): ${location.region_name} অঞ্চলে ভয়াবহ ভূমিধসের আশঙ্কা (${probPct}%) দেখা দিয়েছে। অবিলম্বে নিরাপদ স্থানে আশ্রয় নিন। হেল্পলাইন: ১০৭০ / ১১২।`,
    mizo: `KHAWCHHIA HRIATTIRNA (LANDSAFE): ${location.region_name} hmunah leimin hlauhawm tak (${probPct}%) a thleng thei. Hmun him lam pan vat rawh u. Helpline: 1070 / 112.`
  };

  const handleSendBroadcast = async () => {
    setIsSending(true);
    setDispatchResult(null);
    try {
      const phones = phoneNumbers.split(',').map(p => p.trim()).filter(Boolean);
      const res = await broadcastAlert({
        location_id: location.id,
        region_name: location.region_name,
        alert_level: alertLevel,
        risk_probability: (location.latest_risk?.risk_probability || 0.85),
        target_phones: phones,
        languages: ['en', 'as', 'hi', 'bn', 'mizo']
      });
      setDispatchResult(res);
    } catch (err) {
      console.error(err);
      alert('Broadcast dispatch error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📡</span>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Emergency Disaster Broadcast Center</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Multi-channel SMS & Voice warning system for North East India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Target Region */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>Target Zone</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{location.region_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{location.state} • Coordinates: {location.latitude}, {location.longitude}</div>
        </div>

        {/* Language Switcher Tabs */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Select Regional Language Preview:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { code: 'as', label: 'অসমীয়া (Assamese)' },
              { code: 'hi', label: 'हिन्दी (Hindi)' },
              { code: 'en', label: 'English' },
              { code: 'bn', label: 'বাংলা (Bengali)' },
              { code: 'mizo', label: 'Mizo ṭawng' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedLang === lang.code ? '1px solid var(--color-cyan)' : '1px solid var(--border-glass)',
                  background: selectedLang === lang.code ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.4)',
                  color: selectedLang === lang.code ? 'var(--color-cyan)' : 'var(--text-secondary)'
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview Box */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
            Broadcast SMS & Voice Text Preview ({selectedLang.toUpperCase()})
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#f1f5f9' }}>
            {previews[selectedLang]}
          </p>
        </div>

        {/* Phone numbers */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Recipient Hotlines / Citizen Numbers (Comma separated):
          </label>
          <input
            type="text"
            value={phoneNumbers}
            onChange={(e) => setPhoneNumbers(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontSize: '13px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        {/* Dispatch Result Card */}
        {dispatchResult && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
              ✓ Broadcast Dispatched Successfully!
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Broadcast ID: <span className="font-mono">{dispatchResult.broadcast_id}</span> | Channels: {dispatchResult.channels_active?.join(', ')}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.6)', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)', cursor: 'pointer', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSendBroadcast}
            disabled={isSending}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              border: 'none',
              cursor: isSending ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}
          >
            {isSending ? 'Transmitting Multi-channel Broadcast...' : 'Execute Instant Emergency Broadcast'}
          </button>
        </div>
      </div>
    </div>
  );
}
