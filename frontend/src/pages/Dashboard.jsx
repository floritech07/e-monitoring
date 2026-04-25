import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, Layers, HardDrive, AlertTriangle, Thermometer,
  Activity, Network, Bell, ChevronRight, CheckCircle,
  Zap, Grid, RefreshCw, Box, XCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../api';

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEV_COLOR = { critical: '#ef4444', emergency: '#ef4444', error: '#f97316', warning: '#f59e0b', info: '#3b82f6', notice: '#3b82f6' };
const SEV_LABEL = { critical: 'Critique', emergency: 'Critique', error: 'Erreur', warning: 'Avertissement', info: 'Info', notice: 'Info' };

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, unit = '', icon: Icon, color = '#E30613', onClick, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && onClick ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${hov && onClick ? color : 'var(--border)'}`,
        borderRadius: 12, padding: '16px 18px', cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ background: `${color}20`, borderRadius: 7, padding: 7 }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>{label}</span>
        {onClick && <ChevronRight size={11} color="var(--text-muted)" />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {loading ? <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>—</span> : value}
        {!loading && unit && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
      </div>
      <div style={{ position: 'absolute', bottom: -12, right: -8, opacity: 0.04, pointerEvents: 'none' }}>
        <Icon size={60} color={color} />
      </div>
    </div>
  );
}

function CapBar({ label, pct }) {
  const c = pct < 60 ? '#22d3a3' : pct < 80 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 700, color: c }}>{pct}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: c, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function AlarmBadge({ count, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 8 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color }}>{count}</span>
    </div>
  );
}

function FunctionMapModal({ open, onClose, navigate }) {
  if (!open) return null;
  const sections = [
    { title: 'Infrastructure', color: '#E30613', items: [
      { label: 'Clusters & Pools', path: '/clusters' },
      { label: 'Stockage', path: '/storage' },
      { label: 'Datastore Browser', path: '/datastore' },
      { label: 'Fabric réseau', path: '/network-fabric' },
      { label: 'Carte des services', path: '/services' },
      { label: 'Salle serveur 3D', path: '/datacenter-3d' },
    ]},
    { title: 'Environnement', color: '#22d3a3', items: [
      { label: 'Conditions DC', path: '/physical' },
      { label: 'Schéma électrique UPS', path: '/ups-diagram' },
      { label: 'Réseau WAN & VPN', path: '/vpn-wan' },
      { label: 'Explorateur Logs SI', path: '/logs' },
    ]},
    { title: 'Opérations', color: '#f59e0b', items: [
      { label: 'Vérif. services', path: '/service-checks' },
      { label: 'Astreinte & ITIL', path: '/oncall' },
      { label: 'Capacity Planning', path: '/capacity' },
      { label: 'Sauvegardes GFS', path: '/veeam/gfs' },
      { label: 'Actions à distance', path: '/actions' },
    ]},
    { title: 'Sécurité', color: '#a855f7', items: [
      { label: 'Alertes', path: '/alerts' },
      { label: 'Règles alertes', path: '/rules' },
      { label: 'Audit Trail', path: '/audit' },
      { label: 'Gestion utilisateurs', path: '/users' },
    ]},
    { title: 'Intégrations', color: '#38bdf8', items: [
      { label: 'Payment Monitor', path: '/payments' },
      { label: 'Topologie réseau', path: '/topology' },
      { label: 'Rapports', path: '/reports' },
    ]},
  ];
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 740, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Grid size={18} color="#E30613" />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Carte des fonctions — NexusMonitor SBEE</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 20 }}>
          {sections.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 10, fontWeight: 700, color: sec.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${sec.color}30` }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sec.items.map(item => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); onClose(); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = sec.color}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <ChevronRight size={10} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow]                   = useState(new Date());
  const [showMap, setShowMap]           = useState(false);
  const [clusters, setClusters]         = useState(null);
  const [hosts, setHosts]               = useState(null);
  const [alertsData, setAlertsData]     = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [envSummary, setEnvSummary]     = useState(null);
  const [engineStats, setEngineStats]   = useState(null);
  const [activity, setActivity]         = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      api.getClusters().then(setClusters).catch(() => {}),
      api.getEsxiHosts().then(setHosts).catch(() => {}),
      api.getAllAlerts(50).then(setAlertsData).catch(() => {}),
      api.getStorageStats().then(setStorageStats).catch(() => {}),
      api.getEnvSummary().then(setEnvSummary).catch(() => {}),
      api.getAlertEngineStats().then(setEngineStats).catch(() => {}),
      api.getActivity().then(setActivity).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const totalHosts    = hosts?.length ?? 0;
  const totalVMs      = (hosts || []).reduce((s, h) => s + (h.vmCount || 0), 0);
  const totalClusters = clusters?.length ?? 0;

  const cpuUsed  = (clusters || []).reduce((s, c) => s + (c.cpu?.used  || 0), 0);
  const cpuTotal = (clusters || []).reduce((s, c) => s + (c.cpu?.total || 0), 0);
  const ramUsed  = (clusters || []).reduce((s, c) => s + (c.ram?.used  || 0), 0);
  const ramTotal = (clusters || []).reduce((s, c) => s + (c.ram?.total || 0), 0);
  const cpuPct   = cpuTotal > 0 ? Math.round((cpuUsed / cpuTotal) * 100) : 0;
  const ramPct   = ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0;
  const storPct  = storageStats
    ? (storageStats.usedPct ?? (storageStats.totalTB > 0 ? Math.round((storageStats.usedTB / storageStats.totalTB) * 100) : 0))
    : 0;

  const alertList  = Array.isArray(alertsData) ? alertsData : [];
  const critCount  = alertList.filter(a => a.severity === 'critical' || a.severity === 'emergency').length;
  const errCount   = alertList.filter(a => a.severity === 'error').length;
  const warnCount  = alertList.filter(a => a.severity === 'warning').length;
  const infoCount  = alertList.filter(a => a.severity === 'info' || a.severity === 'notice').length;

  const recentAlerts = [...alertList]
    .sort((a, b) => {
      const ORD = { critical: 0, emergency: 0, error: 1, warning: 2, info: 3, notice: 4 };
      return (ORD[a.severity] ?? 5) - (ORD[b.severity] ?? 5);
    })
    .slice(0, 5);

  const sysOpOk = critCount === 0;

  // Energy sparkline
  const baseKW = envSummary?.power?.totalKW || 220;
  const energyData = Array.from({ length: 12 }, (_, i) => ({
    t: `${i * 5}m`, kw: Math.round(baseKW + (Math.sin(i / 3) * 15)),
  }));

  // Health donut
  const evaluated = engineStats?.evaluated ?? 0;
  const critEngine = engineStats?.bySeverity?.critical ?? critCount;
  const warnEngine = engineStats?.bySeverity?.warning  ?? warnCount;
  const okVal = Math.max(0, evaluated - critEngine - warnEngine) || (critCount === 0 ? 1 : 0);
  const healthData = [
    { name: 'OK',        value: okVal,       color: '#22d3a3' },
    { name: 'Warning',   value: warnEngine || warnCount, color: '#f59e0b' },
    { name: 'Critique',  value: critEngine,  color: '#ef4444' },
  ];

  const fmtClock = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate  = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fade-in" style={{ padding: '24px 28px', background: 'var(--bg-base)', minHeight: 'calc(100vh - 60px)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── ZONE A : Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Centre de Commande — <span style={{ color: '#E30613' }}>SBEE</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: sysOpOk ? '#22d3a3' : '#ef4444',
                boxShadow: `0 0 6px ${sysOpOk ? '#22d3a3' : '#ef4444'}`,
                animation: sysOpOk ? 'none' : 'pulse 1.5s infinite',
              }} />
              <span style={{ color: sysOpOk ? '#22d3a3' : '#ef4444', fontWeight: 700 }}>
                {sysOpOk ? 'SYSTÈME OPÉRATIONNEL' : `${critCount} ALERTE(S) CRITIQUE(S)`}
              </span>
            </div>
            <span>{fmtDate(now)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#E30613', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px' }}>
            {fmtClock(now)}
          </span>
          <button
            onClick={() => setShowMap(true)}
            style={{ background: '#E30613', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <Grid size={13} /> Carte des fonctions
          </button>
          <button
            onClick={fetchAll}
            title="Rafraîchir"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── ZONE B : KPI Row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Hôtes physiques"      value={totalHosts}    icon={Server}        color="#E30613"  onClick={() => navigate('/clusters')}       loading={loading} />
        <KpiCard label="Machines virtuelles"  value={totalVMs}      icon={Box}           color="#a855f7"  onClick={() => navigate('/infrastructure')}  loading={loading} />
        <KpiCard label="Clusters actifs"      value={totalClusters} icon={Layers}        color="#38bdf8"  onClick={() => navigate('/clusters')}       loading={loading} />
        <KpiCard label="Alertes critiques"    value={critCount}     icon={AlertTriangle} color="#ef4444"  onClick={() => navigate('/alerts')}         loading={loading} />
        <KpiCard label="Stockage utilisé"     value={storPct} unit="%" icon={HardDrive}  color="#f59e0b"  onClick={() => navigate('/storage')}        loading={loading} />
        <KpiCard
          label="Température salle"
          value={envSummary?.temperature != null ? parseFloat(envSummary.temperature).toFixed(1) : '—'}
          unit={envSummary?.temperature != null ? '°C' : ''}
          icon={Thermometer}
          color="#22d3a3"
          onClick={() => navigate('/physical')}
          loading={loading}
        />
      </div>

      {/* ── ZONE C : 3 colonnes ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 250px', gap: 16, marginBottom: 16 }}>

        {/* Col gauche — Resource Allocation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>Allocation ressources</div>
            <CapBar label="CPU" pct={cpuPct} />
            <CapBar label="Mémoire RAM" pct={ramPct} />
            <CapBar label="Stockage" pct={storPct} />
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Virtualisation</div>
            {[
              { icon: Box,    label: 'VMs actives',  value: totalVMs,      path: '/infrastructure' },
              { icon: Server, label: 'Hôtes ESXi',    value: totalHosts,    path: '/clusters' },
              { icon: Layers, label: 'Clusters',       value: totalClusters, path: '/clusters' },
            ].map(({ icon: Icon, label, value, path }) => (
              <div
                key={label}
                onClick={() => navigate(path)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderRadius: 4, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{loading ? '—' : value}</span>
                <ChevronRight size={10} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>

        {/* Col centre — Hôtes ESXi + graphe énergie */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Hôtes ESXi — Statut temps réel</span>
              <button
                onClick={() => navigate('/clusters')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E30613', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Vue complète <ChevronRight size={11} />
              </button>
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>Chargement des hôtes…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
                {(hosts || []).map(host => {
                  const cpuH = host.cpu ? Math.round((host.cpu.used / Math.max(host.cpu.total, 1)) * 100) : 0;
                  const ramH = host.ram ? Math.round((host.ram.usedGB / Math.max(host.ram.totalGB, 1)) * 100) : 0;
                  const ok   = host.status !== 'offline' && host.status !== 'error';
                  return (
                    <div
                      key={host.id}
                      onClick={() => navigate(`/infrastructure/esxi/${host.id}`)}
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#E30613'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {host.name || host.id}
                        </span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#22d3a3' : '#ef4444', marginLeft: 6, flexShrink: 0 }} />
                      </div>
                      <CapBar label={`CPU  ${cpuH}%`} pct={cpuH} />
                      <CapBar label={`RAM  ${ramH}%`} pct={ramH} />
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                        {host.vmCount ?? 0} VMs &nbsp;·&nbsp; {host.ip || ''}
                      </div>
                    </div>
                  );
                })}
                {(!hosts || hosts.length === 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aucun hôte ESXi trouvé.</div>
                )}
              </div>
            )}
          </div>

          {/* Graphe énergie */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Zap size={13} color="#E30613" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Consommation énergétique</span>
              </div>
              {envSummary?.power?.totalKW && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{envSummary.power.totalKW} kW</span>
              )}
            </div>
            <div style={{ height: 90 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-primary)', borderRadius: 6 }} />
                  <Line type="monotone" dataKey="kw" stroke="#E30613" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Col droite — Alarmes */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Bell size={13} color="#E30613" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Alarmes</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total {alertList.length}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <AlarmBadge count={critCount} label="Critique"  color="#ef4444" />
            <AlarmBadge count={errCount}  label="Erreur"    color="#f97316" />
            <AlarmBadge count={warnCount} label="Warning"   color="#f59e0b" />
            <AlarmBadge count={infoCount} label="Info"      color="#3b82f6" />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Récentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Chargement…</div>
              ) : recentAlerts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22d3a3', fontSize: 12 }}>
                  <CheckCircle size={13} /> Aucune alerte active
                </div>
              ) : (
                recentAlerts.map((alert, i) => {
                  const sev = alert.severity || 'info';
                  const col = SEV_COLOR[sev] || '#3b82f6';
                  return (
                    <div
                      key={i}
                      onClick={() => navigate('/alerts')}
                      style={{ padding: '8px 10px', background: `${col}08`, border: `1px solid ${col}20`, borderRadius: 8, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `${col}50`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = `${col}20`}
                    >
                      <div style={{ fontSize: 10, color: col, fontWeight: 700, marginBottom: 2 }}>{SEV_LABEL[sev] || sev}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {alert.message || alert.msg || 'Alerte système'}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                        {alert.source && ` · ${alert.source}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/alerts')}
            style={{ background: 'rgba(227,6,19,0.1)', border: '1px solid rgba(227,6,19,0.3)', color: '#E30613', borderRadius: 8, padding: '8px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            Voir toutes les alertes <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* ── ZONE D : Bottom Status Bar ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Statut infrastructure */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Statut infrastructure</div>
          {[
            { label: 'Hôtes en ligne',  value: (hosts || []).filter(h => h.status !== 'offline').length, total: totalHosts, color: '#22d3a3' },
            { label: 'VMs actives',      value: totalVMs,                                                total: null,       color: '#a855f7' },
            { label: 'Alertes actives',  value: alertList.length,                                        total: null,       color: alertList.length > 0 ? '#ef4444' : '#22d3a3' },
            { label: 'Stockage libre',   value: storageStats?.freeTB != null ? `${storageStats.freeTB} TB` : (storageStats ? `${(100 - storPct)}%` : '—'), total: null, color: '#f59e0b' },
          ].map(({ label, value, total, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>
                {loading ? '—' : value}
                {total !== null && !loading && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}> / {total}</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Health Check */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Health Check</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" stroke="none">
                    {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {healthData.map(h => (
                <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{h.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: h.color }}>{h.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Activité récente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Chargement…</div>
            ) : (activity || []).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Aucune activité récente.</div>
            ) : (
              (activity || []).slice(0, 5).map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E30613', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.action || act.message || act.event || 'Action système'}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                      {act.user && <span>{act.user} · </span>}
                      {act.timestamp ? new Date(act.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Function Map Modal */}
      <FunctionMapModal open={showMap} onClose={() => setShowMap(false)} navigate={navigate} />
    </div>
  );
}
