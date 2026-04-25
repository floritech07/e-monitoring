import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Download, Battery, ZapOff, CpuIcon, Router, Wifi, Settings2, List
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE SAAS DATACENTER — ULTIMATE FUSION
 * Structure SaaS moderne, contenu Datacenter exhaustif (vCenter, Energie, Network).
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const CapacityCard = ({ label, value, unit, subValue, color, icon: Icon }) => (
  <div style={{ 
    background: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: '24px', 
    padding: '24px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    flex: 1
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
       <div style={{ background: `${color}20`, padding: '10px', borderRadius: '12px' }}>
          <Icon size={18} color={color} />
       </div>
       <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: 8 }}>
       {value} <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>{unit}</span>
    </div>
    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{subValue}</div>
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
    cpuTotal: 359.63, cpuUsed: 27.07 + (Math.random() * 2),
    ramTotal: 1.93, ramUsed: 1.02,
    storageTotal: 158.06, storageUsed: 71.37,
    energyDelivered: 450.2
  }), [metrics]);

  return (
    <div className="fade-in" style={{ 
      padding: '32px', 
      background: '#0b0e14', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0',
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: 32
    }}>
      
      {/* ── MAIN CONTENT (LEFT) ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
         
         {/* Datacenter Header Banner */}
         <div style={{ 
            background: 'linear-gradient(90deg, rgba(34, 211, 238, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', 
            borderRadius: '24px', 
            padding: '40px', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
         }}>
            <div>
               <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0 }}>SBEE HYPERVISOR</h1>
               <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 10px #22d3ee' }} />
                  Système Connecté : VCSA.SBEE.LOCAL (Cotonou)
               </p>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>UPTIME CLUSTER</div>
               <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>10:02:00</div>
            </div>
         </div>

         {/* Core Capacity Grid */}
         <div style={{ display: 'flex', gap: 24 }}>
            <CapacityCard label="CPU Total" value={stats.cpuTotal} unit="GHz" subValue={`${stats.cpuUsed.toFixed(2)} GHz en charge`} color="#3b82f6" icon={Cpu} />
            <CapacityCard label="RAM Totale" value={stats.ramTotal} unit="To" subValue={`${stats.ramUsed.toFixed(2)} To utilisés`} color="#a78bfa" icon={Layers} />
            <CapacityCard label="Stockage SAN" value={stats.storageTotal} unit="To" subValue={`${stats.storageUsed.toFixed(2)} To occupés`} color="#fb923c" icon={HardDrive} />
            <CapacityCard label="Énergie Salle" value={stats.energyDelivered} unit="kW" subValue="Secteur SBEE Actif" color="#22d3ee" icon={Zap} />
         </div>

         {/* Performance Chart */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
               <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Télémétrie Cluster ESXi</h2>
               <div style={{ display: 'flex', gap: 20, fontSize: '11px', fontWeight: 800 }}>
                  <span style={{ color: '#3b82f6' }}>● CPU LOAD</span>
                  <span style={{ color: '#a78bfa' }}>● RAM LOAD</span>
               </div>
            </div>
            <div style={{ height: '240px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({length: 20}, (_, i) => ({ t: i, cpu: 30+Math.random()*40, ram: 50+Math.random()*20 }))}>
                     <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                     <XAxis hide />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                     <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                     <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} fill="url(#cpuGrad)" />
                     <Area type="monotone" dataKey="ram" stroke="#a78bfa" strokeWidth={3} fill="none" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Critical Servers Table */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: 24 }}>Serveurs Critiques (Tier-0)</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', fontSize: '11px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <th style={{ padding: '12px 8px' }}>SERVEUR</th>
                     <th>CPU</th>
                     <th>RAM</th>
                     <th>STATUT</th>
                  </tr>
               </thead>
               <tbody>
                  {vms.slice(0, 5).map(vm => (
                     <tr key={vm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '13px' }}>
                        <td style={{ padding: '16px 8px', color: '#fff', fontWeight: 700 }}>{vm.name}</td>
                        <td style={{ color: '#3b82f6' }}>{vm.cpu?.usage}%</td>
                        <td style={{ color: '#a78bfa' }}>{vm.ram?.percent}%</td>
                        <td><span style={{ color: '#48bb78', fontSize: '11px', fontWeight: 800 }}>RUNNING</span></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* ── SIDEBAR WIDGETS (RIGHT) ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
         
         {/* Power Widget */}
         <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', borderRadius: '24px', padding: '24px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <Zap size={24} />
               <div style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '10px' }}>UPS ACTIVE</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900 }}>98% <span style={{ fontSize: '14px', opacity: 0.8 }}>Charge Batterie</span></div>
            <div style={{ fontSize: '12px', marginTop: 10, opacity: 0.9 }}>Autonomie estimée : 45 minutes</div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginTop: 20 }}>
               <div style={{ width: '98%', height: '100%', background: '#fff' }} />
            </div>
         </div>

         {/* Hardware Inventory */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: 20 }}>Inventaire Physique</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#94a3b8' }}><Router size={16} /> Routeurs</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>2</div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#94a3b8' }}><Database size={16} /> NAS</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>4</div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#94a3b8' }}><Server size={16} /> Hôtes ESXi</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>13</div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#94a3b8' }}><Network size={16} /> VLANs</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>24</div>
               </div>
            </div>
         </div>

         {/* SAN Storage Donut */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: 20 }}>Occupation SAN</h3>
            <div style={{ height: '140px', position: 'relative' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={[{v: 71.37}, {v: 86.69}]} innerRadius={50} outerRadius={65} paddingAngle={5} dataKey="v">
                        <Cell fill="#fb923c" />
                        <Cell fill="rgba(255,255,255,0.05)" />
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>45%</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>USED</div>
               </div>
            </div>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
               71.37 To utilisés sur 158.06 To
            </div>
         </div>

         {/* Security Notifications */}
         <div style={{ background: 'rgba(245, 101, 101, 0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(245, 101, 101, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', fontSize: '14px', fontWeight: 800, marginBottom: 15 }}>
               <Shield size={18} /> ALERTES CRITIQUES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
               {alerts.filter(a=>a.severity==='critical').slice(0, 2).map((alert, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                     <span style={{ color: '#fff', fontWeight: 700 }}>{alert.sourceId}</span>: {alert.message}
                  </div>
               ))}
            </div>
         </div>

      </div>

    </div>
  );
}
