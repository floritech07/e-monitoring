import { useState, useEffect, useMemo } from 'react';
import { 
  Settings, AlertTriangle, BellRing, X, Plus, Trash2, 
  Volume2, Clock, Zap, Maximize2, Minimize2, Play
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useSocket } from '../hooks/useSocket';

const OPERATOR_COLORS = {
  MOOV: '#075dff',
  MTN: '#ffcb05',
  SBIN: '#10b981',
  ASIN: '#ef4444',
  BANQUES: '#6366f1',
  PERFORM: '#a350e8',
};

const SOUND_OPTIONS = [
  { id: 'alarm-1', label: 'Alarme Standard', freq: 880 },
  { id: 'alarm-2', label: 'Bip Urgence', freq: 1046 },
  { id: 'alarm-3', label: 'Sirène Lente', freq: 440 },
  { id: 'alarm-critical', label: 'CRITIQUE (Haut)', freq: 1244 },
];

const RANGE_HOURS = {
  '5m': 0.083, '15m': 0.25, '30m': 0.5,
  '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24, 
  '2d': 48, '7d': 168, '30d': 720, 'yesterday': 24
};

export default function PaymentMonitor({ timeRange = '1h', refreshRate = '30', refreshCounter = 0 }) {
  const { connected, alerts } = useSocket(); 
  const [prepaidData, setPrepaidData] = useState([]);
  const [postpaidData, setPostpaidData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [rules, setRules] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR'));

  // Fetch functions
  const fetchTrends = async () => {
    setLoading(true);
    try {
      const [preRes, postRes] = await Promise.all([
        fetch(`http://localhost:3001/api/payments/trends/prepaid?range=${timeRange}`),
        fetch(`http://localhost:3001/api/payments/trends/postpaid?range=${timeRange}`)
      ]);
      setPrepaidData(await preRes.json());
      setPostpaidData(await postRes.json());
    } catch (e) {
      console.error("Fetch trends failed", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/payments/rules');
      setRules(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchTrends();
    fetchRules();
    const clockInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('fr-FR')), 1000);
    return () => clearInterval(clockInterval);
  }, [timeRange, refreshCounter]);

  // Chart data formatting
  const formatData = (raw, key) => {
    const map = {};
    if (!Array.isArray(raw)) return [];
    raw.forEach(op => {
      if (op.data && Array.isArray(op.data)) {
        op.data.forEach(p => {
          if (!map[p.time]) map[p.time] = { time: p.time };
          map[p.time][op[key]] = p.entry_count;
        });
      }
    });
    return Object.values(map).sort((a, b) => a.time - b.time);
  };

  const preFormatted = useMemo(() => formatData(prepaidData, 'operator'), [prepaidData]);
  const postFormatted = useMemo(() => formatData(postpaidData, 'tier'), [postpaidData]);

  const saveRule = async (rule) => {
    const isNew = !rule.id;
    const url = isNew ? 'http://localhost:3001/api/payments/rules' : `http://localhost:3001/api/payments/rules/${rule.id}`;
    await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    fetchRules();
  };

  const deleteRule = async (id) => {
    await fetch(`http://localhost:3001/api/payments/rules/${id}`, { method: 'DELETE' });
    fetchRules();
  };

  const testSound = (soundId) => {
    const option = SOUND_OPTIONS.find(o => o.id === soundId);
    if (!option) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = option.freq;
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 1000);
  };

  return (
    <div className="payment-monitor-page fade-in" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      
      {/* Dynamic Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Monitoring Flux <span className="glow-text" style={{ color: 'var(--accent)' }}>Paiements</span></h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <span className="status-badge online" style={{ fontSize: '9px' }}>HAUTE RÉSOLUTION</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{currentTime} — SBEE infrastructure</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
             <button className="btn btn-ghost" onClick={() => fetchTrends()}>
               <Clock size={14} /> Rafraîchir
             </button>
             <button className="btn btn-primary" onClick={() => setShowRules(true)}>
               <Settings size={14} /> Alertes Smart
             </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Prepaid Card */}
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent)', borderRadius: '2px' }} />
              <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Canaux PREPAID (Vente Crédit)</span>
            </div>
            {loading && <div className="loading-spin" />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: '400px' }}>
            <div style={{ padding: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={preFormatted}>
                  <defs>
                    {Object.entries(OPERATOR_COLORS).map(([op, color]) => (
                      <linearGradient key={op} id={`grad-${op}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    hide={false} 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    stroke="var(--text-muted)"
                    fontSize={10}
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelFormatter={(t) => new Date(t).toLocaleTimeString('fr-FR')}
                  />
                  {Array.isArray(prepaidData) && prepaidData.map(s => (
                    <Area 
                      key={s.operator} 
                      type="monotone" 
                      dataKey={s.operator} 
                      stroke={OPERATOR_COLORS[s.operator]} 
                      fill={`url(#grad-${s.operator})`} 
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '24px', borderLeft: '1px solid var(--border)' }}>
               <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Status Opérateurs</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Array.isArray(prepaidData) && prepaidData.map(s => {
                    const latest = s.data.length > 0 ? s.data[s.data.length-1].entry_count : 0;
                    return (
                      <div key={s.operator} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: OPERATOR_COLORS[s.operator] }} />
                           <span style={{ fontSize: '13px', fontWeight: 600 }}>{s.operator}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: latest === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{latest}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>

        {/* Postpaid Card */}
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent-secondary)', borderRadius: '2px' }} />
              <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Canaux POSTPAID (Facturation)</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: '400px' }}>
            <div style={{ padding: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={postFormatted}>
                  <defs>
                    {Object.entries(OPERATOR_COLORS).map(([op, color]) => (
                      <linearGradient key={`post-${op}`} id={`grad-post-${op}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    stroke="var(--text-muted)"
                    fontSize={10}
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelFormatter={(t) => new Date(t).toLocaleTimeString('fr-FR')}
                  />
                  {Array.isArray(postpaidData) && postpaidData.map(s => (
                    <Area 
                      key={s.tier} 
                      type="monotone" 
                      dataKey={s.tier} 
                      stroke={OPERATOR_COLORS[s.tier] || '#666'} 
                      fill={`url(#grad-post-${s.tier || 'GENERIC'})`} 
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '24px', borderLeft: '1px solid var(--border)' }}>
               <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Status Tiers payeurs</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Array.isArray(postpaidData) && postpaidData.map(s => {
                    const latest = s.data.length > 0 ? s.data[s.data.length-1].entry_count : 0;
                    return (
                      <div key={s.tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: OPERATOR_COLORS[s.tier] || '#666' }} />
                           <span style={{ fontSize: '13px', fontWeight: 600 }}>{s.tier}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: latest === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{latest}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>

      </div>

      {/* Rules Modal */}
      {showRules && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="card glass-panel fade-in" style={{ width: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--accent)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <BellRing color="var(--warning)" /> ENGINE D'ALERTES TRANSACTIONNELLES
               </h2>
               <button onClick={() => setShowRules(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
               <div style={{ display: 'grid', gap: '16px' }}>
                 {rules.map(rule => (
                   <div key={rule.id} className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', transition: 'none' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                           <select value={rule.type} onChange={(e) => saveRule({...rule, type: e.target.value})}>
                             <option value="PREPAID">PREPAID</option>
                             <option value="POSTPAID">POSTPAID</option>
                           </select>
                           <select value={rule.operator} onChange={(e) => saveRule({...rule, operator: e.target.value})}>
                             <option value="ALL">TOUS</option>
                             {Object.keys(OPERATOR_COLORS).map(op => <option key={op} value={op}>{op}</option>)}
                           </select>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRule(rule.id)}><Trash2 size={14} /></button>
                     </div>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'center' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SEUIL DE BAISSE (%)</label>
                          <input type="number" value={rule.threshold} onChange={(e) => saveRule({...rule, threshold: parseInt(e.target.value)})} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>INTERVALLE (MIN)</label>
                          <input type="number" value={rule.intervalMin} onChange={(e) => saveRule({...rule, intervalMin: parseInt(e.target.value)})} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <input 
                             type="checkbox" 
                             checked={rule.checkInactivity} 
                             onChange={(e) => saveRule({...rule, checkInactivity: e.target.checked})}
                           />
                           <span style={{ fontSize: '12px' }}>Vérifier l'inactivité</span>
                        </div>
                        <div>
                           <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SONNERIE ALERTE</label>
                           <div style={{ display: 'flex', gap: '4px' }}>
                              <select value={rule.sound} onChange={(e) => saveRule({...rule, sound: e.target.value})} style={{ flex: 1 }}>
                                {SOUND_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                              </select>
                              <button className="btn btn-ghost btn-sm" onClick={() => testSound(rule.sound)}><Play size={12} /></button>
                           </div>
                        </div>
                     </div>
                   </div>
                 ))}
                 
                 <button className="btn btn-ghost" style={{ borderStyle: 'dashed', padding: '20px' }} onClick={() => saveRule({ type: 'PREPAID', operator: 'ALL', threshold: 30, intervalMin: 60, severity: 'critical', sound: 'alarm-1', enabled: true })}>
                   <Plus size={16} /> Créer une nouvelle règle métier
                 </button>
               </div>
            </div>
            
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
               <button className="btn btn-primary" onClick={() => setShowRules(false)} style={{ padding: '12px 32px' }}>Sauvegarder la configuration</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
