import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Server, Globe, Shield, Terminal, Settings } from 'lucide-react';

export default function AddSystem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'host',
    ip: '',
    domain: '',
    os: 'Windows Server 2022',
    credentials: {
      user: '',
      pass: ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate save
    console.log('Saving system:', formData);
    setTimeout(() => navigate('/infrastructure'), 1000);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Retour
          </button>
          <div>
            <div className="page-title">Ajouter un nouveau système</div>
            <div className="page-subtitle">Déclarer un nouvel actif dans l'inventaire SBEE</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card full-width glass-panel">
          <form onSubmit={handleSubmit} className="login-form" style={{ maxWidth: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              <div className="settings-section">
                <h3><Server size={14} style={{ marginRight: 8 }} /> Informations Générales</h3>
                <div className="login-field" style={{ marginBottom: 16 }}>
                  <label>Nom du système (Ex: EX01-SRV)</label>
                  <div className="login-input-wrap">
                    <input 
                      type="text" 
                      placeholder="Identifiant SI" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                <div className="login-field" style={{ marginBottom: 16 }}>
                  <label>Type d'infrastructure</label>
                  <select 
                    style={{ width: '100%', padding: 12, borderRadius: 8 }}
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="host">Hôte Physique / ESXi</option>
                    <option value="vm">Machine Virtuelle</option>
                    <option value="network">Équipement Réseau</option>
                    <option value="storage">Baie de Stockage</option>
                  </select>
                </div>

                <div className="login-field">
                  <label>Système d'exploitation</label>
                  <input 
                    type="text" 
                    className="login-input-wrap"
                    style={{ width: '100%', padding: 12, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'white' }}
                    value={formData.os}
                    onChange={e => setFormData({...formData, os: e.target.value})}
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3><Globe size={14} style={{ marginRight: 8 }} /> Connectivité & Accès</h3>
                <div className="login-field" style={{ marginBottom: 16 }}>
                  <label>Adresse IP ou FQDN</label>
                  <input 
                    type="text" 
                    className="login-input-wrap"
                    style={{ width: '100%', padding: 12, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'white' }}
                    placeholder="10.0.0.X" 
                    value={formData.ip}
                    onChange={e => setFormData({...formData, ip: e.target.value})}
                    required 
                  />
                </div>

                <div className="login-field" style={{ marginBottom: 16 }}>
                  <label>Utilisateur de monitoring (WMI/SSH/API)</label>
                  <input 
                    type="text" 
                    className="login-input-wrap"
                    style={{ width: '100%', padding: 12, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'white' }}
                    placeholder="admin" 
                    value={formData.credentials.user}
                    onChange={e => setFormData({...formData, credentials: {...formData.credentials, user: e.target.value}})}
                  />
                </div>

                <div className="login-field">
                  <label>Mot de passe / Clé API</label>
                  <input 
                    type="password" 
                    className="login-input-wrap"
                    style={{ width: '100%', padding: 12, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'white' }}
                    placeholder="••••••••" 
                    value={formData.credentials.pass}
                    onChange={e => setFormData({...formData, credentials: {...formData.credentials, pass: e.target.value}})}
                  />
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                <Save size={16} /> Enregistrer le système
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
