import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, Info, CheckCircle, Trash2, Search,
  XCircle, Check, Bell, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { api } from '../api';

const PAGE_SIZE = 50;

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `il y a ${s}s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)}m`;
  if (s < 86400)return `il y a ${Math.floor(s / 3600)}h`;
  return `il y a ${Math.floor(s / 86400)}j`;
}

function toIso(ts) {
  return new Date(ts).toLocaleString('fr-FR');
}

const LEVEL_CONFIG = {
  critical: { label: 'Critique',  color: '#E30613', bg: 'rgba(227,6,19,0.08)',   border: '#E30613', icon: XCircle },
  warning:  { label: 'Attention', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', icon: AlertTriangle },
  info:     { label: 'Info',      color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: '#3b82f6', icon: Info },
  ok:       { label: 'OK',        color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: '#22c55e', icon: CheckCircle },
};

function normalizeLevel(a) {
  return a.severity || a.level || 'info';
}

function SummaryCard({ level, count, selected, onClick }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 120,
        background: selected ? cfg.bg : 'var(--bg-surface)',
        border: `1px solid ${selected ? cfg.color : 'var(--border)'}`,
        borderRadius: 10,
        padding: '14px 18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.15s',
        outline: 'none',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `${cfg.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={cfg.color} />
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{cfg.label}</div>
      </div>
    </button>
  );
}

export default function AlertsPage({ alerts: propAlerts }) {
  const [alerts, setAlerts]       = useState(propAlerts || []);
  const [loading, setLoading]     = useState(false);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [cleared, setCleared]     = useState(false);
  const [acked, setAcked]         = useState(new Set());
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const data = await api.getAllAlerts(500);
      if (Array.isArray(data)) setAlerts(data);
    } catch {
      if (propAlerts) setAlerts(propAlerts);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    try {
      await api.clearAlerts();
      setAlerts([]);
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch { }
  }

  async function handleAck(alert) {
    try {
      await api.acknowledgeAlert(alert.id, 'admin', '');
    } catch { }
    setAcked(prev => new Set([...prev, alert.id]));
  }

  const categories = useMemo(() =>
    [...new Set(alerts.map(a => a.category).filter(Boolean))].sort(),
    [alerts]
  );

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0, ok: 0 };
    alerts.forEach(a => {
      const l = normalizeLevel(a);
      if (c[l] !== undefined) c[l]++; else c.info++;
    });
    return c;
  }, [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      const lvl = normalizeLevel(a);
      if (filter !== 'all' && lvl !== filter) return false;
      if (catFilter && a.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (a.message  || '').toLowerCase().includes(q) ||
          (a.source   || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, filter, search, catFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage() { setPage(1); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Alertes &amp; Événements</div>
          <div className="page-subtitle">{alerts.length} alerte(s) — {filtered.length} affichée(s)</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadAlerts} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Actualiser
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClear}>
            <Trash2 size={13} /> Tout effacer
          </button>
        </div>
      </div>

      {/* Banner cleared */}
      {cleared && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(34,211,163,0.2)',
          borderRadius: 8, padding: '10px 16px', color: 'var(--success)',
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={14} /> Alertes effacées avec succès
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <SummaryCard level="critical" count={counts.critical} selected={filter === 'critical'} onClick={() => { setFilter(f => f === 'critical' ? 'all' : 'critical'); resetPage(); }} />
        <SummaryCard level="warning"  count={counts.warning}  selected={filter === 'warning'}  onClick={() => { setFilter(f => f === 'warning'  ? 'all' : 'warning');  resetPage(); }} />
        <SummaryCard level="info"     count={counts.info}     selected={filter === 'info'}     onClick={() => { setFilter(f => f === 'info'     ? 'all' : 'info');     resetPage(); }} />
        <SummaryCard level="ok"       count={counts.ok}       selected={filter === 'ok'}       onClick={() => { setFilter(f => f === 'ok'       ? 'all' : 'ok');       resetPage(); }} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, width: '100%' }}
            placeholder="Rechercher message, source…"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
          />
          {search && (
            <button onClick={() => { setSearch(''); resetPage(); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <XCircle size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          className="input"
          style={{ minWidth: 160 }}
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); resetPage(); }}
        >
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Level pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'Toutes'], ['critical', 'Critiques'], ['warning', 'Attention'], ['info', 'Info']].map(([val, lbl]) => (
            <button
              key={val}
              className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setFilter(val); resetPage(); }}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {paginated.length === 0 ? (
          <div className="empty-state" style={{ padding: 64 }}>
            <Bell size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <div style={{ color: 'var(--text-secondary)' }}>Aucune alerte correspondante</div>
          </div>
        ) : (
          <table className="vm-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 60 }} />
            </colgroup>
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Catégorie</th>
                <th>Message</th>
                <th>Source</th>
                <th>Heure</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(alert => {
                const lvl = normalizeLevel(alert);
                const cfg = LEVEL_CONFIG[lvl] || LEVEL_CONFIG.info;
                const Icon = cfg.icon;
                const isExpanded = expanded === alert.id;
                const isAcked    = acked.has(alert.id) || alert.acknowledged;
                return (
                  <>
                    <tr
                      key={alert.id}
                      onClick={() => setExpanded(isExpanded ? null : alert.id)}
                      style={{
                        cursor: 'pointer',
                        background: isAcked ? 'transparent' : cfg.bg,
                        borderLeft: `3px solid ${isAcked ? 'transparent' : cfg.color}`,
                        opacity: isAcked ? 0.55 : 1,
                        transition: 'background 0.15s',
                      }}
                    >
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, fontWeight: 600, color: cfg.color,
                          background: `${cfg.color}18`, borderRadius: 5,
                          padding: '3px 8px',
                        }}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'capitalize' }}>
                        {alert.category || '—'}
                      </td>
                      <td style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                        {alert.message}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                          {alert.source || '—'}
                        </span>
                      </td>
                      <td>
                        <span title={toIso(alert.timestamp)} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {timeAgo(alert.timestamp)}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        {!isAcked && (
                          <button
                            title="Acquitter"
                            onClick={() => handleAck(alert)}
                            style={{
                              background: 'none', border: '1px solid var(--border)',
                              borderRadius: 6, padding: '3px 6px', cursor: 'pointer',
                              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Check size={12} />
                          </button>
                        )}
                        {isAcked && <Check size={12} color="var(--success)" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${alert.id}-exp`} style={{ background: 'var(--bg-surface)' }}>
                        <td colSpan={6} style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <span><b>ID :</b> {alert.id}</span>
                            <span><b>Heure exacte :</b> {toIso(alert.timestamp)}</span>
                            {alert.source && <span><b>Source :</b> {alert.source}</span>}
                            {alert.category && <span><b>Catégorie :</b> {alert.category}</span>}
                            {alert.value !== undefined && <span><b>Valeur :</b> {alert.value}</span>}
                            {alert.threshold !== undefined && <span><b>Seuil :</b> {alert.threshold}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={14} /> Préc.
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Page {page} / {totalPages} — {filtered.length} alertes
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Suiv. <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
