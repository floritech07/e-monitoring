import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Search, Filter, Download, Calendar, MoreHorizontal
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE MONITORING — LIGHT MODERN DASHBOARD
 * Style SaaS propre, aéré et convivial.
 */

// ── UI COMPONENTS — LIGHT STYLE ────────────────────────────────────────────

const HeaderTab = ({ label, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      padding: '10px 0', 
      marginRight: '32px', 
      cursor: 'pointer', 
      color: active ? '#1a202c' : '#a0aec0', 
      fontWeight: active ? 700 : 500,
      fontSize: '14px',
      borderBottom: active ? '3px solid #3182ce' : '3px solid transparent',
      transition: 'all 0.2s'
    }}
  >
    {label}
  </div>
);

const Card = ({ title, children, style = {}, headerRight }) => (
  <div style={{ 
    background: '#fff', 
    borderRadius: '16px', 
    padding: '24px', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #edf2f7',
    display: 'flex',
    flexDirection: 'column',
    ...style 
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2d3748', margin: 0 }}>{title}</h3>
      {headerRight}
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Datacenter');
  const [env, setEnv] = useState(null);

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  const COLORS = ['#3182ce', '#38bdf8', '#48bb78', '#f6ad55', '#f56565'];

  return (
    <div className="fade-in" style={{ 
      padding: '32px', 
      background: '#f7fafc', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#1a202c'
    }}>
      
      {/* ── TOP NAVIGATION ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a202c', margin: 0 }}>Monitoring</h1>
           <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn" style={{ background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
                 <Calendar size={16} /> Feb 1 - Feb 28 <ChevronRight size={14} />
              </button>
              <button className="btn" style={{ background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
                 Download <ChevronRight size={14} />
              </button>
           </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
           <HeaderTab label="Datacenter" active={activeTab === 'Datacenter'} onClick={() => setActiveTab('Datacenter')} />
           <HeaderTab label="Energie" active={activeTab === 'Energie'} onClick={() => setActiveTab('Energie')} />
           <HeaderTab label="Serveurs" active={activeTab === 'Serveurs'} onClick={() => setActiveTab('Serveurs')} />
           <HeaderTab label="Réseau" active={activeTab === 'Réseau'} onClick={() => setActiveTab('Réseau')} />
        </div>
      </div>

      {/* ── GRID LAYOUT ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 24 }}>
        
        {/* Card 1: Global Health (Santé Système) */}
        <Card title="Santé Système" style={{ background: '#1a202c' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#fff' }}>98%</div>
              <div style={{ background: 'rgba(72, 187, 120, 0.2)', color: '#48bb78', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>Good</div>
           </div>
           <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: 24 }}>1.5% Better than last month</p>
           
           <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: 32, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: '98%', height: '100%', background: '#48bb78' }} />
              <div style={{ position: 'absolute', right: '2%', top: 0, width: '2px', height: '100%', background: '#f56565' }} />
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                 <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{vms.length} VMs</div>
                 <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Total Virtualisation</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                 <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>1 Host</div>
                 <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>ESXi Standalone</div>
              </div>
           </div>
        </Card>

        {/* Card 2: Resource Trends (Télémétrie) */}
        <Card title="Télémétrie SI" headerRight={
           <div style={{ display: 'flex', gap: 12, fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: '#3182ce' }}>● CPU</span>
              <span style={{ color: '#48bb78' }}>● RAM</span>
              <span style={{ color: '#f6ad55' }}>● Storage</span>
           </div>
        }>
           <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={Array.from({length: 20}, (_, i) => ({
                    t: i,
                    cpu: 40 + Math.sin(i/2)*20 + Math.random()*5,
                    ram: 60 + Math.cos(i/3)*10 + Math.random()*5,
                    storage: 64
                 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a0aec0' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="cpu" stroke="#3182ce" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="ram" stroke="#48bb78" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="storage" stroke="#f6ad55" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        
        {/* Card 3: Distribution (Ressources) */}
        <Card title="Allocation Ressources">
           <div style={{ height: '180px', display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={[
                       { name: 'Libre', value: 36 },
                       { name: 'Occupé', value: 64 }
                    ]} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                       <Cell fill="#edf2f7" />
                       <Cell fill="#3182ce" />
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', marginLeft: -120, zIndex: 1 }}>
                 <div style={{ fontSize: '24px', fontWeight: 800 }}>64%</div>
                 <div style={{ fontSize: '10px', color: '#a0aec0' }}>Utilisé</div>
              </div>
           </div>
           <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 8 }}>
                 <span style={{ color: '#4a5568' }}>Stockage SAN</span>
                 <span style={{ fontWeight: 700 }}>5.1 TB / 8.0 TB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                 <span style={{ color: '#4a5568' }}>Température DC</span>
                 <span style={{ fontWeight: 700 }}>{env?.avgTempC || 23.4}°C</span>
              </div>
           </div>
        </Card>

        {/* Card 4: Top Servers (Production) */}
        <Card title="Serveurs Critiques" headerRight={<button className="btn-link" style={{ fontSize: '12px', color: '#3182ce' }}>View all</button>}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {vms.slice(0, 4).map((vm, i) => (
                 <div key={vm.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 8 }}>
                       <span style={{ color: '#4a5568', fontWeight: 600 }}>{vm.name}</span>
                       <span style={{ fontSize: '11px', color: '#a0aec0' }}>{vm.cpu?.usage}% CPU</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ width: `${vm.cpu?.usage}%`, height: '100%', background: '#3182ce' }} />
                    </div>
                 </div>
              ))}
           </div>
        </Card>

        {/* Card 5: Latest Alerts (Alarmes) */}
        <Card title="Dernières Alarmes" headerRight={<button className="btn-link" style={{ fontSize: '12px', color: '#3182ce' }}>View all</button>}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.filter(a => !a.resolved).slice(0, 3).map(alert => (
                 <div key={alert.key} style={{ display: 'flex', gap: 12, padding: '12px', background: alert.severity === 'critical' ? '#fff5f5' : '#fffaf0', borderRadius: '12px', cursor: 'pointer' }}>
                    <div style={{ marginTop: 2 }}>
                       {alert.severity === 'critical' ? <AlertTriangle size={16} color="#f56565" /> : <Info size={16} color="#f6ad55" />}
                    </div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '13px', fontWeight: 700, color: '#2d3748' }}>{alert.sourceId}</div>
                       <div style={{ fontSize: '11px', color: '#718096', margin: '4px 0' }}>{alert.message}</div>
                       <div style={{ fontSize: '10px', color: '#a0aec0' }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <ChevronRight size={14} color="#cbd5e0" style={{ alignSelf: 'center' }} />
                 </div>
              ))}
           </div>
        </Card>

      </div>

    </div>
  );
}
