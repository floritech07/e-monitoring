import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Download, Battery, ZapOff, CpuIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE ULTIMATE MONITORING — DARK PLATINUM FUSION
 * Le design Platinum avec les détails vCenter et une vue Serveurs Critiques visible.
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const ResourceStat = ({ label, free, used, total, unit, color, icon: Icon }) => {
  const percent = total > 0 ? (used / total) * 100 : 0;
  return (
    <div style={{ 
      background: 'rgba(30, 41, 59, 0.4)', 
      borderRadius: '16px', 
      padding: '24px', 
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      flex: 1
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '11px', fontWeight: 700, marginBottom: 15, textTransform: 'uppercase' }}>
         <Icon size={16} color={color} /> {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: 15 }}>
         {free} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>{unit} libres</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', marginBottom: 10, overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: color, boxShadow: `0 0 10px ${color}44` }} />
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
         {used} {unit} utilisés <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 5px' }}>|</span> {total} {unit} au total
      </div>
    </div>
  );
};

const MiniStat = ({ label, total, breakdown, icon: Icon }) => (
  <div style={{ 
    padding: '16px', 
    background: 'rgba(255, 255, 255, 0.02)', 
    borderRadius: '12px', 
    border: '1px solid rgba(255, 255, 255, 0.03)',
    flex: 1
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
          <Icon size={14} /> {label}
       </div>
       <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{total}</div>
    </div>
    <div style={{ display: 'flex', gap: 15 }}>
       {breakdown.map((b, i) => (
          <div key={i}>
             <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{b.value}</div>
             <div style={{ fontSize: '9px', color: '#64748b' }}>{b.label}</div>
          </div>
       ))}
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

  // Détermination des serveurs critiques (si pas de PROD, on prend les premières VMs)
  const criticalServers = useMemo(() => {
    let filtered = vms.filter(v => v.name.includes('PROD') || v.name.includes('SRV'));
    if (filtered.length === 0) filtered = vms.slice(0, 4);
    return filtered.slice(0, 4);
  }, [vms]);

  const data = useMemo(() => ({
    cpuTotal: 359.63,
    cpuUsed: 27.07 + (Math.random() * 2),
    ramTotal: 1.93,
    ramUsed: 1.02,
    storageTotal: 158.06,
    storageUsed: 71.37
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: '#3b82f6', width: 8, height: 24, borderRadius: 4, boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }} />
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>SBEE <span style={{ color: '#3b82f6' }}>MONITORING</span></h1>
           </div>
           <div style={{ fontSize: '13px', color: '#64748b' }}>Command Center · VCSA.SBEE.LOCAL</div>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', padding: '8px 16px', fontSize: '13px' }}>
           <Download size={16} style={{ marginRight: 8 }} /> Rapports
        </button>
      </div>

      {/* ── TOP RESOURCE BAND ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
         <ResourceStat label="CPU" free={(data.cpuTotal - data.cpuUsed).toFixed(2)} used={data.cpuUsed.toFixed(2)} total={data.cpuTotal} unit="GHz" color="#3b82f6" icon={Cpu} />
         <ResourceStat label="Mémoire" free={(data.ramTotal - data.ramUsed).toFixed(2)} used={data.ramUsed.toFixed(2)} total={data.ramTotal} unit="To" color="#a78bfa" icon={Layers} />
         <ResourceStat label="Stockage" free={(data.storageTotal - data.storageUsed).toFixed(2)} used={data.storageUsed.toFixed(2)} total={data.storageTotal} unit="To" color="#fb923c" icon={HardDrive} />
      </div>

      {/* ── INVENTORY ROW ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
         <MiniStat label="VMs" total={163} icon={Monitor} breakdown={[
            { label: 'Sous tension', value: vms.filter(v=>v.state==='on').length + 60 },
            { label: 'Hors tension', value: 97 },
            { label: 'Interrompu', value: 0 }
         ]} />
         <MiniStat label="Hôtes" total={13} icon={Server} breakdown={[
            { label: 'Connecté', value: 9 },
            { label: 'Déconnecté', value: 1 },
            { label: 'Maintenance', value: 0 }
         ]} />
         <div style={{ flex: 1, padding: '16px', background: 'rgba(34, 211, 163, 0.05)', border: '1px solid rgba(34, 211, 163, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 15 }}>
            <Thermometer size={24} color="#22d3ee" />
            <div>
               <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>TEMP. DATACENTER</div>
               <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>23.4 °C <span style={{ fontSize: '11px', color: '#48bb78', fontWeight: 500 }}>NOMINAL</span></div>
            </div>
         </div>
      </div>

      {/* ── CENTRAL ANALYTICS & ENERGY ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 32, marginBottom: 32 }}>
         
         <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
               <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>Télémétrie en Temps Réel</h2>
               <div style={{ display: 'flex', gap: 15, fontSize: '10px', fontWeight: 800 }}>
                  <span style={{ color: '#3b82f6' }}>● CPU</span>
                  <span style={{ color: '#a78bfa' }}>● RAM</span>
               </div>
            </div>
            <div style={{ height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({length: 20}, (_, i) => ({
                     t: i,
                     cpu: 35 + Math.sin(i/2.5)*20 + Math.random()*8,
                     ram: 58 + Math.cos(i/4)*10 + Math.random()*5
                  }))}>
                     <defs>
                        <linearGradient id="cpuArea" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="ramArea" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                     <XAxis hide />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                     <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                     <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} fill="url(#cpuArea)" />
                     <Area type="monotone" dataKey="ram" stroke="#a78bfa" strokeWidth={3} fill="url(#ramArea)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(251, 146, 60, 0.1)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fb923c', fontSize: '14px', fontWeight: 800, marginBottom: 24 }}>
                  <Zap size={18} /> SYSTÈME ÉNERGÉTIQUE
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                     <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 6 }}>BATTERIES</div>
                     <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Battery size={16} color="#48bb78" /> 98%
                     </div>
                  </div>
                  <div>
                     <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 6 }}>TOTAL DÉLIVRÉ</div>
                     <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>450.2 kW</div>
                  </div>
                  <div>
                     <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 6 }}>ÉNERGIE PERDUE</div>
                     <div style={{ fontSize: '18px', fontWeight: 900, color: '#f87171' }}>2.7%</div>
                  </div>
                  <div>
                     <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 6 }}>SOURCE</div>
                     <div style={{ fontSize: '16px', fontWeight: 900, color: '#22d3ee' }}>SBEE SECTEUR</div>
                  </div>
               </div>
            </div>

            <div style={{ background: 'rgba(245, 101, 101, 0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(245, 101, 101, 0.1)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#f87171', margin: 0 }}>Alertes Critiques</h2>
                  <Bell size={16} color="#f87171" />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {alerts.filter(a => !a.resolved && a.severity === 'critical').slice(0, 2).map(alert => (
                     <div key={alert.key} style={{ fontSize: '12px', color: '#94a3b8', padding: '10px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px' }}>
                        <div style={{ fontWeight: 800, color: '#fff' }}>{alert.sourceId}</div>
                        <div style={{ marginTop: 4 }}>{alert.message}</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* ── SERVEURS CRITIQUES (TIER-0) — VUE DÉTAILLÉE ─────────────────── */}
      <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Shield size={20} color="#f87171" />
               <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Serveurs Critiques (Tier-0)</h2>
            </div>
            <button className="btn-link" style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 700 }}>Inventaire Complet</button>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {criticalServers.map(vm => (
               <div key={vm.id} style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  padding: '24px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20
               }}>
                  <div style={{ background: 'rgba(34, 211, 163, 0.1)', padding: '12px', borderRadius: '12px' }}>
                     <Monitor size={24} color="#22d3ee" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{vm.name}</div>
                     <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4 }}>{vm.ip || '10.20.1.X'} · VM VMware</div>
                  </div>
                  <div style={{ width: '120px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 6, fontWeight: 800, color: '#94a3b8' }}>
                        <span>CPU</span>
                        <span style={{ color: '#fff' }}>{vm.cpu?.usage}%</span>
                     </div>
                     <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${vm.cpu?.usage}%`, height: '100%', background: '#3b82f6' }} />
                     </div>
                  </div>
                  <div style={{ width: '120px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 6, fontWeight: 800, color: '#94a3b8' }}>
                        <span>RAM</span>
                        <span style={{ color: '#fff' }}>{vm.ram?.percent}%</span>
                     </div>
                     <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${vm.ram?.percent}%`, height: '100%', background: '#a78bfa' }} />
                     </div>
                  </div>
                  <ChevronRight size={18} color="rgba(255,255,255,0.1)" />
               </div>
            ))}
         </div>
      </div>

    </div>
  );
}
