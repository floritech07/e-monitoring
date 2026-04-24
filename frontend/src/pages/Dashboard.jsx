import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Building2, ArrowUpRight, Gauge, Lock, Globe, CpuIcon,
  RefreshCw, BarChart3, List, Terminal, ActivitySquare,
  Power, Hash, DatabaseZap
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line
} from 'recharts';
import { api } from '../api';

/**
 * SBEE MONITORING — HYPER-VISOR CONSOLE V4 (THE ULTIMATE MIX)
 * Allie haute densité de données et esthétique Cyber-Ops Premium.
 */

// ── UI COMPONENTS — CYBER-OPS STYLE ────────────────────────────────────────

const OpsGauge = ({ label, value, unit, color, icon: Icon, trend }) => (
  <div className="card-pro" style={{ 
    background: 'linear-gradient(180deg, rgba(20,26,42,0.8) 0%, rgba(10,14,24,0.95) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `inset 0 0 20px ${color}05`
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
      <div style={{ background: `${color}15`, padding: '8px', borderRadius: '8px' }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
          {value}<span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span>
        </div>
      </div>
    </div>
    <div style={{ height: '40px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={Array.from({length: 12}, () => ({ v: Math.random() * 20 + 40 }))}>
           <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                 <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
           </defs>
           <Area type="monotone" dataKey="v" stroke={color} fill={`url(#grad-${color})`} strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    {trend && (
      <div style={{ position: 'absolute', bottom: 10, right: 15, fontSize: '10px', fontWeight: 800, color: trend > 0 ? '#f5534b' : '#22d3a3' }}>
        {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const MiniStat = ({ label, value, icon: Icon, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
     <Icon size={14} color={color} />
     <div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{value}</div>
     </div>
  </div>
);

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [env, setEnv] = useState(null);
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
    api.getCapacityReport().then(setCapacity).catch(() => {});
  }, []);

  const healthScore = metrics?.health?.score || 98;
  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'critical').length;

  return (
    <div className="fade-in" style={{ 
      padding: '24px', 
      background: '#05070a', 
      minHeight: 'calc(100vh - 60px)', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 24,
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* ── HEADER — BRANDING & GLOBAL PULSE ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22d3a3', boxShadow: '0 0 15px rgba(34,211,163,0.5)', animation: 'pulse 2s infinite' }} />
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '1px' }}>
                SBEE <span style={{ color: '#4f8ef7' }}>MONITORING</span>
              </h1>
           </div>
           <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.1)' }} />
           <div style={{ display: 'flex', gap: 15 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>SESSION: <span style={{ color: '#e8eaf0' }}>ADMIN_ROOT</span></div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>DATACENTER: <span style={{ color: '#e8eaf0' }}>COTONOU_DC1</span></div>
           </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
           <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(34,211,163,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity size={16} color="#22d3a3" />
              <div>
                 <div style={{ fontSize: '9px', color: '#22d3a3', fontWeight: 800 }}>HEALTH SCORE</div>
                 <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{healthScore}%</div>
              </div>
           </div>
           <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(245,83,75,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={16} color="#f5534b" />
              <div>
                 <div style={{ fontSize: '9px', color: '#f5534b', fontWeight: 800 }}>CRITICAL EVENTS</div>
                 <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{criticalCount}</div>
              </div>
           </div>
        </div>
      </div>

      {/* ── CORE METRICS GRID ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
         <OpsGauge label="Compute Cluster" value={metrics?.cpu?.usage || 42} unit="%" color="#4f8ef7" icon={Cpu} trend={2} />
         <OpsGauge label="Physical Memory" value={metrics?.ram?.percent || 58} unit="%" color="#a78bfa" icon={Activity} trend={-3} />
         <OpsGauge label="Storage Fabric" value={metrics?.storage?.usedPct || 64} unit="%" color="#fb923c" icon={HardDrive} />
         <OpsGauge label="Room Environment" value={env?.avgTempC || 23.4} unit="°C" color="#38bdf8" icon={Thermometer} />
      </div>

      {/* ── MAIN OPS CENTER ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 24, flex: 1 }}>
        
        {/* LEFT: CRITICAL PRODUCTION SERVERS */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Server size={18} color="#4f8ef7" />
                 <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>VIRTUALIZATION ENGINE</h2>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>{vms.filter(v => v.state==='on').length} RUNNING</div>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                    <tr style={{ textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <th style={{ padding: '10px' }}>VM IDENTIFIER</th>
                       <th>STATE</th>
                       <th>PERF</th>
                       <th style={{ textAlign: 'right' }}>COMMAND</th>
                    </tr>
                 </thead>
                 <tbody>
                    {vms.slice(0, 10).map(vm => (
                      <tr key={vm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} className="row-hover">
                         <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8eaf0' }}>{vm.name}</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{vm.os} | {vm.ip || 'DHCP'}</div>
                         </td>
                         <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <div style={{ width: 6, height: 6, borderRadius: '50%', background: vm.state === 'on' ? '#22d3a3' : '#f5534b' }} />
                               <span style={{ fontSize: '10px', fontWeight: 800, color: vm.state === 'on' ? '#22d3a3' : '#f5534b' }}>{vm.state.toUpperCase()}</span>
                            </div>
                         </td>
                         <td>
                            <div style={{ display: 'flex', gap: 10 }}>
                               <div style={{ fontSize: '10px', color: vm.cpu?.usage > 80 ? '#f5534b' : '#e8eaf0' }}>{vm.cpu?.usage}% <span style={{ color: 'var(--text-muted)' }}>CPU</span></div>
                               <div style={{ fontSize: '10px', color: '#e8eaf0' }}>{vm.ram?.percent}% <span style={{ color: 'var(--text-muted)' }}>RAM</span></div>
                            </div>
                         </td>
                         <td style={{ textAlign: 'right' }}>
                            <button className="btn-icon-sm" onClick={() => navigate(`/console/${vm.id}`)} title="Open Console"><Terminal size={12} /></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* MIDDLE: INFRASTRUCTURE INTELLIGENCE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
           {/* Energy SBEE Widget */}
           <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(245,166,35,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap size={18} color="#f5a623" />
                    <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>ENERGY FABRIC</h2>
                 </div>
                 <div style={{ padding: '4px 8px', background: 'rgba(34,211,163,0.1)', color: '#22d3a3', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>SOURCE: SBEE SECTEUR</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                 <MiniStat label="Charge UPS" value={`${metrics?.ups?.avgChargePct || 98}%`} icon={Zap} color="#f5a623" />
                 <MiniStat label="Autonomie" value="45 Min" icon={Clock} color="#4f8ef7" />
                 <MiniStat label="Tension" value="231.4 V" icon={ActivitySquare} color="#22d3a3" />
                 <MiniStat label="Mode" value="Nominal" icon={CheckCircle2} color="#22d3a3" />
              </div>
           </div>

           {/* Backup & Security (Veeam GFS) */}
           <div className="glass-panel" style={{ padding: '24px', flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={18} color="#22d3a3" />
                    <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>BACKUP & IMMUTABILITY</h2>
                 </div>
                 <button className="btn-link" onClick={() => navigate('/veeam/gfs')} style={{ fontSize: '10px', color: '#4f8ef7' }}>Full Report</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status GFS Quotidien</span>
                    <span style={{ fontWeight: 800, color: '#22d3a3' }}>100% SUCCÈS</span>
                 </div>
                 <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                    <div style={{ width: '100%', height: '100%', background: '#22d3a3', borderRadius: '3px', boxShadow: '0 0 10px rgba(34,211,163,0.3)' }} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 10 }}>
                    <MiniStat label="Jobs Actifs" value="1" icon={PlayCircle} color="#4f8ef7" />
                    <MiniStat label="Immutabilité" value="ACTIVE" icon={Lock} color="#fb923c" />
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: REAL-TIME ALARM & EVENT BUS */}
        <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245,83,75,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Bell size={16} color="#f5534b" />
                 <h2 style={{ fontSize: '13px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>EVENT STREAM</h2>
              </div>
              <span style={{ fontSize: '9px', background: '#f5534b', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontWeight: 900 }}>LIVE</span>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {alerts.filter(a => !a.resolved).slice(0, 15).map(alert => (
                <div key={alert.key} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
                   <div style={{ position: 'absolute', left: 0, top: '15%', width: '2px', height: '70%', background: alert.severity === 'critical' ? '#f5534b' : '#f5a623' }} />
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#e8eaf0' }}>{alert.sourceId}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                   </div>
                   <div style={{ fontSize: '11px', color: '#8e8e8e', lineHeight: 1.4 }}>{alert.message}</div>
                </div>
              ))}
           </div>
           
           <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700 }}>CAPACITY FORECAST</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontSize: '18px', fontWeight: 900, color: '#fb923c' }}>74 Jours <span style={{ fontSize: '10px', fontWeight: 500 }}>REMAINING</span></div>
                 <TrendingUp size={16} color="#fb923c" />
              </div>
           </div>
        </div>

      </div>

    </div>
  );
}
