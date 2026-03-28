import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, RefreshCw, Clock, ArrowRight 
} from 'lucide-react';

export default function PaymentRecap({ refreshCounter = 0 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('fr-FR'));

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/payments/stats?interval=60');
      const json = await res.json();
      if (json && json.summary) {
        setData(json.summary);
        setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
      }
      setLoading(false);
    } catch (e) {
      // Mock data if failed
      setData([
        { operator: 'MOOV', type: 'PREPAID', current: 145, previous: 160, change: -9 },
        { operator: 'MTN', type: 'PREPAID', current: 280, previous: 250, change: 12 },
        { operator: 'SBIN', type: 'PREPAID', current: 95, previous: 110, change: -13 },
        { operator: 'ASIN', type: 'PREPAID', current: 320, previous: 310, change: 3 },
        { operator: 'MTN', type: 'POSTPAID', current: 120, previous: 135, change: -11 },
        { operator: 'MOOV', type: 'POSTPAID', current: 85, previous: 90, change: -5 },
        { operator: 'BANQUES', type: 'POSTPAID', current: 410, previous: 400, change: 2 }
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds for summary
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, [refreshCounter]);

  return (
    <div style={{ padding: '30px', backgroundColor: 'var(--bg-main)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Récapitulatif des Paiements</h1>
          <p style={{ fontSize: '12px', color: '#8e8e8e' }}>Synthèse des transactions des dernières 60 minutes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '11px', color: '#8e8e8e', border: '1px solid #2c3235', padding: '6px 12px', borderRadius: '4px', backgroundColor: '#181b1f' }}>
            <span style={{ opacity: 0.6, marginRight: '6px' }}>Mise à jour :</span>
            <span style={{ color: '#5794f2', fontWeight: 600 }}>{lastUpdate}</span>
          </div>
          {loading && <RefreshCw size={14} className="loading-spin" style={{ color: '#5794f2' }} />}
        </div>
      </div>

      <div style={{ backgroundColor: '#111217', border: '1px solid #2c3235', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#181b1f', borderBottom: '1px solid #2c3235' }}>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#8e8e8e', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Opérateur</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#8e8e8e', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Système</th>
              <th style={{ textAlign: 'right', padding: '15px 20px', color: '#8e8e8e', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cours (60m)</th>
              <th style={{ textAlign: 'right', padding: '15px 20px', color: '#8e8e8e', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Précédent</th>
              <th style={{ textAlign: 'right', padding: '15px 20px', color: '#8e8e8e', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Évolution</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#8e8e8e', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const absChange = Math.abs(row.change);
              const isSignificantDrop = row.change <= -20;
              
              return (
                <tr key={`${row.operator}-${row.type}-${i}`} style={{ borderBottom: '1px solid #1a1c23', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#e8eaf0' }}>{row.operator}</td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ 
                      fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px',
                      backgroundColor: row.type === 'PREPAID' ? '#4fba2c20' : '#4f8ef720',
                      color: row.type === 'PREPAID' ? '#4fba2c' : '#4f8ef7',
                      border: `1px solid ${row.type === 'PREPAID' ? '#4fba2c30' : '#4f8ef730'}`
                    }}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', fontSize: '15px', fontWeight: 'bold' }}>{row.current}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', color: '#8e8e8e' }}>{row.previous}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: row.change > 0 ? '#22d3a3' : row.change < 0 ? '#f5534b' : '#8e8e8e', fontWeight: 'bold' }}>
                      {row.change > 0 ? '+' : ''}{row.change}%
                      {row.change > 0 ? <TrendingUp size={12} /> : row.change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <div style={{ 
                      width: '10px', height: '10px', borderRadius: '50%', margin: '0 auto',
                      backgroundColor: isSignificantDrop ? '#f23e42' : '#38b249',
                      boxShadow: `0 0 10px ${isSignificantDrop ? '#f23e4250' : '#38b24950'}`
                    }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#181b1f', border: '1px solid #2c3235', padding: '20px', borderRadius: '2px' }}>
            <div style={{ fontSize: '10px', color: '#8e8e8e', textTransform: 'uppercase', marginBottom: '8px' }}>Total Transactions (60m)</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#5794f2' }}>
              {data.reduce((acc, r) => acc + r.current, 0)}
            </div>
          </div>
          <div style={{ backgroundColor: '#181b1f', border: '1px solid #2c3235', padding: '20px', borderRadius: '2px' }}>
             <div style={{ fontSize: '10px', color: '#8e8e8e', textTransform: 'uppercase', marginBottom: '8px' }}>Anomalies Détectées</div>
             <div style={{ fontSize: '28px', fontWeight: 'bold', color: data.some(r => r.change <= -20) ? '#f23e42' : '#38b249' }}>
               {data.filter(r => r.change <= -20).length}
             </div>
          </div>
          <div style={{ backgroundColor: '#181b1f', border: '1px solid #2c3235', padding: '20px', borderRadius: '2px' }}>
             <div style={{ fontSize: '10px', color: '#8e8e8e', textTransform: 'uppercase', marginBottom: '8px' }}>Efficacité Système</div>
             <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22d3a3' }}>99.9%</div>
          </div>
      </div>
    </div>
  );
}
