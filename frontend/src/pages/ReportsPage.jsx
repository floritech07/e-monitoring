import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Printer, RefreshCw, TrendingUp, Server, Shield, Database, Wifi } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../api';

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#38bdf8', '#8b5cf6'];

function KpiCard({ label, value, sub, color = 'var(--accent)', icon: Icon }) {
  return (
    <div className="card glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      {Icon && (
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      )}
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 3, height: 16, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [avail, setAvail]       = useState(null);
  const [backup, setBackup]     = useState(null);
  const [incStats, setIncStats] = useState(null);
  const [envSummary, setEnv]    = useState(null);
  const [svcChecks, setSvc]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState('24h');

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b, i, e, s] = await Promise.allSettled([
      api.getAvailability(period),
      api.getBackupReport(),
      api.getIncidentStats(),
      api.getEnvSummary(),
      api.getServiceChecksAll(),
    ]);
    if (a.status === 'fulfilled') setAvail(a.value);
    if (b.status === 'fulfilled') setBackup(b.value);
    if (i.status === 'fulfilled') setIncStats(i.value);
    if (e.status === 'fulfilled') setEnv(e.value);
    if (s.status === 'fulfilled') setSvc(Array.isArray(s.value) ? s.value : Object.values(s.value));
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  function handlePrint() { window.print(); }

  function handleExportCSV() {
    if (!avail) return;
    const rows = [['Asset', 'IP', 'Type', 'Statut', 'Latence', 'Dernière vérif']];
    for (const a of (avail.assets || [])) {
      rows.push([a.name, a.ip, a.type, a.status, a.latency ?? '', a.lastProbed ?? '']);
    }
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `rapport_disponibilite_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // Derived metrics
  const netAvailPct  = avail?.networkAssets?.availabilityPct ?? 0;
  const svcOkPct     = svcChecks.length ? Math.round(svcChecks.filter(s => s.status === 'ok').length / svcChecks.length * 100) : 0;
  const backupOkPct  = backup?.summary ? Math.round((backup.summary.success / Math.max(1, backup.summary.total)) * 100) : 0;

  const svcStatusData = [
    { name: 'OK',          value: svcChecks.filter(s => s.status === 'ok').length },
    { name: 'Critique',    value: svcChecks.filter(s => s.status === 'critical').length },
    { name: 'Avertissement',value: svcChecks.filter(s => s.status === 'warning').length },
    { name: 'Inconnu',     value: svcChecks.filter(s => !['ok','critical','warning'].includes(s.status)).length },
  ].filter(d => d.value > 0);

  const backupData = backup?.jobs ? [
    { name: 'Succès',  value: backup.jobs.filter(j => j.statusInfo?.severity === 'success').length },
    { name: 'Échecs',  value: backup.jobs.filter(j => j.statusInfo?.severity === 'critical').length },
    { name: 'Warnings',value: backup.jobs.filter(j => j.statusInfo?.severity === 'warning').length },
  ] : [];

  const netData = avail?.assets ? [
    { name: 'En ligne',  value: avail.assets.filter(a => a.status === 'online').length },
    { name: 'Hors ligne',value: avail.assets.filter(a => a.status === 'offline').length },
  ] : [];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ marginLeft: 12 }}>Génération du rapport…</span>
    </div>
  );

  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo', dateStyle: 'full', timeStyle: 'medium' });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }} id="report-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Rapport de Supervision — SBEE DSITD
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Généré le {now} WAT
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13 }}>
            <option value="24h">24 heures</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
            <RefreshCw size={13} />Actualiser
          </button>
          <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
            <Download size={13} />CSV
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            <Printer size={13} />Imprimer
          </button>
        </div>
      </div>

      {/* KPIs globaux */}
      <Section title="Synthèse globale">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 8 }}>
          <KpiCard label="Disponibilité réseau" value={`${netAvailPct}%`} color={netAvailPct >= 99 ? '#22c55e' : netAvailPct >= 95 ? '#f59e0b' : '#ef4444'} icon={Wifi} sub={`${avail?.networkAssets?.online || 0} / ${avail?.networkAssets?.total || 0} équipements`} />
          <KpiCard label="Services applicatifs" value={`${svcOkPct}%`} color={svcOkPct >= 90 ? '#22c55e' : '#f59e0b'} icon={Server} sub={`${svcChecks.filter(s=>s.status==='ok').length} / ${svcChecks.length} OK`} />
          <KpiCard label="Backups réussis" value={`${backupOkPct}%`} color={backupOkPct >= 90 ? '#22c55e' : '#ef4444'} icon={Database} sub={`${backup?.summary?.success || 0} / ${backup?.summary?.total || 0} jobs`} />
          <KpiCard label="Incidents ouverts" value={incStats ? (incStats.nouveau + incStats.enCours) : '–'} color="#f97316" icon={Shield} sub={`MTTR : ${incStats?.mttrMinutes != null ? incStats.mttrMinutes + 'min' : 'N/A'}`} />
        </div>
      </Section>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Pie services */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Services applicatifs</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={svcStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name">
                {svcStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar backups */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Jobs de sauvegarde</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={backupData} barSize={24}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="value" radius={4}>
                {backupData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie réseau */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Équipements réseau</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={netData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name">
                {netData.map((_, i) => <Cell key={i} fill={i === 0 ? '#22c55e' : '#ef4444'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environnement physique */}
      {envSummary && (
        <Section title="Environnement physique (salle serveur)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Temp. moyenne', value: `${envSummary.avgTempC}°C`,   color: envSummary.avgTempC > 27 ? '#f59e0b' : '#22c55e' },
              { label: 'Temp. max',     value: `${envSummary.maxTempC}°C`,   color: envSummary.maxTempC > 32 ? '#ef4444' : '#f59e0b' },
              { label: 'Allée chaude',  value: `${envSummary.hotAisleTempC}°C`, color: envSummary.hotAisleTempC > 35 ? '#ef4444' : '#22c55e' },
              { label: 'Humidité moy.', value: `${envSummary.avgHumidity}%`, color: envSummary.avgHumidity > 65 || envSummary.avgHumidity < 30 ? '#f59e0b' : '#22c55e' },
            ].map(k => (
              <div key={k.label} className="card glass-panel" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>Conformité ASHRAE :</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: envSummary.ashrae?.compliant ? '#22c55e' : '#ef4444' }}>
              {envSummary.ashrae?.compliant ? '✓ Conforme' : '✗ Hors norme'} — Classe {envSummary.ashrae?.class}
            </span>
          </div>
        </Section>
      )}

      {/* Disponibilité équipements réseau */}
      {avail?.assets?.length > 0 && (
        <Section title={`Disponibilité équipements réseau — ${period}`}>
          <div className="card glass-panel" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-hover)' }}>
                  {['Équipement', 'IP', 'Type', 'Statut', 'Latence', 'Dernière vérif'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {avail.assets.slice(0, 20).map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{a.name}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{a.ip}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{a.type}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: a.status === 'online' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: a.status === 'online' ? '#22c55e' : '#ef4444' }}>
                        {a.status === 'online' ? '● EN LIGNE' : '● HORS LIGNE'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{a.latency != null ? `${a.latency}ms` : '–'}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{a.lastProbed ? new Date(a.lastProbed).toLocaleString('fr-FR') : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Incidents ITIL */}
      {incStats && (
        <Section title="Incidents ITIL — Résumé">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Total',        value: incStats.total,    color: 'var(--text-primary)' },
              { label: 'Nouveaux',     value: incStats.nouveau,  color: '#ef4444' },
              { label: 'En cours',     value: incStats.enCours,  color: '#f59e0b' },
              { label: 'Résolus',      value: incStats.résolu,   color: '#22c55e' },
              { label: 'MTTR moyen',   value: incStats.mttrMinutes != null ? `${incStats.mttrMinutes}min` : 'N/A', color: '#38bdf8' },
            ].map(k => (
              <div key={k.label} className="card glass-panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          .card { break-inside: avoid; }
          button, select { display: none !important; }
        }
      `}</style>
    </div>
  );
}
