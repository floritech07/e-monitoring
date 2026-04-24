import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Building2, ArrowUpRight, Gauge, Lock, Globe, CpuIcon
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';
import { api } from '../api';

/**
 * SBEE MONITORING — EXECUTIVE COMMAND CENTER
 * Design Premium, Épuré, Axé sur la clarté décisionnelle.
 */

// ── DESIGN SYSTEM COMPONENTS ───────────────────────────────────────────────

const GlassCard = ({ children, style = {}, className = "" }) => (
  <div 
    className={`glass-panel ${className}`} 
    style={{ 
      background: 'rgba(15, 18, 25, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      ...style 
    }}
  >
    {children}
  </div>
);

const MetricHero = ({ label, value, unit, icon: Icon, color, trend }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ background: `${color}15`, padding: '10px', borderRadius: '12px', display: 'flex' }}>
        <Icon size={20} color={color} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{value}</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
      {trend && (
        <span style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 700, color: trend > 0 ? '#f5534b' : '#22d3a3', display: 'flex', alignItems: 'center', gap: 2 }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
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

  const criticalVMs = useMemo(() => vms.filter(v => v.name.toLowerCase().includes('prod') || v.name.toLowerCase().includes('base')), [vms]);

  return (
    <div className="fade-in" style={{ 
      padding: '32px', 
      background: 'radial-gradient(circle at top right, #1a1d2b 0%, #08090d 100%)', 
      minHeight: 'calc(100vh - 60px)', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 32,
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* ── HEADER: BRANDING & GLOBAL STATUS ──────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
             <img src="/sbee-logo.png" alt="SBEE" style={{ height: 40, filter: 'brightness(1.2)' }} onError={(e) => e.target.style.display='none'} />
             <div style={{ height: 30, width: 2, background: 'rgba(255,255,255,0.1)' }} />
             <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
               SBEE <span style={{ color: '#4f8ef7' }}>MONITORING</span>
             </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>Supervision temps réel de l'infrastructure critique</p>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SANTÉ GLOBALE</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#22d3a3' }}>{metrics?.health?.score || 98}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ALERTES ACTIVES</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: alerts.length > 0 ? '#f5534b' : '#22d3a3' }}>{alerts.filter(a => !a.resolved).length}</div>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION: 3D INFRASTRUCTURE ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
        
        {/* Vue 3D épurée */}
        <GlassCard style={{ position: 'relative', height: '480px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', position: 'relative', zIndex: 10 }}>
             <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>ÉTAT DU DATACENTER</h2>
             <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>Vue systémique des ressources de production</p>
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Scène 3D CSS */}
            <div style={{ transform: 'rotateX(55deg) rotateZ(-35deg)', position: 'relative', width: '400px', height: '400px' }}>
               {/* Grille de fond */}
               <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(79, 142, 247, 0.1)', background: 'linear-gradient(rgba(79, 142, 247, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 142, 247, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
               
               {/* Blocs d'infrastructure */}
               {/* NAS */}
               <div style={{ position: 'absolute', top: '10%', left: '10%', width: '80px', height: '80px', background: '#fb923c', transform: 'translateZ(40px)', boxShadow: '0 0 40px rgba(251, 146, 60, 0.3)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database color="white" size={32} style={{ transform: 'rotateZ(35deg) rotateX(-55deg)' }} />
               </div>

               {/* COMPUTE */}
               <div style={{ position: 'absolute', top: '50%', left: '40%', width: '120px', height: '120px', background: '#4f8ef7', transform: 'translateZ(60px)', boxShadow: '0 0 60px rgba(79, 142, 247, 0.4)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server color="white" size={48} style={{ transform: 'rotateZ(35deg) rotateX(-55deg)' }} />
               </div>

               {/* NETWORK */}
               <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '60px', height: '60px', background: '#a78bfa', transform: 'translateZ(30px)', boxShadow: '0 0 30px rgba(167, 139, 250, 0.3)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Network color="white" size={24} style={{ transform: 'rotateZ(35deg) rotateX(-55deg)' }} />
               </div>
            </div>

            {/* Overlays d'information flottants */}
            <div style={{ position: 'absolute', top: '100px', right: '40px', textAlign: 'right' }}>
               <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{vms.length}</div>
               <div style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 800 }}>MACHINES VIRTUELLES</div>
            </div>

            <div style={{ position: 'absolute', bottom: '40px', left: '40px' }}>
               <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TEMPÉRATURE</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{env?.avgTempC || 22.8}°C</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>HYGROMÉTRIE</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{env?.avgHumidity || 45}%</div>
                  </div>
               </div>
            </div>
          </div>
        </GlassCard>

        {/* Panneau Latéral: Métriques Clés */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <GlassCard>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '1px' }}>Utilisation Systémique</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <MetricHero label="CPU" value={metrics?.cpu?.usage} unit="%" icon={Cpu} color="#4f8ef7" trend={2} />
              <MetricHero label="RAM" value={metrics?.ram?.percent} unit="%" icon={Activity} color="#a78bfa" trend={-5} />
              <MetricHero label="Stockage" value={metrics?.storage?.usedPct || 64} unit="%" icon={HardDrive} color="#fb923c" />
            </div>
          </GlassCard>

          <GlassCard style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>DERNIÈRES ALERTES</h3>
               <button className="btn-link" onClick={() => navigate('/alerts')} style={{ color: '#4f8ef7', fontSize: '11px', fontWeight: 700 }}>Voir tout</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {alerts.filter(a => !a.resolved).slice(0, 3).map(alert => (
                 <div key={alert.key} style={{ padding: '12px', background: 'rgba(245, 83, 75, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 83, 75, 0.1)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                     <span style={{ fontSize: '11px', fontWeight: 800, color: '#f5534b' }}>{alert.severity.toUpperCase()}</span>
                     <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                   </div>
                   <div style={{ fontSize: '12px', color: '#e8eaf0', lineHeight: 1.4 }}>{alert.message}</div>
                 </div>
               ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── BOTTOM SECTION: CRITICAL APPLICATIONS & TRENDS ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 32 }}>
        
        {/* Applications Critiques */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>APPLICATIONS DE PRODUCTION</h3>
            <div style={{ display: 'flex', gap: 8 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10px', color: '#22d3a3', fontWeight: 700 }}>
                  <div style={{ width: 6, height: 6, background: '#22d3a3', borderRadius: '50%' }} /> ONLINE
               </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {criticalVMs.slice(0, 4).map(vm => (
              <div key={vm.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/infrastructure/${vm.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                   <Monitor size={16} color="#4f8ef7" />
                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#22d3a3' }}>STABLE</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{vm.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{vm.cpu?.usage}% CPU | {vm.ram?.percent}% RAM</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Tendance Énergétique */}
        <GlassCard>
           <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: 20 }}>RÉSEAU ÉLECTRIQUE</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>CHARGE ONDULEURS</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#f5a623' }}>{metrics?.ups?.avgChargePct || 98}%</div>
                 </div>
                 <Zap size={32} color="#f5a623" opacity={0.5} />
              </div>
              <div style={{ height: 60 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{v:95}, {v:96}, {v:98}, {v:97}, {v:98}]}>
                       <Area type="monotone" dataKey="v" stroke="#f5a623" fill="rgba(245, 166, 35, 0.1)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div style={{ fontSize: '11px', color: '#22d3a3', fontWeight: 700, textAlign: 'center' }}>SOURCE : SECTEUR (SBEE)</div>
           </div>
        </GlassCard>

        {/* Planning de Capacité */}
        <GlassCard>
           <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: 20 }}>CAPACITÉ & CROISSANCE</h3>
           <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>SATURATION STOCKAGE ESTIMÉE</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#fb923c' }}>74 Jours</div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', margin: '16px 0', overflow: 'hidden' }}>
                 <div style={{ width: '65%', height: '100%', background: '#fb923c', borderRadius: '4px' }} />
              </div>
              <button className="btn btn-ghost" style={{ fontSize: '11px', width: '100%' }} onClick={() => navigate('/capacity')}>
                Optimiser les ressources <ArrowRight size={12} />
              </button>
           </div>
        </GlassCard>

      </div>

    </div>
  );
}
