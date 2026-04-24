import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { api } from '../api';

/**
 * NEXUS COMMAND CENTER — HCI VISION
 * Inspiré du design industriel haute-fidélité.
 */

// ── COMPOSANTS INTERNES ──────────────────────────────────────────────────────

function ResourceBar({ label, value, unit, total, color }) {
  const percent = Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
        <span>{label}</span>
        <span>{percent.toFixed(2)}% ({value}{unit}/{total}{unit})</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: color, boxShadow: `0 0 10px ${color}66` }} />
      </div>
    </div>
  );
}

function StatGroup({ icon: Icon, label, value, subLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <div style={{ color: 'var(--text-muted)' }}><Icon size={16} /></div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#e8eaf0', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [activeAlarmTab, setActiveAlarmTab] = useState('all');

  // Calculs de stats
  const cpuAlloc = metrics?.cpu?.usage || 0;
  const memAlloc = metrics?.ram?.percent || 0;
  const storageAlloc = metrics?.storage?.usedPct || 64;

  const criticalAlerts = alerts.filter(a => !a.resolved && a.severity === 'critical');
  const majorAlerts = alerts.filter(a => !a.resolved && a.severity === 'warning');

  const taskData = [
    { name: 'Execution error', value: 5, color: '#f5534b' },
    { name: 'Not executed', value: 11, color: '#545b78' },
    { name: 'Running', value: 3, color: '#4f8ef7' },
  ];

  return (
    <div className="fade-in" style={{ padding: '20px', background: '#0d0e12', minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* ── TOP SECTION: MAIN HCI VIEW ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, height: 500 }}>
        
        {/* Panneau Central Isométrique */}
        <div className="card glass-panel" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', padding: 0, overflow: 'hidden' }}>
          
          {/* Sidebar Gauche: Ressources & Virtualisation */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: 24, background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e8e', marginBottom: 16 }}>Data Centers</div>
              <StatGroup icon={Building2} label="Data centers" value="1" />
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e8e', marginBottom: 16 }}>Resource Allocation</div>
              <ResourceBar label="CPU Alloc..." value={(cpuAlloc * 0.12).toFixed(2)} total="12.00" unit=" GHz" color="#4f8ef7" />
              <ResourceBar label="Memory..." value={(memAlloc * 0.64).toFixed(2)} total="64.00" unit=" GB" color="#a78bfa" />
              <ResourceBar label="Storage C..." value={(storageAlloc * 0.8).toFixed(2)} total="8.00" unit=" TB" color="#fb923c" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e8e', marginBottom: 16 }}>Virtualization</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <StatGroup icon={Monitor} label="VMs" value={vms.length} />
                <StatGroup icon={Server} label="Host Machines" value="1" />
                <StatGroup icon={Layers} label="Clusters" value="1" />
              </div>
            </div>
          </div>

          {/* Centre: Isometric Infrastructure View */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1a1d27 0%, #0d0e12 100%)' }}>
             {/* Grille de perspective */}
             <div style={{ 
               position: 'absolute', width: '200%', height: '200%', 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
               backgroundSize: '100px 100px', transform: 'rotateX(60deg) rotateZ(45deg)', top: '-50%', left: '-50%'
             }} />

             {/* Éléments Isométriques (Simulation avec SVG) */}
             <svg width="600" height="400" viewBox="0 0 600 400" style={{ position: 'relative', zIndex: 2 }}>
                {/* Storage node */}
                <g transform="translate(300, 100)">
                  <path d="M0 20 L40 0 L80 20 L40 40 Z" fill="#1a1d27" stroke="#4f8ef7" strokeWidth="1" />
                  <path d="M0 20 L0 60 L40 80 L40 40 Z" fill="#13151c" stroke="#4f8ef7" strokeWidth="1" />
                  <path d="M40 80 L80 60 L80 20 L40 40 Z" fill="#0d0e12" stroke="#4f8ef7" strokeWidth="1" />
                  <text x="40" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">1</text>
                  <text x="40" y="100" textAnchor="middle" fill="#8e8e8e" fontSize="10" fontWeight="700">Storage</text>
                  {/* Glow effect */}
                  <rect x="10" y="25" width="60" height="2" fill="#4f8ef7" opacity="0.5" />
                  <rect x="10" y="35" width="60" height="2" fill="#4f8ef7" opacity="0.3" />
                </g>

                {/* Servers node */}
                <g transform="translate(150, 200)">
                  <path d="M0 20 L40 0 L80 20 L40 40 Z" fill="#1a1d27" stroke="#e8eaf0" strokeWidth="1" />
                  <path d="M0 20 L0 60 L40 80 L40 40 Z" fill="#13151c" stroke="#e8eaf0" strokeWidth="1" />
                  <path d="M40 80 L80 60 L80 20 L40 40 Z" fill="#0d0e12" stroke="#e8eaf0" strokeWidth="1" />
                  <text x="40" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">{vms.filter(v => v.state==='on').length}</text>
                  <text x="40" y="100" textAnchor="middle" fill="#8e8e8e" fontSize="10" fontWeight="700">Servers</text>
                </g>

                {/* Network node */}
                <g transform="translate(450, 200)">
                  <path d="M0 20 L40 0 L80 20 L40 40 Z" fill="#1a1d27" stroke="#545b78" strokeWidth="1" />
                  <path d="M0 20 L0 60 L40 80 L40 40 Z" fill="#13151c" stroke="#545b78" strokeWidth="1" />
                  <path d="M40 80 L80 60 L80 20 L40 40 Z" fill="#0d0e12" stroke="#545b78" strokeWidth="1" />
                  <text x="40" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">0</text>
                  <text x="40" y="100" textAnchor="middle" fill="#8e8e8e" fontSize="10" fontWeight="700">Switches</text>
                </g>

                {/* HCI node */}
                <g transform="translate(300, 280)">
                  <path d="M0 20 L40 0 L80 20 L40 40 Z" fill="#1a1d27" stroke="#8e8e8e" strokeWidth="1" />
                  <path d="M0 20 L0 60 L40 80 L40 40 Z" fill="#13151c" stroke="#8e8e8e" strokeWidth="1" />
                  <path d="M40 80 L80 60 L80 20 L40 40 Z" fill="#0d0e12" stroke="#8e8e8e" strokeWidth="1" />
                  <text x="40" y="-10" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">0</text>
                  <text x="40" y="100" textAnchor="middle" fill="#8e8e8e" fontSize="10" fontWeight="700">HCI</text>
                </g>
             </svg>
          </div>
        </div>

        {/* Panneau Droite: Alarms */}
        <div className="card glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', marginBottom: 12 }}>Alarms</div>
            <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               {['all', 'critical', 'major', 'minor', 'info'].map(tab => (
                 <div 
                   key={tab} 
                   onClick={() => setActiveAlarmTab(tab)}
                   style={{ 
                     padding: '8px 0', fontSize: 11, cursor: 'pointer',
                     borderBottom: activeAlarmTab === tab ? '2px solid #4f8ef7' : '2px solid transparent',
                     color: activeAlarmTab === tab ? '#e8eaf0' : '#8e8e8e',
                     fontWeight: activeAlarmTab === tab ? 700 : 500,
                     textTransform: 'capitalize'
                   }}
                 >
                   {tab === 'all' ? `All ${alerts.length}` : tab}
                 </div>
               ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
            {alerts.slice(0, 6).map(alert => (
              <div key={alert.key} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                 <div style={{ marginTop: 4, width: 6, height: 6, borderRadius: '50%', background: alert.severity === 'critical' ? '#f5534b' : '#f5a623', flexShrink: 0 }} />
                 <div style={{ flex: 1 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ fontSize: 11, fontWeight: 700, color: '#e8eaf0' }}>{alert.message}</div>
                     <ChevronRight size={12} color="#8e8e8e" />
                   </div>
                   <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                     {new Date(alert.timestamp).toLocaleString()}
                   </div>
                 </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: 10 }}>
               <button className="btn-link" style={{ fontSize: 11, color: '#4f8ef7', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/alerts')}>View All</button>
            </div>
          </div>
          
          <div style={{ padding: 20, background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8e8e', marginBottom: 16 }}>Check Results</div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <CheckCircle2 size={14} color="#22d3a3" />
                   <span style={{ fontSize: 12, fontWeight: 800 }}>0</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <AlertCircle size={14} color="#f5534b" />
                   <span style={{ fontSize: 12, fontWeight: 800 }}>0</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <TrendingUp size={14} color="#4f8ef7" />
                   <span style={{ fontSize: 12, fontWeight: 800 }}>0</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: STATUS, HEALTH, TASKS ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, height: 260 }}>
        
        {/* Panel 1: Status */}
        <div className="card glass-panel">
           <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e8e', marginBottom: 20 }}>Status</div>
           <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
             <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                   <Monitor size={18} color="#4f8ef7" />
                   <span style={{ fontSize: 11, color: '#8e8e8e' }}>VMs {vms.length}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{vms.filter(v => v.state==='on').length} / {vms.length}</div>
             </div>
             <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                   <Server size={18} color="#4f8ef7" />
                   <span style={{ fontSize: 11, color: '#8e8e8e' }}>Host Machines 1</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>1 / 1</div>
             </div>
           </div>
        </div>

        {/* Panel 2: Health Check */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e8e', marginBottom: 20 }}>Health Check</div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center', marginBottom: 24 }}>
             <div>
               <div style={{ fontSize: 20, fontWeight: 900 }}>1<span style={{ fontSize: 10, color: '#8e8e8e', marginLeft: 4 }}>Items</span></div>
               <div style={{ fontSize: 10, color: '#f5534b', fontWeight: 700, marginTop: 4 }}>Poor (0 to 79)</div>
             </div>
             <div>
               <div style={{ fontSize: 20, fontWeight: 900 }}>1<span style={{ fontSize: 10, color: '#8e8e8e', marginLeft: 4 }}>Items</span></div>
               <div style={{ fontSize: 10, color: '#f5a623', fontWeight: 700, marginTop: 4 }}>Fair (80 to 94)</div>
             </div>
             <div>
               <div style={{ fontSize: 20, fontWeight: 900 }}>0<span style={{ fontSize: 10, color: '#8e8e8e', marginLeft: 4 }}>Items</span></div>
               <div style={{ fontSize: 10, color: '#22d3a3', fontWeight: 700, marginTop: 4 }}>Good (95 to 100)</div>
             </div>
           </div>
           <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden' }}>
             <div style={{ flex: 1, background: '#f5534b' }} />
             <div style={{ flex: 1, background: '#f5a623' }} />
             <div style={{ flex: 3, background: '#13151c' }} />
           </div>
           <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>Bottom 5 Health Scores</div>
        </div>

        {/* Panel 3: Tasks */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e8e', marginBottom: 12 }}>Tasks</div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', flex: 1, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {taskData.map(t => (
                   <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <div style={{ width: 8, height: 8, background: t.color, borderRadius: 2 }} />
                     <span style={{ fontSize: 11, fontWeight: 700, color: '#e8eaf0' }}>{t.value}</span>
                     <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.name}</span>
                   </div>
                 ))}
              </div>
              <div style={{ height: 120 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={taskData} 
                        innerRadius={35} 
                        outerRadius={50} 
                        paddingAngle={5} 
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {taskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="20" fontWeight="900">
                        19
                      </text>
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
}
