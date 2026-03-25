import { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Server, CheckCircle, Volume2, VolumeX } from 'lucide-react';

const defaultAlertSettings = {
  cpu: { threshold: 85, enabled: true, frequency: 440 },
  ram: { threshold: 90, enabled: true, frequency: 554.37 },
  disk: { threshold: 90, enabled: true, frequency: 659.25 },
  tx: { threshold: 10, enabled: true, frequency: 329.63 },
  soundEnabled: true
};

export default function SettingsPage() {
  const [alertSettings, setAlertSettings] = useState(() => {
    const saved = localStorage.getItem('sbee_alert_settings');
    const parsed = saved ? JSON.parse(saved) : defaultAlertSettings;
    return { ...defaultAlertSettings, ...parsed }; // Merge to ensure new settings like 'tx' exist
  });
  const [interval, setInterval] = useState(3);
  const [saved, setSaved] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [emailAddr, setEmailAddr] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');

  function save() {
    localStorage.setItem('sbee_alert_settings', JSON.stringify(alertSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const updateSetting = (metric, key, value) => {
    setAlertSettings(prev => ({
      ...prev,
      [metric]: { ...prev[metric], [key]: value }
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Paramètres</div>
          <div className="page-subtitle">Configuration du système de monitoring</div>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Enregistrer les modifications
        </button>
      </div>

      {saved && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,211,163,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} /> Vos préférences ont été enregistrées avec succès.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>

        {/* Bips Sonores & Seuils */}
        <div className="card settings-section premium-card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={16} color="var(--accent)" /> Alertes Sonores (Bips)
            </div>
            <button 
              className={`btn btn-sm ${alertSettings.soundEnabled ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setAlertSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              style={{ fontSize: 10, padding: '4px 8px' }}
            >
              {alertSettings.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {alertSettings.soundEnabled ? 'Actif' : 'Muet'}
            </button>
          </div>
          
          <div style={{ marginTop: 20 }}>
            {[
              { id: 'cpu', label: 'Processeur (CPU)', icon: '⚡', unit: '%' },
              { id: 'ram', label: 'Mémoire (RAM)', icon: '🧠', unit: '%' },
              { id: 'disk', label: 'Stockage (Disk)', icon: '💾', unit: '%' },
              { id: 'tx', label: 'Transactions (VM)', icon: '💳', unit: 'min' }
            ].map(({ id, label, icon, unit }) => (
              <div key={id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{icon}</span> {label}
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={alertSettings[id].enabled} 
                      onChange={e => updateSetting(id, 'enabled', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="settings-label" style={{ fontSize: 10 }}>SEUIL {id === 'tx' ? 'MINIMAL' : 'CRITIQUE'} ({unit})</label>
                    <input
                      type="number"
                      min={0}
                      max={id === 'tx' ? 10000 : 100}
                      className="tp-search-input"
                      value={alertSettings[id].threshold}
                      onChange={e => updateSetting(id, 'threshold', +e.target.value)}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label className="settings-label" style={{ fontSize: 10 }}>FRÉQUENCE DU BIP (Hz)</label>
                    <input
                      type="number"
                      min={100}
                      max={2000}
                      step={10}
                      className="tp-search-input"
                      value={alertSettings[id].frequency}
                      onChange={e => updateSetting(id, 'frequency', +e.target.value)}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monitoring settings */}
        <div className="card settings-section">
          <div className="card-title"><Server size={13} color="var(--warning)" /> Collecte de données</div>
          <div className="settings-row">
            <label className="settings-label">Intervalle de collecte (s)</label>
            <input type="number" min={1} max={60} value={interval} onChange={e => setInterval(+e.target.value)} />
          </div>
          <div className="settings-row">
            <label className="settings-label">URL du backend</label>
            <input type="text" value={backendUrl} onChange={e => setBackendUrl(e.target.value)} style={{ width: 220 }} />
          </div>
        </div>

        {/* Notifications */}
        <div className="card settings-section">
          <div className="card-title"><Bell size={13} color="var(--accent)" /> Notifications par email</div>
          <div className="settings-row">
            <label className="settings-label">Alertes email activées</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={emailAlerts} onChange={e => setEmailAlerts(e.target.checked)} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
              {emailAlerts ? 'Activé' : 'Désactivé'}
            </label>
          </div>
          {emailAlerts && (
            <div className="settings-row">
              <label className="settings-label">Adresse email</label>
              <input type="email" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} placeholder="admin@sbee.bj" style={{ width: 220 }} />
            </div>
          )}
        </div>

        {/* Security */}
        <div className="card settings-section">
          <div className="card-title"><Shield size={13} color="var(--success)" /> Sécurité & Audit</div>
          <div className="settings-row">
            <label className="settings-label">Authentification</label>
            <select defaultValue="local" className="tp-search-input" style={{ width: 140 }}>
              <option value="local">Compte Local</option>
              <option value="ldap">LDAP / Active Directory</option>
            </select>
          </div>
          <div className="settings-row">
            <label className="settings-label">Timeout session (min)</label>
            <input type="number" defaultValue={30} min={5} max={480} className="tp-search-input" style={{ width: 70 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
