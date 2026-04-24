import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  Shield, RefreshCw, Download, Search, Filter, ChevronRight,
  User, Settings, Trash2, Edit2, Plus, Eye, AlertTriangle,
} from 'lucide-react';

const METHOD_COLOR = {
  GET:    '#6B7280',
  POST:   '#10B981',
  PUT:    '#F59E0B',
  PATCH:  '#F59E0B',
  DELETE: '#EA580C',
};

const METHOD_LABEL = {
  POST:   'CRÉÉ',
  PUT:    'MODIFIÉ',
  PATCH:  'MODIFIÉ',
  DELETE: 'SUPPRIMÉ',
  GET:    'LU',
};

const PATH_ICONS = {
  '/api/oncall':         <User size={12} />,
  '/api/alert':         <AlertTriangle size={12} />,
  '/api/service-check': <Settings size={12} />,
  '/api/room':          <Eye size={12} />,
  '/api/notification':  <Shield size={12} />,
};

function pathIcon(path) {
  for (const [prefix, icon] of Object.entries(PATH_ICONS)) {
    if (path?.startsWith(prefix)) return icon;
  }
  return <Settings size={12} />;
}

export default function AuditTrailPage() {
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [methodFlt,  setMethodFlt]  = useState('ALL');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [selected,   setSelected]   = useState(null);
  const PAGE_SIZE = 50;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
      if (methodFlt !== 'ALL') params.method = methodFlt;
      if (search.trim()) params.q = search.trim();
      const data = await api.getAuditTrail(params);
      setEntries(data.entries || []);
      setTotal(data.total   || 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page, methodFlt, search]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { setPage(1); }, [methodFlt, search]);

  const exportCSV = () => {
    const header = 'Timestamp,Méthode,Chemin,IP,Utilisateur,Statut,Durée(ms)\n';
    const rows = entries.map(e =>
      `"${e.ts}","${e.method}","${e.path}","${e.ip}","${e.user || 'anonymous'}","${e.status}","${e.durationMs}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url; a.download = `audit-trail-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summaryByMethod = entries.reduce((acc, e) => {
    acc[e.method] = (acc[e.method] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fade-in" style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={22} style={{ color: 'var(--accent)' }} />
            Piste d'audit
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Traçabilité complète des actions — qui a fait quoi, quand
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchEntries}>
            <RefreshCw size={13} /> Actualiser
          </button>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total événements', value: total, color: 'var(--accent)' },
          { label: 'Créations', value: summaryByMethod['POST'] || 0, color: '#10B981' },
          { label: 'Modifications', value: (summaryByMethod['PUT'] || 0) + (summaryByMethod['PATCH'] || 0), color: '#F59E0B' },
          { label: 'Suppressions', value: summaryByMethod['DELETE'] || 0, color: '#EA580C' },
        ].map(s => (
          <div key={s.label} className="card glass-panel"
            style={{ padding: '12px 20px', minWidth: 140, flex: '1 1 140px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Chercher par chemin, IP, utilisateur…"
            style={{ width: '100%', paddingLeft: 30, height: 34, background: 'var(--bg-surface)',
              border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)',
              fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'POST', 'PUT', 'DELETE', 'GET'].map(m => (
            <button key={m}
              className={`btn btn-sm ${methodFlt === m ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11, color: m !== 'ALL' && methodFlt !== m ? METHOD_COLOR[m] : undefined }}
              onClick={() => setMethodFlt(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                {['Timestamp', 'Méthode', 'Action', 'IP source', 'Utilisateur', 'Statut', 'Durée', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                    color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                  Chargement…
                </td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <Shield size={28} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  Aucune entrée d'audit
                </td></tr>
              )}
              {!loading && entries.map((e, i) => (
                <tr key={i}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    background: selected === i ? 'rgba(79,142,247,0.06)' : 'transparent',
                    transition: 'background 0.1s' }}
                  onClick={() => setSelected(selected === i ? null : i)}
                  onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={ev => ev.currentTarget.style.background = selected === i ? 'rgba(79,142,247,0.06)' : 'transparent'}
                >
                  <td style={{ padding: '7px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {e.ts ? new Date(e.ts).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: `${METHOD_COLOR[e.method] || '#6B7280'}22`,
                      color: METHOD_COLOR[e.method] || '#6B7280',
                    }}>{e.method}</span>
                  </td>
                  <td style={{ padding: '7px 12px', maxWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{pathIcon(e.path)}</span>
                      <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.path}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {e.ip || '—'}
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-primary)' }}>
                    {e.user || <span style={{ color: 'var(--text-muted)' }}>anonymous</span>}
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{
                      padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                      background: e.status < 400 ? '#10B98120' : '#EA580C20',
                      color: e.status < 400 ? '#10B981' : '#EA580C',
                    }}>{e.status}</span>
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {e.durationMs != null ? `${e.durationMs} ms` : '—'}
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    <ChevronRight size={12} style={{
                      color: 'var(--accent)',
                      transform: selected === i ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s',
                    }} />
                  </td>
                </tr>
              ))}
              {/* Expanded detail row */}
              {selected !== null && entries[selected] && (
                <tr style={{ background: 'rgba(79,142,247,0.04)' }}>
                  <td colSpan={8} style={{ padding: '12px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 11 }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>EN-TÊTES</div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, fontSize: 10,
                          background: 'var(--bg-base)', padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 80 }}>
                          {JSON.stringify(entries[selected].headers || {}, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>CORPS REQUÊTE</div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, fontSize: 10,
                          background: 'var(--bg-base)', padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 80 }}>
                          {JSON.stringify(entries[selected].body || {}, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>MÉTADONNÉES</div>
                        <div style={{ background: 'var(--bg-base)', padding: 8, borderRadius: 4, lineHeight: 1.8 }}>
                          <div>User-Agent: <span style={{ color: 'var(--accent)', fontSize: 10 }}>{entries[selected].userAgent || '—'}</span></div>
                          <div>Session: <span style={{ color: 'var(--accent)' }}>{entries[selected].sessionId || '—'}</span></div>
                          <div>Durée: <span style={{ color: 'var(--accent)' }}>{entries[selected].durationMs} ms</span></div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {total} entrée{total !== 1 ? 's' : ''} • page {page} / {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              ← Préc.
            </button>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Suiv. →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
