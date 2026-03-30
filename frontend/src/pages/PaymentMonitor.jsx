import { useState, useEffect } from 'react';
import { 
  Settings, AlertTriangle, BellRing, X, Plus, Trash2 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useSocket } from '../hooks/useSocket';

const OPERATOR_COLORS = {
  MOOV: '#075dff',
  MTN: '#ffcb05',
  SBIN: '#4fba2c',
  ASIN: '#d63030',
  BANQUES: '#9b9b9b',
  PERFORM: '#a350e8',
  PNS: '#9c27b0'
};

const RANGE_HOURS = {
  '5m': 0.083, '15m': 0.25, '30m': 0.5,
  '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24, 
  '2d': 48, '7d': 168, '30d': 720, '90d': 2160, 
  '6mo': 4320, '1y': 8760, '2y': 17520, '5y': 43800,
  'yesterday': 24
};

// Realistic mock data generator based on time range
const getMockData = (type, timeRangeValue) => {
  const hours = RANGE_HOURS[timeRangeValue] || 3;
  const operators = type === 'prepaid' ? ['MOOV', 'MTN', 'SBIN', 'ASIN'] : ['ASIN', 'MTN', 'MOOV', 'SBIN', 'BANQUES', 'PERFORM'];
  const points = hours > 3 ? 100 : 60;

  return operators.map(op => {
    const data = [];
    let base = type === 'prepaid' ? Math.random() * 20 + 20 : Math.random() * 5 + 5;
    const now = Date.now();
    for (let i = 0; i < points; i++) {
        const time = now - (points - i) * (hours * 3600000 / points);
        const val = Math.max(0, base + (Math.random() - 0.5) * (type === 'prepaid' ? 8 : 2));
        data.push({ time, entry_count: Math.round(val) });
        base = val;
    }
    return { [type === 'prepaid' ? 'operator' : 'tier']: op, data };
  });
};

export default function PaymentMonitor({ timeRange = '3h', refreshRate = '300', refreshCounter = 0 }) {
  const { connected } = useSocket(); 
  const [prepaidData, setPrepaidData] = useState([]);
  const [postpaidData, setPostpaidData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR'));
  const [showRules, setShowRules] = useState(false);
  const [rules, setRules] = useState([]);

  useEffect(() => {
    fetchRules();
    fetchTrends();
    let trendInterval;
    
    let ms = 0;
    if (refreshRate.startsWith('int-')) {
        ms = parseInt(refreshRate.split('-')[1]);
    } else if (refreshRate !== '0') {
        ms = parseInt(refreshRate) * 1000;
    }

    if (ms > 0) {
      trendInterval = setInterval(fetchTrends, ms);
    }
    const clockInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('fr-FR')), 1000);
    
    return () => {
      if (trendInterval) clearInterval(trendInterval);
      clearInterval(clockInterval);
    };
  }, [timeRange, refreshRate, refreshCounter]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const [preRes, postRes] = await Promise.all([
        fetch(`http://localhost:3001/api/payments/trends/prepaid?range=${timeRange}`),
        fetch(`http://localhost:3001/api/payments/trends/postpaid?range=${timeRange}`)
      ]);
      const pre = await preRes.json();
      const post = await postRes.json();
      
      const isPreEmpty = !Array.isArray(pre) || pre.length === 0 || pre.every(s => s.data.length === 0);
      const isPostEmpty = !Array.isArray(post) || post.length === 0 || post.every(s => s.data.length === 0);

      if (isPreEmpty && isPostEmpty) {
        setPrepaidData(getMockData('prepaid', timeRange));
        setPostpaidData(getMockData('postpaid', timeRange));
        setUseMock(true);
      } else {
        setPrepaidData(Array.isArray(pre) ? pre : []);
        setPostpaidData(Array.isArray(post) ? post : []);
        setUseMock(false);
      }
      setLoading(false);
    } catch (e) {
      setPrepaidData(getMockData('prepaid', timeRange));
      setPostpaidData(getMockData('postpaid', timeRange));
      setUseMock(true);
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/payments/rules');
      const data = await res.json();
      setRules(data);
    } catch (e) {}
  };

  const saveRule = async (rule) => {
    const url = rule.id ? `http://localhost:3001/api/payments/rules/${rule.id}` : 'http://localhost:3001/api/payments/rules';
    const method = rule.id ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    fetchRules();
  };

  const deleteRule = async (id) => {
    await fetch(`http://localhost:3001/api/payments/rules/${id}`, { method: 'DELETE' });
    fetchRules();
  };

  const formatChartData = (seriesData, key) => {
    const timeMap = {};
    seriesData.forEach(s => {
      if (s && Array.isArray(s.data)) {
        s.data.forEach(p => {
          // Utiliser un timestamp arrondi pour regrouper les données temporellement
          // et éviter les collisions de clés Recharts
          const roundedTime = Math.floor(p.time / 1000) * 1000;
          if (!timeMap[roundedTime]) timeMap[roundedTime] = { time: roundedTime };
          timeMap[roundedTime][s[key]] = p.entry_count;
        });
      }
    });
    return Object.values(timeMap).sort((a, b) => a.time - b.time);
  };

  const prepaidChartData = formatChartData(prepaidData, 'operator');
  const postpaidChartData = formatChartData(postpaidData, 'tier');

  return (
    <div style={{ padding: '30px', backgroundColor: 'var(--bg-main)', minHeight: '100%', position: 'relative' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#181b1f', border: '1px solid #2c3235', padding: '15px 25px', borderRadius: '2px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '10px', color: '#8e8e8e', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
            HEURE SYSTÈME :
          </div>
          <div style={{ fontSize: '48px', color: '#5794f2', fontFamily: 'monospace', fontWeight: 'bold' }}>
            {currentTime}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
           <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Vues de Transactions</h1>
           <p style={{ fontSize: '12px', color: '#8e8e8e' }}>Monitorage en temps réel des flux opérateurs</p>
           {useMock && (
             <div style={{ marginTop: '10px', backgroundColor: '#f5912315', color: '#f5a623', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #f5912330' }}>
               DONNÉES SIMULÉES (Mode Démo)
             </div>
           )}
           {loading && <div style={{ fontSize: '10px', color: '#5794f2', marginTop: '4px' }}>Actualisation...</div>}
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* PREPAID */}
        <div style={{ backgroundColor: '#111217', border: '1px solid #2c3235', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ backgroundColor: '#21262d', padding: '10px 20px', fontSize: '11px', fontWeight: 'bold', color: '#ccd3ff', borderBottom: '1px solid #2c3235' }}>
            PREPAID - EVOLUTION TRANS. ACHAT CRÉDIT / {timeRange.toUpperCase()}
          </div>
          <div style={{ display: 'flex', height: '350px' }}>
            <div style={{ flex: 1, padding: '15px' }}>
              {prepaidChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <AreaChart key={`pre-${timeRange}-${prepaidChartData.length}`} data={prepaidChartData}>
                    <defs>
                      {Object.keys(OPERATOR_COLORS).map(op => (
                        <linearGradient key={op} id={`grad-pre-${op}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={OPERATOR_COLORS[op]} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={OPERATOR_COLORS[op]} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                    <XAxis 
                      dataKey="time" 
                      type="number" 
                      domain={[Date.now() - (RANGE_HOURS[timeRange] || 1) * 3600000, Date.now()]} 
                      tickFormatter={t => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} 
                      stroke="#444" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#181b1f', border: '1px solid #333', color: '#fff' }} labelFormatter={t => new Date(t).toLocaleString()} />
                    {prepaidData.map((s, idx) => <Area key={`${s.operator}-${idx}`} type="monotone" dataKey={s.operator} stroke={OPERATOR_COLORS[s.operator]} fill={`url(#grad-pre-${s.operator})`} strokeWidth={2} dot={false} isAnimationActive={false} />)}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>Initialisation du graphique...</div>
              )}
            </div>
            <div style={{ width: '220px', borderLeft: '1px solid #2c3235', backgroundColor: '#0b0c10', padding: '15px', overflowY: 'auto' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', borderBottom: '1px solid #2c3235', paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', color: '#8e8e8e' }}>
                <span>OPERATOR</span> <span>MAX / TOTAL</span>
              </div>
              {prepaidData.map(s => {
                const max = Math.max(...s.data.map(d => d.entry_count || 0));
                const total = s.data.reduce((acc, d) => acc + (d.entry_count || 0), 0);
                return (
                  <div key={s.operator} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: OPERATOR_COLORS[s.operator] }} />
                      <span style={{ fontWeight: 500 }}>{s.operator}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#5794f2', fontWeight: 'bold' }}>{max}</span>
                      <span style={{ color: '#555', margin: '0 4px' }}>|</span>
                      <span>{total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* POSTPAID */}
        <div style={{ backgroundColor: '#111217', border: '1px solid #2c3235', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ backgroundColor: '#21262d', padding: '10px 20px', fontSize: '11px', fontWeight: 'bold', color: '#ccd3ff', borderBottom: '1px solid #2c3235' }}>
            POSTPAID - EVOLUTION TRANS. OPÉRATEURS / {timeRange.toUpperCase()}
          </div>
          <div style={{ display: 'flex', height: '350px' }}>
            <div style={{ flex: 1, padding: '15px' }}>
              {postpaidChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <AreaChart key={`post-${timeRange}-${postpaidChartData.length}`} data={postpaidChartData}>
                    <defs>
                      {Object.keys(OPERATOR_COLORS).map(op => (
                        <linearGradient key={op} id={`grad-post-${op}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={OPERATOR_COLORS[op]} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={OPERATOR_COLORS[op]} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                    <XAxis 
                      dataKey="time" 
                      type="number" 
                      domain={[Date.now() - (RANGE_HOURS[timeRange] || 1) * 3600000, Date.now()]} 
                      tickFormatter={t => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} 
                      stroke="#444" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#181b1f', border: '1px solid #333', color: '#fff' }} labelFormatter={t => new Date(t).toLocaleString()} />
                    {postpaidData.map((s, idx) => <Area key={`${s.tier}-${idx}`} type="monotone" dataKey={s.tier} stroke={OPERATOR_COLORS[s.tier]} fill={`url(#grad-post-${s.tier})`} strokeWidth={2} dot={false} isAnimationActive={false} />)}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>Initialisation du graphique...</div>
              )}
            </div>
            <div style={{ width: '220px', borderLeft: '1px solid #2c3235', backgroundColor: '#0b0c10', padding: '15px', overflowY: 'auto' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', borderBottom: '1px solid #2c3235', paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', color: '#8e8e8e' }}>
                <span>OPERATOR</span> <span>MAX / TOTAL</span>
              </div>
              {postpaidData.map(s => {
                const max = Math.max(...s.data.map(d => d.entry_count || 0));
                const total = s.data.reduce((acc, d) => acc + (d.entry_count || 0), 0);
                return (
                  <div key={s.tier} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: OPERATOR_COLORS[s.tier] }} />
                      <span style={{ fontWeight: 500 }}>{s.tier}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#5794f2', fontWeight: 'bold' }}>{max}</span>
                      <span style={{ color: '#555', margin: '0 4px' }}>|</span>
                      <span>{total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      <div style={{ marginTop: '40px', borderTop: '1px solid #222', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '11px', color: connected ? '#22d3a3' : '#f5534b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connected ? '#22d3a3' : '#f5534b' }} />
            {connected ? 'SERVEUR CONNECTÉ' : 'CONNEXION PERDUE'}
          </div>
          <button 
            onClick={() => setShowRules(true)}
            style={{ background: 'none', border: 'none', color: '#545b78', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Settings size={14} /> RÉGLAGES DES ALERTES
          </button>
      </div>

      {showRules && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel" style={{ width: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}><BellRing size={20} color="var(--warning)" /> SEUILS D'ALERTE PERSONNALISÉS</h2>
              <X size={24} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setShowRules(false)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
               <div style={{ display: 'grid', gap: '20px' }}>
                 {rules.map((r, i) => (
                   <div key={r.id} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,1%)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                       <div style={{ display: 'flex', gap: '10px' }}>
                          <select 
                            value={r.type} 
                            onChange={(e) => saveRule({...r, type: e.target.value})}
                            style={{ background: '#181b1f', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                          >
                            <option value="PREPAID">PREPAID</option>
                            <option value="POSTPAID">POSTPAID</option>
                          </select>
                          <select 
                            value={r.operator} 
                            onChange={(e) => saveRule({...r, operator: e.target.value})}
                            style={{ background: '#181b1f', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                          >
                             <option value="ALL">Tous les opérateurs</option>
                             {Object.keys(OPERATOR_COLORS).map(op => <option key={op} value={op}>{op}</option>)}
                          </select>
                       </div>
                       <Trash2 size={16} color="var(--danger)" style={{ cursor: 'pointer' }} onClick={() => deleteRule(r.id)} />
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Alerter si baisse &gt; 
                        <input 
                          type="number" 
                          value={r.threshold} 
                          onChange={(e) => saveRule({...r, threshold: parseInt(e.target.value)})}
                          style={{ width: '60px', background: '#000', border: '1px solid #333', color: 'var(--warning)', textAlign: 'center', padding: '4px', fontWeight: 'bold' }} 
                        /> % 
                        sur 
                        <input 
                          type="number" 
                          value={r.intervalMin} 
                          onChange={(e) => saveRule({...r, intervalMin: parseInt(e.target.value)})}
                          style={{ width: '60px', background: '#000', border: '1px solid #333', color: '#fff', textAlign: 'center', padding: '4px' }} 
                        /> minutes.
                        Grade:
                        <select 
                           value={r.severity} 
                           onChange={(e) => saveRule({...r, severity: e.target.value})}
                           style={{ background: 'none', border: 'none', color: r.severity === 'critical' ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold', fontSize: '11px' }}
                        >
                          <option value="critical">CRITIQUE</option>
                          <option value="warning">ATTENTION</option>
                        </select>
                     </div>
                   </div>
                 ))}
                 <button 
                   onClick={() => saveRule({ type: 'PREPAID', operator: 'ALL', threshold: 30, intervalMin: 60, severity: 'critical', enabled: true })}
                   style={{ padding: '15px', border: '1px dashed var(--border)', borderRadius: '12px', background: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '13px', fontWeight: 'bold' }}
                 >
                   <Plus size={18} /> AJOUTER UNE CONDITION PERSONNALISÉE
                 </button>
               </div>
            </div>
            <div style={{ padding: '20px 30px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
               <button className="btn-premium" onClick={() => setShowRules(false)} style={{ padding: '10px 40px' }}>FERMER ET APPLIQUER</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
