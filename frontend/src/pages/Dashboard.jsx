import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Download, Battery, ZapOff, CpuIcon, User, Search, Settings, MoreVertical
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE SAAS PLATINUM EDITION
 * Layout SaaS moderne avec structure par blocs, widgets latéraux et mode sombre.
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const AssetCard = ({ label, value, trend, subLabel, color, icon: Icon }) => (
  <div style={{ 
    background: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: '24px', 
    padding: '24px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    flex: 1
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
       <div style={{ background: `${color}20`, padding: '12px', borderRadius: '16px' }}>
          <Icon size={20} color={color} />
       </div>
       <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
       <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{value}</span>
       <span style={{ fontSize: '12px', color: trend.startsWith('+') ? '#48bb78' : '#f87171', fontWeight: 700 }}>
          {trend} {trend.startsWith('+') ? '↑' : '↓'}
       </span>
    </div>
    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 15 }}>{subLabel}</div>
    <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
       <div style={{ width: value.includes('%') ? value : '65%', height: '100%', background: color }} />
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
         
         {/* Welcome Banner */}
         <div style={{ 
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)', 
            borderRadius: '24px', 
            padding: '40px', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
         }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
               <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0 }}>Welcome back, Admin</h1>
               <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: 12, maxWidth: '400px', lineHeight: 1.6 }}>
                  L'infrastructure SBEE est actuellement à <span style={{ color: '#48bb78', fontWeight: 800 }}>98% de disponibilité</span>. 
                  Toutes les vCenter Nodes sont synchronisées.
               </p>
            </div>
            {/* Background Illustration Decor */}
            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
               <Server size={200} color="#fff" />
            </div>
         </div>

         {/* Asset Cards Grid */}
         <div style={{ display: 'flex', gap: 24 }}>
            <AssetCard label="CPU" value={`${metrics?.cpu?.usage || 4.8}%`} trend="+6.5%" subLabel="Avg usage last 24h" color="#6366f1" icon={Cpu} />
            <AssetCard label="RAM" value={`${metrics?.ram?.percent || 4.2}%`} trend="-8.5%" subLabel="Avg usage last 24h" color="#ec4899" icon={Layers} />
            <AssetCard label="DISK" value="5.8GB" trend="+3.6%" subLabel="SAN utilization" color="#8b5cf6" icon={HardDrive} />
            <AssetCard label="SERVICES" value="3.5KB" trend="+4.8%" subLabel="Network traffic" color="#f59e0b" icon={Network} />
         </div>

         {/* Main Chart: Server Traffic */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
               <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Server Traffic Source</h2>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>This Year</div>
            </div>
            <div style={{ height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({length: 12}, (_, i) => ({ name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], value: 40 + Math.random()*60 }))}>
                     <defs>
                        <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                     <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                     <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} fill="url(#trafficGrad)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* ── SIDEBAR WIDGETS (RIGHT) ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
         
         {/* Mini Metrics */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ marginBottom: 20 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>Loads</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Online Participant</span>
               </div>
               <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                  <div style={{ width: '85%', height: '100%', background: '#f87171', borderRadius: '3px' }} />
               </div>
            </div>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>Requests</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Offline Participant</span>
               </div>
               <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                  <div style={{ width: '62%', height: '100%', background: '#6366f1', borderRadius: '3px' }} />
               </div>
            </div>
         </div>

         {/* Storage Circular */}
         <div style={{ background: '#f97316', borderRadius: '24px', padding: '30px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900 }}>
                  75
               </div>
               <div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>Storage Usage</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, marginTop: 4 }}>594,875,625</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: 2 }}>Online Users Capacity</div>
               </div>
            </div>
         </div>

         {/* Security Threat Card */}
         <div style={{ background: '#4f46e5', borderRadius: '24px', padding: '30px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
               <Shield size={32} />
               <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>Unauthorized Threats has been Terminated</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.9 }}>
               <div style={{ fontSize: '13px' }}>• 5 Unnecessary Data</div>
               <div style={{ fontSize: '13px' }}>• 12 Unidentified Source Data</div>
               <div style={{ fontSize: '13px' }}>• 8 Unused Images</div>
            </div>
            <button style={{ width: '100%', marginTop: 24, background: '#fff', color: '#4f46e5', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
               View More
            </button>
         </div>

         {/* Disk Usage Donut */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: 20 }}>Disk Usage</h3>
            <div style={{ height: '140px', position: 'relative' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={[{v: 70}, {v: 30}]} innerRadius={50} outerRadius={65} paddingAngle={5} dataKey="v">
                        <Cell fill="#22d3ee" />
                        <Cell fill="rgba(255,255,255,0.05)" />
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>70%</div>
               </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#f87171' }}><span>• Max Usage</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}><span>• Average Usage</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#22d3ee' }}><span>• Minimum Usage</span></div>
            </div>
         </div>

      </div>

    </div>
  );
}
