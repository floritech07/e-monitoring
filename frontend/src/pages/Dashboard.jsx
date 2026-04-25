import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Search, Filter, Download, Calendar, MoreHorizontal,
  Power, CpuIcon, Gauge, ChevronDown, Battery, ZapOff
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE MONITORING — VCENTER DARK PLATINUM EDITION
 * Fusion de l'ergonomie vSphere et de l'esthétique Dark Premium.
 */

// ── UI COMPONENTS — VCENTER STYLE ──────────────────────────────────────────

const ResourceBlock = ({ label, free, used, total, unit, color }) => {
  const percent = total > 0 ? (used / total) * 100 : 0;
  return (
    <div style={{ 
      background: 'rgba(30, 41, 59, 0.4)', 
      borderRadius: '4px', 
      padding: '24px', 
      border: '1px solid rgba(255, 255, 255, 0.05)',
      flex: 1 
    }}>
      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 15, fontWeight: 600 }}>{label}</div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
         <div style={{ fontSize: '28px', fontWeight: 300, color: '#fff' }}>
            {free} <span style={{ fontSize: '18px' }}>{unit} libres</span>
         </div>
      </div>
      <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', marginBottom: 10, overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: color, boxShadow: `0 0 10px ${color}44` }} />
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'center', gap: 8 }}>
         <span>{used} {unit} utilisés</span>
         <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
         <span>{total} {unit} au total</span>
      </div>
    </div>
  );
};

const InventoryBlock = ({ label, total, icon: Icon, items }) => (
  <div style={{ 
    background: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: '4px', 
    padding: '20px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    flex: 1 
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
          <Icon size={16} /> {label}
       </div>
       <div style={{ fontSize: '20px', fontWeight: 300, color: '#fff' }}>{total}</div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
       {items.map((item, idx) => (
          <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
             <div style={{ fontSize: '18px', fontWeight: 300, color: '#fff' }}>{item.value}</div>
             <div style={{ fontSize: '10px', color: '#64748b', marginTop: 4 }}>{item.label}</div>
          </div>
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

  const stats = useMemo(() => ({
    cpuTotal: 359.63,
    cpuUsed: 27.07 + (Math.random() * 5),
    ramTotal: 1.93, // TB
    ramUsed: 1.02, // TB
    storageTotal: 158.06,
    storageUsed: 71.37,
    vmCount: vms.length,
    hostCount: 1,
  }), [vms]);

  return (
    <div className="fade-in" style={{ 
      padding: '20px', 
      background: '#0b0e14', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0'
    }}>
      
      {/* ── BREADCRUMB HEADER ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
         <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#fff', margin: 0 }}>Accueil</h1>
         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '12px', color: '#22d3ee', fontWeight: 600 }}>
            <div style={{ width: 14, height: 14, background: '#22d3ee20', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Monitor size={10} color="#22d3ee" />
            </div>
            VCSA.SBEE.LOCAL <ChevronDown size={14} />
         </div>
      </div>

      {/* ── RESOURCE BAND (TOP) ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
         <ResourceBlock label="CPU" free={(stats.cpuTotal - stats.cpuUsed).toFixed(2)} used={stats.cpuUsed.toFixed(2)} total={stats.cpuTotal} unit="GHz" color="#48bb78" />
         <ResourceBlock label="Mémoire" free={(stats.ramTotal - stats.ramUsed).toFixed(2)} used={stats.ramUsed.toFixed(2)} total={stats.ramTotal} unit="To" color="#48bb78" />
         <ResourceBlock label="Stockage" free={(stats.storageTotal - stats.storageUsed).toFixed(2)} used={stats.storageUsed.toFixed(2)} total={stats.storageTotal} unit="To" color="#48bb78" />
      </div>

      {/* ── INVENTORY ROW ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
         <InventoryBlock label="VM" total={163} icon={Monitor} items={[
            { label: 'Sous tension', value: vms.filter(v=>v.state==='on').length + 60 },
            { label: 'Hors tension', value: 97 },
            { label: 'Interrompu', value: 0 }
         ]} />
         <InventoryBlock label="Hôtes" total={13} icon={Server} items={[
            { label: 'Connecté', value: 9 },
            { label: 'Déconnecté', value: 1 },
            { label: 'Maintenance', value: 0 }
         ]} />
      </div>

      {/* ── ENERGY SYSTEM (SBEE SPECIFIC) ────────────────────────────────── */}
      <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '4px', padding: '24px', border: '1px solid rgba(251, 146, 60, 0.1)', marginBottom: 16 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fb923c', fontSize: '13px', fontWeight: 600, marginBottom: 20 }}>
            <Zap size={16} /> SYSTÈME ÉNERGÉTIQUE SBEE
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            <div>
               <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Batteries</div>
               <div style={{ fontSize: '20px', fontWeight: 300, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Battery size={20} color="#48bb78" /> 98% <span style={{ fontSize: '12px', color: '#48bb78' }}>OPTIMAL</span>
               </div>
            </div>
            <div>
               <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Total Délivré</div>
               <div style={{ fontSize: '20px', fontWeight: 300, color: '#fff' }}>450.2 kW</div>
            </div>
            <div>
               <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Énergie Perdue</div>
               <div style={{ fontSize: '20px', fontWeight: 300, color: '#f87171' }}>12.4 kW <span style={{ fontSize: '12px' }}>(2.7%)</span></div>
            </div>
            <div>
               <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Source</div>
               <div style={{ fontSize: '20px', fontWeight: 300, color: '#22d3ee' }}>SECTEUR ACTIF</div>
            </div>
         </div>
      </div>

      {/* ── BOTTOM TABLES: CRITICAL SERVERS & ALERTS ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
         
         {/* SERVEURS CRITIQUES (vCenter Style) */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '4px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={16} color="#f87171" /> SERVEURS CRITIQUES (TIER-0)
               </div>
               <span style={{ fontSize: '12px', color: '#64748b' }}>4 Éléments</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', fontSize: '11px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <th style={{ padding: '8px' }}>Serveur</th>
                     <th>Charge</th>
                     <th>Santé</th>
                  </tr>
               </thead>
               <tbody>
                  {vms.filter(v=>v.name.includes('PROD') || v.name.includes('SRV')).slice(0, 4).map(vm => (
                     <tr key={vm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '12px' }}>
                        <td style={{ padding: '12px 8px', color: '#fff', fontWeight: 500 }}>{vm.name}</td>
                        <td style={{ color: '#94a3b8' }}>{vm.cpu?.usage}% CPU</td>
                        <td style={{ color: '#48bb78' }}>OPTIMAL</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* OBJETS PRÉSENTANT LE PLUS D'ALERTES */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '4px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bell size={16} /> OBJETS PRÉSENTANT LE PLUS D'ALERTES
               </div>
               <span style={{ fontSize: '12px', color: '#64748b' }}>10</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', fontSize: '11px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <th style={{ padding: '8px' }}>Élément</th>
                     <th>Alertes</th>
                     <th>Avertissements</th>
                  </tr>
               </thead>
               <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '12px' }}>
                     <td style={{ padding: '12px 8px', color: '#fff' }}>vcsa.sbee.local</td>
                     <td style={{ color: '#f87171' }}>3</td>
                     <td style={{ color: '#fb923c' }}>0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '12px' }}>
                     <td style={{ padding: '12px 8px', color: '#fff' }}>esxi-noc.sbee.local</td>
                     <td style={{ color: '#f87171' }}>2</td>
                     <td style={{ color: '#fb923c' }}>0</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}
