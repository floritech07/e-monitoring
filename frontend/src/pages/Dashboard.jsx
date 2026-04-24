import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Building2, ArrowUpRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { api } from '../api';

/**
 * NEXUS ULTIMATE COMMAND CENTER — HYBRID HCI VERSION
 * Mix entre données techniques exhaustives et design HCI stratégique.
 */

// ── COMPOSANTS UI PREMIMUM ──────────────────────────────────────────────────

function TopIndicator({ icon: Icon, label, value, subValue, color, status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ background: `${color}15`, padding: 8, borderRadius: 8, display: 'flex' }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#e8eaf0' }}>{value}</span>
          <span style={{ fontSize: 10, color: status === 'ok' ? '#22d3a3' : '#f5534b' }}>{subValue}</span>
        </div>
      </div>
    </div>
  );
}

function ResourceBar({ label, value, unit, total, color }) {
  const percent = Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>
        <span>{label}</span>
        <span>{percent.toFixed(1)}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, position: 'relative' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: 2, boxShadow: `0 0 10px ${color}44` }} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{value}{unit} / {total}{unit}</div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [capacity, setCapacity] = useState(null);
  const [env, setEnv] = useState(null);

  useEffect(() => {
    api.getCapacityReport().then(setCapacity).catch(() => {});
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  // Filter critical servers
  const criticalServers = useMemo(() => {
    return vms.filter(v => v.name.toLowerCase().includes('prod') || v.name.toLowerCase().includes('base') || v.name.toLowerCase().includes('pay') || v.name.toLowerCase().includes('ad-'));
  }, [vms]);

  const taskData = [
    { name: 'Errors', value: 2, color: '#f5534b' },
    { name: 'Pending', value: 8, color: '#545b78' },
    { name: 'Success', value: 24, color: '#22d3a3' },
  ];

  return (
    <div className="fade-in" style={{ padding: '20px', background: '#0a0a0c', minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* ── HEADER BANNER: STRATEGIC KPIs ─────────────────────────────────── */}
      <div className="card glass-panel" style={{ padding: '12px 0', display: 'flex', alignItems: 'center' }}>
        <div style={{ padding: '0 24px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>NEXUS <span style={{ color: '#4f8ef7' }}>ULTIMATE</span></div>
          <div style={{ fontSize: 9, color: '#4f8ef7', fontWeight: 700 }}>COMMAND CENTER V2.5</div>
        </div>
        
        <TopIndicator icon={Activity} label="Santé Globale" value={`${metrics?.health?.score || 94}%`} subValue="NOMINAL" color="#22d3a3" status="ok" />
        <TopIndicator icon={Thermometer} label="Temp. Datacenter" value={`${env?.avgTempC || 23.4}°C`} subValue="STABLE" color="#38bdf8" status="ok" />
        <TopIndicator icon={Zap} label="Charge Onduleurs" value={`${metrics?.ups?.avgChargePct || 98}%`} subValue="SECTEUR" color="#f5a623" status="ok" />
        <TopIndicator icon={Database} label="Volume Stockage" value={`${metrics?.storage?.usedPct || 64}%`} subValue="UTILISÉ" color="#fb923c" status="ok" />
        
        <div style={{ marginLeft: 'auto', padding: '0 24px', display: 'flex', gap: 8 }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{new Date().toLocaleTimeString('fr-FR')}</div>
           </div>
        </div>
      </div>

      {/* ── MAIN GRID: ISOMETRIC + ALARMS ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, flex: 1 }}>
        
        {/* Panneau Central Isométrique */}
        <div className="card glass-panel" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', padding: 0, overflow: 'hidden' }}>
          
          {/* Sidebar Gauche: Ressources & Virtualisation */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: 24, background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8e8e', marginBottom: 16, textTransform: 'uppercase' }}>Resource Allocation</div>
              <ResourceBar label="Puissance CPU" value={(metrics?.cpu?.usage * 0.12).toFixed(1)} total="12.0" unit=" GHz" color="#4f8ef7" />
              <ResourceBar label="Mémoire Vive" value={(metrics?.ram?.percent * 0.64).toFixed(1)} total="64.0" unit=" GB" color="#a78bfa" />
              <ResourceBar label="Stockage SAN" value={(metrics?.storage?.usedPct * 0.08).toFixed(1)} total="8.0" unit=" TB" color="#fb923c" />
            </div>

            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8e8e', marginBottom: 16, textTransform: 'uppercase' }}>Virtualisation</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                   <Monitor size={14} color="#4f8ef7" style={{ marginBottom: 6 }} />
                   <div style={{ fontSize: 18, fontWeight: 900 }}>{vms.length}</div>
                   <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>VMs Totales</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                   <Server size={14} color="#4f8ef7" style={{ marginBottom: 6 }} />
                   <div style={{ fontSize: 18, fontWeight: 900 }}>1</div>
                   <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Hôte Physique</div>
                </div>
              </div>
            </div>

            <div>
               <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8e8e', marginBottom: 12, textTransform: 'uppercase' }}>Événements</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                     <span style={{ color: 'var(--text-muted)' }}>Logs / s</span>
                     <span style={{ fontWeight: 700 }}>124</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                     <span style={{ color: 'var(--text-muted)' }}>Uptime</span>
                     <span style={{ fontWeight: 700, color: '#22d3a3' }}>14d 6h</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Centre: Isometric Infrastructure View Enrichment */}
          <div style={{ position: 'relative', background: 'radial-gradient(circle at center, #13151c 0%, #0a0a0c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {/* Isometric SVG with labels */}
             <svg width="100%" height="100%" viewBox="0 0 600 450" style={{ maxWidth: 800 }}>
                {/* Perspective Grid */}
                <defs>
                   <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                   </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" transform="skewX(-15) scale(1, 0.8) translate(50, 50)" opacity="0.5" />

                {/* Nodes with detailed labels */}
                {/* Storage / NAS */}
                <g transform="translate(300, 100)">
                  <path d="M0 20 L50 0 L100 20 L50 40 Z" fill="#1a1d27" stroke="#fb923c" strokeWidth="1.5" />
                  <path d="M0 20 L0 70 L50 90 L50 40 Z" fill="#13151c" stroke="#fb923c" strokeWidth="1.5" />
                  <path d="M50 90 L100 70 L100 20 L50 40 Z" fill="#0d0e12" stroke="#fb923c" strokeWidth="1.5" />
                  <text x="50" y="-15" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">1 NAS</text>
                  <g transform="translate(110, 20)">
                    <text x="0" y="0" fill="#fb923c" fontSize="10" fontWeight="800">NETAPP-01</text>
                    <text x="0" y="14" fill="#8e8e8e" fontSize="9">Cap: 8.0TB</text>
                    <text x="0" y="26" fill="#22d3a3" fontSize="9">Status: Optimal</text>
                  </g>
                </g>

                {/* Compute / Servers */}
                <g transform="translate(100, 220)">
                  <path d="M0 20 L50 0 L100 20 L50 40 Z" fill="#1a1d27" stroke="#4f8ef7" strokeWidth="1.5" />
                  <path d="M0 20 L0 70 L50 90 L50 40 Z" fill="#13151c" stroke="#4f8ef7" strokeWidth="1.5" />
                  <path d="M50 90 L100 70 L100 20 L50 40 Z" fill="#0d0e12" stroke="#4f8ef7" strokeWidth="1.5" />
                  <text x="50" y="-15" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">{vms.length} VMs</text>
                  <g transform="translate(-10, 110)" textAnchor="middle">
                    <text x="50" y="0" fill="#4f8ef7" fontSize="10" fontWeight="800">ESXI-PROD-01</text>
                    <text x="50" y="14" fill="#8e8e8e" fontSize="9">CPU: {metrics?.cpu?.usage}% | RAM: {metrics?.ram?.percent}%</text>
                  </g>
                </g>

                {/* Network / Fabric */}
                <g transform="translate(400, 220)">
                  <path d="M0 20 L50 0 L100 20 L50 40 Z" fill="#1a1d27" stroke="#a78bfa" strokeWidth="1.5" />
                  <path d="M0 20 L0 70 L50 90 L50 40 Z" fill="#13151c" stroke="#a78bfa" strokeWidth="1.5" />
                  <path d="M50 90 L100 70 L100 20 L50 40 Z" fill="#0d0e12" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="50" y="-15" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">4 Fabrics</text>
                  <g transform="translate(50, 110)" textAnchor="middle">
                    <text x="0" y="0" fill="#a78bfa" fontSize="10" fontWeight="800">CORE-SWITCH-01</text>
                    <text x="0" y="14" fill="#8e8e8e" fontSize="9">Traffic: 450 Mbps</text>
                  </g>
                </g>

                {/* Security / HCI */}
                <g transform="translate(250, 320)">
                  <path d="M0 20 L50 0 L100 20 L50 40 Z" fill="#1a1d27" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M0 20 L0 70 L50 90 L50 40 Z" fill="#13151c" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M50 90 L100 70 L100 20 L50 40 Z" fill="#0d0e12" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="50" y="-15" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">FIREWALL</text>
                  <text x="50" y="110" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="800">FORTIGATE-HA</text>
                </g>

                {/* Connecting Lines */}
                <path d="M350 160 L180 230" stroke="rgba(79, 142, 247, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M350 160 L420 230" stroke="rgba(79, 142, 247, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
             </svg>
          </div>
        </div>

        {/* Panneau Droite: Alertes & Activité (Mixte) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {/* Alarms Tabbed */}
           <div className="card glass-panel" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>ALARMES ACTIVES</span>
               <Bell size={14} color="#f5534b" />
             </div>
             <div style={{ flex: 1, padding: '12px 20px', overflowY: 'auto' }}>
                {alerts.filter(a => !a.resolved).slice(0, 5).map(alert => (
                  <div key={alert.key} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: alert.severity === 'critical' ? '#f5534b' : '#f5a623' }}>{alert.sourceId}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#e8eaf0', lineHeight: '1.4' }}>{alert.message}</div>
                  </div>
                ))}
             </div>
             <button className="btn btn-ghost" style={{ width: '100%', borderRadius: 0, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} onClick={() => navigate('/alerts')}>
               Historique Complet <ArrowUpRight size={12} />
             </button>
           </div>

           {/* Health Check Circle */}
           <div className="card glass-panel" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8e8e', marginBottom: 16, textTransform: 'uppercase' }}>Indice de Santé</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                 <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <svg width="80" height="80" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                       <circle cx="50" cy="50" r="45" fill="none" stroke="#22d3a3" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - (metrics?.health?.score || 94)/100)} strokeLinecap="round" transform="rotate(-90 50 50)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>{metrics?.health?.score || 94}%</div>
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3a3' }}>EXCELLENT</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Tous les systèmes de production sont nominaux.</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: CRITICAL SERVERS & TASKS ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 16, height: 240 }}>
        
        {/* Panel 1: Serveurs de Production Critiques */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
             SERVEURS DE PRODUCTION CRITIQUES
             <Shield size={14} color="#f5534b" />
           </div>
           <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '8px 0' }}>NOM</th>
                    <th>CPU</th>
                    <th>RAM</th>
                    <th>CONTRÔLE</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalServers.map(vm => (
                    <tr key={vm.id} style={{ fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600, color: '#e8eaf0' }}>{vm.name}</td>
                      <td>{vm.cpu?.usage}%</td>
                      <td>{vm.ram?.percent}%</td>
                      <td>
                        <button className="btn-link" style={{ fontSize: 10, color: '#4f8ef7' }} onClick={() => navigate(`/console/${vm.id}`)}>Console</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>

        {/* Panel 2: Tendance de Capacité */}
        <div className="card glass-panel">
           <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 16 }}>CAPACITY PLANNING</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>SATURATION ESTIMÉE (STOCKAGE)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fb923c' }}>Dans 74 jours</div>
                <div style={{ fontSize: 10, color: '#8e8e8e', marginTop: 4 }}>Basé sur une croissance de 1.2 GB/jour</div>
              </div>
              <div style={{ height: 60 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{v:30}, {v:35}, {v:42}, {v:50}, {v:64}]}>
                       <Area type="monotone" dataKey="v" stroke="#fb923c" fill="rgba(251, 146, 60, 0.1)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Panel 3: Tâches & Sauvegardes */}
        <div className="card glass-panel">
           <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 16 }}>TÂCHES & BACKUPS</div>
           <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 100, height: 100 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={taskData} innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value">
                          {taskData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                       </Pie>
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                 {taskData.map(t => (
                   <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }} />
                      <span style={{ fontWeight: 800 }}>{t.value}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{t.name}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

    </div>
  );
}
