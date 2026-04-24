import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, RefreshCw, Download, ChevronDown, AlertTriangle, Info, AlertCircle, Activity } from 'lucide-react';
import { api } from '../api';

// ── constants ──────────────────────────────────────────────────────────────────

const SEVERITIES = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];
const SOURCES    = ['ESXi-01-SBEE', 'ESXi-02-SBEE', 'ESXi-03-SBEE', 'SW-CORE-01', 'UPS-SUKAM-01', 'NAS-SYNOLOGY-01', 'SICA-APP-01', 'AD-DC-01'];

const SEV_STYLES = {
  emergency: { bg: '#7f1d1d', color: '#fca5a5', label: 'EMERG' },
  alert:     { bg: '#7c2d12', color: '#fdba74', label: 'ALERT' },
  critical:  { bg: '#431407', color: '#fb923c', label: 'CRIT'  },
  error:     { bg: '#3b0764', color: '#c084fc', label: 'ERROR' },
  warning:   { bg: '#451a03', color: '#fbbf24', label: 'WARN'  },
  notice:    { bg: '#1e3a5f', color: '#60a5fa', label: 'NOTIC' },
  info:      { bg: '#052e16', color: '#4ade80', label: 'INFO'  },
  debug:     { bg: '#1e293b', color: '#94a3b8', label: 'DEBUG' },
};

const SEV_PRIORITY = { emergency: 0, alert: 1, critical: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 };

// ── helpers ────────────────────────────────────────────────────────────────────

function SevBadge({ sev }) {
  const s = SEV_STYLES[sev] || SEV_STYLES.info;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em',
      background: s.bg, color: s.color, padding: '2px 6px', borderRadius: 3,
      whiteSpace: 'nowrap', display: 'inline-block', minWidth: 40, textAlign: 'center',
    }}>
      {s.label}
    </span>
  );
}

function ts(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function StatsChip({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div className="card glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ── main ───────────────────────────────────────────────────────────────────────

export default function LogsExplorer() {
  const [logs,    setLogs]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [paused,  setPaused]  = useState(false);

  // filters
  const [severity, setSeverity] = useState('');
  const [source,   setSource]   = useState('');
  const [search,   setSearch]   = useState('');
  const [limit,    setLimit]    = useState(200);
  const [minSev,   setMinSev]   = useState('');   // minimum severity level filter

  // expand row
  const [expanded, setExpanded] = useState(null);

  const tableRef = useRef(null);
  const atBottomRef = useRef(true);

  const fetchLogs = useCallback(async () => {
    if (paused) return;
    try {
      const params = new URLSearchParams({ limit });
      if (severity) params.set('severity', severity);
      if (source)   params.set('source', source);
      if (search)   params.set('search', search);
      const [data, statsData] = await Promise.all([
        api.getLogs(Object.fromEntries(params)),
        api.getLogStats(),
      ]);
      setLogs(Array.isArray(data) ? data : []);
      setStats(statsData);
    } catch (_) {}
    finally { setLoading(false); }
  }, [paused, severity, source, search, limit]);

  useEffect(() => {
    fetchLogs();
    const t = setInterval(fetchLogs, 3000);
    return () => clearInterval(t);
  }, [fetchLogs]);

  // apply minimum severity client-side filter
  const filteredLogs = minSev
    ? logs.filter(l => (SEV_PRIORITY[l.severity] ?? 6) <= (SEV_PRIORITY[minSev] ?? 7))
    : logs;

  // export to JSON
  function exportLogs() {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `logs-sbee-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // stats helpers
  const criticalCount  = stats ? (stats.bySeverity?.critical || 0) + (stats.bySeverity?.error || 0) + (stats.bySeverity?.emergency || 0) + (stats.bySeverity?.alert || 0) : 0;
  const warningCount   = stats?.bySeverity?.warning || 0;
  const infoCount      = stats?.bySeverity?.info    || 0;

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Explorateur de Logs</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Syslog RFC 5424 · ESXi · Switches · UPS · AD · NAS
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setPaused(p => !p)}
            style={{ background: paused ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)', border: `1px solid ${paused ? '#ef4444' : '#10b981'}40`, borderRadius: 6, padding: '6px 12px', color: paused ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            {paused ? '▶ Reprendre' : '⏸ Pause'}
          </button>
          <button onClick={exportLogs} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} />
            <span style={{ fontSize: 11 }}>Exporter</span>
          </button>
          <button onClick={fetchLogs} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} />
            <span style={{ fontSize: 11 }}>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Stats chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatsChip label="Total (buffer)" value={stats?.total ?? '—'} color="var(--text-primary)" />
        <StatsChip label="Critiques / Erreurs" value={criticalCount} color={criticalCount > 0 ? '#ef4444' : '#10b981'} />
        <StatsChip label="Warnings" value={warningCount} color={warningCount > 0 ? '#f59e0b' : '#10b981'} />
        <StatsChip label="Info" value={infoCount} color="#4ade80" />
        <StatsChip label="Affichés" value={filteredLogs.length} color="#60a5fa" />
      </div>

      {/* Filters */}
      <div className="card glass-panel" style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color="var(--text-muted)" />

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher dans les messages…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', padding: '6px 10px 6px 30px', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Severity exact */}
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="">Toutes sévérités</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Min severity filter */}
        <select
          value={minSev}
          onChange={e => setMinSev(e.target.value)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="">≥ Niveau min</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}+</option>)}
        </select>

        {/* Source */}
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="">Toutes sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Limit */}
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          {[50, 100, 200, 500].map(v => <option key={v} value={v}>{v} lignes</option>)}
        </select>

        {(search || severity || source || minSev) && (
          <button
            onClick={() => { setSearch(''); setSeverity(''); setSource(''); setMinSev(''); }}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '6px 10px', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Log table */}
      <div ref={tableRef} className="card glass-panel" style={{ flex: 1, overflow: 'auto', padding: 0, minHeight: 300 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, color: 'var(--text-muted)' }}>
            <Activity size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
            Chargement des logs…
          </div>
        )}
        {!loading && filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
            Aucun log correspondant aux filtres actifs
          </div>
        )}
        {!loading && filteredLogs.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 2 }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', width: '12%' }}>Horodatage</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', width: '7%' }}>Sév.</th>
                <th style={{ padding: '8px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', width: '14%' }}>Source</th>
                <th style={{ padding: '8px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', width: '8%' }}>Facility</th>
                <th style={{ padding: '8px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                const isExpanded = expanded === log.id;
                const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)';
                const sev = SEV_STYLES[log.severity] || SEV_STYLES.info;
                const isHigh = ['emergency', 'alert', 'critical', 'error'].includes(log.severity);
                return [
                  <tr
                    key={log.id}
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                    style={{ background: isHigh ? `${sev.bg}22` : rowBg, cursor: 'pointer', borderLeft: isHigh ? `3px solid ${sev.color}` : '3px solid transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = isHigh ? `${sev.bg}22` : rowBg}
                  >
                    <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {ts(log.timestamp)}
                    </td>
                    <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                      <SevBadge sev={log.severity} />
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 11, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.source}
                    </td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {log.facility}
                    </td>
                    <td style={{ padding: '6px 8px', color: sev.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.message}
                    </td>
                  </tr>,
                  isExpanded && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={5} style={{ padding: '0 12px 12px', background: 'rgba(0,0,0,0.4)' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, borderLeft: `3px solid ${sev.color}` }}>
                          <div style={{ marginBottom: 6, color: 'var(--text-muted)', fontSize: 10 }}>
                            ID: {log.id} &nbsp;|&nbsp; Timestamp: {log.timestamp}
                          </div>
                          <div style={{ wordBreak: 'break-all', color: sev.color }}>{log.raw || log.message}</div>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* By-source stats */}
      {stats?.bySource && (
        <div className="card glass-panel" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Répartition par source (sur {stats.total} entrées en buffer)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(stats.bySource)
              .sort((a, b) => b[1] - a[1])
              .map(([src, count]) => (
                <div
                  key={src}
                  onClick={() => setSource(src === source ? '' : src)}
                  style={{
                    padding: '5px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    background: source === src ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                    border: source === src ? '1px solid #60a5fa' : '1px solid var(--border)',
                    color: source === src ? '#60a5fa' : 'var(--text-primary)',
                  }}
                >
                  {src} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({count})</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
