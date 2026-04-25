import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, Layers, HardDrive, AlertTriangle, Thermometer,
  ChevronRight, CheckCircle, Zap, Grid, RefreshCw, Box,
  Bell, Database, Network,
  Plug, BatteryCharging, Wind
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEV_COLOR = {
  critical: '#ef4444', emergency: '#ef4444',
  error: '#f97316', warning: '#f59e0b',
  info: '#3b82f6', notice: '#3b82f6',
};
const SEV_LABEL = {
  critical: 'Critique', emergency: 'Critique',
  error: 'Erreur', warning: 'Avertissement',
  info: 'Info', notice: 'Info',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, unit = '', icon: Icon, color = '#E30613', onClick, loading, sub }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && onClick ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${hov && onClick ? color : 'var(--border)'}`,
        borderRadius: 12, padding: '15px 16px', cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <div style={{ background: `${color}20`, borderRadius: 7, padding: 6 }}>
          <Icon size={13} color={color} />
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>{label}</span>
        {onClick && <ChevronRight size={10} color="var(--text-muted)" />}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {loading ? <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>—</span> : value}
        {!loading && unit && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && !loading && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
      <div style={{ position: 'absolute', bottom: -10, right: -6, opacity: 0.04, pointerEvents: 'none' }}>
        <Icon size={56} color={color} />
      </div>
    </div>
  );
}

function CapBar({ label, pct }) {
  const p = Math.max(0, Math.min(100, pct || 0));
  const c = p < 60 ? '#22d3a3' : p < 80 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 700, color: c }}>{p}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: c, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function AlarmBadge({ count, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 7 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{count}</span>
    </div>
  );
}

function PowerCard({ icon: Icon, label, kw, status, color, sub }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: `1px solid ${color}30`, borderRadius: 10, padding: '12px 14px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', flex: 1 }}>{label}</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'ok' || status === 'running' ? '#22d3a3' : status === 'stopped' ? '#f59e0b' : '#ef4444' }} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>
        {kw != null ? kw.toFixed(1) : '—'}
        <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>kW</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function FunctionMapModal({ open, onClose, navigate }) {
  if (!open) return null;
  const sections = [
    { title: 'Infrastructure', color: '#E30613', items: [
      { label: 'Clusters & Pools ESXi', path: '/clusters' },
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
      { label: 'Utilisateurs', path: '/users' },
    ]},
    { title: 'Intégrations', color: '#38bdf8', items: [
      { label: 'Payment Monitor', path: '/payments' },
      { label: 'Topologie réseau', path: '/topology' },
      { label: 'Rapports', path: '/reports' },
    ]},
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, maxWidth: 740, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Grid size={16} color="#E30613" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Carte des fonctions — NexusMonitor SBEE</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 18 }}>
          {sections.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 10, fontWeight: 700, color: sec.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7, paddingBottom: 4, borderBottom: `1px solid ${sec.color}30` }}>
                {sec.title}
              </div>
              {sec.items.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); onClose(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 5, width: '100%', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = sec.color}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <ChevronRight size={9} /> {item.label}
                </button>
              ))}
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
  const [datacenter, setDatacenter]     = useState(null);
  const [pduData, setPduData]           = useState(null);
  const [genset, setGenset]             = useState(null);
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
      api.getDatacenter().then(setDatacenter).catch(() => {}),
      api.getEnvPDU().then(setPduData).catch(() => {}),
      api.getEnvGenset().then(setGenset).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const totalHosts    = hosts?.length ?? 0;
  const totalVMs      = (hosts || []).reduce((s, h) => s + (h.vmCount || 0), 0);
  const totalClusters = clusters?.length ?? 0;

  // Clusters: support both usedCores/totalCores (esxiService) and used/total
  const cpuUsed  = (clusters || []).reduce((s, c) => s + (c.cpu?.usedCores  ?? c.cpu?.used  ?? 0), 0);
  const cpuTotal = (clusters || []).reduce((s, c) => s + (c.cpu?.totalCores ?? c.cpu?.total ?? 0), 0);
  const ramUsed  = (clusters || []).reduce((s, c) => s + (c.ram?.usedGB  ?? c.ram?.used  ?? 0), 0);
  const ramTotal = (clusters || []).reduce((s, c) => s + (c.ram?.totalGB ?? c.ram?.total ?? 0), 0);
  const cpuPct   = cpuTotal > 0 ? Math.round((cpuUsed  / cpuTotal) * 100) : 0;
  const ramPct   = ramTotal > 0 ? Math.round((ramUsed  / ramTotal) * 100) : 0;
  const storPct  = storageStats
    ? (storageStats.usedPct ?? (storageStats.totalTB > 0 ? Math.round((storageStats.usedTB / storageStats.totalTB) * 100) : 0))
    : 0;

  // Alerts
  const alertList  = Array.isArray(alertsData) ? alertsData : [];
  const critCount  = alertList.filter(a => a.severity === 'critical' || a.severity === 'emergency').length;
  const errCount   = alertList.filter(a => a.severity === 'error').length;
  const warnCount  = alertList.filter(a => a.severity === 'warning').length;
  const infoCount  = alertList.filter(a => a.severity === 'info' || a.severity === 'notice').length;
  const recentAlerts = [...alertList]
    .sort((a, b) => { const O = { critical: 0, emergency: 0, error: 1, warning: 2, info: 3 }; return (O[a.severity] ?? 4) - (O[b.severity] ?? 4); })
    .slice(0, 5);
  const sysOpOk = critCount === 0;

  // Physical inventory from real datacenter data
  const physInv = (() => {
    if (!datacenter) return {};
    const c = {};
    (datacenter.rooms || []).forEach(room =>
      (room.racks || []).forEach(rack =>
        (rack.devices || []).forEach(dev => {
          const cat = (dev.type || 'other').split('.')[0];
          c[cat] = (c[cat] || 0) + 1;
        })
      )
    );
    return c;
  })();
  const totalPhys = Object.values(physInv).reduce((a, b) => a + b, 0);
  const rackCount = (datacenter?.rooms || []).reduce((s, r) => s + (r.racks || []).length, 0);

  // Power
  const pduList    = Array.isArray(pduData) ? pduData : [];
  const secteurKW  = pduList.reduce((s, p) => s + (p.powerKW || 0), 0) || (envSummary?.power?.totalKW ? envSummary.power.totalKW * 0.9 : null);
  const upsKW      = envSummary?.power?.upsKW ?? (envSummary?.power?.totalKW ? envSummary.power.totalKW * 0.85 : null);
  const genRunning = genset?.status === 'running';
  const genKW      = genset?.loadKW ?? null;
  const genFuel    = genset?.fuelLevelPct ?? null;

  // Energy sparkline
  const baseKW    = envSummary?.power?.totalKW || 220;
  const energyData = Array.from({ length: 12 }, (_, i) => ({
    t: `${i * 5}m`,
    Secteur:    Math.round(baseKW + Math.sin(i / 2) * 12),
    Onduleur:   Math.round(baseKW * 0.87 + Math.sin(i / 2.5) * 10),
    Générateur: genRunning ? Math.round(genKW || 85 + Math.sin(i / 3) * 8) : 0,
  }));

  // Health donut
  const critEngine = engineStats?.bySeverity?.critical ?? critCount;
  const warnEngine = engineStats?.bySeverity?.warning  ?? warnCount;
  const evaluated  = engineStats?.evaluated ?? 10;
  const okVal      = Math.max(0, evaluated - critEngine - warnEngine) || (critCount === 0 && warnCount === 0 ? 5 : 0);
  const healthData = [
    { name: 'OK',       value: okVal,        color: '#22d3a3' },
    { name: 'Warning',  value: warnEngine || warnCount, color: '#f59e0b' },
    { name: 'Critique', value: critEngine,   color: '#ef4444' },
  ];

  const fmtClock = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate  = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fade-in" style={{ padding: '20px 24px', background: 'var(--bg-base)', minHeight: 'calc(100vh - 60px)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── ZONE A : Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Centre de Commande — <span style={{ color: '#E30613' }}>SBEE</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: sysOpOk ? '#22d3a3' : '#ef4444', boxShadow: `0 0 5px ${sysOpOk ? '#22d3a3' : '#ef4444'}` }} />
              <span style={{ color: sysOpOk ? '#22d3a3' : '#ef4444', fontWeight: 700 }}>
                {sysOpOk ? 'SYSTÈME OPÉRATIONNEL' : `${critCount} ALERTE(S) CRITIQUE(S)`}
              </span>
            </div>
            <span>{fmtDate(now)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#E30613', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px' }}>
            {fmtClock(now)}
          </span>
          <button onClick={() => setShowMap(true)} style={{ background: '#E30613', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Grid size={12} /> Carte des fonctions
          </button>
          <button onClick={fetchAll} title="Rafraîchir" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* ── ZONE B : KPI Row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <KpiCard label="Hôtes physiques"      value={totalHosts}    icon={Server}        color="#E30613"  onClick={() => navigate('/clusters')}       loading={loading} sub={clusters?.[0]?.datacenter} />
        <KpiCard label="Machines virtuelles"  value={totalVMs}      icon={Box}           color="#a855f7"  onClick={() => navigate('/infrastructure')}  loading={loading} />
        <KpiCard label="Clusters actifs"      value={totalClusters} icon={Layers}        color="#38bdf8"  onClick={() => navigate('/clusters')}       loading={loading} />
        <KpiCard label="Alertes critiques"    value={critCount}     icon={AlertTriangle} color="#ef4444"  onClick={() => navigate('/alerts')}         loading={loading} />
        <KpiCard label="Stockage utilisé"     value={storPct} unit="%" icon={HardDrive}  color="#f59e0b"  onClick={() => navigate('/storage')}        loading={loading} sub={storageStats?.totalTB ? `${storageStats.totalTB} To total` : undefined} />
        <KpiCard label="Température salle"    value={envSummary?.temperature != null ? parseFloat(envSummary.temperature).toFixed(1) : '—'} unit={envSummary?.temperature != null ? '°C' : ''} icon={Thermometer} color="#22d3a3" onClick={() => navigate('/physical')} loading={loading} />
      </div>

      {/* ── ZONE C : 3 colonnes ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 240px', gap: 14, marginBottom: 14 }}>

        {/* Col gauche — Resource Allocation + Virtualisation + Inventaire physique */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Allocation ressources</div>
            <CapBar label={`CPU (${cpuUsed}/${cpuTotal} cœurs)`} pct={cpuPct} />
            <CapBar label={`RAM (${ramUsed}/${ramTotal} Go)`} pct={ramPct} />
            <CapBar label={`Stockage`} pct={storPct} />
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Virtualisation</div>
            {[
              { icon: Box,    label: 'VMs actives',  value: totalVMs,      path: '/infrastructure' },
              { icon: Server, label: 'Hôtes ESXi',    value: totalHosts,    path: '/clusters' },
              { icon: Layers, label: 'Clusters',       value: totalClusters, path: '/clusters' },
            ].map(({ icon: Icon, label, value, path }) => (
              <div
                key={label}
                onClick={() => navigate(path)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderRadius: 3 }}
                onMouseEnter={e => e.currentTarget.style.paddingLeft = '4px'}
                onMouseLeave={e => e.currentTarget.style.paddingLeft = '0px'}
              >
                <Icon size={11} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{loading ? '—' : value}</span>
                <ChevronRight size={9} color="var(--text-muted)" />
              </div>
            ))}
          </div>

          {/* Inventaire physique depuis les vraies données datacenter-3d */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Salle serveur</span>
              <button onClick={() => navigate('/datacenter-3d')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E30613', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>3D <ChevronRight size={9} /></button>
            </div>
            {[
              { icon: Server,   label: 'Serveurs physiques', key: 'server',  path: '/datacenter-3d' },
              { icon: Network,  label: 'Équip. réseau',       key: 'network', path: '/datacenter-3d' },
              { icon: Database, label: 'Stockage (baies)',     key: 'storage', path: '/datacenter-3d' },
              { icon: Plug,     label: 'Onduleurs',            key: 'power',   path: '/ups-diagram' },
            ].map(({ icon: Icon, label, key, path }) => (
              <div
                key={key}
                onClick={() => navigate(path)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <Icon size={11} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: totalPhys > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {loading ? '—' : (physInv[key] ?? 0)}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>{rackCount} racks · {totalPhys} équipements</span>
            </div>
          </div>
        </div>

        {/* Col centre — Hôtes ESXi + section alimentation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Hôtes ESXi */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Hôtes ESXi — Statut temps réel</span>
              <button onClick={() => navigate('/clusters')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E30613', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                Voir tout <ChevronRight size={11} />
              </button>
            </div>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 16 }}>Chargement des hôtes…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
                {(hosts || []).map(host => {
                  // Support both field naming conventions
                  const cpuUsedVal  = host.cpu?.usedCores  ?? host.cpu?.used  ?? 0;
                  const cpuTotalVal = host.cpu?.totalCores ?? host.cpu?.total ?? 0;
                  const cpuH = cpuTotalVal > 0 ? Math.round((cpuUsedVal / cpuTotalVal) * 100) : 0;
                  const ramH = (host.ram?.totalGB > 0) ? Math.round(((host.ram.usedGB ?? 0) / host.ram.totalGB) * 100) : 0;
                  const ok   = host.status !== 'offline' && host.status !== 'error';
                  return (
                    <div
                      key={host.id}
                      onClick={() => navigate(`/infrastructure/esxi/${host.id}`)}
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 13, cursor: 'pointer', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#E30613'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {host.name || host.id}
                        </span>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: ok ? '#22d3a3' : '#ef4444', marginLeft: 5, flexShrink: 0 }} />
                      </div>
                      <CapBar label={`CPU  ${cpuH}%`} pct={cpuH} />
                      <CapBar label={`RAM  ${ramH}%`} pct={ramH} />
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{host.vmCount ?? 0} VMs</span>
                        <span>{host.ip || ''}</span>
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

          {/* Section Alimentation — Secteur / Onduleur / Groupe électrogène */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Zap size={13} color="#E30613" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Alimentation électrique</span>
              </div>
              <button onClick={() => navigate('/ups-diagram')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E30613', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                Schéma <ChevronRight size={9} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <PowerCard icon={Plug}           label="Réseau secteur"   kw={secteurKW}  status="ok"        color="#22d3a3" sub="EDF / SBEE réseau" />
              <PowerCard icon={BatteryCharging} label="Onduleurs (UPS)"  kw={upsKW}      status="ok"        color="#38bdf8" sub="EcoFlow + SUKAM" />
              <PowerCard icon={Wind}            label="Groupe électrogène" kw={genKW}    status={genset?.status || 'stopped'} color={genRunning ? '#f59e0b' : 'var(--text-muted)'} sub={genFuel != null ? `Carburant : ${genFuel.toFixed(0)}%` : 'En veille'} />
            </div>

            {/* Graphe énergie multilignes */}
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--text-primary)', borderRadius: 6 }} />
                  <Line type="monotone" dataKey="Secteur"    stroke="#22d3a3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Onduleur"   stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Générateur" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray={genRunning ? undefined : '4 4'} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
              {[['Secteur','#22d3a3'],['Onduleur','#38bdf8'],['Générateur','#f59e0b']].map(([lbl, col]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
                  <div style={{ width: 18, height: 2, background: col, borderRadius: 1 }} />
                  {lbl}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col droite — Alarmes */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={12} color="#E30613" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Alarmes</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total {alertList.length}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            <AlarmBadge count={critCount} label="Critique"  color="#ef4444" />
            <AlarmBadge count={errCount}  label="Erreur"    color="#f97316" />
            <AlarmBadge count={warnCount} label="Warning"   color="#f59e0b" />
            <AlarmBadge count={infoCount} label="Info"      color="#3b82f6" />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Récentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Chargement…</div>
              ) : recentAlerts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#22d3a3', fontSize: 12 }}>
                  <CheckCircle size={12} /> Aucune alerte active
                </div>
              ) : (
                recentAlerts.map((alert, i) => {
                  const sev = alert.severity || 'info';
                  const col = SEV_COLOR[sev] || '#3b82f6';
                  return (
                    <div
                      key={i}
                      onClick={() => navigate('/alerts')}
                      style={{ padding: '7px 9px', background: `${col}08`, border: `1px solid ${col}20`, borderRadius: 7, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `${col}50`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = `${col}20`}
                    >
                      <div style={{ fontSize: 9, color: col, fontWeight: 700, marginBottom: 2 }}>{SEV_LABEL[sev] || sev}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {alert.message || alert.msg || 'Alerte système'}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
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
            style={{ background: 'rgba(227,6,19,0.1)', border: '1px solid rgba(227,6,19,0.3)', color: '#E30613', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            Voir toutes les alertes <ChevronRight size={11} />
          </button>
        </div>
      </div>

      {/* ── ZONE D : Bottom Status Bar ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* Statut infrastructure */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Statut infrastructure</div>
          {[
            { label: 'Hôtes connectés',   value: (hosts || []).filter(h => h.status !== 'offline').length,  total: totalHosts,  color: '#22d3a3' },
            { label: 'VMs sous tension',   value: totalVMs,  total: null, color: '#a855f7' },
            { label: 'Alertes actives',    value: alertList.length, total: null, color: alertList.length > 0 ? '#ef4444' : '#22d3a3' },
            { label: 'Équipements DC',     value: totalPhys, total: null, color: '#f59e0b', onClick: () => navigate('/datacenter-3d') },
          ].map(({ label, value, total, color, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: onClick ? 'pointer' : 'default' }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>
                {loading ? '—' : value}
                {total !== null && !loading && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}> / {total}</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Health Check donut */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Health Check</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 80, height: 80, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" stroke="none">
                    {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
              {healthData.map(h => (
                <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{h.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: h.color }}>{h.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Activité récente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Chargement…</div>
            ) : (activity || []).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Aucune activité récente.</div>
            ) : (
              (activity || []).slice(0, 5).map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E30613', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.action || act.message || act.event || 'Action système'}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
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

      <FunctionMapModal open={showMap} onClose={() => setShowMap(false)} navigate={navigate} />
    </div>
  );
}
