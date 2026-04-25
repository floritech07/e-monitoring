import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Download, Battery, ZapOff, CpuIcon, Router, Wifi, Settings2, List, MoreVertical, Plus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE PREMIUM MONITORING — "ASHRAF EDITION"
 * Reproduction fidèle du dashboard haute-performance avec focus Énergie.
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const MetricCard = ({ label, value, subLabel, trend, trendColor, icon: Icon }) => (
  <div style={{ 
    background: '#121212', 
    borderRadius: '12px', 
    padding: '24px', 
    border: '1px solid #1f1f1f',
    flex: 1,
    position: 'relative'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
       <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
          <Icon size={20} color="#f97316" />
       </div>
       <MoreVertical size={16} color="#444" />
    </div>
    <div style={{ fontSize: '11px', color: '#666', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
       <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>{value}</span>
       <span style={{ fontSize: '11px', color: '#444' }}>{subLabel}</span>
    </div>
    <div style={{ marginTop: 20, fontSize: '11px', color: trendColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
       <div style={{ padding: '2px 6px', background: `${trendColor}15`, borderRadius: '4px' }}>{trend}</div>
       <span style={{ color: '#444' }}>Usage in the Last 24 Hours</span>
    </div>
  </div>
);

const SegmentedBar = ({ value, label, percentColor = "#f97316" }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
       <span>{label}</span>
       <span style={{ color: '#fff' }}>{value}%</span>
    </div>
    <div style={{ display: 'flex', gap: 3 }}>
       {Array.from({length: 20}).map((_, i) => (
          <div key={i} style={{ 
             flex: 1, 
             height: '8px', 
             background: (i < (value/5)) ? percentColor : '#1a1a1a',
             borderRadius: '1px'
          }} />
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

  const powerData = useMemo(() => Array.from({length: 7}, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    secteur: 200 + Math.random()*40,
    ups1: 180 + Math.random()*30,
    ups2: 190 + Math.random()*20,
    gen: 170 + Math.random()*50
  })), []);

  return (
    <div className="fade-in" style={{ 
      padding: '40px', 
      background: '#080808', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0'
    }}>
      
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
           <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: 0 }}>
              Welcome back, <span style={{ color: '#f97316' }}>Ashraf!</span>
           </h1>
           <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 10, fontSize: '12px', color: '#666' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#48bb78' }} />
                 <span style={{ color: '#48bb78', fontWeight: 800 }}>GLOBAL SYSTEM IS ACTIVE</span>
              </div>
              <span>Global uptime stands at <span style={{ color: '#fff' }}>99.93%</span> over the past 24 hours.</span>
           </div>
        </div>
        <div style={{ display: 'flex', gap: 15 }}>
           <button className="btn" style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Plus size={18} /> Add a New Server
           </button>
           <button className="btn" style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '12px 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={18} /> Check Alerts
           </button>
        </div>
      </div>

      {/* ── METRIC CARDS ROW ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
         <MetricCard label="Active Servers List" value="68" subLabel="Server Details" trend="+1 server" trendColor="#48bb78" icon={Server} />
         <MetricCard label="Average CPU Load" value="26%" subLabel="Current Load" trend="-3%" trendColor="#f87171" icon={Activity} />
         <MetricCard label="Memory Usage Stats" value="75%" subLabel="Total Resources" trend="+2% inc." trendColor="#48bb78" icon={Database} />
         <MetricCard label="Network Traffic (TX/RX)" value="2.3" subLabel="Gbps Rate" trend="+0.3 inc." trendColor="#48bb78" icon={Network} />
      </div>

      {/* ── CENTRAL SECTION: POWER GRAPH & RESOURCE CONSUMPTION ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 32, marginBottom: 40 }}>
         
         {/* Power Graph (Main) */}
         <div style={{ background: '#121212', borderRadius: '16px', padding: '32px', border: '1px solid #1f1f1f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Zap size={20} color="#f97316" />
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase' }}>ALIMENTATION ÉNERGÉTIQUE (kW)</h2>
               </div>
               <div style={{ display: 'flex', gap: 15, fontSize: '11px' }}>
                  <div style={{ background: '#1a1a1a', padding: '6px 12px', borderRadius: '6px', color: '#666' }}>Past Week</div>
                  <MoreVertical size={16} color="#444" />
               </div>
            </div>
            <div style={{ height: '350px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={powerData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#444' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#444' }} />
                     <Tooltip contentStyle={{ background: '#121212', border: '1px solid #333', color: '#fff' }} />
                     <Line type="monotone" dataKey="secteur" stroke="#4fd1c5" strokeWidth={3} dot={false} />
                     <Line type="monotone" dataKey="ups1" stroke="#f6ad55" strokeWidth={3} dot={false} />
                     <Line type="monotone" dataKey="ups2" stroke="#b794f4" strokeWidth={3} dot={false} />
                     <Line type="monotone" dataKey="gen" stroke="#68d391" strokeWidth={3} dot={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginTop: 20 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: '#666' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4fd1c5' }} /> SECTEUR</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: '#666' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f6ad55' }} /> UPS 01</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: '#666' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b794f4' }} /> UPS 02</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: '#666' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#68d391' }} /> GÉNÉRATEUR</div>
            </div>
         </div>

         {/* Right Sidebar: Resource Consumption */}
         <div style={{ background: '#121212', borderRadius: '16px', padding: '32px', border: '1px solid #1f1f1f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: '15px', fontWeight: 800, marginBottom: 30 }}>
               <Activity size={18} /> RESOURCE CONSUMPTION
            </div>
            <SegmentedBar label="Processor Load" value={76} percentColor="#f97316" />
            <SegmentedBar label="RAM Usage" value={68} percentColor="#f97316" />
            <SegmentedBar label="Disk Input/Output" value={88} percentColor="#f97316" />
            <SegmentedBar label="Network Transmission" value={56} percentColor="#f97316" />

            {/* Alert Box */}
            <div style={{ marginTop: 40, background: 'rgba(246, 173, 85, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(246, 173, 85, 0.1)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f6ad55', fontSize: '13px', fontWeight: 800, marginBottom: 15 }}>
                  <AlertCircle size={16} /> TWO MINOR ISSUES FOUND
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '11px', color: '#666' }}>
                  <div>• Disk I/O peaked at 03:22 on database servers.</div>
                  <div>• CPU variations observed in Datacenter Cotonou.</div>
               </div>
            </div>
         </div>
      </div>

      {/* ── BOTTOM SECTION: SERVER OVERVIEW TABLE ───────────────────────── */}
      <div style={{ background: '#121212', borderRadius: '16px', padding: '32px', border: '1px solid #1f1f1f' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>SERVER OVERVIEW</h2>
            <div style={{ display: 'flex', gap: 10 }}>
               <div style={{ background: '#1a1a1a', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', color: '#666', border: '1px solid #333' }}>LOCATION</div>
               <div style={{ background: '#1a1a1a', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', color: '#666', border: '1px solid #333' }}>CURRENT STATUS</div>
            </div>
         </div>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ textAlign: 'left', fontSize: '11px', color: '#444', borderBottom: '1px solid #1a1a1a' }}>
                  <th style={{ padding: '15px 10px' }}>SERVER IDENTIFIER</th>
                  <th>LOCATION</th>
                  <th>CURRENT STATUS</th>
                  <th>PROCESSOR</th>
                  <th>MEMORY</th>
                  <th>BANDWIDTH</th>
                  <th style={{ textAlign: 'right' }}>OPERATIONAL TIME</th>
               </tr>
            </thead>
            <tbody>
               {[
                  { id: 'api-prod-01', loc: 'Cotonou - HQ', status: 'OPERATIONAL', statusColor: '#48bb78', cpu: 32, ram: 61, bw: '1.4 Gbps', time: '99.99% Uptime' },
                  { id: 'db-master-01', loc: 'Porto-Novo - DR', status: 'CRITICAL ALERT', statusColor: '#f87171', cpu: 88, ram: 92, bw: '1.2 Gbps', time: '98.40% Uptime' },
                  { id: 'gateway-eu-02', loc: 'Parakou - Branch', status: 'WARNING ALERT', statusColor: '#f6ad55', cpu: 55, ram: 73, bw: '0.8 Gbps', time: '99.28% Uptime' },
                  { id: 'scheduler-ap-03', loc: 'Ouidah - Ops', status: 'OPERATIONAL', statusColor: '#48bb78', cpu: 27, ram: 39, bw: '0.9 Gbps', time: '99.97% Uptime' }
               ].map((server, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1a1a1a', fontSize: '13px' }}>
                     <td style={{ padding: '20px 10px', color: '#fff', fontWeight: 600 }}>{server.id}</td>
                     <td style={{ color: '#666' }}>{server.loc}</td>
                     <td>
                        <div style={{ 
                           display: 'inline-block', 
                           padding: '4px 12px', 
                           borderRadius: '6px', 
                           background: `${server.statusColor}15`, 
                           color: server.statusColor, 
                           fontSize: '10px', 
                           fontWeight: 800,
                           border: `1px solid ${server.statusColor}30`
                        }}>{server.status}</div>
                     </td>
                     <td>
                        <div style={{ width: '100px' }}>
                           <div style={{ display: 'flex', gap: 2 }}>
                              {Array.from({length: 10}).map((_, i) => (
                                 <div key={i} style={{ flex: 1, height: '4px', background: (i < server.cpu/10) ? '#f97316' : '#1a1a1a', borderRadius: '1px' }} />
                              ))}
                           </div>
                        </div>
                     </td>
                     <td>
                        <div style={{ width: '100px' }}>
                           <div style={{ display: 'flex', gap: 2 }}>
                              {Array.from({length: 10}).map((_, i) => (
                                 <div key={i} style={{ flex: 1, height: '4px', background: (i < server.ram/10) ? '#f97316' : '#1a1a1a', borderRadius: '1px' }} />
                              ))}
                           </div>
                        </div>
                     </td>
                     <td style={{ color: '#666' }}>{server.bw}</td>
                     <td style={{ textAlign: 'right', color: '#666' }}>{server.time}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

    </div>
  );
}
