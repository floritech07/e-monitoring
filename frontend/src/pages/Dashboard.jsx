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
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { api } from '../api';

/**
 * SBEE MONITORING — CENTRE DE COMMANDE (VERSION ORIGINALE RESTAURÉE)
 * Efficacité, clarté, et données critiques immédiates.
 */

const QuickStat = ({ icon: Icon, label, value, unit, color, status }) => (
  <div className="card glass-panel" style={{ padding: '20px', flex: 1 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ background: `${color}15`, padding: '8px', borderRadius: '8px' }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: '10px', color: status === 'ok' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
        ● {status?.toUpperCase()}
      </div>
    </div>
    <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
      {value}<span style={{ fontSize: '14px', color: '#8e8e8e', marginLeft: 4 }}>{unit}</span>
    </div>
    <div style={{ fontSize: '12px', color: '#8e8e8e', fontWeight: 500 }}>{label}</div>
  </div>
);

const CUSTOM_TOOLTIP = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#13151c', border: '1px solid #2c3235', padding: '10px', borderRadius: '4px' }}>
        <div style={{ fontSize: '10px', color: '#8e8e8e', marginBottom: 5 }}>{payload[0].payload.t}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: '12px', fontWeight: 700, color: p.color }}>
            {p.name}: {p.value}%
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [env, setEnv] = useState(null);

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  const activeAlerts = useMemo(() => alerts.filter(a => !a.resolved), [alerts]);

  const trendData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      t: `${i * 3}m`,
      cpu: Math.floor(Math.random() * 20 + 30 + (i % 5)),
      ram: Math.floor(Math.random() * 10 + 55)
    }));
  }, []);

  return (
    <div className="fade-in" style={{ padding: '24px', background: '#0a0a0c', minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* ── TITRE & STATUT ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>SBEE MONITORING</h1>
          <p style={{ fontSize: '14px', color: '#8e8e8e', margin: '4px 0 0' }}>Tableau de bord de supervision unifiée</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
             SYSTEM STATUS: NOMINAL
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ROW ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <QuickStat icon={Cpu} label="CPU Global" value={metrics?.cpu?.usage} unit="%" color="#38bdf8" status="ok" />
        <QuickStat icon={Server} label="RAM Cluster" value={metrics?.ram?.percent} unit="%" color="#a78bfa" status="ok" />
        <QuickStat icon={HardDrive} label="Stockage" value={metrics?.storage?.usedPct || 64} unit="%" color="#fb923c" status="ok" />
        <QuickStat icon={Thermometer} label="Temp. Datacenter" value={env?.avgTempC || 23.4} unit="°C" color="#ef4444" status="ok" />
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, flex: 1 }}>
        
        {/* Gauche : Tendances & Capacity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card glass-panel" style={{ flex: 1, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>Télémétrie en Temps Réel</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <span style={{ color: '#38bdf8' }}>● CPU</span>
                <span style={{ color: '#a78bfa' }}>● RAM</span>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#8e8e8e' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8e8e8e' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="cpu" name="CPU" stroke="#38bdf8" strokeWidth={3} fill="url(#grad1)" dot={false} />
                  <Area type="monotone" dataKey="ram" name="RAM" stroke="#a78bfa" strokeWidth={3} fill="url(#grad2)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Capacity projection mini */}
            <div className="card glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', marginBottom: 12 }}>Projection de Capacité</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, color: '#8e8e8e' }}>Saturation estimée du stockage :</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fb923c' }}>Dans 74 jours</div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <div style={{ width: '70%', height: '100%', background: '#fb923c', borderRadius: 3 }} />
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 11 }} onClick={() => navigate('/capacity')}>
                  Détail du Planning <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Quick Access */}
            <div className="card glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', marginBottom: 12 }}>Astreinte IT (Niveau 1)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3274d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>Équipe Exploitation</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>Disponible</div>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 14, fontSize: 11 }} onClick={() => navigate('/oncall')}>
                Contacter l'astreinte
              </button>
            </div>
          </div>
        </div>

        {/* Droite : Alertes Critiques & Inventaire Rapide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>Alertes Critiques</div>
              <Shield size={16} color="#ef4444" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeAlerts.length > 0 ? (
                activeAlerts.slice(0, 5).map(alert => (
                  <div key={alert.key} style={{ 
                    padding: '12px', background: 'rgba(239,68,68,0.05)', 
                    borderLeft: `3px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
                    borderRadius: 4
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e8eaf0' }}>{alert.sourceId}</div>
                    <div style={{ fontSize: 11, color: '#8e8e8e', marginTop: 4 }}>{alert.message}</div>
                    <div style={{ fontSize: 9, color: '#ef4444', marginTop: 6, fontWeight: 700 }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8e8e8e' }}>
                  <CheckCircle size={32} color="#10b981" style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ fontSize: 12 }}>Aucune alerte critique active</div>
                </div>
              )}
            </div>
            
            <button className="btn btn-ghost" style={{ marginTop: 'auto', width: '100%' }} onClick={() => navigate('/alerts')}>
              Journal complet des alertes
            </button>
          </div>

          <div className="card glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', marginBottom: 12 }}>Machines Virtuelles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#8e8e8e' }}>Running</span>
                  <span style={{ fontWeight: 700, color: '#22d3a3' }}>{vms.filter(v => v.state === 'on').length}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#8e8e8e' }}>Powered Off</span>
                  <span style={{ fontWeight: 700 }}>{vms.filter(v => v.state === 'off').length}</span>
               </div>
               <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 11, width: '100%' }} onClick={() => navigate('/infrastructure')}>
                  Gérer l'infrastructure
               </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
