import { useState, useEffect, useRef } from 'react';
import {
  Shield, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Clock, Database, Layers, Play, Square, HardDrive,
  BarChart2, Activity, ChevronRight, Wifi, WifiOff,
  Settings, Save, Eye, EyeOff
} from 'lucide-react';
import { api } from '../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDuration(sec) {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function timeAgo(isoStr) {
  if (!isoStr) return '—';
  const s = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (s < 60)   return `il y a ${s}s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)}m`;
  if (s < 86400)return `il y a ${Math.floor(s / 3600)}h`;
  return `il y a ${Math.floor(s / 86400)}j`;
}

function StatusPill({ result }) {
  const c = {
    Success: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'rgba(34,211,163,0.3)', label: 'Succès' },
    Warning: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(245,166,35,0.3)', label: 'Attention' },
    Failed:  { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'rgba(245,83,75,0.3)',  label: 'Échec' },
    Running: { color: 'var(--info)',    bg: 'var(--info-bg)',    border: 'rgba(79,142,247,0.3)', label: 'En cours' },
  }[result] || { color: 'var(--text-muted)', bg: 'var(--bg-hover)', border: 'var(--border)', label: result || 'N/A' };

  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

// ─── RPO Gauge ────────────────────────────────────────────────────────────────

function RPOGauge({ rpoHours, thresholdHours = 24 }) {
  const pct   = Math.min((rpoHours / thresholdHours) * 100, 100);
  const color = rpoHours > thresholdHours ? 'var(--danger)'
              : rpoHours > thresholdHours * 0.7 ? 'var(--warning)'
              : 'var(--success)';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>RPO Actuel</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
        {rpoHours === null ? '—' : `${rpoHours}h`}
      </div>
      <div style={{ width: 80, height: 4, background: 'var(--bg-hover)', borderRadius: 4, margin: '6px auto 0', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>Seuil: {thresholdHours}h</div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, onAction, loading }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = job.statusInfo || {};

  return (
    <div
      className="card glass-panel"
      style={{ padding: 0, overflow: 'hidden', borderColor: job.lastResult === 'Failed' ? 'rgba(245,83,75,0.4)' : 'var(--border)' }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: job.lastResult === 'Success' ? 'var(--success)'
                  : job.lastResult === 'Warning' ? 'var(--warning)'
                  : job.lastResult === 'Failed'  ? 'var(--danger)'
                  : 'var(--info)',
      }} />

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={14} color={job.lastResult === 'Failed' ? 'var(--danger)' : 'var(--success)'} />
              <span className="truncate">{job.name}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.type}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusPill result={job.lastResult} />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dernier run</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{timeAgo(job.lastRun?.endTime)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prochain run</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{timeAgo(job.nextRun)}</div>
          </div>
          <RPOGauge rpoHours={job.rpoHours} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            className="btn btn-sm btn-success"
            onClick={() => onAction(job.id, 'start')}
            disabled={loading === job.id + '_start'}
          >
            {loading === job.id + '_start' ? <RefreshCw size={11} className="rotate-animation" /> : <Play size={11} fill="currentColor" />}
            Démarrer
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onAction(job.id, 'stop')}
            disabled={loading === job.id + '_stop'}
          >
            {loading === job.id + '_stop' ? <RefreshCw size={11} className="rotate-animation" /> : <Square size={11} fill="currentColor" />}
            Arrêter
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setExpanded(e => !e)}
            style={{ marginLeft: 'auto' }}
          >
            <ChevronRight size={11} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
          </button>
        </div>
      </div>

      {expanded && job.lastSession && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px', background: 'var(--bg-elevated)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, fontSize: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durée</div>
            <div style={{ fontWeight: 600 }}>{formatDuration(job.lastSession.durationSeconds)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transféré</div>
            <div style={{ fontWeight: 600 }}>{formatBytes(job.lastSession.transferredBytes)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Objets</div>
            <div style={{ fontWeight: 600 }}>{job.lastSession.processedObjects || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Goulot</div>
            <div style={{ fontWeight: 600 }}>{job.lastSession.bottleneck || '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Config Panel ─────────────────────────────────────────────────────────────

function VeeamConfigPanel({ onSaved }) {
  const [cfg,     setCfg]     = useState({ url: '', username: '', password: '', enabled: false, rpoThresholdHours: 24 });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  useEffect(() => {
    api.getVeeamConfig()
      .then(c => setCfg({ ...c }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api.saveVeeamConfig(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.();
    } catch {}
    setSaving(false);
  }

  if (loading) return <div className="empty-state"><div className="loading-spin" /></div>;

  return (
    <div className="card glass-panel" style={{ padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Settings size={15} color="var(--accent)" />
        Configuration Veeam B&R
      </div>

      {saved && (
        <div style={{ marginBottom: 16, padding: '8px 14px', background: 'var(--success-bg)', border: '1px solid rgba(34,211,163,0.2)', borderRadius: 8, color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={13} /> Configuration sauvegardée
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>URL API Veeam</label>
          <input
            type="text"
            value={cfg.url}
            onChange={e => setCfg(p => ({ ...p, url: e.target.value }))}
            placeholder="https://veeam-server:9419"
            style={{ width: '100%', marginTop: 4, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Utilisateur</label>
            <input
              type="text"
              value={cfg.username || ''}
              onChange={e => setCfg(p => ({ ...p, username: e.target.value }))}
              placeholder="administrator"
              style={{ width: '100%', marginTop: 4, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mot de passe</label>
            <div style={{ position: 'relative', marginTop: 4 }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={cfg.password || ''}
                onChange={e => setCfg(p => ({ ...p, password: e.target.value }))}
                style={{ width: '100%', padding: '8px 36px 8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Seuil RPO (heures)</label>
          <input
            type="number"
            min={1} max={168}
            value={cfg.rpoThresholdHours || 24}
            onChange={e => setCfg(p => ({ ...p, rpoThresholdHours: parseInt(e.target.value) }))}
            style={{ width: 100, marginTop: 4, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={cfg.enabled || false} onChange={e => setCfg(p => ({ ...p, enabled: e.target.checked }))} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
            Intégration Veeam activée
          </label>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ width: 'fit-content' }}>
          {saving ? <RefreshCw size={13} className="rotate-animation" /> : <Save size={13} />}
          Sauvegarder la configuration
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VeeamPage() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [actionLoad, setActionLoad] = useState(null);
  const [tab,        setTab]        = useState('jobs'); // 'jobs' | 'sessions' | 'repos' | 'config'
  const [configKey,  setConfigKey]  = useState(0); // force re-fetch

  useEffect(() => {
    load();
  }, [configKey]);

  async function load(refresh = false) {
    setLoading(true);
    try {
      const result = await api.getVeeam(refresh);
      setData(result);
    } catch (e) {
      setData({ error: e.message, connected: false, jobs: [], sessions: [], repos: [] });
    }
    setLoading(false);
  }

  async function jobAction(jobId, action) {
    setActionLoad(`${jobId}_${action}`);
    try {
      await api.veeamJobAction(jobId, action);
      setTimeout(() => load(true), 2000);
    } catch {}
    setActionLoad(null);
  }

  const d           = data || {};
  const jobs        = d.jobs        || [];
  const sessions    = d.sessions    || [];
  const repos       = d.repos       || [];
  const successJobs = jobs.filter(j => j.lastResult === 'Success').length;
  const failedJobs  = jobs.filter(j => j.lastResult === 'Failed').length;
  const slaRate     = jobs.length ? Math.round((successJobs / jobs.length) * 100) : 0;

  const TABS = ['jobs','sessions','repos','config'];

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title glow-text" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={22} color="var(--accent)" />
            Veeam Backup & Replication
          </h1>
          <p className="page-subtitle">Supervision de la sauvegarde des données critiques</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            background: 'var(--bg-surface)', borderRadius: 20,
            border: `1px solid ${d.connected ? 'rgba(34,211,163,0.3)' : 'rgba(245,83,75,0.3)'}`,
            fontSize: 12,
          }}>
            {d.connected ? <Wifi size={12} color="var(--success)" /> : <WifiOff size={12} color="var(--danger)" />}
            <span style={{ color: d.connected ? 'var(--success)' : 'var(--danger)' }}>
              {d.connected ? 'Connecté' : d.error || 'Non configuré'}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'rotate-animation' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Jobs',  value: jobs.length, color: 'var(--accent)',   icon: Layers },
          { label: 'Succès',      value: successJobs, color: 'var(--success)',  icon: CheckCircle },
          { label: 'Échecs',      value: failedJobs,  color: 'var(--danger)',   icon: XCircle },
          { label: 'Taux SLA',    value: `${slaRate}%`, color: slaRate >= 90 ? 'var(--success)' : slaRate >= 75 ? 'var(--warning)' : 'var(--danger)', icon: BarChart2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card glass-panel" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
              <Icon size={14} color={color} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <div key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'jobs' && <>{<Layers size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />}Jobs de sauvegarde</>}
            {t === 'sessions' && <>{<Activity size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />}Sessions récentes</>}
            {t === 'repos' && <>{<Database size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />}Référentiels</>}
            {t === 'config' && <>{<Settings size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />}Configuration</>}
          </div>
        ))}
      </div>

      {loading && tab !== 'config' ? (
        <div className="empty-state"><div className="loading-spin" />Connexion à Veeam...</div>
      ) : (
        <>
          {tab === 'jobs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px,1fr))', gap: 16 }}>
              {jobs.length === 0 ? (
                <div className="card glass-panel empty-state" style={{ gridColumn: '1/-1', padding: 60 }}>
                  <Shield size={40} style={{ opacity: 0.3 }} />
                  <div>Aucun job Veeam trouvé</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {d.connected ? 'Aucun job configuré' : 'Veeam non configuré — allez dans l\'onglet Configuration'}
                  </div>
                </div>
              ) : (
                jobs.map(job => (
                  <JobCard key={job.id} job={job} onAction={jobAction} loading={actionLoad} />
                ))
              )}
            </div>
          )}

          {tab === 'sessions' && (
            <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              {sessions.length === 0 ? (
                <div className="empty-state" style={{ padding: 60 }}>
                  <Activity size={40} style={{ opacity: 0.3 }} />
                  <div>Aucune session récente</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                      {['Job','État','Résultat','Début','Durée','Transféré','Objets'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 50).map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{s.jobName}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{s.state}</td>
                        <td style={{ padding: '10px 14px' }}><StatusPill result={s.result} /></td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(s.creationTime)}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{formatDuration(s.durationSeconds)}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{formatBytes(s.transferredBytes)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{s.processedObjects || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'repos' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
              {repos.length === 0 ? (
                <div className="card glass-panel empty-state" style={{ gridColumn: '1/-1', padding: 60 }}>
                  <Database size={40} style={{ opacity: 0.3 }} /><div>Aucun référentiel trouvé</div>
                </div>
              ) : (
                repos.map(r => (
                  <div key={r.id} className="card glass-panel" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <HardDrive size={16} color="var(--accent)" />
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capacité totale</div>
                        <div style={{ fontWeight: 600, marginTop: 2 }}>{r.totalSpaceGB} Go</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Espace libre</div>
                        <div style={{ fontWeight: 600, marginTop: 2, color: r.freeSpaceGB < r.totalSpaceGB * 0.15 ? 'var(--danger)' : 'var(--success)' }}>{r.freeSpaceGB} Go</div>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${r.usedPct}%`, height: '100%', background: r.usedPct > 90 ? 'var(--danger)' : r.usedPct > 75 ? 'var(--warning)' : 'var(--success)', borderRadius: 4, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{r.usedPct}% utilisé</div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'config' && (
            <div style={{ maxWidth: 560 }}>
              <VeeamConfigPanel onSaved={() => { setConfigKey(k => k + 1); load(true); }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
