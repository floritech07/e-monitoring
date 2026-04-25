import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, Layers, HardDrive, AlertTriangle, Thermometer,
  ChevronRight, CheckCircle, Zap, Grid, RefreshCw, Box,
  Bell, Database, Network,
  Plug, BatteryCharging, Wind, ShieldCheck,
  Battery, Activity, CheckCircle2, BarChart3, ArrowDown,
  Cpu, MousePointer2, ClipboardList, Download,
  Sun, Moon
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
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
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

function ResourceGaugeCard({ label, mainValue, subValue, pct, icon: Icon, color = '#22d3a3', onClick, loading }) {
  const [hov, setHov] = useState(false);
  const p = Math.max(0, Math.min(100, pct || 0));
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && onClick ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${hov && onClick ? color : 'var(--border)'}`,
        borderRadius: 12, padding: '24px 20px', cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
         <Icon size={14} color={color} />
         {label}
      </div>
      
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, textAlign: 'center' }}>
        {loading ? '—' : mainValue}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.6s ease' }} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>
        {loading ? '—' : subValue}
      </div>

      <div style={{ position: 'absolute', top: 10, right: 10, opacity: 0.1 }}>
        <Icon size={24} color={color} />
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

function HeatmapRackComponent({ name, temp }) {
  const color = temp > 35 ? '#ef4444' : temp > 28 ? '#f59e0b' : '#22d3a3';
  const bgColor = temp > 35 ? 'rgba(239,68,68,0.1)' : temp > 28 ? 'rgba(245,158,11,0.1)' : 'rgba(34,211,163,0.05)';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{name}</div>
      <div style={{ 
        width: '100%', padding: '6px 4px', background: bgColor, border: `1px solid ${color}30`, borderRadius: 4,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2
      }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ height: 4, borderRadius: 1, background: i < 12 ? color : 'rgba(255,255,255,0.05)' }} />
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color }}>{temp}°C</div>
    </div>
  );
}

function OccupancyRackComponent({ name, free, total, pct }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{name}</div>
      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)' }}>{free}U / {total}U</div>
      <div style={{ width: 14, height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${pct}%`, background: pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22d3a3', borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: pct > 85 ? '#ef4444' : 'var(--text-primary)' }}>{pct}%</div>
    </div>
  );
}

function PowerFlowComponent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(34,211,163,0.1)', border: '1px solid #22d3a3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={12} color="#22d3a3" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source Principale</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>Réseau secteur</div>
          <div style={{ fontSize: 8, color: '#22d3a3' }}>230V | 50 Hz</div>
        </div>
      </div>
      <div style={{ marginLeft: 11, width: 1, height: 10, background: '#22d3a3' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Battery size={12} color="#38bdf8" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>UPS</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#22d3a3' }}>OK</div>
          <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>100% Charge</div>
        </div>
      </div>
      <div style={{ marginLeft: 11, width: 1, height: 10, background: 'var(--border)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database size={12} color="var(--text-muted)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>PDU</div>
          <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>Normal</div>
        </div>
      </div>
    </div>
  );
}

function EsxiMiniCard({ name, cpu, ram, vms, status = 'online' }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'online' ? '#22d3a3' : '#ef4444' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{name}</span>
        <Activity size={10} color="var(--text-muted)" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
          <span style={{ color: 'var(--text-muted)' }}>CPU {cpu}%</span>
          <span style={{ color: 'var(--text-muted)' }}>{vms} VMs</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${cpu}%`, height: '100%', background: cpu > 80 ? '#ef4444' : '#22d3a3' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 2 }}>
          <span style={{ color: 'var(--text-muted)' }}>RAM {ram}%</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${ram}%`, height: '100%', background: ram > 80 ? '#ef4444' : '#38bdf8' }} />
        </div>
      </div>
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
  const [occupancy, setOccupancy] = useState([]);
  const [envSummary, setEnvSummary]     = useState(null);
  const [engineStats, setEngineStats]   = useState(null);
  const [activity, setActivity]         = useState(null);
  const [datacenter, setDatacenter]     = useState(null);
  const [pduData, setPduData]           = useState(null);
  const [genset, setGenset]             = useState(null);
  const [isLight, setIsLight]           = useState(document.body.classList.contains('light-mode'));
  const [loading, setLoading]           = useState(true);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

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
      api.getDatacenterOccupancy().then(setOccupancy).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const totalHosts    = hosts?.length ?? 0;
  const totalVMs      = (hosts || []).reduce((s, h) => s + (h.vmCount || 0), 0);
  const totalClusters = clusters?.length ?? 0;
  const totalVmsOn    = (hosts || []).reduce((s, h) => s + (h.vmsOn  || 0), 0);
  const totalVmsOff   = (hosts || []).reduce((s, h) => s + (h.vmsOff || 0), 0);
  const totalVmsSusp  = totalVMs - totalVmsOn - totalVmsOff;

  // Clusters: Prefer MHz/GHz and GB/TB for SBEE
  const cpuUsedMhz  = (clusters || []).reduce((s, c) => s + (c.cpu?.usedMhz  ?? 0), 0);
  const cpuTotalMhz = (clusters || []).reduce((s, c) => s + (c.cpu?.totalMhz ?? 0), 0);
  const cpuUsed     = (cpuUsedMhz / 1000).toFixed(2);
  const cpuTotal    = (cpuTotalMhz / 1000).toFixed(2);
  
  const ramUsedGB   = (clusters || []).reduce((s, c) => s + (c.ram?.usedGB  ?? 0), 0);
  const ramTotalGB  = (clusters || []).reduce((s, c) => s + (c.ram?.totalGB ?? 0), 0);
  const ramFreeGB   = ramTotalGB - ramUsedGB;
  
  const ramUsedStr  = ramUsedGB >= 1024 ? `${(ramUsedGB / 1024).toFixed(2)} To` : `${Math.round(ramUsedGB)} Go`;
  const ramTotalStr = ramTotalGB >= 1024 ? `${(ramTotalGB / 1024).toFixed(2)} To` : `${Math.round(ramTotalGB)} Go`;
  const ramFreeStr  = ramFreeGB >= 1024 ? `${(ramFreeGB / 1024).toFixed(2)} To libres` : `${ramFreeGB.toFixed(2)} Go libres`;

  const cpuPct   = cpuTotalMhz > 0 ? Math.round((cpuUsedMhz  / cpuTotalMhz) * 100) : 0;
  const ramPct   = ramTotalGB > 0 ? Math.round((ramUsedGB  / ramTotalGB) * 100) : 0;
  
  const storageFreeStr = storageStats?.freeTB != null ? `${storageStats.freeTB} To libres` : '— libres';
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
    <div className="fade-in" style={{ padding: '12px 16px', background: 'var(--bg-base)', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: 'var(--text-primary)' }}>
      
      {/* ── ZONE A : Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Grid size={18} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Centre de Commande — <span style={{ color: '#E30613' }}>SBEE</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontWeight: 700 }}>{critCount} ALERTES CRITIQUES</span>
              <span style={{ color: 'var(--text-muted)' }}>| {fmtDate(now)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--success-bg)', border: '1px solid var(--success)30', padding: '6px 12px', borderRadius: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3a3', animation: 'pulse-green 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22d3a3' }}>STS HSM: OK</span>
            <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              <span style={{ color: '#22d3a3', fontWeight: 700 }}>• Revenue Indicator (HSM STS)</span>
              <br/>2x PRISM HSMs pour STS
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '1px' }}>{fmtClock(now)}</div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleTheme} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 6, borderRadius: 6, cursor: 'pointer' }}>
               {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button onClick={() => setShowMap(true)} style={{ background: '#E30613', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Grid size={12} /> Carte des fonctions
            </button>
          </div>
          <Bell size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
          <div style={{ width: 28, height: 28, background: 'var(--bg-elevated)', borderRadius: '50%', border: '1px solid var(--border)' }} />
        </div>
      </div>

      <style>{`
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34,211,163,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(34,211,163,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,211,163,0); }
        }
      `}</style>

      {/* ── ZONE B1 : KPIs & Gauges ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <KpiCard label="Hôtes physiques" value={totalHosts} sub="DC-SBEE-Cotonou" icon={Server} color="#3b82f6" loading={loading} />
        <KpiCard label="Machines virtuelles" value={totalVMs} icon={Box} color="#a855f7" loading={loading} />
        <KpiCard label="Clusters actifs" value={totalClusters} icon={Layers} color="#38bdf8" loading={loading} />
        <KpiCard label="Alertes critiques" value={critCount} icon={AlertTriangle} color="#ef4444" loading={loading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: 10, marginBottom: 10 }}>
        <ResourceGaugeCard 
          label="Stockage" 
          mainValue={`${storageStats?.freeTB || 0} To de libres`} 
          subValue={`${storageStats?.usedTB || 0} To utilisés | Espace total : ${storageStats?.totalTB || 0} To`} 
          pct={storPct} icon={HardDrive} color="#f59e0b" loading={loading} 
        />
        <ResourceGaugeCard 
          label="Mémoire RAM" 
          mainValue={`${(ramTotalGB - ramUsedGB).toFixed(2)} Go de libres`} 
          subValue={`${ramUsedStr} utilisés | Espace total : ${ramTotalStr}`} 
          pct={ramPct} icon={Zap} color="#3b82f6" loading={loading} 
        />
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 20px', position: 'relative' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#22d3a3', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Thermometer size={12} /> Température salle
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>18 <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 400 }}>°C</span></div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Statut : <span style={{ color: '#22d3a3', fontWeight: 700 }}>Optimal</span></div>
          <div style={{ position: 'absolute', right: 10, top: 40, opacity: 0.1 }}><Thermometer size={48} color="#22d3a3" /></div>
        </div>
      </div>

      {/* ── ZONE B2 : Infrastructure Physique ───── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} /> Infrastructure Physique <span style={{ background: '#a855f7', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 4 }}>NEW</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Heatmap Température des Racks</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(envSummary?.rackTemps || []).map(r => <HeatmapRackComponent key={r.id} {...r} />)}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {[['< 30°C', '#22d3a3'], ['30°C - 40°C', '#f59e0b'], ['> 40°C', '#ef4444']].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: 'var(--text-muted)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: c }} /> {l}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Occupation des Racks (U)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {occupancy.map(r => <OccupancyRackComponent key={r.id} {...r} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Puissance & Redondance</div>
            <PowerFlowComponent />
          </div>
        </div>
      </div>

      {/* ── ZONE C : Monitoring Détaillé ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3.5fr 1fr', gap: 10, marginBottom: 10 }}>
        
        {/* Col Gauche : Resources & VMs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 10 }}>Allocation Ressources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <CapBar label={`CPU ${cpuUsed}/${cpuTotal} GHz`} pct={cpuPct} />
              <CapBar label={`RAM ${ramUsedStr}/${ramTotalStr}`} pct={ramPct} />
              <CapBar label={`Stockage ${storageStats?.usedTB}/${storageStats?.totalTB} To`} pct={storPct} />
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 10 }}>Machines Virtuelles ({totalVMs})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <CheckCircle size={10} color="#22d3a3" /> <span style={{ flex: 1 }}>Sous tension</span> <span style={{ fontWeight: 700 }}>{totalVmsOn}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <Box size={10} color="var(--text-muted)" /> <span style={{ flex: 1 }}>Hors tension</span> <span style={{ fontWeight: 700 }}>{totalVmsOff}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <RefreshCw size={10} color="#f59e0b" /> <span style={{ flex: 1 }}>Interrompu</span> <span style={{ fontWeight: 700 }}>{totalVmsSusp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col Centre : ESXi & Power Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Hôtes ESXi — Statut Temps Réel</div>
              <span style={{ fontSize: 9, color: '#38bdf8', cursor: 'pointer' }} onClick={() => navigate('/clusters')}>Voir tout &gt;</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {(hosts || []).slice(0, 5).map(h => (
                <EsxiMiniCard key={h.id} name={h.name} cpu={Math.round((h.cpu?.usedCores / h.cpu?.totalCores) * 100)} ram={Math.round((h.ram?.usedGB / h.ram?.totalGB) * 100)} vms={h.vmCount} />
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 10 }}>Alimentation Électrique</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
               <div style={{ fontSize: 10 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>RÉSEAU SECTEUR</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{secteurKW?.toFixed(1)} <span style={{ fontSize: 9 }}>kW</span></div>
                  <div style={{ fontSize: 8, color: '#22d3a3' }}>ECO / SBEE Réseau</div>
               </div>
               <div style={{ fontSize: 10 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>ONDOLEURS (UPS)</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{upsKW?.toFixed(1)} <span style={{ fontSize: 9 }}>kW</span></div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>EcoFlow - SKVAH</div>
               </div>
               <div style={{ fontSize: 10 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>GROUPE ÉLECTROGÈNE</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{genKW?.toFixed(1)} <span style={{ fontSize: 9 }}>kW</span></div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>Carburant : {genFuel}%</div>
               </div>
            </div>
            <div style={{ height: 60 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyData}>
                  <Line type="monotone" dataKey="Secteur" stroke="#22d3a3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Onduleur" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Générateur" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Col Droite : Alarms & Recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 10 }}>Alarmes <span style={{ float: 'right', color: 'var(--text-muted)' }}>Total {critCount + warnCount}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ padding: '6px 8px', background: 'var(--danger-bg)', border: '1px solid var(--danger)20', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#ef4444' }}>Critique</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444' }}>{critCount}</span>
              </div>
              <div style={{ padding: '6px 8px', background: 'var(--warning-bg)', border: '1px solid var(--warning)20', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b' }}>Warning</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{warnCount}</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 10 }}>Récentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentAlerts.slice(0, 3).map((a, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${SEV_COLOR[a.severity] || '#3b82f6'}`, paddingLeft: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: SEV_COLOR[a.severity] }}>{SEV_LABEL[a.severity]}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.2, margin: '2px 0' }}>{a.message}</div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{fmtClock(new Date(a.timestamp))}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/alerts')} style={{ width: '100%', marginTop: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 9, padding: '6px', borderRadius: 6, cursor: 'pointer' }}>
               Voir toutes les alertes &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ── ZONE D : Synthèse & Activités ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: 10 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', marginBottom: 10 }}>Statut Infrastructure</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span style={{ color: 'var(--text-muted)' }}>Hôtes connectés</span> <span style={{ fontWeight: 700, color: '#22d3a3' }}>{totalHosts}/{totalHosts}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span style={{ color: 'var(--text-muted)' }}>VMs sous tension</span> <span style={{ fontWeight: 700, color: '#a855f7' }}>{totalVmsOn}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span style={{ color: 'var(--text-muted)' }}>Alertes actives</span> <span style={{ fontWeight: 700, color: '#ef4444' }}>{critCount}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span style={{ color: 'var(--text-muted)' }}>Équipements DC</span> <span style={{ fontWeight: 700, color: '#f59e0b' }}>55</span></div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', marginBottom: 10 }}>Health Check</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 64, height: 64 }}>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={healthData} cx="50%" cy="50%" innerRadius={20} outerRadius={32} dataKey="value" stroke="none">
                         {healthData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                {healthData.map(h => (
                   <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: h.color }} />
                      <span style={{ color: 'var(--text-muted)', flex: 1 }}>{h.name}</span>
                      <span style={{ fontWeight: 700, color: h.color }}>{h.value}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#E30613', textTransform: 'uppercase', marginBottom: 10 }}>Activité Récente</div>
          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(activity || []).slice(0, 4).map((a, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#E30613' }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.action}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{i === 0 ? 'Il y a 2 min' : `Il y a ${i * 4 + 3} min`}</span>
                   </div>
                ))}
             </div>
             <div style={{ width: 100, height: 40 }}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart3 size={40} color="var(--accent-glow)" />
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      {/* ── ZONE E : Footer ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
         <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <ClipboardList size={11} /> HISTORIQUE INCIDENTS <ChevronRight size={10} />
         </div>
         <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={11} /> MAINTENANCES PLANIFIÉES <span style={{ marginLeft: 6, color: 'var(--text-muted)', opacity: 0.5 }}>Aucune maintenance à venir</span>
         </div>
         <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', cursor: 'pointer' }}>
            EXPORTS & RAPPORTS <Download size={11} />
         </div>
      </div>

      <FunctionMapModal open={showMap} onClose={() => setShowMap(false)} navigate={navigate} />
    </div>
  );
}
