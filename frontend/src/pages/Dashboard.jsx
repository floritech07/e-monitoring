import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Search, Filter, Download, Calendar, MoreHorizontal,
  Power, CpuIcon, Gauge
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE MONITORING — DARK PLATINUM EDITION
 * L'excellence technique du Platinum dans une esthétique Midnight Premium.
 */

// ── UI COMPONENTS — DARK PLATINUM STYLE ───────────────────────────────────

const StatBox = ({ label, value, unit, subValue, color, icon: Icon }) => (
  <div style={{ 
    background: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: '20px', 
    padding: '24px', 
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    flex: 1,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div style={{ background: `${color}20`, padding: '12px', borderRadius: '12px', border: `1px solid ${color}30` }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ color: '#22d3ee', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} /> LIVE
      </div>
    </div>
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: '36px', fontWeight: 900, color: '#fff' }}>{value}</span>
      <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>{unit}</span>
    </div>
    <div style={{ fontSize: '11px', color: '#64748b', marginTop: 10, fontWeight: 500 }}>{subValue}</div>
  </div>
);

const CriticalServerCard = ({ vm }) => (
  <div style={{ 
    padding: '16px', 
    background: 'rgba(255, 255, 255, 0.02)', 
    borderRadius: '16px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  }} className="hover-glow">
    <div style={{ background: vm.state === 'on' ? 'rgba(34, 211, 163, 0.1)' : 'rgba(245, 101, 101, 0.1)', padding: '10px', borderRadius: '12px' }}>
      <Monitor size={20} color={vm.state === 'on' ? '#22d3ee' : '#f87171'} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{vm.name}</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>{vm.ip || '10.20.1.X'} · {vm.os || 'Linux Server'}</div>
    </div>
    <div style={{ width: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 4, fontWeight: 700, color: '#94a3b8' }}>
        <span>CPU</span>
        <span style={{ color: '#fff' }}>{vm.cpu?.usage}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${vm.cpu?.usage}%`, height: '100%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
      </div>
    </div>
    <div style={{ width: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 4, fontWeight: 700, color: '#94a3b8' }}>
        <span>RAM</span>
        <span style={{ color: '#fff' }}>{vm.ram?.percent}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${vm.ram?.percent}%`, height: '100%', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
      </div>
    </div>
  </div>
);

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [env, setEnv] = useState(null);

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  const stats = useMemo(() => ({
    cpuTotal: 12.0,
    ramTotal: 64.0,
    storageTotal: 8.0,
    cpuUsed: (metrics?.cpu?.usage || 26) * 0.12,
    ramUsed: (metrics?.ram?.percent || 58) * 0.64,
    storageUsed: (metrics?.storage?.usedPct || 64) * 0.08
  }), [metrics]);

  return (
    <div className="fade-in" style={{ 
      padding: '40px', 
      background: '#0b0e14', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0'
    }}>
      
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 8 }}>
              <div style={{ background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)', width: 8, height: 32, borderRadius: 4, boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }} />
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>SBEE <span style={{ color: '#3b82f6' }}>MONITORING</span></h1>
           </div>
           <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Enterprise Command Center · Datacenter de Production Cotonou</p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>NETWORK STATUS</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                 ONLINE <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 10px #22d3ee' }} />
              </div>
           </div>
           <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', padding: '10px 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Download size={18} /> Rapports
           </button>
        </div>
      </div>

      {/* ── TOP STATS: GLOBAL CAPACITY ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
         <StatBox label="Puissance CPU" value={stats.cpuTotal} unit="GHz" subValue={`${stats.cpuUsed.toFixed(1)} GHz en charge`} icon={Cpu} color="#3b82f6" />
         <StatBox label="Mémoire Cluster" value={stats.ramTotal} unit="GB" subValue={`${stats.ramUsed.toFixed(1)} GB utilisés`} icon={Layers} color="#a78bfa" />
         <StatBox label="Stockage SAN" value={stats.storageTotal} unit="TB" subValue={`${stats.storageUsed.toFixed(1)} TB occupés`} icon={Database} color="#fb923c" />
         <StatBox label="Datacenter Temp" value={env?.avgTempC || 23.4} unit="°C" subValue="Refroidissement Nominal" icon={Thermometer} color="#f87171" />
      </div>

      {/* ── MAIN ANALYTICS GRID ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 32, marginBottom: 40 }}>
        
        {/* Panel Gauche: Performance Flows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
           
           {/* Graphique Haute-Fidélité (Dark SaaS style) */}
           <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                 <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Performance Télémétrie</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: 4 }}>Flux de ressources en temps réel (Cluster ESXi)</p>
                 </div>
                 <div style={{ display: 'flex', gap: 24 }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 800 }}>CPU USAGE</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{metrics?.cpu?.usage}%</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 800 }}>RAM USAGE</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{metrics?.ram?.percent}%</div></div>
                 </div>
              </div>
              <div style={{ height: '320px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={Array.from({length: 20}, (_, i) => ({
                       t: i,
                       cpu: 35 + Math.sin(i/2.5)*20 + Math.random()*8,
                       ram: 58 + Math.cos(i/4)*10 + Math.random()*5
                    }))}>
                       <defs>
                          <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                       <XAxis hide />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 100]} />
                       <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                       <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={4} fill="url(#cpuGrad)" />
                       <Area type="monotone" dataKey="ram" stroke="#a78bfa" strokeWidth={4} fill="url(#ramGrad)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Section Énergie Midnight */}
           <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: 40, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(251, 146, 60, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(251, 146, 60, 0.2)' }}>
                       <Zap size={24} color="#fb923c" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Énergie & Continuité</h2>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                    <div>
                       <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Source</div>
                       <div style={{ fontSize: '20px', fontWeight: 900, color: '#22d3ee' }}>SBEE SECTEUR</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Charge UPS</div>
                       <div style={{ fontSize: '20px', fontWeight: 900, color: '#fb923c' }}>{metrics?.ups?.avgChargePct || 98}%</div>
                    </div>
                 </div>
              </div>
              <div style={{ width: 140, height: 100 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{v: 98}, {v: 95}, {v: 97}, {v: 98}]}>
                       <Bar dataKey="v" fill="#fb923c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
                 <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748b', marginTop: 10, fontWeight: 700 }}>UPS HISTORY</div>
              </div>
           </div>
        </div>

        {/* Panel Droit: Serveurs & Alertes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
           
           {/* Liste des Serveurs de Production (Dark Cards) */}
           <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Serveurs de Production</h2>
                 <button className="btn-link" onClick={() => navigate('/infrastructure')} style={{ color: '#3b82f6', fontWeight: 800, fontSize: '13px' }}>View All</button>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '440px', paddingRight: '5px' }}>
                 {vms.filter(v => v.name.includes('PROD') || v.name.includes('SRV')).slice(0, 6).map(vm => (
                   <CriticalServerCard key={vm.id} vm={vm} />
                 ))}
              </div>
           </div>

           {/* Alertes Critiques (Midnight Red) */}
           <div style={{ background: 'rgba(245, 101, 101, 0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(245, 101, 101, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                 <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', margin: 0 }}>Dernières Alertes</h2>
                 <Bell size={18} color="#f87171" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {alerts.filter(a => !a.resolved && a.severity === 'critical').slice(0, 2).map(alert => (
                    <div key={alert.key} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{alert.sourceId}</div>
                       <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>{alert.message}</div>
                       <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 800, marginTop: 10, textTransform: 'uppercase' }}>Il y a quelques minutes</div>
                    </div>
                 ))}
              </div>
              <button className="btn" style={{ width: '100%', marginTop: 24, background: 'rgba(245, 101, 101, 0.1)', color: '#f87171', borderRadius: '12px', border: '1px solid rgba(245, 101, 101, 0.2)', padding: '12px', fontWeight: 800 }} onClick={() => navigate('/alerts')}>
                 Ouvrir le Journal d'Audit
              </button>
           </div>
        </div>

      </div>

    </div>
  );
}
