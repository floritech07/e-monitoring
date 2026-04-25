import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Building2, ArrowUpRight, Gauge, Lock, Globe, CpuIcon,
  Circle
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { api } from '../api';

/**
 * SBEE HCI CENTER — HIGH-FIDELITY PRESTIGE VERSION
 * Focus sur l'esthétique, la profondeur et l'expérience utilisateur premium.
 */

// ── UI COMPONENTS — PRESTIGE STYLE ─────────────────────────────────────────

const ProgressBar = ({ label, value, unit, total, color }) => {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a0aec0', marginBottom: 6, fontWeight: 500 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14, background: `${color}10`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30` }}>
               <div style={{ width: 6, height: 6, background: color, boxShadow: `0 0 8px ${color}` }} />
            </div>
            <span style={{ letterSpacing: '0.5px' }}>{label}</span>
         </div>
         <div style={{ color: '#fff', fontWeight: 700 }}>{percent.toFixed(2)}% <span style={{ color: '#4a5568', fontWeight: 400, fontSize: '10px' }}>({value.toFixed(1)}/{total.toFixed(1)} {unit})</span></div>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
         <div style={{ 
           width: `${percent}%`, 
           height: '100%', 
           background: `linear-gradient(90deg, ${color}, ${color}dd)`, 
           borderRadius: '2px',
           boxShadow: `0 0 10px ${color}44`
         }} />
      </div>
    </div>
  );
};

const AlarmTab = ({ label, count, color, active, onClick }) => (
  <div onClick={onClick} style={{ 
    padding: '10px 16px', 
    cursor: 'pointer', 
    borderBottom: `2px solid ${active ? color : 'transparent'}`,
    background: active ? `${color}08` : 'transparent',
    color: active ? '#fff' : '#718096',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '11px',
    fontWeight: active ? 700 : 500,
    transition: 'all 0.2s ease',
    borderRadius: '4px 4px 0 0'
  }}>
    <span>{label}</span>
    <span style={{ 
      background: active ? color : 'rgba(255,255,255,0.05)', 
      color: active ? '#fff' : '#718096',
      padding: '1px 6px',
      borderRadius: '10px',
      fontSize: '10px'
    }}>{count}</span>
  </div>
);

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [env, setEnv] = useState(null);
  const [alarmFilter, setAlarmFilter] = useState('all');

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  const stats = useMemo(() => ({
    vmCount: vms.length,
    hostCount: 1,
    clusterCount: 1,
    storageTotal: 8.0,
    storageUsed: (metrics?.storage?.usedPct || 64) * 0.08,
    cpuTotal: 12.0,
    cpuUsed: (metrics?.cpu?.usage || 26) * 0.12,
    ramTotal: 64.0,
    ramUsed: (metrics?.ram?.percent || 58) * 0.64
  }), [metrics, vms]);

  const taskData = [
    { name: 'Execution error', value: 5, color: '#f56565' },
    { name: 'Not executed', value: 0, color: '#4a5568' },
    { name: 'Success', value: 11, color: '#48bb78' },
  ];

  const filteredAlerts = alerts.filter(a => {
    if (alarmFilter === 'all') return true;
    return a.severity === alarmFilter;
  });

  return (
    <div className="fade-in" style={{ 
      background: '#0d1117', 
      minHeight: 'calc(100vh - 60px)', 
      display: 'flex', 
      flexDirection: 'column',
      color: '#cbd5e0',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      
      {/* ── TOP SECTION: HCI PERSPECTIVE SCENE ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 360px', gap: 2, background: 'rgba(255,255,255,0.03)', flex: 1 }}>
        
        {/* Panneau Gauche: Navigation & Allocation */}
        <div style={{ background: '#0d1117', padding: '24px', borderRight: '1px solid rgba(255,255,255,0.02)' }}>
           <h2 style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px' }}>Data Centers</h2>
           <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40, padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div style={{ background: 'linear-gradient(135deg, #2a4365 0%, #1a365d 100%)', padding: '10px', borderRadius: '8px' }}>
                 <Building2 size={24} color="#63b3ed" />
              </div>
              <div>
                 <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>1</div>
                 <div style={{ fontSize: '10px', color: '#718096', fontWeight: 600 }}>Data centers</div>
              </div>
           </div>

           <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px' }}>Resource Allocation</h3>
           <ProgressBar label="CPU Allocation" value={stats.cpuUsed} total={stats.cpuTotal} unit="GHz" color="#3182ce" />
           <ProgressBar label="Memory Allocation" value={stats.ramUsed} total={stats.ramTotal} unit="GB" color="#3182ce" />
           <ProgressBar label="Storage Capacity" value={stats.storageUsed} total={stats.storageTotal} unit="TB" color="#3182ce" />

           <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', marginTop: 40, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px' }}>Virtualization</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { icon: Monitor, label: 'VMs', value: stats.vmCount },
                { icon: Server, label: 'Hosts', value: stats.hostCount },
                { icon: Layers, label: 'Clusters', value: stats.clusterCount }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                   <item.icon size={18} color="#4a5568" />
                   <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{item.value}</div>
                      <div style={{ fontSize: '9px', color: '#718096', fontWeight: 600 }}>{item.label}</div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Panneau Central: Scene Isométrique immersive */}
        <div style={{ 
          background: 'radial-gradient(circle at center, #1a202c 0%, #0d1117 100%)', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
           <div style={{ position: 'absolute', top: 24, left: 24, fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>Infrastructure View</div>
           
           <svg width="100%" height="100%" viewBox="0 0 600 450" style={{ filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))' }}>
              {/* Perspective Grid */}
              <defs>
                 <pattern id="prestigeGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(79, 142, 247, 0.05)" strokeWidth="1"/>
                 </pattern>
                 <linearGradient id="nodeTop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2c5282" />
                    <stop offset="100%" stopColor="#1a365d" />
                 </linearGradient>
                 <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                 </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#prestigeGrid)" transform="skewX(-15) scale(1, 0.8) translate(50, 50)" opacity="0.4" />

              {/* STORAGE Node */}
              <g transform="translate(300, 80)">
                 <ellipse cx="50" cy="50" rx="60" ry="30" fill="rgba(49, 130, 206, 0.1)" filter="url(#glow)" />
                 <path d="M0 20 L50 0 L100 20 L50 40 Z" fill="url(#nodeTop)" stroke="#63b3ed" strokeWidth="1" />
                 <path d="M0 20 L0 70 L50 90 L50 40 Z" fill="#171923" stroke="#2a4365" strokeWidth="1" />
                 <path d="M50 90 L100 70 L100 20 L50 40 Z" fill="#101116" stroke="#2a4365" strokeWidth="1" />
                 <text x="50" y="-15" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900" filter="url(#glow)">1</text>
                 <text x="50" y="5" textAnchor="middle" fill="#63b3ed" fontSize="10" fontWeight="700">STORAGE</text>
              </g>

              {/* SERVERS Node */}
              <g transform="translate(120, 200)">
                 <path d="M0 20 L45 0 L90 20 L45 40 Z" fill="#2d3748" stroke="#4a5568" strokeWidth="1" />
                 <path d="M0 20 L0 65 L45 85 L45 40 Z" fill="#1a202c" stroke="#2d3748" strokeWidth="1" />
                 <path d="M45 85 L90 65 L90 20 L45 40 Z" fill="#101116" stroke="#2d3748" strokeWidth="1" />
                 <text x="45" y="-15" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900">0</text>
                 <text x="45" y="5" textAnchor="middle" fill="#a0aec0" fontSize="10" fontWeight="700">SERVERS</text>
              </g>

              {/* HCI Node */}
              <g transform="translate(300, 310)">
                 <path d="M0 20 L45 0 L90 20 L45 40 Z" fill="#2d3748" stroke="#4a5568" strokeWidth="1" />
                 <path d="M0 20 L0 65 L45 85 L45 40 Z" fill="#1a202c" stroke="#2d3748" strokeWidth="1" />
                 <path d="M45 85 L90 65 L90 20 L45 40 Z" fill="#101116" stroke="#2d3748" strokeWidth="1" />
                 <text x="45" y="-15" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900">0</text>
                 <text x="45" y="5" textAnchor="middle" fill="#a0aec0" fontSize="10" fontWeight="700">HCI</text>
              </g>

              {/* SWITCHES Node */}
              <g transform="translate(480, 200)">
                 <path d="M0 20 L45 0 L90 20 L45 40 Z" fill="#2d3748" stroke="#4a5568" strokeWidth="1" />
                 <path d="M0 20 L0 65 L45 85 L45 40 Z" fill="#1a202c" stroke="#2d3748" strokeWidth="1" />
                 <path d="M45 85 L90 65 L90 20 L45 40 Z" fill="#101116" stroke="#2d3748" strokeWidth="1" />
                 <text x="45" y="-15" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900">0</text>
                 <text x="45" y="5" textAnchor="middle" fill="#a0aec0" fontSize="10" fontWeight="700">SWITCHES</text>
              </g>

              {/* Connecting Glow Lines */}
              <path d="M350 140 L210 220" stroke="rgba(99, 179, 237, 0.15)" strokeWidth="1.5" strokeDasharray="4,4" />
              <path d="M350 140 L520 220" stroke="rgba(99, 179, 237, 0.15)" strokeWidth="1.5" strokeDasharray="4,4" />
           </svg>
        </div>

        {/* Panneau Droite: Alarms & Check */}
        <div style={{ background: '#0d1117', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.02)' }}>
           <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: 20 }}>Alarms</h2>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 15 }}>
                 <AlarmTab label="All" count={alerts.length} color="#3182ce" active={alarmFilter === 'all'} onClick={() => setAlarmFilter('all')} />
                 <AlarmTab label="Critical" count={alerts.filter(a => a.severity === 'critical').length} color="#e53e3e" active={alarmFilter === 'critical'} onClick={() => setAlarmFilter('critical')} />
                 <AlarmTab label="Major" count={alerts.filter(a => a.severity === 'warning').length} color="#dd6b20" active={alarmFilter === 'warning'} onClick={() => setAlarmFilter('warning')} />
              </div>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
              {filteredAlerts.slice(0, 12).map(alert => (
                 <div key={alert.key} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: alert.severity === 'critical' ? '#e53e3e' : '#dd6b20', boxShadow: `0 0 10px ${alert.severity === 'critical' ? '#e53e3e' : '#dd6b20'}55` }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>{alert.sourceId}</span>
                       </div>
                       <ArrowRight size={12} color="#4a5568" />
                    </div>
                    <div style={{ fontSize: '11px', color: '#718096', lineHeight: 1.4 }}>{alert.message}</div>
                    <div style={{ fontSize: '9px', color: '#4a5568', marginTop: 8, fontWeight: 700 }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                 </div>
              ))}
           </div>

           <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', marginBottom: 15, textTransform: 'uppercase' }}>Check Results</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                 {['Ca.. 0', 'Fa.. 0', 'Pe.. 0', 'Co.. 0', 'O.. 0'].map((txt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', color: '#718096' }}>
                       <div style={{ width: 6, height: 6, borderRadius: '50%', background: i===1 ? '#e53e3e' : '#3182ce' }} /> {txt}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: OPERATIONAL STATUS & TASKS ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.03)', height: '220px' }}>
        
        {/* Module Status */}
        <div style={{ background: '#0d1117', padding: '24px' }}>
           <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: 24 }}>Status</h2>
           <div style={{ display: 'flex', gap: 30 }}>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <Monitor size={16} color="#3182ce" />
                       <span style={{ fontSize: '12px', fontWeight: 600 }}>VMs {stats.vmCount}</span>
                    </div>
                 </div>
                 <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '80%', background: '#48bb78' }} />
                    <div style={{ width: '15%', background: '#f56565' }} />
                    <div style={{ width: '5%', background: '#4a5568' }} />
                 </div>
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <Server size={16} color="#3182ce" />
                       <span style={{ fontSize: '12px', fontWeight: 600 }}>Hosts {stats.hostCount}</span>
                    </div>
                 </div>
                 <div style={{ display: 'flex', height: '6px', borderRadius: '3px', background: '#48bb78' }} />
              </div>
           </div>
        </div>

        {/* Module Health Check */}
        <div style={{ background: '#0d1117', padding: '24px', borderLeft: '1px solid rgba(255,255,255,0.02)' }}>
           <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: 24 }}>Health Check</h2>
           <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
              <div>
                 <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>1</div>
                 <div style={{ fontSize: '9px', color: '#f56565', fontWeight: 700, marginTop: 4 }}>POOR (0-79)</div>
              </div>
              <div>
                 <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>1</div>
                 <div style={{ fontSize: '9px', color: '#ed8936', fontWeight: 700, marginTop: 4 }}>FAIR (80-94)</div>
              </div>
              <div>
                 <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>0</div>
                 <div style={{ fontSize: '9px', color: '#48bb78', fontWeight: 700, marginTop: 4 }}>GOOD (95-100)</div>
              </div>
           </div>
        </div>

        {/* Module Tasks */}
        <div style={{ background: '#0d1117', padding: '24px', borderLeft: '1px solid rgba(255,255,255,0.02)', display: 'flex', gap: 20 }}>
           <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: 20 }}>Tasks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 8, height: 8, background: '#f56565', borderRadius: '2px' }} /> Execution error
                    </div>
                    <span style={{ fontWeight: 800 }}>5</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 8, height: 8, background: '#4a5568', borderRadius: '2px' }} /> Not executed
                    </div>
                    <span style={{ fontWeight: 800 }}>0</span>
                 </div>
              </div>
           </div>
           <div style={{ width: 110, height: 110, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={taskData} innerRadius={38} outerRadius={50} paddingAngle={3} dataKey="value" stroke="none">
                       {taskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#fff' }}>11</div>
           </div>
        </div>

      </div>

    </div>
  );
}
