import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Shield, Lock, Unlock, Wifi, Globe, Mail, Server, Database } from 'lucide-react';
import { api } from '../api';

const STATUS_CFG = {
  ok:          { label: 'OK',           color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle  },
  critical:    { label: 'CRITIQUE',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle      },
  warning:     { label: 'AVERTISSEMENT',color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: AlertTriangle},
  unknown:     { label: 'INCONNU',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: Clock        },
  unreachable: { label: 'INJOIGNABLE',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: Wifi         },
  maintenance: { label: 'MAINTENANCE',  color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: Shield       },
};

const TYPE_ICON = {
  tcp:   Server, http: Globe, https: Globe,
  smtp:  Mail,   imap: Mail,
  ldap:  Database, ssl: Lock, dns: Globe,
};

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.unknown;
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

function SslExpiryBadge({ daysLeft }) {
  if (daysLeft == null) return null;
  const color = daysLeft < 7 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#22c55e';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 8, fontSize: 10, background: `${color}18`, color, border: `1px solid ${color}40` }}>
      <Lock size={9} />{daysLeft}j
    </span>
  );
}

function ServiceRow({ svc, onCheck }) {
  const [checking, setChecking] = useState(false);
  const Icon = TYPE_ICON[svc.type] || Server;
  const cfg = STATUS_CFG[svc.status] || STATUS_CFG.unknown;

  async function handleCheck() {
    setChecking(true);
    try { await onCheck(svc.id); } finally { setChecking(false); }
  }

  const lastCheck = svc.lastCheck ? new Date(svc.lastCheck).toLocaleTimeString('fr-FR') : '–';
  const latency   = svc.latencyMs != null ? `${svc.latencyMs}ms` : '–';

  return (
    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
      <td style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={cfg.color} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{svc.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{svc.host}:{svc.port}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '8px 12px' }}>
        <span style={{ fontSize: 11, padding: '1px 6px', background: 'var(--bg-hover)', borderRadius: 4, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{svc.type}</span>
      </td>
      <td style={{ padding: '8px 12px' }}><StatusPill status={svc.status} /></td>
      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{latency}</td>
      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{lastCheck}</td>
      <td style={{ padding: '8px 12px' }}>
        {svc.sslDaysLeft != null && <SslExpiryBadge daysLeft={svc.sslDaysLeft} />}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {svc.lastMessage || '–'}
        </div>
      </td>
      <td style={{ padding: '8px 12px' }}>
        <button
          onClick={handleCheck}
          disabled={checking}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: checking ? 'wait' : 'pointer', fontSize: 11 }}
        >
          <RefreshCw size={11} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
          {checking ? '...' : 'Test'}
        </button>
      </td>
    </tr>
  );
}

const PRIORITY_STATUS = ['critical', 'warning', 'unknown', 'unreachable', 'ok', 'maintenance'];

function sortByStatus(services) {
  return [...services].sort((a, b) => PRIORITY_STATUS.indexOf(a.status) - PRIORITY_STATUS.indexOf(b.status));
}

export default function ServiceChecks() {
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [mwList, setMwList]         = useState([]);
  const [showMWModal, setShowMWModal] = useState(false);
  const [newMW, setNewMW]           = useState({ serviceId: '', start: '', end: '', reason: '' });
  const [activeTab, setActiveTab]   = useState('services');

  const load = useCallback(async () => {
    try {
      const data = await api.getServiceChecksAll();
      setServices(Array.isArray(data) ? data : Object.values(data));
    } catch { /* graceful */ } finally { setLoading(false); }
  }, []);

  const loadMW = useCallback(async () => {
    try { setMwList(await api.getMaintenanceWindows()); } catch {}
  }, []);

  useEffect(() => {
    load();
    loadMW();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load, loadMW]);

  async function handleCheck(id) {
    await api.triggerServiceCheck(id);
    await load();
  }

  async function handleAddMW() {
    await api.addMaintenanceWindow(newMW);
    setNewMW({ serviceId: '', start: '', end: '', reason: '' });
    setShowMWModal(false);
    await loadMW();
  }

  async function handleDeleteMW(id) {
    await api.deleteMaintenanceWindow(id);
    await loadMW();
  }

  const groups = {};
  for (const svc of services) {
    const g = svc.group || 'Autres';
    if (!groups[g]) groups[g] = [];
    groups[g].push(svc);
  }

  const filtered = services.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.host?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total:    services.length,
    ok:       services.filter(s => s.status === 'ok').length,
    critical: services.filter(s => s.status === 'critical').length,
    warning:  services.filter(s => s.status === 'warning').length,
    unknown:  services.filter(s => s.status === 'unknown' || s.status === 'unreachable').length,
  };

  const sslServices = services.filter(s => s.sslDaysLeft != null).sort((a, b) => a.sslDaysLeft - b.sslDaysLeft);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Vérifications de Services</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>TCP / HTTP / SSL / SMTP / LDAP — checks actifs toutes les 30s</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
          <RefreshCw size={14} />Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Services OK',      value: stats.ok,       color: '#22c55e' },
          { label: 'Critiques',        value: stats.critical, color: '#ef4444' },
          { label: 'Avertissements',   value: stats.warning,  color: '#f59e0b' },
          { label: 'Inconnus',         value: stats.unknown,  color: '#6b7280' },
        ].map(k => (
          <div key={k.label} className="card glass-panel" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
        {['services', 'ssl', 'maintenance'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 16px', borderRadius: '6px 6px 0 0', border: 'none', background: activeTab === t ? 'var(--accent)' : 'transparent', color: activeTab === t ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t ? 600 : 400 }}>
            {t === 'services' ? 'Services' : t === 'ssl' ? `Certificats SSL (${sslServices.length})` : 'Fenêtres maintenance'}
          </button>
        ))}
      </div>

      {activeTab === 'services' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, width: 200 }}
            />
            {['all', 'critical', 'warning', 'ok', 'unknown'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: filter === f ? 'var(--accent)' : 'var(--bg-surface)', color: filter === f ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                {f === 'all' ? `Tous (${stats.total})` : f}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement…</div>
          ) : (
            <div className="card glass-panel" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-hover)' }}>
                    {['Service', 'Type', 'Statut', 'Latence', 'Dernier check', 'SSL', 'Message', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortByStatus(filtered).map(svc => (
                    <ServiceRow key={svc.id} svc={svc} onCheck={handleCheck} />
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                  Aucun service trouvé
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'ssl' && (
        <div className="card glass-panel" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Expiration des certificats SSL</h3>
          {sslServices.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun certificat SSL monitoré</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sslServices.map(svc => {
                const d = svc.sslDaysLeft;
                const color = d < 7 ? '#ef4444' : d < 30 ? '#f59e0b' : '#22c55e';
                const pct   = Math.min(100, Math.max(0, (d / 365) * 100));
                return (
                  <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 200, fontSize: 13, color: 'var(--text-primary)' }}>{svc.name}</div>
                    <div style={{ flex: 1, height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 80, fontSize: 13, color, fontWeight: 600 }}>{d} jours</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{svc.host}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="card glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Fenêtres de maintenance</h3>
            <button onClick={() => setShowMWModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
              + Ajouter
            </button>
          </div>
          {mwList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune fenêtre de maintenance programmée</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mwList.map(mw => (
                <div key={mw.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <Shield size={16} color="#38bdf8" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {services.find(s => s.id === mw.serviceId)?.name || mw.serviceId}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(mw.start).toLocaleString('fr-FR')} → {new Date(mw.end).toLocaleString('fr-FR')}
                    </div>
                    {mw.reason && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{mw.reason}</div>}
                  </div>
                  <button onClick={() => handleDeleteMW(mw.id)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}

          {showMWModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="card glass-panel" style={{ padding: 24, width: 460, borderRadius: 12 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Nouvelle fenêtre de maintenance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <select value={newMW.serviceId} onChange={e => setNewMW(p => ({ ...p, serviceId: e.target.value }))} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13 }}>
                    <option value="">Sélectionner un service…</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input type="datetime-local" value={newMW.start} onChange={e => setNewMW(p => ({ ...p, start: e.target.value }))} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13 }} />
                  <input type="datetime-local" value={newMW.end}   onChange={e => setNewMW(p => ({ ...p, end: e.target.value }))}   style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13 }} />
                  <input placeholder="Raison (optionnel)" value={newMW.reason} onChange={e => setNewMW(p => ({ ...p, reason: e.target.value }))} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13 }} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowMWModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                    <button onClick={handleAddMW} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Créer</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
