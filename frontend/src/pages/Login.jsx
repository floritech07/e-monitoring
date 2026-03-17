import { useState } from 'react';
import { Activity, Lock, Mail, Server, Sun, Moon, Eye, EyeOff, Wifi, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (email === 'admin@sbee.bj' && password === 'admin') {
        onLogin({ email, name: 'Administrateur', role: 'admin' });
      } else {
        setError('Identifiants incorrects. Essayez admin@sbee.bj / admin');
        setLoading(false);
      }
    }, 900);
  }

  return (
    <div className={`login-page ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Left Panel — Branding */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">
              <Activity size={28} color="white" />
            </div>
            <span className="login-brand-name">SBEE Monitor</span>
          </div>
          <h2 className="login-left-title">
            Supervision Professionnelle<br />
            <span style={{ color: 'var(--accent)' }}>du Système d'Information</span>
          </h2>
          <p className="login-left-sub">
            Plateforme centrale de monitoring en temps réel pour l'infrastructure IT de la SBEE.
          </p>
          <div className="login-features">
            {[
              { icon: Wifi, text: 'Monitoring réseau & ESXi en temps réel' },
              { icon: ShieldCheck, text: "Alertes & détection d'anomalies" },
              { icon: Activity, text: 'Métriques système détaillées' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="login-feature-item">
                <Icon size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="login-left-grid" aria-hidden="true">
          {Array.from({ length: 64 }).map((_, i) => <div key={i} className="login-grid-dot" />)}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="login-right">
        {/* Theme toggle */}
        <div className="login-theme-toggle" onClick={onToggleTheme} title="Changer le thème">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </div>

        <div className="login-form-wrapper">
          <div className="login-form-header">
            <div className="login-logo">
              <Activity size={26} color="var(--accent)" />
            </div>
            <h1>Bienvenue</h1>
            <p>Connectez-vous à votre espace de supervision</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <ShieldCheck size={14} /> {error}
              </div>
            )}

            <div className="login-field">
              <label>Adresse e-mail</label>
              <div className="login-input-wrap">
                <Mail size={15} className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sbee.bj"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label>Mot de passe</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading
                ? <div className="loading-spin" style={{ width: 16, height: 16, margin: '0 auto', borderWidth: 2 }} />
                : 'Se connecter au système'}
            </button>
          </form>

          <div className="login-footer" style={{ marginTop: 32, flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Server size={12} /> Connexion sécurisée · Serveur local SBEE
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              v2.0 · 2026 · Société Béninoise d'Énergie Électrique
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
