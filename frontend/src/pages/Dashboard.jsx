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
 * SBEE HCI CENTER — PIXEL PERFECT REPRODUCTION
 * Reproduction exacte de l'interface de référence HCI.
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const ProgressBar = ({ label, value, unit, total, color }) => {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8e8e8e', marginBottom: 5 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, background: `${color}20`, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: 6, height: 6, background: color }} />
            </div>
            {label}
         </div>
         <div>{percent.toFixed(2)}% ({value.toFixed(3)}/{total.toFixed(3)} {unit})</div>
      </div>
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
};

const AlarmTab = ({ label, count, color, active, onClick }) => (
  <div onClick={onClick} style={{ 
    padding: '8px 12px', 
    cursor: 'pointer', 
    borderBottom: active ? `2px solid ${color}` : 'none',
    color: active ? '#fff' : '#8e8e8e',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '11px'
  }}>
    <span style={{ color: active ? color : '#8e8e8e' }}>{label}</span>
    <span style={{ color: active ? color : '#8e8e8e', fontWeight: 800 }}>{count}</span>
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
    hostCount: 1, // Default standalone ESXi
    clusterCount: 1,
    storageTotal: 8.0,
    storageUsed: (metrics?.storage?.usedPct || 64) * 0.08,
    cpuTotal: 12.0, // GHz
    cpuUsed: (metrics?.cpu?.usage || 26) * 0.12,
    ramTotal: 64.0, // GB
    ramUsed: (metrics?.ram?.percent || 58) * 0.64
  }), [metrics, vms]);

  const taskData = [
    { name: 'Execution error', value: 5, color: '#f5534b' },
    { name: 'Not executed', value: 0, color: '#545b78' },
    { name: 'Success', value: 11, color: '#22d3a3' },
  ];

  const filteredAlerts = alerts.filter(a => {
    if (alarmFilter === 'all') return true;
    return a.severity === alarmFilter;
  });

  return (
    <div className="fade-in" style={{ 
      background: '#11151c', 
      minHeight: 'calc(100vh - 60px)', 
      display: 'flex', 
      flexDirection: 'column',
      color: '#e8eaf0',
      fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif'
    }}>
      
      {/* ── TOP AREA (HCI MAP) ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: 1, background: 'rgba(255,255,255,0.05)', flex: 1 }}>
        
        {/* Panel Gauche: Allocation */}
        <div style={{ background: '#11151c', padding: '20px' }}>
           <h2 style={{ fontSize: '13px', color: '#8e8e8e', marginBottom: 20 }}>Data Centers</h2>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
              <Building2 size={24} color="#8e8e8e" />
              <div>
                 <div style={{ fontSize: '18px', fontWeight: 700 }}>1</div>
                 <div style={{ fontSize: '10px', color: '#8e8e8e' }}>Data centers</div>
              </div>
           </div>

           <h3 style={{ fontSize: '12px', color: '#8e8e8e', marginBottom: 20, textTransform: 'uppercase' }}>Resource Allocation</h3>
           <ProgressBar label="CPU Alloc..." value={stats.cpuUsed} total={stats.cpuTotal} unit="GHz" color="#4f8ef7" />
           <ProgressBar label="Memory ..." value={stats.ramUsed} total={stats.ramTotal} unit="GB" color="#4f8ef7" />
           <ProgressBar label="Storage C..." value={stats.storageUsed} total={stats.storageTotal} unit="TB" color="#4f8ef7" />

           <h3 style={{ fontSize: '12px', color: '#8e8e8e', marginTop: 30, marginBottom: 20, textTransform: 'uppercase' }}>Virtualization</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Monitor size={20} color="#8e8e8e" />
                 <div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{stats.vmCount}</div>
                    <div style={{ fontSize: '10px', color: '#8e8e8e' }}>VMs</div>
                 </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Server size={20} color="#8e8e8e" />
                 <div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{stats.hostCount}</div>
                    <div style={{ fontSize: '10px', color: '#8e8e8e' }}>Host Machines</div>
                 </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Layers size={20} color="#8e8e8e" />
                 <div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{stats.clusterCount}</div>
                    <div style={{ fontSize: '10px', color: '#8e8e8e' }}>Clusters</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Panel Central: Isometric Visualizer */}
        <div style={{ background: '#141a23', position: 'relative', overflow: 'hidden' }}>
           <div style={{ position: 'absolute', top: 20, left: 20, fontSize: '13px', color: '#8e8e8e' }}>Data Centers</div>
           
           <svg width="100%" height="100%" viewBox="0 0 600 450">
              {/* Grille de perspective */}
              <defs>
                 <pattern id="hciGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                 </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hciGrid)" transform="skewX(-15) scale(1, 0.8) translate(50, 50)" opacity="0.5" />

              {/* STORAGE Node */}
              <g transform="translate(300, 80)">
                 <path d="M0 20 L50 0 L100 20 L50 40 Z" fill="#1a1d27" stroke="#4f8ef7" strokeWidth="1" />
                 <path d="M0 20 L0 70 L50 90 L50 40 Z" fill="#13151c" stroke="#4f8ef7" strokeWidth="1" />
                 <path d="M50 90 L100 70 L100 20 L50 40 Z" fill="#0d0e12" stroke="#4f8ef7" strokeWidth="1" />
                 <text x="50" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">1</text>
                 <text x="50" y="5" textAnchor="middle" fill="#8e8e8e" fontSize="10">Storage</text>
              </g>

              {/* SERVERS Node */}
              <g transform="translate(150, 200)">
                 <path d="M0 20 L40 0 L80 20 L40 40 Z" fill="#1a1d27" stroke="#8e8e8e" strokeWidth="1" />
                 <path d="M0 20 L0 60 L40 80 L40 40 Z" fill="#13151c" stroke="#8e8e8e" strokeWidth="1" />
                 <path d="M40 80 L80 60 L80 20 L40 40 Z" fill="#0d0e12" stroke="#8e8e8e" strokeWidth="1" />
                 <text x="40" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">0</text>
                 <text x="40" y="5" textAnchor="middle" fill="#8e8e8e" fontSize="10">Servers</text>
              </g>

              {/* HCI Node */}
              <g transform="translate(300, 300)">
                 <path d="M0 20 L40 0 L80 20 L40 40 Z" fill="#1a1d27" stroke="#8e8e8e" strokeWidth="1" />
                 <path d="M0 20 L0 60 L40 80 L40 40 Z" fill="#13151c" stroke="#8e8e8e" strokeWidth="1" />
                 <path d="M40 80 L80 60 L80 20 L40 40 Z" fill="#0d0e12" stroke="#8e8e8e" strokeWidth="1" />
                 <text x="40" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">0</text>
                 <text x="40" y="5" textAnchor="middle" fill="#8e8e8e" fontSize="10">HCI</text>
              </g>

              {/* SWITCHES Node */}
              <g transform="translate(450, 200)">
                 <path d="M0 15 L40 0 L80 15 L40 30 Z" fill="#1a1d27" stroke="#8e8e8e" strokeWidth="1" />
                 <path d="M0 15 L0 45 L40 60 L40 30 Z" fill="#13151c" stroke="#8e8e8e" strokeWidth="1" />
                 <path d="M40 60 L80 45 L80 15 L40 30 Z" fill="#0d0e12" stroke="#8e8e8e" strokeWidth="1" />
                 <text x="40" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">0</text>
                 <text x="40" y="5" textAnchor="middle" fill="#8e8e8e" fontSize="10">Switches</text>
              </g>

              {/* Lignes de connexion */}
              <path d="M350 140 L190 220" stroke="rgba(79, 142, 247, 0.2)" strokeWidth="1" />
              <path d="M350 140 L490 220" stroke="rgba(79, 142, 247, 0.2)" strokeWidth="1" />
              <path d="M190 260 L320 320" stroke="rgba(79, 142, 247, 0.2)" strokeWidth="1" />
              <path d="M490 260 L380 320" stroke="rgba(79, 142, 247, 0.2)" strokeWidth="1" />
           </svg>
        </div>

        {/* Panel Droite: Alarmes */}
        <div style={{ background: '#11151c', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '13px', color: '#fff', marginBottom: 15 }}>Alarms</h2>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 10 }}>
                 <AlarmTab label="All" count={alerts.length} color="#4f8ef7" active={alarmFilter === 'all'} onClick={() => setAlarmFilter('all')} />
                 <AlarmTab label="Critical" count={alerts.filter(a => a.severity === 'critical').length} color="#f5534b" active={alarmFilter === 'critical'} onClick={() => setAlarmFilter('critical')} />
                 <AlarmTab label="Major" count={alerts.filter(a => a.severity === 'warning').length} color="#fb923c" active={alarmFilter === 'warning'} onClick={() => setAlarmFilter('warning')} />
                 <AlarmTab label="Minor" count={0} color="#f5a623" active={alarmFilter === 'minor'} onClick={() => setAlarmFilter('minor')} />
                 <AlarmTab label="Info" count={alerts.filter(a => a.severity === 'info').length} color="#38bdf8" active={alarmFilter === 'info'} onClick={() => setAlarmFilter('info')} />
              </div>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
              {filteredAlerts.slice(0, 10).map(alert => (
                 <div key={alert.key} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: alert.severity === 'critical' ? '#f5534b' : '#fb923c' }} />
                          <span style={{ fontSize: '11px', fontWeight: 600 }}>{alert.message}</span>
                       </div>
                       <button className="btn-link" style={{ fontSize: '10px', color: '#4f8ef7' }}>Details</button>
                    </div>
                    <div style={{ fontSize: '9px', color: '#8e8e8e', marginTop: 4 }}>{new Date(alert.timestamp).toLocaleString()}</div>
                 </div>
              ))}
              <div style={{ textAlign: 'center', padding: '15px' }}>
                 <button className="btn-link" style={{ fontSize: '11px', color: '#4f8ef7' }} onClick={() => navigate('/alerts')}>View All</button>
              </div>
           </div>

           <div style={{ padding: '20px', background: 'rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '12px', color: '#8e8e8e', marginBottom: 15 }}>Check Results</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                 <div style={{ fontSize: '10px', color: '#8e8e8e' }}>Ca... 0</div>
                 <div style={{ fontSize: '10px', color: '#8e8e8e' }}>Fa... 0</div>
                 <div style={{ fontSize: '10px', color: '#8e8e8e' }}>Pe... 0</div>
                 <div style={{ fontSize: '10px', color: '#8e8e8e' }}>Co... 0</div>
                 <div style={{ fontSize: '10px', color: '#8e8e8e' }}>O... 0</div>
              </div>
           </div>
        </div>
      </div>

      {/* ── BOTTOM AREA ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.05)', height: '200px' }}>
        
        {/* Status */}
        <div style={{ background: '#11151c', padding: '20px' }}>
           <h2 style={{ fontSize: '12px', color: '#8e8e8e', marginBottom: 20 }}>Status</h2>
           <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Monitor size={16} color="#4f8ef7" />
                    <span style={{ fontSize: '11px' }}>VMs {stats.vmCount}</span>
                 </div>
                 <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ flex: 1, height: 4, background: '#22d3a3' }} />
                    <div style={{ flex: 1, height: 4, background: '#f5534b' }} />
                    <div style={{ flex: 1, height: 4, background: '#545b78' }} />
                 </div>
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Server size={16} color="#4f8ef7" />
                    <span style={{ fontSize: '11px' }}>Host Machines {stats.hostCount}</span>
                 </div>
                 <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ flex: 1, height: 4, background: '#22d3a3' }} />
                 </div>
              </div>
           </div>
        </div>

        {/* Health Check */}
        <div style={{ background: '#11151c', padding: '20px' }}>
           <h2 style={{ fontSize: '12px', color: '#8e8e8e', marginBottom: 20 }}>Health Check</h2>
           <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
              <div>
                 <div style={{ fontSize: '18px', fontWeight: 700 }}>1 <span style={{ fontSize: '10px', color: '#8e8e8e', fontWeight: 400 }}>Items</span></div>
                 <div style={{ fontSize: '9px', color: '#f5534b' }}>Poor (0 to 79)</div>
              </div>
              <div>
                 <div style={{ fontSize: '18px', fontWeight: 700 }}>1 <span style={{ fontSize: '10px', color: '#8e8e8e', fontWeight: 400 }}>Items</span></div>
                 <div style={{ fontSize: '9px', color: '#fb923c' }}>Fair (80 to 94)</div>
              </div>
              <div>
                 <div style={{ fontSize: '18px', fontWeight: 700 }}>0 <span style={{ fontSize: '10px', color: '#8e8e8e', fontWeight: 400 }}>Items</span></div>
                 <div style={{ fontSize: '9px', color: '#22d3a3' }}>Good (95 to 100)</div>
              </div>
           </div>
           <div style={{ fontSize: '9px', color: '#8e8e8e', marginTop: 15 }}>Bottom 5 Health Scores</div>
        </div>

        {/* Tasks */}
        <div style={{ background: '#11151c', padding: '20px', display: 'flex', gap: 20 }}>
           <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '12px', color: '#8e8e8e', marginBottom: 15 }}>Tasks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       <div style={{ width: 8, height: 8, background: '#f5534b' }} /> Execution error
                    </div>
                    <span style={{ fontWeight: 700 }}>5</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       <div style={{ width: 8, height: 8, background: '#545b78' }} /> Not executed
                    </div>
                    <span style={{ fontWeight: 700 }}>0</span>
                 </div>
              </div>
           </div>
           <div style={{ width: 100, height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={taskData} innerRadius={35} outerRadius={45} paddingAngle={2} dataKey="value">
                       {taskData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', marginTop: -65, fontSize: '16px', fontWeight: 800 }}>11</div>
           </div>
        </div>

      </div>

    </div>
  );
}
