import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Download, Battery, ZapOff, CpuIcon, Router, Hub, Wifi, Settings2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE DATACENTER HYPERVISOR — ULTIMATE EDITION
 * Inventaire complet : VMs, Hôtes, Réseau (Switches, Routeurs, VLANs), Stockage (NAS) et Énergie.
 */

// ── UI COMPONENTS ──────────────────────────────────────────────────────────

const ResourceStat = ({ label, free, used, total, unit, color, icon: Icon }) => {
  const percent = total > 0 ? (used / total) * 100 : 0;
  return (
    <div style={{ 
      background: 'rgba(30, 41, 59, 0.4)', 
      borderRadius: '16px', 
      padding: '24px', 
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      flex: 1
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '11px', fontWeight: 700, marginBottom: 15, textTransform: 'uppercase' }}>
         <Icon size={16} color={color} /> {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: 15 }}>
         {free} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>{unit} libres</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', marginBottom: 10, overflow: 'hidden' }}>
         <div style={{ width: `${percent}%`, height: '100%', background: color, boxShadow: `0 0 10px ${color}44` }} />
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
         {used} {unit} utilisés <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 5px' }}>|</span> {total} {unit} au total
      </div>
    </div>
  );
};

const InventorySection = ({ title, icon: Icon, items }) => (
  <div style={{ 
    background: 'rgba(30, 41, 59, 0.4)', 
    borderRadius: '16px', 
    padding: '24px', 
    border: '1px solid rgba(255, 255, 255, 0.05)',
    flex: 1
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: '12px', fontWeight: 800, marginBottom: 20, textTransform: 'uppercase' }}>
       <Icon size={18} /> {title}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
       {items.map((item, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{item.value}</div>
             <div style={{ fontSize: '10px', color: '#64748b', marginTop: 4, fontWeight: 700 }}>{item.label}</div>
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

  const criticalServers = useMemo(() => {
    let filtered = vms.filter(v => v.name.includes('PROD') || v.name.includes('SRV'));
    if (filtered.length === 0) filtered = vms.slice(0, 4);
    return filtered.slice(0, 4);
  }, [vms]);

  return (
    <div className="fade-in" style={{ 
      padding: '40px', 
      background: '#0b0e14', 
      minHeight: 'calc(100vh - 60px)', 
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0'
    }}>
      
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)', width: 8, height: 24, borderRadius: 4, boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }} />
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>SBEE <span style={{ color: '#3b82f6' }}>HYPERVISOR</span></h1>
           </div>
           <div style={{ fontSize: '13px', color: '#64748b' }}>Datacenter Cotonou · Surveillance Environnementale & Réseau</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>SYSTÈME</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#22d3ee' }}>VCSA.SBEE.LOCAL</div>
           </div>
           <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', padding: '8px 16px', fontSize: '12px' }}>
              <Download size={16} /> Rapports
           </button>
        </div>
      </div>

      {/* ── BAND 1: CORE CAPACITY ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
         <ResourceStat label="CPU Cluster" free="332.57" used="27.07" total={359.63} unit="GHz" color="#3b82f6" icon={Cpu} />
         <ResourceStat label="Mémoire vive" free="928.05" used="1.02" total={1.93} unit="To" color="#a78bfa" icon={Layers} />
         <ResourceStat label="Stockage SAN" free="86.69" used="71.37" total={158.06} unit="To" color="#fb923c" icon={HardDrive} />
      </div>

      {/* ── BAND 2: FULL INVENTORY (VMs, Hôtes, Réseau, Stockage) ────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
         <InventorySection title="Virtualisation" icon={Monitor} items={[
            { label: 'VMs ON', value: vms.filter(v=>v.state==='on').length + 60 },
            { label: 'VMs OFF', value: 97 },
            { label: 'Hôtes ESXi', value: 13 }
         ]} />
         <InventorySection title="Réseau & NOC" icon={Network} items={[
            { label: 'Switches', value: 8 },
            { label: 'Routeurs', value: 2 },
            { label: 'VLANs', value: 24 }
         ]} />
         <InventorySection title="Stockage & Ops" icon={Database} items={[
            { label: 'NAS', value: 4 },
            { label: 'NOC Nodes', value: 6 },
            { label: 'LUNs', value: 12 }
         ]} />
      </div>

      {/* ── BAND 3: POWER & ENVIRONMENT (DÉTAILLÉ) ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 32 }}>
         
         {/* Console Énergie Salle */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(251, 146, 60, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fb923c', fontSize: '14px', fontWeight: 800 }}>
                  <Zap size={18} /> ALIMENTATION DE LA SALLE
               </div>
               <div style={{ fontSize: '11px', color: '#48bb78', fontWeight: 800, background: 'rgba(72, 211, 163, 0.1)', padding: '4px 12px', borderRadius: '10px' }}>STABLE</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
               <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 8 }}>BATTERIES UPS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                     <Battery size={24} color="#48bb78" />
                     <div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>98%</div>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>45min Autonomie</div>
                     </div>
                  </div>
               </div>
               <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 8 }}>CONSOMMATION TOTALE</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>450.2 <span style={{ fontSize: '14px', color: '#64748b' }}>kW</span></div>
                  <div style={{ fontSize: '9px', color: '#f87171', marginTop: 4 }}>PUE: 1.62 (Énergie perdue: 12kW)</div>
               </div>
               <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 8 }}>ALIMENTATION SECTEUR</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#22d3ee' }}>SBEE Ligne 1</div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: 4 }}>Tension: 400V · Fréq: 50Hz</div>
               </div>
            </div>
         </div>

         {/* Conditions Environnementales */}
         <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(34, 211, 163, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#22d3ee', fontSize: '14px', fontWeight: 800, marginBottom: 24 }}>
               <Thermometer size={18} /> CLIMATISATION (CRAC)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>23.4 <span style={{ fontSize: '16px', color: '#64748b' }}>°C</span></div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>TEMPÉRATURE MOYENNE</div>
               </div>
               <div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>45 <span style={{ fontSize: '16px', color: '#64748b' }}>%</span></div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>HUMIDITÉ RELATIVE</div>
               </div>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: 20 }}>
               <div style={{ width: '45%', height: '100%', background: '#22d3ee' }} />
            </div>
         </div>
      </div>

      {/* ── SERVEURS CRITIQUES (TIER-0) ─────────────────────────────────── */}
      <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Shield size={20} color="#f87171" />
               <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>Infrastructure Critique (Tier-0)</h2>
            </div>
            <button className="btn-link" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 800 }}>DÉTAILS COMPLETS</button>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {criticalServers.map(vm => (
               <div key={vm.id} style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)'
               }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3a3', boxShadow: '0 0 8px #22d3a3' }} />
                     <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{vm.name}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: 6, fontWeight: 800 }}>
                     <span>CPU</span>
                     <span style={{ color: '#fff' }}>{vm.cpu?.usage}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                     <div style={{ width: `${vm.cpu?.usage}%`, height: '100%', background: '#3b82f6' }} />
                  </div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
}
