import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Thermometer, Droplets, Zap, Server, AlertTriangle, CheckCircle,
  Layers, Eye, EyeOff, ChevronRight, X, Activity, Wind, Cpu,
  HardDrive, Wifi, Battery, RefreshCw, Maximize2,
} from 'lucide-react';
import { api } from '../api';

// ─── Constantes visuelles ────────────────────────────────────────────────────

const STATUS_COLOR = {
  ok:       '#10B981',
  warning:  '#F59E0B',
  critical: '#EA580C',
  disaster: '#DC2626',
  offline:  '#374151',
  unknown:  '#6B7280',
  running:  '#10B981',
  idle:     '#6B7280',
};

const SEV_LABEL = { ok: 'OK', warning: 'Attention', critical: 'Critique', disaster: 'Désastre', offline: 'Hors ligne' };

// ─── Plan salle SBEE ─────────────────────────────────────────────────────────
// Toutes les coordonnées sont en unités SVG (viewBox 0 0 1100 680)

const ROOM = { x: 30, y: 60, w: 780, h: 560 };
const AISLES = [
  { id: 'cold-n', type: 'cold', x: 30,  y: 60,  w: 780, h: 95,  label: 'Allée froide — Nord' },
  { id: 'hot',    type: 'hot',  x: 30,  y: 260, w: 780, h: 180, label: 'Allée chaude' },
  { id: 'cold-s', type: 'cold', x: 30,  y: 535, w: 780, h: 85,  label: 'Allée froide — Sud' },
];

const RACKS_DEF = [
  // Row A (North) — serveurs production
  { id: 'rack-a', name: 'RACK-A', desc: 'Serveurs Prod', row: 'A', x: 80,  y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: ['ESXi-01-SBEE','SW-CORE-01','SW-ACCESS-01','UPS-SUKAM-01'] },
  { id: 'rack-a2', name: 'RACK-A2', desc: 'Extension Prod', row: 'A', x: 195, y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: ['ESXi-02-SBEE'] },
  { id: 'rack-a3', name: 'RACK-A3', desc: 'Réseau / Brassage', row: 'A', x: 310, y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: [] },
  { id: 'rack-a4', name: 'RACK-A4', desc: 'Réserve', row: 'A', x: 425, y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: [] },
  // Row B (South) — stockage & backup
  { id: 'rack-b', name: 'RACK-B', desc: 'Backup / ESXi-03', row: 'B', x: 80,  y: 440, w: 100, h: 95, cmdbId: 'rack-b',
    equipment: ['ESXi-03-SBEE','NAS-SYNOLOGY-01','SAN-HPE-MSA-01','UPS-SUKAM-02'] },
  { id: 'rack-b2', name: 'RACK-B2', desc: 'Stockage NAS', row: 'B', x: 195, y: 440, w: 100, h: 95, cmdbId: 'rack-b',
    equipment: ['NAS-SYNOLOGY-01'] },
  { id: 'rack-b3', name: 'RACK-B3', desc: 'Réserve', row: 'B', x: 310, y: 440, w: 100, h: 95, cmdbId: 'rack-b',
    equipment: [] },
];

const EQUIPMENT_DEF = [
  { id: 'crac-a', name: 'CRAC-01', type: 'crac', subtype: 'CRAC Nord', x: 570, y: 80,  w: 200, h: 120 },
  { id: 'crac-b', name: 'CRAC-02', type: 'crac', subtype: 'CRAC Sud',  x: 570, y: 430, w: 200, h: 120 },
  { id: 'tgbt',   name: 'TGBT',    type: 'power', subtype: 'Tableau Général BT', x: 570, y: 260, w: 90,  h: 100 },
];

const SENSORS_DEF = [
  { id: 's1', x: 130, y: 90,  label: 'T° Nord-A', zone: 'cold-n' },
  { id: 's2', x: 240, y: 90,  label: 'T° Nord-B', zone: 'cold-n' },
  { id: 's3', x: 130, y: 340, label: 'T° Allée C', zone: 'hot' },
  { id: 's4', x: 310, y: 340, label: 'T° Allée D', zone: 'hot' },
  { id: 's5', x: 130, y: 580, label: 'T° Sud-A',  zone: 'cold-s' },
  { id: 's6', x: 310, y: 580, label: 'T° Sud-B',  zone: 'cold-s' },
  { id: 's7', x: 620, y: 150, label: 'T° CRAC-1', zone: 'crac' },
  { id: 's8', x: 620, y: 490, label: 'T° CRAC-2', zone: 'crac' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tempToColor(t) {
  if (t < 18)  return '#3B82F6';  // bleu (trop froid)
  if (t < 22)  return '#10B981';  // vert (optimal)
  if (t < 27)  return '#A3E635';  // jaune-vert
  if (t < 30)  return '#F59E0B';  // orange
  if (t < 35)  return '#EA580C';  // orange foncé
  return '#DC2626';               // rouge critique
}

function interpolateTemp(px, py, sensors) {
  let weightSum = 0, tempSum = 0;
  for (const s of sensors) {
    const d = Math.hypot(px - s.x, py - s.y);
    const w = d < 1 ? 1e6 : 1 / (d * d);
    weightSum += w;
    tempSum   += w * (s.tempC || 22);
  }
  return weightSum > 0 ? tempSum / weightSum : 22;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RoomMap() {
  const navigate   = useNavigate();
  const svgRef     = useRef(null);
  const isPanning  = useRef(false);
  const panStart   = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const [sensors,       setSensors]       = useState([]);
  const [snmpData,      setSnmpData]      = useState({});
  const [redfishData,   setRedfishData]   = useState({});
  const [clusters,      setClusters]      = useState([]);
  const [activeAlerts,  setActiveAlerts]  = useState([]);
  const [crac,          setCrac]          = useState([]);
  const [selectedRack,  setSelectedRack]  = useState(null);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [tooltip,       setTooltip]       = useState(null);
  const [layers, setLayers] = useState({
    racks: true, power: true, cooling: true, sensors: true,
    heatmap: false, alerts: true, network: false,
  });
  const [zoom, setZoom]   = useState(1);
  const [pan,  setPan]    = useState({ x: 0, y: 0 });
  const [alertSidebar, setAlertSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [envData, snmp, redfish, cls, alts] = await Promise.allSettled([
        api.getRoomSensors(),
        api.getSnmpData(),
        api.getRedfishServers(),
        api.getClusters(),
        api.getActiveAlerts(),
      ]);
      if (envData.status === 'fulfilled') {
        setSensors(envData.value.sensors || []);
        setCrac(envData.value.crac || []);
      }
      if (snmp.status === 'fulfilled')    setSnmpData(snmp.value);
      if (redfish.status === 'fulfilled') setRedfishData(redfish.value);
      if (cls.status === 'fulfilled')     setClusters(cls.value);
      if (alts.status === 'fulfilled')    setActiveAlerts(alts.value);
      setLastUpdate(new Date());
      setLoading(false);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // ── Zoom / Pan handlers ──────────────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();
    const delta   = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.4, Math.min(3.5, zoom * delta));
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 1 && !e.ctrlKey) return;
    isPanning.current = true;
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y, vx: pan.x, vy: pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  };

  const handleMouseUp = () => { isPanning.current = false; };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ── Dériver l'état santé d'un rack depuis les données réelles ────────────────
  function getRackStatus(rack) {
    if (rack.equipment.length === 0) return 'unknown';
    const alerts = activeAlerts.filter(a =>
      rack.equipment.some(e => a.sourceId?.includes(e.toLowerCase().replace(/-/g, '')))
    );
    if (alerts.some(a => a.severity === 'DISASTER')) return 'disaster';
    if (alerts.some(a => a.severity === 'CRITICAL')) return 'critical';
    if (alerts.some(a => a.severity === 'WARNING'))  return 'warning';

    // Vérification Redfish
    for (const eq of rack.equipment) {
      const srvId = eq.toLowerCase().replace(/-sbee$/, '').replace(/-/g, '-');
      const srv = Object.values(redfishData).find(s => s?.id === srvId || s?.name?.includes(eq.split('-')[0]));
      if (srv && srv.system?.status !== 'OK') return 'warning';
    }
    if (rack.equipment.length > 0) return 'ok';
    return 'unknown';
  }

  function getCRACStatus(cracId) {
    const c = crac.find(x => x.id === cracId);
    return c?.status || 'unknown';
  }

  function getUPSInfo() {
    const upsEntry = Object.values(snmpData).find(d => d?.type === 'ups');
    if (!upsEntry) return { label: '—', color: STATUS_COLOR.unknown };
    const pct = upsEntry.battery?.chargePct || 0;
    const ok  = upsEntry.status?.input === 'on_line';
    return {
      label: `${pct}% • ${ok ? 'Secteur' : '⚡ Batterie'}`,
      color: pct < 20 ? STATUS_COLOR.disaster : pct < 40 ? STATUS_COLOR.warning : STATUS_COLOR.ok,
    };
  }

  // ── KPIs globaux ──────────────────────────────────────────────────────────────
  const totalCPU   = clusters.reduce((s, c) => s + (c.cpu?.total || 0), 0);
  const usedCPU    = clusters.reduce((s, c) => s + (c.cpu?.used  || 0), 0);
  const cpuPct     = totalCPU > 0 ? Math.round(usedCPU / totalCPU * 100) : 0;
  const totalRAM   = clusters.reduce((s, c) => s + (c.ram?.totalGB || 0), 0);
  const usedRAM    = clusters.reduce((s, c) => s + (c.ram?.usedGB  || 0), 0);
  const ramPct     = totalRAM > 0 ? Math.round(usedRAM / totalRAM * 100) : 0;
  const avgTempC   = sensors.length ? +(sensors.reduce((s, x) => s + (x.tempC || 22), 0) / sensors.length).toFixed(1) : 22.0;
  const avgHum     = sensors.length ? Math.round(sensors.reduce((s, x) => s + (x.humidity || 47), 0) / sensors.length) : 47;
  const upsInfo    = getUPSInfo();
  const critCount  = activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'DISASTER').length;
  const warnCount  = activeAlerts.filter(a => a.severity === 'WARNING').length;

  // ── Heatmap grid ──────────────────────────────────────────────────────────────
  const heatmapCells = [];
  if (layers.heatmap && sensors.length > 0) {
    const cellW = 50, cellH = 40;
    for (let gy = 0; gy < 16; gy++) {
      for (let gx = 0; gx < 18; gx++) {
        const px = ROOM.x + gx * cellW + cellW / 2;
        const py = ROOM.y + gy * cellH + cellH / 2;
        if (px > ROOM.x + ROOM.w || py > ROOM.y + ROOM.h) continue;
        const t    = interpolateTemp(px, py, sensors);
        const col  = tempToColor(t);
        heatmapCells.push({ x: ROOM.x + gx * cellW, y: ROOM.y + gy * cellH, w: cellW, h: cellH, color: col, temp: t });
      }
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── BARRE D'ÉTAT GLOBALE ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        fontSize: 12, flexShrink: 0,
      }}>
        <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14, marginRight: 4 }}>
          SALLE SERVEUR SBEE
        </div>

        <KpiChip icon={<Activity size={12} />} label="CPU" value={`${cpuPct}%`}
          color={cpuPct > 85 ? STATUS_COLOR.critical : cpuPct > 70 ? STATUS_COLOR.warning : STATUS_COLOR.ok} />
        <KpiChip icon={<Cpu size={12} />} label="RAM" value={`${ramPct}%`}
          color={ramPct > 90 ? STATUS_COLOR.critical : ramPct > 80 ? STATUS_COLOR.warning : STATUS_COLOR.ok} />
        <KpiChip icon={<Thermometer size={12} />} label="Temp. moy." value={`${avgTempC}°C`}
          color={tempToColor(avgTempC)} />
        <KpiChip icon={<Droplets size={12} />} label="Humidité" value={`${avgHum}%`}
          color={avgHum > 65 || avgHum < 30 ? STATUS_COLOR.warning : STATUS_COLOR.ok} />
        <KpiChip icon={<Battery size={12} />} label="UPS" value={upsInfo.label} color={upsInfo.color} />

        {critCount > 0 && (
          <KpiChip icon={<AlertTriangle size={12} />} label="Critiques" value={critCount}
            color={STATUS_COLOR.critical} onClick={() => setAlertSidebar(true)} />
        )}
        {warnCount > 0 && (
          <KpiChip icon={<AlertTriangle size={12} />} label="Warnings" value={warnCount}
            color={STATUS_COLOR.warning} onClick={() => setAlertSidebar(true)} />
        )}
        {critCount === 0 && warnCount === 0 && (
          <KpiChip icon={<CheckCircle size={12} />} label="Santé" value="Normale" color={STATUS_COLOR.ok} />
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdate && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Màj {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: loading ? '#F59E0B' : '#10B981',
            boxShadow: `0 0 6px ${loading ? '#F59E0B' : '#10B981'}`, animation: 'pulse 2s infinite' }} />
          <button className="btn btn-ghost btn-sm" onClick={fetchAll} title="Actualiser">
            <RefreshCw size={12} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAlertSidebar(!alertSidebar)}
            title="Alertes actives">
            <AlertTriangle size={12} /> {activeAlerts.length}
          </button>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── PANNEAU COUCHES (gauche) ──────────────────────────────────────── */}
        <div style={{
          width: 180, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
          padding: 12, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>COUCHES</div>
          {Object.entries({
            racks: 'Racks & serveurs', power: 'Alimentation (UPS/PDU)', cooling: 'Refroidissement (CRAC)',
            sensors: 'Capteurs T°/HR', heatmap: '🌡 Carte thermique', alerts: 'Indicateurs alertes',
            network: 'Liens réseau',
          }).map(([key, label]) => (
            <label key={key} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              fontSize: 11, color: layers[key] ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '4px 6px', borderRadius: 4,
              background: layers[key] ? 'rgba(79,142,247,0.1)' : 'transparent',
            }}>
              <input type="checkbox" checked={layers[key]}
                onChange={e => setLayers(l => ({ ...l, [key]: e.target.checked }))}
                style={{ width: 12, height: 12 }} />
              {label}
            </label>
          ))}

          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>VUE</div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 4 }} onClick={resetView}>
              <Maximize2 size={11} /> Réinitialiser
            </button>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              🖱 Molette: zoom<br />
              Ctrl+drag: déplacer
            </div>
          </div>

          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>LÉGENDE</div>
            {Object.entries({ ok: 'Normal', warning: 'Attention', critical: 'Critique', offline: 'Hors ligne' }).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, marginBottom: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[k], flexShrink: 0 }} />
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* ── CANVAS SVG ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#0a0c10', cursor: 'crosshair' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 1100 680"
            style={{ width: '100%', height: '100%', userSelect: 'none' }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-strong">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              </pattern>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
              style={{ transformOrigin: '550px 340px' }}>

              {/* Fond grille */}
              <rect x="0" y="0" width="1100" height="680" fill="url(#grid)" />

              {/* ── Murs de la salle ──────────────────────────────────────── */}
              <rect x={ROOM.x} y={ROOM.y} width={ROOM.w} height={ROOM.h}
                fill="rgba(15,20,30,0.7)" stroke="#2a4060" strokeWidth="3" rx="4" />

              {/* ── Porte ────────────────────────────────────────────────── */}
              <rect x={340} y={618} width={80} height={8} fill="#3B82F6" rx="2" />
              <text x={380} y={640} textAnchor="middle" fill="#6B7280" fontSize="10">Entrée</text>

              {/* ── Allées thermiques ─────────────────────────────────────── */}
              {AISLES.map(a => (
                <rect key={a.id} x={a.x} y={a.y} width={a.w} height={a.h}
                  fill={a.type === 'cold' ? 'rgba(59,130,246,0.06)' : 'rgba(234,88,12,0.08)'}
                  stroke={a.type === 'cold' ? 'rgba(59,130,246,0.15)' : 'rgba(234,88,12,0.15)'}
                  strokeWidth="1" strokeDasharray="4,4" />
              ))}
              <text x={35} y={112} fill="rgba(59,130,246,0.5)" fontSize="9" fontStyle="italic">❄ Allée froide Nord</text>
              <text x={35} y={310} fill="rgba(234,88,12,0.6)" fontSize="9" fontStyle="italic">🔥 Allée chaude</text>
              <text x={35} y={590} fill="rgba(59,130,246,0.5)" fontSize="9" fontStyle="italic">❄ Allée froide Sud</text>

              {/* ── Heatmap thermique ─────────────────────────────────────── */}
              {layers.heatmap && heatmapCells.map((cell, i) => (
                <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                  fill={cell.color} opacity="0.25" />
              ))}

              {/* ── Racks ─────────────────────────────────────────────────── */}
              {layers.racks && RACKS_DEF.map(rack => {
                const status  = getRackStatus(rack);
                const color   = STATUS_COLOR[status] || STATUS_COLOR.unknown;
                const isEmpty = rack.equipment.length === 0;
                const alerts  = activeAlerts.filter(a =>
                  rack.equipment.some(e => a.sourceId?.toLowerCase().includes(e.split('-')[0].toLowerCase()))
                );

                return (
                  <g key={rack.id} style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedRack(rack)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ type: 'rack', data: rack, status, alerts, x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}>

                    {/* Corps du rack */}
                    <rect x={rack.x} y={rack.y} width={rack.w} height={rack.h}
                      fill={isEmpty ? 'rgba(30,40,55,0.5)' : 'rgba(20,30,50,0.9)'}
                      stroke={color} strokeWidth={status !== 'ok' && status !== 'unknown' ? 2 : 1}
                      rx="3" filter={status === 'critical' || status === 'disaster' ? 'url(#glow)' : undefined} />

                    {/* Bandeau couleur en haut */}
                    <rect x={rack.x} y={rack.y} width={rack.w} height={5} fill={color} rx="3" />

                    {/* Nom rack */}
                    <text x={rack.x + rack.w / 2} y={rack.y + 22} textAnchor="middle"
                      fill="white" fontSize="10" fontWeight="700">{rack.name}</text>
                    <text x={rack.x + rack.w / 2} y={rack.y + 33} textAnchor="middle"
                      fill="rgba(255,255,255,0.5)" fontSize="8">{rack.desc}</text>

                    {/* Indicateur équipements */}
                    {!isEmpty && (
                      <>
                        <text x={rack.x + rack.w / 2} y={rack.y + 55} textAnchor="middle"
                          fill={color} fontSize="9">{rack.equipment.length} éq.</text>
                        {/* Mini LEDs */}
                        {rack.equipment.slice(0, 4).map((eq, i) => (
                          <circle key={i}
                            cx={rack.x + 14 + i * 18}
                            cy={rack.y + rack.h - 18}
                            r={5} fill={status === 'ok' ? '#10B981' : color}
                            opacity="0.8"
                          />
                        ))}
                      </>
                    )}

                    {/* Alerte badge pulsant */}
                    {layers.alerts && alerts.length > 0 && (
                      <g>
                        <circle cx={rack.x + rack.w - 10} cy={rack.y + 18} r={8}
                          fill="#DC2626" opacity="0.9" filter="url(#glow-strong)" />
                        <text x={rack.x + rack.w - 10} y={rack.y + 22} textAnchor="middle"
                          fill="white" fontSize="8" fontWeight="bold">{alerts.length}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ── Équipements hors rack (CRAC, TGBT) ───────────────────── */}
              {EQUIPMENT_DEF.map(eq => {
                const isCrac  = eq.type === 'crac';
                const cracSt  = isCrac ? (crac.find(c => c.id === eq.id)?.status || 'unknown') : 'ok';
                const color   = STATUS_COLOR[cracSt === 'running' ? 'ok' : cracSt];
                const fill    = isCrac ? 'rgba(14,165,233,0.12)' : 'rgba(234,179,8,0.12)';
                const stroke  = isCrac ? '#0EA5E9' : '#EAB308';

                return (
                  <g key={eq.id} style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedEquip(eq)}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setTooltip({ type: 'equip', data: eq, cracStatus: cracSt, x: r.left + r.width / 2, y: r.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}>
                    <rect x={eq.x} y={eq.y} width={eq.w} height={eq.h}
                      fill={fill} stroke={stroke} strokeWidth="1.5" rx="4" />
                    <rect x={eq.x} y={eq.y} width={eq.w} height={4} fill={stroke} rx="3" />
                    <text x={eq.x + eq.w / 2} y={eq.y + 22} textAnchor="middle"
                      fill="white" fontSize="11" fontWeight="700">{eq.name}</text>
                    <text x={eq.x + eq.w / 2} y={eq.y + 34} textAnchor="middle"
                      fill="rgba(255,255,255,0.5)" fontSize="8">{eq.subtype}</text>
                    {isCrac && (
                      <text x={eq.x + eq.w / 2} y={eq.y + eq.h - 12} textAnchor="middle"
                        fill={color} fontSize="9" fontWeight="600">
                        {cracSt === 'running' ? '▶ En marche' : '⏸ Arrêté'}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── Capteurs environnementaux ─────────────────────────────── */}
              {layers.sensors && sensors.length > 0 && SENSORS_DEF.map(sd => {
                const sens = sensors.find(s => s.id === sd.id) || sensors[0];
                const col  = sens ? tempToColor(sens.tempC) : '#6B7280';
                return (
                  <g key={sd.id}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setTooltip({ type: 'sensor', data: { ...sd, ...sens }, x: r.left, y: r.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}>
                    <circle cx={sd.x} cy={sd.y} r={7} fill={col} opacity="0.9"
                      filter="url(#glow)" style={{ cursor: 'help' }} />
                    <circle cx={sd.x} cy={sd.y} r={3} fill="white" opacity="0.8" />
                    {sens && (
                      <text x={sd.x + 9} y={sd.y + 4} fill={col} fontSize="8" fontWeight="600">
                        {sens.tempC}°C
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── Liens réseau (couche optionnelle) ─────────────────────── */}
              {layers.network && (
                <g opacity="0.5">
                  <line x1={130} y1={207} x2={130} y2={535} stroke="#06B6D4" strokeWidth="1.5"
                    strokeDasharray="4,3" />
                  <line x1={245} y1={207} x2={245} y2={535} stroke="#06B6D4" strokeWidth="1"
                    strokeDasharray="4,3" />
                </g>
              )}

              {/* ── Légende échelle ──────────────────────────────────────── */}
              <g>
                <line x1={850} y1={650} x2={950} y2={650} stroke="#374151" strokeWidth="1.5" />
                <line x1={850} y1={645} x2={850} y2={655} stroke="#374151" strokeWidth="1.5" />
                <line x1={950} y1={645} x2={950} y2={655} stroke="#374151" strokeWidth="1.5" />
                <text x={900} y={665} textAnchor="middle" fill="#374151" fontSize="9">~2m</text>
              </g>

            </g>{/* fin transform group */}
          </svg>

          {/* ── Tooltip flottant ─────────────────────────────────────────── */}
          {tooltip && (
            <div style={{
              position: 'fixed', left: tooltip.x, top: tooltip.y - 10,
              transform: 'translateX(-50%) translateY(-100%)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '8px 12px', fontSize: 11, zIndex: 1000,
              pointerEvents: 'none', maxWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              {tooltip.type === 'rack' && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.data.name}</div>
                  <div style={{ color: STATUS_COLOR[tooltip.status] }}>{SEV_LABEL[tooltip.status] || tooltip.status}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{tooltip.data.equipment.length} équipements</div>
                  {tooltip.alerts.length > 0 && (
                    <div style={{ color: STATUS_COLOR.critical, marginTop: 2 }}>{tooltip.alerts.length} alerte(s)</div>
                  )}
                </>
              )}
              {tooltip.type === 'sensor' && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.data.label}</div>
                  <div>🌡 {tooltip.data.tempC}°C</div>
                  <div>💧 {tooltip.data.humidity}%</div>
                  <div style={{ color: STATUS_COLOR[tooltip.data.status] || STATUS_COLOR.ok }}>
                    {tooltip.data.status === 'ok' ? 'Normal' : 'Attention'}
                  </div>
                </>
              )}
              {tooltip.type === 'equip' && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.data.name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{tooltip.data.subtype}</div>
                  {tooltip.cracStatus && (
                    <div style={{ color: STATUS_COLOR[tooltip.cracStatus === 'running' ? 'ok' : 'warning'] }}>
                      {tooltip.cracStatus === 'running' ? '✓ En marche' : '⚠ Vérifier'}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── PANNEAU RACK SÉLECTIONNÉ ──────────────────────────────────────── */}
        {selectedRack && (
          <RackDetailPanel
            rack={selectedRack}
            alerts={activeAlerts}
            redfishData={redfishData}
            onClose={() => setSelectedRack(null)}
            navigate={navigate}
          />
        )}

        {/* ── SIDEBAR ALERTES ───────────────────────────────────────────────── */}
        {alertSidebar && (
          <div style={{
            width: 320, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Alertes actives ({activeAlerts.length})</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setAlertSidebar(false)}><X size={12} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 8 }}>
              {activeAlerts.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  <CheckCircle size={24} style={{ display: 'block', margin: '0 auto 8px', color: '#10B981' }} />
                  Aucune alerte active
                </div>
              )}
              {activeAlerts.map(a => (
                <div key={a.key || a.id} style={{
                  padding: '8px 10px', borderRadius: 6, marginBottom: 6,
                  background: 'var(--bg-base)', borderLeft: `3px solid ${STATUS_COLOR[a.severity?.toLowerCase()] || '#6B7280'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ fontWeight: 600, color: STATUS_COLOR[a.severity?.toLowerCase()] || '#6B7280' }}>
                      {a.severity}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleTimeString('fr-FR') : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>{a.ruleName || a.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{a.sourceId}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }}
                onClick={() => navigate('/alerts')}>
                Voir toutes les alertes <ChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KPI Chip ─────────────────────────────────────────────────────────────────

function KpiChip({ icon, label, value, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20,
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}30`,
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s',
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = `${color}15`)}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
      <span style={{ color, fontWeight: 700, fontSize: 12 }}>{value}</span>
    </div>
  );
}

// ─── Panneau détail rack ─────────────────────────────────────────────────────

function RackDetailPanel({ rack, alerts, redfishData, onClose, navigate }) {
  const rackAlerts = alerts.filter(a =>
    rack.equipment.some(e => a.sourceId?.toLowerCase().includes(e.split('-')[0].toLowerCase()))
  );

  return (
    <div style={{
      width: 340, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{rack.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rack.desc}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={12} /></button>
      </div>

      {/* Schéma élévation simplifié */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>
          ÉLÉVATION RACK — 42U
        </div>
        <div style={{ background: '#0d1117', borderRadius: 4, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {Array.from({ length: 42 }, (_, i) => 42 - i).map(u => {
            const equip = rack.equipment.find((_, idx) => idx === 42 - u);
            const bg = u <= 2 ? '#1e3a2f' : u === 10 || u === 11 ? '#1a2e3e' : u >= 14 && u <= 15 ? '#2a2a0e' : 'transparent';
            return (
              <div key={u} style={{
                height: 6, borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: bg, display: 'flex', alignItems: 'center',
                paddingLeft: 4,
              }}>
                {(u === 1 || u === 3 || u === 10 || u === 11 || u === 14) && (
                  <div style={{ height: '80%', width: '60%', background: 'rgba(79,142,247,0.3)', borderRadius: 1 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Équipements */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>
          ÉQUIPEMENTS ({rack.equipment.length})
        </div>
        {rack.equipment.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Rack vide</div>
        )}
        {rack.equipment.map(eq => {
          const srvId = eq.toLowerCase().replace(/-sbee$/, '').replace(/-(\d+)$/, '-0$1').replace('esxi-01', 'esxi-01');
          const srv   = Object.values(redfishData).find(s => s?.name?.includes(eq.split('-')[0]));
          const isESXi = eq.includes('ESXi');
          const hostId = eq.toLowerCase().replace('-sbee', '');

          return (
            <div key={eq} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
              borderBottom: '1px solid var(--border)', cursor: isESXi ? 'pointer' : 'default',
            }}
              onClick={() => isESXi && navigate(`/infrastructure/esxi/${hostId}`)}
              onMouseEnter={e => isESXi && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, truncate: 'ellipsis' }}>{eq}</div>
                {srv && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{srv.system?.model || ''}</div>}
              </div>
              {isESXi && <ChevronRight size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>

      {/* Alertes rack */}
      {rackAlerts.length > 0 && (
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: STATUS_COLOR.warning }}>
            ALERTES ({rackAlerts.length})
          </div>
          {rackAlerts.map((a, i) => (
            <div key={i} style={{
              padding: '6px 8px', borderRadius: 4, marginBottom: 4,
              background: 'var(--bg-base)', borderLeft: `2px solid ${STATUS_COLOR[a.severity?.toLowerCase()] || '#6B7280'}`,
              fontSize: 10,
            }}>
              <div style={{ color: STATUS_COLOR[a.severity?.toLowerCase()], fontWeight: 600 }}>{a.severity}</div>
              <div>{a.ruleName}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: 12, marginTop: 'auto', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        {rack.equipment.filter(e => e.includes('ESXi')).map(eq => (
          <button key={eq} className="btn btn-primary btn-sm" style={{ flex: 1 }}
            onClick={() => navigate(`/infrastructure/esxi/${eq.toLowerCase().replace('-sbee', '')}`)}>
            <Server size={10} /> {eq.split('-')[0]+'-'+eq.split('-')[1]}
          </button>
        ))}
      </div>
    </div>
  );
}
