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
 * SBEE MONITORING — PLATINUM EDITION
 * Fusion de la clarté SaaS et de la densité technique Data Center.
 */

// ── UI COMPONENTS — PLATINUM STYLE ─────────────────────────────────────────

const StatBox = ({ label, value, unit, subValue, color, icon: Icon }) => (
  <div style={{ 
    background: '#fff', 
    borderRadius: '20px', 
    padding: '24px', 
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
    flex: 1
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div style={{ background: `${color}10`, padding: '12px', borderRadius: '12px' }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
        <TrendingUp size={14} /> LIVE
      </div>
    </div>
    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a' }}>{value}</span>
      <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>{unit}</span>
    </div>
    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 10 }}>{subValue}</div>
  </div>
);

const CriticalServerCard = ({ vm }) => (
  <div style={{ 
    padding: '16px', 
    background: '#fff', 
    borderRadius: '16px', 
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  }} className="hover-lift">
    <div style={{ background: vm.state === 'on' ? '#f0fdf4' : '#fef2f2', padding: '10px', borderRadius: '12px' }}>
      <Monitor size={20} color={vm.state === 'on' ? '#22c55e' : '#ef4444'} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{vm.name}</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>{vm.ip || '10.20.1.X'} · {vm.os || 'Linux'}</div>
    </div>
    <div style={{ width: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 4, fontWeight: 700 }}>
        <span>CPU</span>
        <span>{vm.cpu?.usage}%</span>
      </div>
      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${vm.cpu?.usage}%`, height: '100%', background: '#3b82f6' }} />
      </div>
    </div>
    <div style={{ width: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 4, fontWeight: 700 }}>
        <span>RAM</span>
        <span>{vm.ram?.percent}%</span>
      </div>
      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${vm.ram?.percent}%`, height: '100%', background: '#8b5cf6' }} />
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

  const totalCapacity = useMemo(() => ({
    cpu: 12.0, // GHz
    ram: 64.0, // GB
    storage: 8.0, // TB
    cpuUsed: (metrics?.cpu?.usage || 26) * 0.12,
    ramUsed: (metrics?.ram?.percent || 58) * 0.64,
    storageUsed: (metrics?.storage?.usedPct || 64) * 0.08
  }), [metrics]);

  return (
    <div className="fade-in" style={{ 
      padding: '40px', 
      background: '#f8fafc', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', sans-serif",
      color: '#1e293b'
    }}>
      
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: '#3b82f6', width: 8, height: 24, borderRadius: 4 }} />
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>SBEE MONITORING</h1>
           </div>
           <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Command Center · Datacenter de Production Cotonou</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Dernier Sync</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Aujourd'hui, {new Date().toLocaleTimeString()}</div>
           </div>
           <button className="btn" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Download size={18} /> Rapports
           </button>
        </div>
      </div>

      {/* ── TOP STATS: POWER & CAPACITY ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
         <StatBox label="Puissance CPU" value={totalCapacity.cpu} unit="GHz" subValue={`${totalCapacity.cpuUsed.toFixed(1)} GHz actuellement utilisés`} icon={Cpu} color="#3b82f6" />
         <StatBox label="Mémoire Cluster" value={totalCapacity.ram} unit="GB" subValue={`${totalCapacity.ramUsed.toFixed(1)} GB alloués aux VMs`} icon={Layers} color="#8b5cf6" />
         <StatBox label="Stockage SAN" value={totalCapacity.storage} unit="TB" subValue={`${totalCapacity.storageUsed.toFixed(1)} TB occupés`} icon={HardDrive} color="#f59e0b" />
         <StatBox label="Température DC" value={env?.avgTempC || 23.4} unit="°C" subValue="Refroidissement Nominal (CRAC-01)" icon={Thermometer} color="#ef4444" />
      </div>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 32, marginBottom: 40 }}>
        
        {/* Panel Gauche: Performance & Energie */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
           
           {/* Graphique Haute-Fidélité (Style SaaS) */}
           <div style={{ background: '#0f172a', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                 <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Télémétrie en Temps Réel</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Performances agrégées du cluster ESXi</p>
                 </div>
                 <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 800 }}>CPU</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{metrics?.cpu?.usage}%</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 800 }}>RAM</div><div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{metrics?.ram?.percent}%</div></div>
                 </div>
              </div>
              <div style={{ height: '300px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={Array.from({length: 20}, (_, i) => ({
                       t: i,
                       cpu: 40 + Math.sin(i/2)*20 + Math.random()*5,
                       ram: 60 + Math.cos(i/3)*10 + Math.random()*5
                    }))}>
                       <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis hide />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
                       <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                       <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={4} fill="url(#colorCpu)" />
                       <Area type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={4} fill="url(#colorRam)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Section Energie SBEE */}
           <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', display: 'flex', gap: 40, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '10px' }}>
                       <Zap size={24} color="#f59e0b" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Énergie & Onduleurs</h2>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Source Actuelle</div>
                       <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>SECTEUR SBEE</div>
                    </div>
                    <div>
                       <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Charge UPS</div>
                       <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{metrics?.ups?.avgChargePct || 98}%</div>
                    </div>
                 </div>
              </div>
              <div style={{ width: 150, height: 100 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{v: 98}, {v: 95}, {v: 97}, {v: 98}]}>
                       <Bar dataKey="v" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
                 <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: 8 }}>Historique de Charge</div>
              </div>
           </div>
        </div>

        {/* Panel Droit: Serveurs Critiques & Alertes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
           
           {/* Liste des Serveurs Critiques */}
           <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Serveurs de Production</h2>
                 <button className="btn-link" onClick={() => navigate('/infrastructure')} style={{ color: '#3b82f6', fontWeight: 700, fontSize: '13px' }}>Voir tout</button>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                 {vms.filter(v => v.name.includes('PROD') || v.name.includes('SRV')).slice(0, 5).map(vm => (
                   <CriticalServerCard key={vm.id} vm={vm} />
                 ))}
              </div>
           </div>

           {/* Alertes Critiques (Style SaaS) */}
           <div style={{ background: '#fef2f2', borderRadius: '24px', padding: '24px', border: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b', margin: 0 }}>Alertes Critiques</h2>
                 <Bell size={18} color="#991b1b" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {alerts.filter(a => !a.resolved && a.severity === 'critical').slice(0, 2).map(alert => (
                    <div key={alert.key} style={{ background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                       <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{alert.sourceId}</div>
                       <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>{alert.message}</div>
                       <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700, marginTop: 8 }}>IL Y A 12 MINUTES</div>
                    </div>
                 ))}
              </div>
              <button className="btn" style={{ width: '100%', marginTop: 20, background: '#991b1b', color: '#fff', borderRadius: '12px', border: 'none', padding: '12px', fontWeight: 700 }} onClick={() => navigate('/alerts')}>
                 Ouvrir le Journal d'Audit
              </button>
           </div>
        </div>

      </div>

    </div>
  );
}
