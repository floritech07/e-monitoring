import { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Server, CheckCircle, Volume2, VolumeX, Activity } from 'lucide-react';

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
    <div className="fade-in" style={{ padding: '56px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '1px solid var(--glass-border)', paddingBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8 }}>Paramètres & Préférences</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', mragin: 0 }}>Configuration globale du centre de contrôle SBEE Monitoring</p>
        </div>
        <div>
          <button 
            className="btn-premium-link" 
            onClick={save}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 142, 247, 0.3)', transition: 'transform 0.2s', whiteSpace: 'nowrap' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <CheckCircle size={18} /> Enregistrer les réglages
          </button>
        </div>
      </div>

      {saved && (
        <div className="fade-in" style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,211,163,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 32, color: 'var(--success)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={18} /> Vos préférences système ont été synchronisées avec succès.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 32 }}>

        {/* COLONNE GAUCHE : Alertes & Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Bips Sonores & Seuils */}
          <div className="card glass-panel" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'var(--accent-glow)', padding: 12, borderRadius: 12 }}>
                  <Volume2 size={24} color="var(--accent)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Règles d'Alertes Sonores & Visuelles</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Définissez les seuils critiques déclenchant des avertissements de monitoring</p>
                </div>
              </div>
              
              <div 
                onClick={() => setAlertSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '6px 16px', borderRadius: 30,
                  background: alertSettings.soundEnabled ? 'var(--success-bg)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${alertSettings.soundEnabled ? 'rgba(34, 211, 163, 0.3)' : 'var(--border)'}`,
                  transition: 'all 0.3s'
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: alertSettings.soundEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                  {alertSettings.soundEnabled ? 'AUDIO ACTIVÉ' : 'AUDIO COUPÉ'}
                </span>
                <div style={{ 
                  width: 44, height: 24, borderRadius: 24, background: alertSettings.soundEnabled ? 'var(--success)' : 'var(--border)',
                  position: 'relative', transition: 'background 0.3s'
                }}>
                  <div style={{ 
                    width: 20, height: 20, borderRadius: '50%', background: '#fff', 
                    position: 'absolute', top: 2, left: alertSettings.soundEnabled ? 22 : 2, 
                    transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                  }} />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {[
                { id: 'cpu', label: 'Processeur (CPU)', icon: <Activity size={18} color="var(--accent)" />, unit: '%', color: 'var(--accent)' },
                { id: 'ram', label: 'Mémoire (RAM)', icon: <Server size={18} color="var(--success)" />, unit: '%', color: 'var(--success)' },
                { id: 'disk', label: 'Stockage Globaux', icon: <Server size={18} color="var(--warning)" />, unit: '%', color: 'var(--warning)' },
                { id: 'tx', label: 'Paiements Actifs', icon: <Volume2 size={18} color="var(--accent-secondary)" />, unit: 'min', color: 'var(--accent-secondary)' }
              ].map(({ id, label, icon, unit, color }) => (
                <div 
                  key={id} 
                  style={{ 
                    background: alertSettings[id].enabled ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)', 
                    border: `1px solid ${alertSettings[id].enabled ? 'var(--glass-border)' : 'rgba(255,255,255,0.01)'}`, 
                    borderRadius: 16, padding: 24, transition: 'all 0.3s',
                    opacity: alertSettings[id].enabled ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)' }}>
                      <div style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, padding: 8, borderRadius: 8 }}>
                         {icon}
                      </div>
                      {label}
                    </div>
                    
                    <div 
                      onClick={() => updateSetting(id, 'enabled', !alertSettings[id].enabled)}
                      style={{ 
                        width: 44, height: 24, borderRadius: 24, background: alertSettings[id].enabled ? 'var(--accent)' : 'var(--border)',
                        position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                      }}
                    >
                      <div style={{ 
                        width: 20, height: 20, borderRadius: '50%', background: '#fff', 
                        position: 'absolute', top: 2, left: alertSettings[id].enabled ? 22 : 2, 
                        transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, pointerEvents: alertSettings[id].enabled ? 'auto' : 'none' }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.5px' }}>
                        Seuil ({unit})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={id === 'tx' ? 10000 : 100}
                        value={alertSettings[id].threshold}
                        onChange={e => updateSetting(id, 'threshold', +e.target.value)}
                        style={{ 
                          width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', 
                          color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = color}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.5px' }}>
                        Bip (Hz)
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={2000}
                        step={10}
                        value={alertSettings[id].frequency}
                        onChange={e => updateSetting(id, 'frequency', +e.target.value)}
                        style={{ 
                          width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', 
                          color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = color}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Système & Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
           {/* Monitoring settings */}
           <div className="card glass-panel" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid var(--glass-border)' }}>
                <Server size={20} color="var(--warning)" />
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Moteur de Collecte</span>
             </div>
             
             <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Intervalle de collecte (sec)</label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Fréquence d'interrogation du socket daemon</div>
                <input 
                   type="number" min={1} max={60} value={interval} onChange={e => setInterval(+e.target.value)} 
                   style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, outline: 'none' }}
                />
             </div>

             <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Point de terminaison API</label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>URL Socket.io de l'orchestrateur</div>
                <input 
                   type="text" value={backendUrl} onChange={e => setBackendUrl(e.target.value)} 
                   style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, outline: 'none' }}
                />
             </div>
           </div>

           {/* Routage & Sécurité */}
           <div className="card glass-panel" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid var(--glass-border)' }}>
                <Bell size={20} color="var(--accent)" />
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Routage & Sécurité</span>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Alertes Email</div>
                 <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Réception des rapports critiques</div>
               </div>
               <div 
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  style={{ 
                    width: 44, height: 24, borderRadius: 24, background: emailAlerts ? 'var(--accent)' : 'var(--border)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                  }}
               >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: emailAlerts ? 22 : 2, transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
               </div>
             </div>

             {emailAlerts && (
               <div className="fade-in">
                 <input 
                    type="email" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} placeholder="admin@sbee.bj"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, outline: 'none' }}
                 />
               </div>
             )}

             <div style={{ height: 1, background: 'var(--glass-border)', margin: '8px 0' }} />

             <div>
               <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Modèle Moteur Auth</div>
               <select 
                  defaultValue="local" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, outline: 'none' }}
               >
                 <option value="local">Silo Local Intégré</option>
                 <option value="ldap">Annuaire d'Entreprise (AD/LDAP)</option>
               </select>
             </div>

             <div>
               <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Expiration Jetons (TTL)</div>
               <input 
                  type="number" defaultValue={30} min={5} max={480} 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, outline: 'none' }}
               />
             </div>
           </div>

        </div>
      </div>
    </div>
  );

}
