import { useState } from 'react';
import { Settings, Bell, Shield, Server, CheckCircle } from 'lucide-react';

const defaultThresholds = { cpu: 85, ram: 90, disk: 90 };

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [interval, setInterval] = useState(3);
  const [saved, setSaved] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [emailAddr, setEmailAddr] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Paramètres</div>
          <div className="page-subtitle">Configuration du système de monitoring</div>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Enregistrer
        </button>
      </div>

      {saved && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,211,163,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} /> Paramètres enregistrés.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Alert thresholds */}
        <div className="card settings-section">
          <div className="card-title"><Bell size={13} /> Seuils d'alerte</div>
          {[
            { key: 'cpu', label: 'CPU critique (%)', min: 50, max: 100 },
            { key: 'ram', label: 'RAM critique (%)', min: 50, max: 100 },
            { key: 'disk', label: 'Disque alerte (%)', min: 50, max: 100 },
          ].map(({ key, label, min, max }) => (
            <div key={key} className="settings-row">
              <label className="settings-label">{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                value={thresholds[key]}
                onChange={e => setThresholds(t => ({ ...t, [key]: +e.target.value }))}
              />
            </div>
          ))}
        </div>

        {/* Monitoring settings */}
        <div className="card settings-section">
          <div className="card-title"><Server size={13} /> Collecte de données</div>
          <div className="settings-row">
            <label className="settings-label">Intervalle de collecte (s)</label>
            <input type="number" min={1} max={60} value={interval} onChange={e => setInterval(+e.target.value)} />
          </div>
          <div className="settings-row">
            <label className="settings-label">URL du backend</label>
            <input type="text" value={backendUrl} onChange={e => setBackendUrl(e.target.value)} style={{ width: 200 }} />
          </div>
          <div className="settings-row">
            <label className="settings-label">Historique affiché (pts)</label>
            <input type="number" min={10} max={300} defaultValue={60} />
          </div>
        </div>

        {/* Notifications */}
        <div className="card settings-section">
          <div className="card-title"><Bell size={13} /> Notifications par email</div>
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
          <div className="card-title"><Shield size={13} /> Sécurité</div>
          <div className="settings-row">
            <label className="settings-label">Authentification</label>
            <select defaultValue="local">
              <option value="local">Locale</option>
              <option value="ldap">LDAP / AD</option>
            </select>
          </div>
          <div className="settings-row">
            <label className="settings-label">Timeout session (min)</label>
            <input type="number" defaultValue={30} min={5} max={480} />
          </div>
          <div className="settings-row">
            <label className="settings-label">Journal d'audit</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: 'auto', accentColor: 'var(--accent)' }} />
              Activé
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
