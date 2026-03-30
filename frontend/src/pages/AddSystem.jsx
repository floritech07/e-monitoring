import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Server, Globe, Shield, Activity, HardDrive, LayoutGrid } from 'lucide-react';

export default function AddSystem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'vcenter',
    ip: '',
    port: '443',
    credentials: {
      user: '',
      pass: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Erreur réseau');
      
      // Simulate connection checking delay
      setTimeout(() => {
        setLoading(false);
        navigate('/infrastructure');
      }, 1500);
      
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '56px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '1px solid var(--glass-border)', paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
             className="btn btn-ghost" 
             onClick={() => navigate(-1)}
             style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8 }}>
              Connexion Hyperviseur
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              Ajouter un nœud d'administration distant au monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card glass-panel" style={{ position: 'relative', padding: 40, gridColumn: '1 / -1' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,12,0.85)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, backdropFilter: 'blur(8px)' }}>
               <div className="loading-spin" style={{ marginBottom: 20, width: 40, height: 40, borderWidth: 3 }}></div>
               <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>Négociation SSL avec {formData.ip}...</div>
               <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Vérification de l'empreinte et validation des accès API en cours</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ margin: '0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 4fr)', gap: 40 }}>
              
              {/* COLONNE GAUCHE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                   <div style={{ background: 'var(--accent-glow)', padding: 8, borderRadius: 8 }}>
                     <LayoutGrid size={20} color="var(--accent)" />
                   </div>
                   <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>1. Choix du moteur</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                   {/* Options hyperviseur */}
                   <div 
                      onClick={() => setFormData({...formData, type: 'vcenter', port: '443'})} 
                      style={{ padding: 20, border: formData.type === 'vcenter' ? '2px solid var(--accent)' : '1px solid var(--border)', background: formData.type === 'vcenter' ? 'rgba(79, 142, 247, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', opacity: formData.type === 'vcenter' ? 1 : 0.6 }}>
                      <Server size={28} color={formData.type === 'vcenter' ? 'var(--accent)' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>VMware vCenter</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Superviseur Cluster</div>
                      </div>
                   </div>
                   <div 
                      onClick={() => setFormData({...formData, type: 'esxi', port: '443'})} 
                      style={{ padding: 20, border: formData.type === 'esxi' ? '2px solid var(--success)' : '1px solid var(--border)', background: formData.type === 'esxi' ? 'rgba(34, 211, 163, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', opacity: formData.type === 'esxi' ? 1 : 0.6 }}>
                      <HardDrive size={28} color={formData.type === 'esxi' ? 'var(--success)' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Serveur ESXi</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Hôte Physique Isolé</div>
                      </div>
                   </div>
                   <div 
                      onClick={() => setFormData({...formData, type: 'hyperv', port: '5985'})} 
                      style={{ padding: 20, border: formData.type === 'hyperv' ? '2px solid #00a4ef' : '1px solid var(--border)', background: formData.type === 'hyperv' ? 'rgba(0, 164, 239, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', opacity: formData.type === 'hyperv' ? 1 : 0.6 }}>
                      <Activity size={28} color={formData.type === 'hyperv' ? '#00a4ef' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Hyper-V</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Windows Server Core</div>
                      </div>
                   </div>
                   <div 
                      onClick={() => setFormData({...formData, type: 'proxmox', port: '8006'})} 
                      style={{ padding: 20, border: formData.type === 'proxmox' ? '2px solid #e57000' : '1px solid var(--border)', background: formData.type === 'proxmox' ? 'rgba(229, 112, 0, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', opacity: formData.type === 'proxmox' ? 1 : 0.6 }}>
                      <Shield size={28} color={formData.type === 'proxmox' ? '#e57000' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Proxmox VE</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Environnement KVM</div>
                      </div>
                   </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.5px' }}>
                    Label d'identification sur le Dashboard
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cluster-Production-Site-A" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '14px 16px', borderRadius: 8, fontSize: 15, fontWeight: 500, outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    required 
                  />
                </div>
              </div>

              {/* COLONNE DROITE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                   <div style={{ background: 'rgba(34, 211, 163, 0.1)', padding: 8, borderRadius: 8 }}>
                     <Globe size={20} color="var(--success)" />
                   </div>
                   <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>2. Accès & Résolution API</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16 }}>
                   <div>
                     <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.5px' }}>
                       Adresse IP ou FQDN
                     </label>
                     <input 
                       type="text" 
                       placeholder="vcenter.sbee.local" 
                       value={formData.ip}
                       onChange={e => setFormData({...formData, ip: e.target.value})}
                       style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '14px 16px', borderRadius: 8, fontSize: 15, fontWeight: 500, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'monospace' }}
                       onFocus={(e) => e.target.style.borderColor = 'var(--success)'}
                       onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                       required 
                     />
                   </div>
                   <div>
                     <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.5px' }}>
                       Port
                     </label>
                     <input 
                       type="text" 
                       value={formData.port}
                       onChange={e => setFormData({...formData, port: e.target.value})}
                       style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '14px 16px', borderRadius: 8, fontSize: 15, fontWeight: 600, outline: 'none', transition: 'border-color 0.2s', textAlign: 'center' }}
                       onFocus={(e) => e.target.style.borderColor = 'var(--success)'}
                       onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                       required 
                     />
                   </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.5px' }}>
                    Compte Service {formData.type === 'vcenter' ? '(ex: admin@vsphere.local)' : formData.type === 'hyperv' ? '(Domaine\\Utilisateur)' : '(root)'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="administrator@vsphere.local" 
                    value={formData.credentials.user}
                    onChange={e => setFormData({...formData, credentials: {...formData.credentials, user: e.target.value}})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '14px 16px', borderRadius: 8, fontSize: 15, fontWeight: 500, outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--success)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.5px' }}>
                    Jeton ou Mot de passe
                  </label>
                  <input 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    value={formData.credentials.pass}
                    onChange={e => setFormData({...formData, credentials: {...formData.credentials, pass: e.target.value}})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '14px 16px', borderRadius: 8, fontSize: 15, fontWeight: 500, outline: 'none', transition: 'border-color 0.2s', letterSpacing: '3px' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--success)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
              <button 
                 type="button" 
                 onClick={() => navigate(-1)}
                 style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                 onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                 Annuler
              </button>
              
              <button 
                type="submit" 
                disabled={loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 28px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(79, 142, 247, 0.4)', transition: 'transform 0.2s', opacity: loading ? 0.7 : 1 }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <Save size={18} /> Authentifier et associer l'hôte
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

