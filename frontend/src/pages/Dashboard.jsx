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
 * SBEE ULTIMATE 3D HYPERVISOR
 * Fusion du design Platinum, des détails vCenter et d'une scène isométrique 3D.
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const ResourceBlock = ({ label, free, used, total, unit, color }) => {
  const percent = total > 0 ? (used / total) * 100 : 0;
  return (
    <div style={{ 
      background: 'rgba(30, 41, 59, 0.4)', 
      borderRadius: '8px', 
      padding: '24px', 
      border: '1px solid rgba(255, 255, 255, 0.05)',
      flex: 1 
    }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: 15, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 300, color: '#fff', marginBottom: 15 }}>
         {free} <span style={{ fontSize: '16px', color: '#64748b' }}>{unit} libres</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', marginBottom: 10, overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: color, boxShadow: `0 0 10px ${color}44` }} />
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{used} {unit} utilisés | {total} {unit} au total</div>
    </div>
  );
};

const ServerRack = ({ x, y, active }) => (
  <g transform={`translate(${x}, ${y})`}>
     <ellipse cx="40" cy="70" rx="35" ry="15" fill="rgba(0,0,0,0.3)" />
     <path d="M0 20 L40 0 L80 20 L40 40 Z" fill={active ? "#2a3748" : "#1a202c"} stroke="#4a5568" strokeWidth="0.5" />
     <path d="M0 20 L0 80 L40 100 L40 40 Z" fill={active ? "#1e293b" : "#0f172a"} stroke="#4a5568" strokeWidth="0.5" />
     <path d="M40 100 L80 80 L80 20 L40 40 Z" fill={active ? "#0f172a" : "#0b0e14"} stroke="#4a5568" strokeWidth="0.5" />
     <rect x="5" y="40" width="30" height="2" fill={active ? "#3b82f6" : "rgba(255,255,255,0.05)"} transform="skewY(26)" />
     <rect x="5" y="90" width="20" height="4" fill="#fb923c" transform="skewY(26)" opacity={active ? 1 : 0.3} />
  </g>
);

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [env, setEnv] = useState(null);

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  const data = useMemo(() => ({
    cpuTotal: 359.63,
    cpuUsed: 27.07 + (Math.random() * 2),
    ramTotal: 1.93,
    ramUsed: 1.02,
    storageTotal: 158.06,
    storageUsed: 71.37
  }), [metrics]);

  const criticalServers = useMemo(() => {
    let filtered = vms.filter(v => v.name.includes('PROD') || v.name.includes('SRV'));
    if (filtered.length === 0) filtered = vms.slice(0, 5);
    return filtered.slice(0, 5);
  }, [vms]);

  return (
    <div className="fade-in" style={{ 
      padding: '32px', 
      background: '#0b0e14', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0'
    }}>
      
      {/* ── TOP RESOURCE BAND ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
         <ResourceBlock label="CPU" free={(data.cpuTotal - data.cpuUsed).toFixed(2)} used={data.cpuUsed.toFixed(2)} total={data.cpuTotal} unit="GHz" color="#48bb78" />
         <ResourceBlock label="Mémoire" free={(data.ramTotal - data.ramUsed).toFixed(2)} used={data.ramUsed.toFixed(2)} total={data.ramTotal} unit="To" color="#48bb78" />
         <ResourceBlock label="Stockage" free={(data.storageTotal - data.storageUsed).toFixed(2)} used={data.storageUsed.toFixed(2)} total={data.storageTotal} unit="To" color="#48bb78" />
      </div>

      {/* ── CENTRAL VISUAL SECTION: 3D INFRASTRUCTURE ────────────────────── */}
      <div style={{ 
        background: 'radial-gradient(circle at 60% 50%, #1a202c 0%, #0b0e14 100%)', 
        borderRadius: '16px', 
        padding: '40px', 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 40,
        marginBottom: 16,
        minHeight: '400px'
      }}>
         <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '80px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{metrics?.cpu?.usage || 58}<span style={{ fontSize: '24px', color: '#64748b', fontWeight: 600 }}>% CPU</span></div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: 24, lineHeight: 1.6 }}>
               Supervision en temps réel de la charge cumulée du cluster. 
               Une utilisation élevée peut indiquer une surcharge ou un besoin d'extension de capacité.
            </p>
            <div style={{ marginTop: 40, display: 'flex', gap: 30 }}>
               <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>RÉPONSE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#22d3ee' }}>3.28 ms</div>
               </div>
               <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>UPTIME</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#48bb78' }}>10:02:00</div>
               </div>
            </div>
         </div>

         <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 300">
               <ServerRack x={150} y={50} active={true} />
               <ServerRack x={250} y={100} active={false} />
               <ServerRack x={350} y={50} active={false} />
               <ServerRack x={100} y={150} active={false} />
               <ServerRack x={200} y={200} active={true} />
               <ServerRack x={300} y={150} active={false} />
            </svg>
         </div>
      </div>

      {/* ── BOTTOM TABLE: PERFORMANCE MATRIX ────────────────────────────── */}
      <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Analyse Détaillée des Serveurs Critiques</h2>
            <div style={{ fontSize: '11px', color: '#48bb78', background: 'rgba(72, 187, 120, 0.1)', padding: '4px 12px', borderRadius: '4px' }}>Uptime: 10:02:00</div>
         </div>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ textAlign: 'left', fontSize: '11px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '12px 8px' }}>SERVER NAME</th>
                  <th>CORES</th>
                  <th>OS</th>
                  <th>CPU USAGE</th>
                  <th>MEMORY USAGE</th>
                  <th style={{ textAlign: 'right' }}>DISK</th>
               </tr>
            </thead>
            <tbody>
               {criticalServers.map(vm => (
                  <tr key={vm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '13px' }}>
                     <td style={{ padding: '16px 8px', color: '#22d3ee', fontWeight: 600 }}>{vm.name}</td>
                     <td style={{ color: '#94a3b8' }}>{vm.cpu?.cores || 4}</td>
                     <td style={{ color: '#94a3b8' }}>{vm.os || 'Linux'}</td>
                     <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           <span style={{ fontSize: '11px', fontWeight: 700 }}>{vm.cpu?.usage}%</span>
                           <div style={{ flex: 1, width: 60, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                              <div style={{ width: `${vm.cpu?.usage}%`, height: '100%', background: '#3b82f6' }} />
                           </div>
                        </div>
                     </td>
                     <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           <span style={{ fontSize: '11px', fontWeight: 700 }}>{vm.ram?.percent}%</span>
                           <div style={{ flex: 1, width: 80, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                              <div style={{ width: `${vm.ram?.percent}%`, height: '100%', background: '#8b5cf6' }} />
                           </div>
                        </div>
                     </td>
                     <td style={{ textAlign: 'right', color: '#94a3b8', fontSize: '11px' }}>80GB / 120GB</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

    </div>
  );
}
