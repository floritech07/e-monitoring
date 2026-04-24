import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { RefreshCw, Zap, AlertTriangle, CheckCircle, Battery } from 'lucide-react';

// ─── Couleurs état ─────────────────────────────────────────────────────────────
const C = {
  ok:      '#10B981', warning: '#F59E0B', critical: '#EA580C',
  offline: '#374151', live:    '#4F8EF7', neutral:  '#6B7280',
};

// ─── Composants SVG réutilisables ─────────────────────────────────────────────

function Bus({ x, y, w, label, color = C.live }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={10} fill={color} rx="2" opacity="0.9" />
      <text x={x + w / 2} y={y - 4} textAnchor="middle" fill={color} fontSize="9" fontWeight="700">{label}</text>
    </g>
  );
}

function Breaker({ x, y, label, status = 'closed', value }) {
  const col = status === 'open' ? C.warning : C.ok;
  return (
    <g>
      <rect x={x - 8} y={y} width={16} height={20} fill="var(--bg-surface)"
        stroke={col} strokeWidth="1.5" rx="2" />
      <line x1={x} y1={y} x2={x} y2={y + 20} stroke={col} strokeWidth={status === 'open' ? 0 : 2} />
      {status === 'open' && (
        <line x1={x - 4} y1={y + 5} x2={x + 4} y2={y + 15} stroke={col} strokeWidth="1.5" />
      )}
      {label && <text x={x} y={y + 28} textAnchor="middle" fill="var(--text-muted)" fontSize="8">{label}</text>}
      {value && <text x={x} y={y - 4} textAnchor="middle" fill={col} fontSize="8">{value}</text>}
    </g>
  );
}

function UPSBox({ x, y, w = 100, h = 55, name, model, battPct, mode, power }) {
  const col = battPct < 20 ? C.critical : battPct < 40 ? C.warning : C.ok;
  const modCol = mode === 'on_line' ? C.ok : mode === 'on_battery' ? C.warning : C.offline;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="rgba(20,30,50,0.95)"
        stroke={col} strokeWidth="1.5" rx="4" />
      <rect x={x} y={y} width={w} height={5} fill={col} rx="3" />
      <text x={x + w / 2} y={y + 16} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{name}</text>
      <text x={x + w / 2} y={y + 26} textAnchor="middle" fill="var(--text-muted)" fontSize="8">{model}</text>
      {/* Barre batterie */}
      <rect x={x + 6} y={y + 30} width={w - 12} height={8} fill="rgba(255,255,255,0.08)" rx="2" />
      <rect x={x + 6} y={y + 30} width={(w - 12) * (battPct / 100)} height={8} fill={col} rx="2" />
      <text x={x + w / 2} y={y + 37} textAnchor="middle" fill="white" fontSize="7" fontWeight="700">{battPct}%</text>
      <text x={x + 6} y={y + 50} fill={modCol} fontSize="7">
        {mode === 'on_line' ? '✓ Secteur' : mode === 'on_battery' ? '⚡ Batterie' : '— Offline'}
      </text>
      {power && <text x={x + w - 6} y={y + 50} textAnchor="end" fill={C.neutral} fontSize="7">{power} kW</text>}
    </g>
  );
}

function PDUBox({ x, y, name, outlets, totalW, phase }) {
  const usedPct = Math.min(100, Math.round((totalW / 7000) * 100));
  const col = usedPct > 85 ? C.critical : usedPct > 70 ? C.warning : C.ok;
  return (
    <g>
      <rect x={x} y={y} width={80} height={50} fill="rgba(20,30,50,0.9)"
        stroke="#EAB308" strokeWidth="1" rx="3" />
      <rect x={x} y={y} width={80} height={4} fill="#EAB308" rx="2" />
      <text x={x + 40} y={y + 14} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">{name}</text>
      <text x={x + 40} y={y + 24} textAnchor="middle" fill="#EAB308" fontSize="8">{outlets} prises</text>
      <rect x={x + 4} y={y + 29} width={72} height={6} fill="rgba(255,255,255,0.1)" rx="2" />
      <rect x={x + 4} y={y + 29} width={72 * usedPct / 100} height={6} fill={col} rx="2" />
      <text x={x + 40} y={y + 45} textAnchor="middle" fill={col} fontSize="7">
        {(totalW / 1000).toFixed(1)} kW ({usedPct}%)
      </text>
    </g>
  );
}

function GenSet({ x, y, w = 110, h = 60, data }) {
  const running = data?.state === 'running';
  const col = running ? C.ok : data?.state === 'alarm' ? C.critical : C.neutral;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="rgba(20,30,50,0.9)"
        stroke={col} strokeWidth="1.5" rx="4" />
      <rect x={x} y={y} width={w} height={5} fill={col} rx="3" />
      <text x={x + w / 2} y={y + 16} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Groupe Élec.</text>
      <text x={x + w / 2} y={y + 26} textAnchor="middle" fill="var(--text-muted)" fontSize="8">Cummins C220D5</text>
      <text x={x + 8} y={y + 38} fill={col} fontSize="8">
        {running ? '▶ En marche' : '⏸ Arrêt'}
      </text>
      {data?.fuelLevelPct != null && (
        <>
          <rect x={x + 4} y={y + 44} width={w - 8} height={5} fill="rgba(255,255,255,0.1)" rx="2" />
          <rect x={x + 4} y={y + 44} width={(w - 8) * (data.fuelLevelPct / 100)} height={5}
            fill={data.fuelLevelPct < 20 ? C.critical : C.warning} rx="2" />
          <text x={x + w / 2} y={y + 57} textAnchor="middle" fill="var(--text-muted)" fontSize="7">
            Carburant {data.fuelLevelPct}%
          </text>
        </>
      )}
    </g>
  );
}

function Wire({ x1, y1, x2, y2, live = true, label }) {
  const col = live ? C.live : C.neutral;
  const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  return (
    <g>
      <polyline points={`${x1},${y1} ${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`}
        fill="none" stroke={col} strokeWidth="1.5"
        strokeDasharray={live ? undefined : '4,3'} opacity="0.7" />
      {label && (
        <text x={mid.x + 4} y={mid.y - 3} fill={col} fontSize="7">{label}</text>
      )}
    </g>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DiagrammeUnifilaireUPS() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [env, snmp] = await Promise.allSettled([
        api.getEnvironment(),
        api.getSnmpData(),
      ]);
      setData({
        env:  env.status  === 'fulfilled' ? env.value  : null,
        snmp: snmp.status === 'fulfilled' ? snmp.value : null,
      });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 20000); return () => clearInterval(iv); }, [fetchData]);

  const ups1 = data?.snmp ? Object.values(data.snmp).find(d => d?.type === 'ups') : null;
  const gen  = data?.env?.genset;
  const pdus = data?.env?.pdus || [];

  const ht = data?.env?.powerQuality || {};

  return (
    <div className="fade-in" style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={20} style={{ color: '#EAB308' }} />
            Synoptique Unifilaire — Alimentation DC SBEE
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            TGBT · ATS · UPS · Groupe électrogène · PDU · Racks
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={13} /></button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Tension secteur', value: `${ht.voltageL1 || 230} V`, color: C.ok },
          { label: 'cos φ global', value: ht.powerFactor?.toFixed(2) || '0.95', color: C.ok },
          { label: 'THD tension', value: `${ht.thd?.toFixed(1) || '2.3'} %`, color: (ht.thd || 2.3) > 5 ? C.warning : C.ok },
          { label: 'UPS 1 batterie', value: `${ups1?.battery?.chargePct ?? 87} %`, color: (ups1?.battery?.chargePct ?? 87) < 40 ? C.critical : C.ok },
          { label: 'Groupe élec.', value: gen?.state === 'running' ? 'En marche' : 'Arrêté', color: gen?.state === 'running' ? C.warning : C.neutral },
        ].map(k => (
          <div key={k.label} className="card glass-panel" style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Schéma SVG ── */}
      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 500" style={{ width: '100%', maxHeight: 520, background: '#0a0c10' }}>
          <defs>
            <filter id="glow-wire">
              <feGaussianBlur stdDeviation="1.5" result="b" />
              <feComposite in="SourceGraphic" in2="b" operator="over" />
            </filter>
          </defs>

          {/* ── Réseau HT / Arrivée secteur ── */}
          <text x={80} y={30} fill="#EAB308" fontSize="11" fontWeight="700">RÉSEAU EBENIN HTA 15kV</text>
          <line x1={80} y1={35} x2={820} y2={35} stroke="#EAB308" strokeWidth="3" filter="url(#glow-wire)" />
          {[180, 380, 580].map(x => (
            <line key={x} x1={x} y1={35} x2={x} y2={55} stroke="#EAB308" strokeWidth="2" />
          ))}

          {/* Transformateurs */}
          {[180, 380, 580].map((x, i) => (
            <g key={i}>
              <ellipse cx={x} cy={68} rx={20} ry={12} fill="none" stroke="#EAB308" strokeWidth="1.5" />
              <ellipse cx={x} cy={78} rx={20} ry={12} fill="none" stroke="#EAB308" strokeWidth="1.5" />
              <text x={x} y={100} textAnchor="middle" fill="var(--text-muted)" fontSize="8">Trafo {i + 1}</text>
            </g>
          ))}

          {/* Bus BT 400V */}
          <Bus x={60} y={110} w={760} label="JEU DE BARRES BT 400V / 50Hz" color={C.live} />

          {/* Fils depuis transformateurs */}
          {[180, 380, 580].map(x => (
            <line key={x} x1={x} y1={90} x2={x} y2={110} stroke={C.live} strokeWidth="1.5" />
          ))}

          {/* TGBT Disjoncteurs */}
          <text x={60} y={140} fill="var(--text-muted)" fontSize="9" fontWeight="600">TGBT</text>
          {[150, 250, 350, 450, 550, 650].map((x, i) => (
            <Breaker key={i} x={x} y={122} label={`D${i + 1}`}
              status={i === 2 ? 'open' : 'closed'}
              value={i === 0 ? '120A' : i === 1 ? '80A' : i === 2 ? 'OFF' : i === 3 ? '60A' : i === 4 ? '40A' : '30A'} />
          ))}

          {/* ATS */}
          <rect x={690} y={115} width={60} height={30} fill="rgba(234,179,8,0.15)"
            stroke="#EAB308" strokeWidth="1.5" rx="4" />
          <text x={720} y={128} textAnchor="middle" fill="#EAB308" fontSize="9" fontWeight="700">ATS</text>
          <text x={720} y={138} textAnchor="middle" fill={C.ok} fontSize="7">Secteur</text>

          {/* Fils vers UPS */}
          <Wire x1={150} y1={148} x2={120} y2={190} live label="Réseau A" />
          <Wire x1={350} y1={148} x2={350} y2={190} live label="Réseau B" />

          {/* UPS */}
          <UPSBox x={70} y={190} name="UPS SUKAM-01" model="SUKAM 10kVA"
            battPct={ups1?.battery?.chargePct ?? 87}
            mode={ups1?.status?.input ?? 'on_line'}
            power={ups1?.output?.powerW ? (ups1.output.powerW / 1000).toFixed(1) : '6.2'} />
          <UPSBox x={295} y={190} name="UPS SUKAM-02" model="SUKAM 10kVA"
            battPct={Math.max(20, (ups1?.battery?.chargePct ?? 85) - 3)}
            mode={ups1?.status?.input ?? 'on_line'}
            power="4.8" />

          {/* Groupe électrogène */}
          <GenSet x={560} y={180} data={gen} />
          <Wire x1={720} y1={148} x2={615} y2={180} live={false} label="Secours" />

          {/* Bus ondulé */}
          <Bus x={60} y={270} w={400} label="BUS ONDULÉ — DOMAIN A" color="#10B981" />
          <Bus x={480} y={270} w={280} label="BUS ONDULÉ — DOMAIN B" color="#A855F7" />

          <line x1={120} y1={248} x2={120} y2={270} stroke="#10B981" strokeWidth="1.5" />
          <line x1={345} y1={248} x2={345} y2={270} stroke="#A855F7" strokeWidth="1.5" />

          {/* PDU */}
          {pdus.slice(0, 3).map((pdu, i) => (
            <PDUBox key={i}
              x={80 + i * 130} y={295}
              name={pdu.name || `PDU-0${i + 1}`}
              outlets={pdu.outlets || 8}
              totalW={pdu.totalPowerW || (3500 - i * 600)}
              phase={`L${i + 1}`} />
          ))}
          {/* Fallback PDUs si pas de données */}
          {pdus.length === 0 && [
            { name: 'PDU-01', outlets: 8, totalW: 3800 },
            { name: 'PDU-02', outlets: 8, totalW: 3100 },
            { name: 'PDU-03', outlets: 8, totalW: 2600 },
          ].map((pdu, i) => (
            <PDUBox key={`sim-${i}`} x={80 + i * 130} y={295}
              name={pdu.name} outlets={pdu.outlets} totalW={pdu.totalW} />
          ))}

          {/* Fils vers racks */}
          {[120, 250, 380, 520, 650, 750].map((x, i) => (
            <g key={i}>
              <line x1={x} y1={350} x2={x} y2={380} stroke={i < 4 ? '#10B981' : '#A855F7'}
                strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
              <rect x={x - 20} y={380} width={40} height={25}
                fill="rgba(79,142,247,0.2)" stroke={i < 4 ? '#10B981' : '#A855F7'}
                strokeWidth="1" rx="2" />
              <text x={x} y={396} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">
                {['RACK-A','RACK-A2','RACK-A3','RACK-A4','RACK-B','RACK-B2'][i]}
              </text>
            </g>
          ))}

          {/* Légende */}
          <g transform="translate(760, 290)">
            <text x={0} y={0} fill="var(--text-muted)" fontSize="8" fontWeight="700">LÉGENDE</text>
            <line x1={0} y1={8} x2={20} y2={8} stroke={C.live} strokeWidth="2" />
            <text x={24} y={12} fill="var(--text-muted)" fontSize="7">Alimentation secteur</text>
            <line x1={0} y1={20} x2={20} y2={20} stroke="#10B981" strokeWidth="2" />
            <text x={24} y={24} fill="var(--text-muted)" fontSize="7">Ondulé Domain A</text>
            <line x1={0} y1={32} x2={20} y2={32} stroke="#A855F7" strokeWidth="2" />
            <text x={24} y={36} fill="var(--text-muted)" fontSize="7">Ondulé Domain B</text>
            <line x1={0} y1={44} x2={20} y2={44} stroke={C.neutral} strokeWidth="2" strokeDasharray="4,3" />
            <text x={24} y={48} fill="var(--text-muted)" fontSize="7">Circuit ouvert/secours</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
