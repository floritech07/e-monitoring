import { useState, useMemo, useEffect, useRef } from 'react';
import {
  AlertTriangle, Info, CheckCircle, Bell, BellOff,
  Filter, Search, X, ChevronDown, Clock, Shield,
  Volume2, VolumeX, RefreshCw, Wifi, WifiOff,
  Eye, EyeOff, MessageSquare, Zap, MoreHorizontal
} from 'lucide-react';
import { api } from '../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}j`;
}

const SEV_CONFIG = {
  critical: { label: 'Critique',  color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'rgba(245,83,75,0.3)',   pulse: true  },
  warning:  { label: 'Attention', color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(245,166,35,0.3)',  pulse: false },
  info:     { label: 'Info',      color: 'var(--info)',    bg: 'var(--info-bg)',    border: 'rgba(79,142,247,0.3)',  pulse: false },
};

const CAT_LABELS = {
  cpu: '🖥 CPU', ram: '🧠 RAM', disk: '💾 Disque',
  network: '🌐 Réseau', vm: '📦 VM', backup: '🔒 Backup',
};

// ─── Severity Pulse ───────────────────────────────────────────────────────────

function SeverityBadge({ severity, acknowledged }) {
  const cfg = SEV_CONFIG[severity] || SEV_CONFIG.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      opacity: acknowledged ? 0.6 : 1,
    }}>
      {cfg.pulse && !acknowledged && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: cfg.color,
          animation: 'pulse 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
      {cfg.label}
    </span>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ alerts, onFilterSeverity, activeSeverity }) {
  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0, total: alerts.length };
    alerts.forEach(a => { c[a.severity] = (c[a.severity] || 0) + 1; });
    return c;
  }, [alerts]);

  const stats = [
    { key: 'critical', label: 'Critiques', color: 'var(--danger)',  count: counts.critical },
    { key: 'warning',  label: 'Attention', color: 'var(--warning)', count: counts.warning  },
    { key: 'info',     label: 'Info',      color: 'var(--info)',    count: counts.info     },
    { key: 'all',      label: 'Total',     color: 'var(--accent)',  count: counts.total    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
      {stats.map(s => (
        <div
          key={s.key}
          onClick={() => onFilterSeverity(s.key === 'all' ? null : s.key)}
          style={{
            background: activeSeverity === s.key ? `${s.color}22` : 'var(--bg-surface)',
            border: `1px solid ${activeSeverity === s.key ? s.color : 'var(--border)'}`,
            borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
            transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: s.count > 0 ? s.color : 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            {s.count}
          </div>
          {s.count > 0 && s.key === 'critical' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: s.color, animation: 'shimmer 2s infinite',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Acknowledge Modal ────────────────────────────────────────────────────────

function AckModal({ alert, onClose, onAck }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await onAck(alert.id, comment);
      onClose();
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="card glass-panel fade-in" style={{ width: 460, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Acquitter l'alerte</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          <SeverityBadge severity={alert.severity} />
          <span style={{ marginLeft: 8 }}>{alert.message}</span>
        </div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Commentaire (optionnel)</label>
        <textarea
          rows={3}
          placeholder="Décrivez l'action prise..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{
            width: '100%', marginTop: 6, padding: '8px 12px',
            background: 'var(--bg-base)', border: '1px solid var(--border-bright)',
            borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
            fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}
          >
            {loading ? <RefreshCw size={13} className="rotate-animation" /> : <CheckCircle size={13} />}
            Acquitter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

function AlertRow({ alert, onAck, onSilence, isNew }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        style={{
          background: isNew ? 'rgba(245,83,75,0.05)' : 'transparent',
          animation: isNew ? 'slide-in 0.4s ease' : 'none',
          borderBottom: '1px solid var(--border)',
          transition: 'background 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = isNew ? 'rgba(245,83,75,0.05)' : 'transparent'}
      >
        <td style={{ padding: '10px 12px', width: 110 }}>
          <SeverityBadge severity={alert.severity} acknowledged={alert.acknowledged} />
        </td>
        <td style={{ padding: '10px 12px', width: 100, fontSize: 11, color: 'var(--text-muted)' }}>
          {CAT_LABELS[alert.category] || alert.category}
        </td>
        <td style={{ padding: '10px 12px', flex: 1 }}>
          <div style={{ fontSize: 13, color: alert.acknowledged ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: alert.acknowledged ? 'line-through' : 'none' }}>
            {alert.message}
          </div>
          {alert.acknowledged && alert.ackUser && (
            <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 2 }}>
              ✓ Acquitté par {alert.ackUser} {alert.ackComment ? `— "${alert.ackComment}"` : ''}
            </div>
          )}
        </td>
        <td style={{ padding: '10px 12px', width: 140 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.source}</span>
        </td>
        <td style={{ padding: '10px 12px', width: 70, textAlign: 'right' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {timeAgo(alert.timestamp)}
          </span>
        </td>
        <td style={{ padding: '10px 12px', width: 120 }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
            {!alert.acknowledged && (
              <button
                className="btn btn-sm"
                style={{ padding: '3px 8px', fontSize: 11, border: '1px solid var(--border-bright)', color: 'var(--success)' }}
                onClick={() => onAck(alert)}
                title="Acquitter"
              >
                <CheckCircle size={11} /> Ack
              </button>
            )}
            <button
              className="btn btn-sm"
              style={{ padding: '3px 8px', fontSize: 11, border: '1px solid var(--border-bright)' }}
              onClick={() => setExpanded(e => !e)}
              title="Détails"
            >
              <MoreHorizontal size={11} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: 'var(--bg-elevated)' }}>
          <td colSpan={6} style={{ padding: '10px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, fontSize: 12 }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>ID Alerte</div>
                <span className="mono">#{alert.id}</span>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Règle</div>
                <span className="mono">{alert.ruleId || '—'}</span>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Horodatage</div>
                <span>{new Date(alert.timestamp).toLocaleString('fr-FR')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => onSilence(alert, 3600_000)}
              >
                <BellOff size={11} /> Silence 1h
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => onSilence(alert, 4 * 3600_000)}
              >
                <BellOff size={11} /> Silence 4h
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => onSilence(alert, 24 * 3600_000)}
              >
                <BellOff size={11} /> Silence 24h
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProblemConsole({ alerts: propAlerts, connected }) {
  const [search,       setSearch]       = useState('');
  const [sevFilter,    setSevFilter]    = useState(null);
  const [catFilter,    setCatFilter]    = useState(null);
  const [showAcked,    setShowAcked]    = useState(false);
  const [ackTarget,    setAckTarget]    = useState(null);
  const [alerts,       setAlerts]       = useState(propAlerts || []);
  const [newIds,       setNewIds]       = useState(new Set());
  const [soundOn,      setSoundOn]      = useState(true);
  const [loading,      setLoading]      = useState(false);
  const prevIds = useRef(new Set());
  const audioCtx = useRef(null);

  // Sync from socket
  useEffect(() => {
    if (!propAlerts) return;
    const incoming = new Set(propAlerts.map(a => a.id));
    const fresh    = [...incoming].filter(id => !prevIds.current.has(id));
    if (fresh.length > 0) {
      setNewIds(s => { const n = new Set(s); fresh.forEach(id => n.add(id)); return n; });
      // Fade out "new" highlight after 5s
      setTimeout(() => setNewIds(s => { const n = new Set(s); fresh.forEach(id => n.delete(id)); return n; }), 5000);
      // Sound for critical
      if (soundOn && propAlerts.some(a => fresh.includes(a.id) && a.severity === 'critical')) {
        playBeep(880, 0.2, 0.3);
      }
    }
    prevIds.current = incoming;
    setAlerts(propAlerts);
  }, [propAlerts, soundOn]);

  function playBeep(freq, vol, dur) {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.frequency.value = freq;
      gain.gain.value     = vol;
      osc.start();
      osc.stop(audioCtx.current.currentTime + dur);
    } catch {}
  }

  const filtered = useMemo(() => {
    let list = alerts;
    if (!showAcked) list = list.filter(a => !a.acknowledged);
    if (sevFilter)  list = list.filter(a => a.severity === sevFilter);
    if (catFilter)  list = list.filter(a => a.category === catFilter);
    if (search)     list = list.filter(a =>
      a.message.toLowerCase().includes(search.toLowerCase()) ||
      (a.source || '').toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [alerts, sevFilter, catFilter, showAcked, search]);

  async function handleAck(id, comment) {
    const user = JSON.parse(localStorage.getItem('sbee_user') || '{}').name || 'Opérateur';
    await api.acknowledgeAlert(id, user, comment);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true, ackUser: user, ackComment: comment } : a));
  }

  async function handleSilence(alert, durationMs) {
    await api.createSilence({ category: alert.category, assetId: alert.source, durationMs, reason: `Alerte #${alert.id}` });
  }

  async function handleClearAll() {
    setLoading(true);
    try {
      await api.clearAlerts();
      setAlerts([]);
    } catch {}
    setLoading(false);
  }

  const categories = [...new Set(alerts.map(a => a.category))];

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title glow-text">Console des Problèmes</h1>
          <p className="page-subtitle">Surveillance temps réel des incidents — {filtered.length} alerte(s) affichée(s)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-surface)', border: `1px solid ${connected ? 'rgba(34,211,163,0.3)' : 'rgba(245,83,75,0.3)'}`, borderRadius: 20, fontSize: 12 }}>
            {connected ? <Wifi size={12} color="var(--success)" /> : <WifiOff size={12} color="var(--danger)" />}
            <span style={{ color: connected ? 'var(--success)' : 'var(--danger)' }}>
              {connected ? 'Flux en direct' : 'Reconnexion...'}
            </span>
            {connected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }} />}
          </div>
          <button
            className="btn btn-sm"
            style={{ border: '1px solid var(--border-bright)' }}
            onClick={() => setSoundOn(s => !s)}
            title={soundOn ? 'Couper les sons' : 'Activer les sons'}
          >
            {soundOn ? <Volume2 size={13} color="var(--accent)" /> : <VolumeX size={13} color="var(--text-muted)" />}
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleClearAll} disabled={loading}>
            {loading ? <RefreshCw size={12} className="rotate-animation" /> : <X size={12} />}
            Tout effacer
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar alerts={alerts} onFilterSeverity={setSevFilter} activeSeverity={sevFilter} />

      {/* Filter toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 12px', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Rechercher un incident..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%' }}
          />
          {search && <X size={12} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSearch('')} />}
        </div>

        {/* Category filter */}
        <select
          value={catFilter || ''}
          onChange={e => setCatFilter(e.target.value || null)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12 }}
        >
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
        </select>

        {/* severity chips */}
        {['critical','warning','info'].map(s => {
          const cfg = SEV_CONFIG[s];
          const active = sevFilter === s;
          return (
            <button
              key={s}
              onClick={() => setSevFilter(active ? null : s)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.color : 'var(--text-muted)',
                border: `1px solid ${active ? cfg.border : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {cfg.label}
            </button>
          );
        })}

        <button
          onClick={() => setShowAcked(s => !s)}
          style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: showAcked ? 'var(--success-bg)' : 'transparent',
            color: showAcked ? 'var(--success)' : 'var(--text-muted)',
            border: `1px solid ${showAcked ? 'rgba(34,211,163,0.3)' : 'var(--border)'}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {showAcked ? <Eye size={11} style={{ marginRight: 4 }} /> : <EyeOff size={11} style={{ marginRight: 4 }} />}
          Acquittées
        </button>
      </div>

      {/* Alert Table */}
      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 80 }}>
            <CheckCircle size={48} style={{ color: 'var(--success)', opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>Aucun incident actif</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Le système fonctionne normalement.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {['Sévérité','Catégorie','Message','Source','Durée','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(alert => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    isNew={newIds.has(alert.id)}
                    onAck={setAckTarget}
                    onSilence={handleSilence}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ack modal */}
      {ackTarget && (
        <AckModal
          alert={ackTarget}
          onClose={() => setAckTarget(null)}
          onAck={handleAck}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
