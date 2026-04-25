import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Download, Battery, ZapOff, CpuIcon, Folder, List
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE ULTIMATE MONITORING — OPERATIONAL DASHBOARD
 * Tableau vCenter (Objets Alerfiques) + Logs d'activité en temps réel.
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const ResourceStat = ({ label, free, used, total, unit, color, icon: Icon }) => {
  const percent = total > 0 ? (used / total) * 100 : 0;
  return (
    <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '11px', fontWeight: 700, marginBottom: 15, textTransform: 'uppercase' }}>
         <Icon size={16} color={color} /> {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: 15 }}>
         {free} <span style={{ fontSize: '14px', color: '#64748b' }}>{unit} libres</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', marginBottom: 10, overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: color }} />
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{used} {unit} utilisés | {total} {unit} au total</div>
    </div>
  );
};

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [env, setEnv] = useState(null);

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  const data = useMemo(() => ({
    cpuTotal: 359.63, cpuUsed: 27.07 + (Math.random() * 2),
    ramTotal: 1.93, ramUsed: 1.02,
    storageTotal: 158.06, storageUsed: 71.37
  }), [metrics]);

  return (
    <div className="fade-in" style={{ padding: '40px', background: '#0b0e14', minHeight: 'calc(100vh - 60px)', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
           <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>SBEE <span style={{ color: '#3b82f6' }}>MONITORING</span></h1>
           <div style={{ fontSize: '13px', color: '#64748b', marginTop: 4 }}>Centre de Commandes Opérationnel · vCenter Hybrid</div>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', padding: '8px 16px', fontSize: '12px' }}>
           <Download size={16} style={{ marginRight: 8 }} /> Rapports
        </button>
      </div>

      {/* ── RESOURCE BAND ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
         <ResourceStat label="CPU" free={(data.cpuTotal - data.cpuUsed).toFixed(2)} used={data.cpuUsed.toFixed(2)} total={data.cpuTotal} unit="GHz" color="#3b82f6" icon={Cpu} />
         <ResourceStat label="Mémoire" free={(data.ramTotal - data.ramUsed).toFixed(2)} used={data.ramUsed.toFixed(2)} total={data.ramTotal} unit="To" color="#a78bfa" icon={Layers} />
         <ResourceStat label="Stockage" free={(data.storageTotal - data.storageUsed).toFixed(2)} used={data.storageUsed.toFixed(2)} total={data.storageTotal} unit="To" color="#fb923c" icon={HardDrive} />
      </div>

      {/* ── INVENTORY & ENERGY ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '12px', fontWeight: 800, marginBottom: 20 }}>
               <Monitor size={16} /> INVENTAIRE VMs
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <div><div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>163</div><div style={{ fontSize: '10px', color: '#64748b' }}>TOTAL</div></div>
               <div><div style={{ fontSize: '24px', fontWeight: 900, color: '#48bb78' }}>66</div><div style={{ fontSize: '10px', color: '#64748b' }}>ON</div></div>
               <div><div style={{ fontSize: '24px', fontWeight: 900, color: '#f87171' }}>97</div><div style={{ fontSize: '10px', color: '#64748b' }}>OFF</div></div>
            </div>
         </div>
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(251, 146, 60, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fb923c', fontSize: '12px', fontWeight: 800, marginBottom: 20 }}>
               <Zap size={16} /> SYSTÈME ÉNERGÉTIQUE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               <div style={{ fontSize: '14px', fontWeight: 700 }}>Batteries: <span style={{ color: '#48bb78' }}>98%</span></div>
               <div style={{ fontSize: '14px', fontWeight: 700 }}>Délivré: <span style={{ color: '#fff' }}>450 kW</span></div>
            </div>
         </div>
      </div>

      {/* ── OPERATIONAL SECTION: TABLE + LOGS ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 24 }}>
         
         {/* TABLEAU DES OBJETS (Image Style) */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={18} /> Objets présentant le plus d'alertes
               </div>
               <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 700 }}>10</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', fontSize: '11px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <th style={{ padding: '12px 8px' }}>Élément</th>
                     <th style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} color="#f87171" /> Alertes</th>
                     <th><AlertTriangle size={14} color="#fb923c" /> Avertissements</th>
                  </tr>
               </thead>
               <tbody>
                  {[
                     { name: 'vcsa.sbee.local', alerts: 3, warns: 0, type: 'folder' },
                     { name: 'esxi-noc.sbee.local', alerts: 2, warns: 0, type: 'server' },
                     { name: 'drmcesxi.sbee.local', alerts: 2, warns: 0, type: 'server' },
                     { name: 'drbaesxi.sbee.local', alerts: 1, warns: 1, type: 'server' },
                     { name: 'VMDGMAIL_replica (1)', alerts: 1, warns: 1, type: 'vm' }
                  ].map((item, idx) => (
                     <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '13px' }}>
                        <td style={{ padding: '12px 8px', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 10 }}>
                           {item.type === 'folder' ? <Folder size={16} /> : item.type === 'server' ? <Server size={16} /> : <Monitor size={16} />}
                           {item.name}
                        </td>
                        <td style={{ color: item.alerts > 0 ? '#fff' : '#64748b' }}>{item.alerts}</td>
                        <td style={{ color: item.warns > 0 ? '#fff' : '#64748b' }}>{item.warns}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* LOGS D'ACTIVITÉ */}
         <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '15px', fontWeight: 800, marginBottom: 24 }}>
               <List size={18} /> Logs d'activité récents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
               {alerts.slice(0, 6).map((alert, i) => (
                  <div key={i} style={{ display: 'flex', gap: 15, fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 12 }}>
                     <div style={{ color: alert.severity === 'critical' ? '#f87171' : '#fb923c' }}>
                        {alert.severity === 'critical' ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
                     </div>
                     <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 700 }}>{alert.sourceId}</div>
                        <div style={{ color: '#94a3b8', marginTop: 4 }}>{alert.message}</div>
                     </div>
                     <div style={{ color: '#475569', fontSize: '10px' }}>{new Date().toLocaleTimeString()}</div>
                  </div>
               ))}
            </div>
         </div>

      </div>

    </div>
  );
}
