import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Thermometer, Droplets, Zap, Server, AlertTriangle, CheckCircle,
  Layers, Eye, EyeOff, ChevronRight, X, Activity, Wind, Cpu,
  HardDrive, Wifi, Battery, RefreshCw, Maximize2, Edit2, Save, Move,
  WifiOff, Camera, Shield, RotateCcw, Clock, Play, Pause,
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

const ROOM = { x: 30, y: 60, w: 780, h: 560 };
const AISLES = [
  { id: 'cold-n', type: 'cold', x: 30,  y: 60,  w: 780, h: 95,  label: 'Allée froide — Nord' },
  { id: 'hot',    type: 'hot',  x: 30,  y: 260, w: 780, h: 180, label: 'Allée chaude' },
  { id: 'cold-s', type: 'cold', x: 30,  y: 535, w: 780, h: 85,  label: 'Allée froide — Sud' },
];

const RACKS_DEF = [
  { id: 'rack-a',  name: 'RACK-A',  desc: 'Serveurs Prod',     row: 'A', x: 80,  y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: ['ESXi-01-SBEE','SW-CORE-01','SW-ACCESS-01','UPS-SUKAM-01'] },
  { id: 'rack-a2', name: 'RACK-A2', desc: 'Extension Prod',    row: 'A', x: 195, y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: ['ESXi-02-SBEE'] },
  { id: 'rack-a3', name: 'RACK-A3', desc: 'Réseau / Brassage', row: 'A', x: 310, y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: [] },
  { id: 'rack-a4', name: 'RACK-A4', desc: 'Réserve',           row: 'A', x: 425, y: 155, w: 100, h: 105, cmdbId: 'rack-a',
    equipment: [] },
  { id: 'rack-b',  name: 'RACK-B',  desc: 'Backup / ESXi-03',  row: 'B', x: 80,  y: 440, w: 100, h: 95,  cmdbId: 'rack-b',
    equipment: ['ESXi-03-SBEE','NAS-SYNOLOGY-01','SAN-HPE-MSA-01','UPS-SUKAM-02'] },
  { id: 'rack-b2', name: 'RACK-B2', desc: 'Stockage NAS',      row: 'B', x: 195, y: 440, w: 100, h: 95,  cmdbId: 'rack-b',
    equipment: ['NAS-SYNOLOGY-01'] },
  { id: 'rack-b3', name: 'RACK-B3', desc: 'Réserve',           row: 'B', x: 310, y: 440, w: 100, h: 95,  cmdbId: 'rack-b',
    equipment: [] },
];

const EQUIPMENT_DEF = [
  { id: 'crac-a', name: 'CRAC-01', type: 'crac', subtype: 'CRAC Nord', x: 570, y: 80,  w: 200, h: 120 },
  { id: 'crac-b', name: 'CRAC-02', type: 'crac', subtype: 'CRAC Sud',  x: 570, y: 430, w: 200, h: 120 },
  { id: 'tgbt',   name: 'TGBT',    type: 'power', subtype: 'Tableau Général BT', x: 570, y: 260, w: 90, h: 100 },
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

// ─── Sécurité physique ───────────────────────────────────────────────────────

const SECURITY_DEF = [
  { id: 'ext-1', type: 'extincteur', x: 65,  y: 100, label: 'Extincteur CO₂' },
  { id: 'ext-2', type: 'extincteur', x: 65,  y: 580, label: 'Extincteur CO₂' },
  { id: 'ext-3', type: 'extincteur', x: 550, y: 100, label: 'Extincteur poudre' },
  { id: 'cam-1', type: 'camera',     x: 45,  y: 75,  label: 'Caméra NE', angle: 45 },
  { id: 'cam-2', type: 'camera',     x: 780, y: 75,  label: 'Caméra NO', angle: 135 },
  { id: 'cam-3', type: 'camera',     x: 45,  y: 610, label: 'Caméra SE', angle: -45 },
  { id: 'cam-4', type: 'camera',     x: 780, y: 610, label: 'Caméra SO', angle: -135 },
  { id: 'smoke-1', type: 'fumee',    x: 200, y: 75,  label: 'Détect. fumée VESDA' },
  { id: 'smoke-2', type: 'fumee',    x: 400, y: 75,  label: 'Détect. fumée VESDA' },
  { id: 'smoke-3', type: 'fumee',    x: 200, y: 615, label: 'Détect. fumée VESDA' },
  { id: 'badge-1', type: 'badge',    x: 335, y: 620, label: 'Lecteur badge entrée', angle: 0 },
  { id: 'bris-1', type: 'bris',      x: 40,  y: 340, label: 'Bris de vitre urgence' },
];

// ─── Liens réseau entre racks ────────────────────────────────────────────────

const NETWORK_LINKS = [
  { from: { x: 180, y: 207 }, to: { x: 180, y: 440 }, label: '10G', type: 'fiber' },
  { from: { x: 130, y: 207 }, to: { x: 310, y: 207 }, label: '10G', type: 'fiber' },
  { from: { x: 310, y: 207 }, to: { x: 425, y: 207 }, label: '1G',  type: 'copper' },
  { from: { x: 310, y: 207 }, to: { x: 570, y: 310 }, label: '10G', type: 'fiber' },
  { from: { x: 245, y: 440 }, to: { x: 310, y: 207 }, label: '10G', type: 'fiber' },
  { from: { x: 130, y: 207 }, to: { x: 570, y: 310 }, label: '1G',  type: 'copper' },
];

// ─── Zones redondance (UPS domains, clusters vSphere) ────────────────────────

const REDUNDANCY_ZONES = [
  { id: 'ups-a', label: 'UPS A — Domaine prod', x: 72, y: 145, w: 265, h: 120, color: '#10B981', type: 'ups' },
  { id: 'ups-b', label: 'UPS B — Domaine backup', x: 72, y: 430, w: 265, h: 110, color: '#F59E0B', type: 'ups' },
  { id: 'cl-prod',   label: 'Cluster Production', x: 74, y: 147, w: 160, h: 116, color: '#4F8EF7', type: 'cluster' },
  { id: 'cl-backup', label: 'Cluster Backup/DMZ',  x: 74, y: 432, w: 106, h: 106, color: '#A855F7', type: 'cluster' },
];

// ─── Densité énergétique par rack (kW simulé) ─────────────────────────────────

const RACK_POWER_KW = {
  'rack-a': 8.2, 'rack-a2': 6.5, 'rack-a3': 2.1, 'rack-a4': 0.5,
  'rack-b': 5.8, 'rack-b2': 3.4, 'rack-b3': 0.3,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tempToColor(t) {
  if (t < 18)  return '#3B82F6';
  if (t < 22)  return '#10B981';
  if (t < 27)  return '#A3E635';
  if (t < 30)  return '#F59E0B';
  if (t < 35)  return '#EA580C';
  return '#DC2626';
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

// Convert client coordinates to SVG group space (accounting for pan + zoom + viewBox)
function clientToSVGGroup(clientX, clientY, svgEl, pan, zoom) {
  if (!svgEl) return { x: 0, y: 0 };
  const rect   = svgEl.getBoundingClientRect();
  const scaleX = 1100 / rect.width;
  const scaleY = 680  / rect.height;
  const svgX   = (clientX - rect.left) * scaleX;
  const svgY   = (clientY - rect.top)  * scaleY;
  return { x: (svgX - pan.x) / zoom, y: (svgY - pan.y) / zoom };
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RoomMap() {
  const navigate   = useNavigate();
  const svgRef     = useRef(null);
  const isPanning  = useRef(false);
  const panStart   = useRef({ x: 0, y: 0 });
  const dragRef    = useRef(null);  // { rackId, origX, origY, startSVGX, startSVGY }

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
    heatmap: false, alerts: true, network: false, airflow: false,
    security: false, energy: false, incidents: false, redundancy: false,
  });

  // ── Mode offline ────────────────────────────────────────────────────────────
  const [isOffline,    setIsOffline]    = useState(false);

  // ── Replay historique heatmap (24 snapshots simulés) ───────────────────────
  const [replayMode,   setReplayMode]   = useState(false);
  const [replayIndex,  setReplayIndex]  = useState(0);
  const [replayHistory, setReplayHistory] = useState([]);
  const replayTimerRef = useRef(null);
  const [zoom, setZoom]   = useState(1);
  const [pan,  setPan]    = useState({ x: 0, y: 0 });
  const [alertSidebar, setAlertSidebar] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdate,  setLastUpdate]  = useState(null);

  // ── Éditeur admin ─────────────────────────────────────────────────────────
  const [editMode,  setEditMode]  = useState(false);
  const [editRacks, setEditRacks] = useState(RACKS_DEF.map(r => ({ ...r })));
  const [saveStatus, setSaveStatus] = useState(null); // 'saving'|'saved'|'error'|null

  // Génère 24 snapshots simulés de l'historique thermique (dernières 24h)
  function buildReplayHistory(baseSensors) {
    return Array.from({ length: 24 }, (_, i) => {
      const hoursAgo = 23 - i;
      const peakFactor = hoursAgo >= 9 && hoursAgo <= 18 ? 1.0 : 0.75;
      return baseSensors.map(s => ({
        ...s,
        tempC: +(((s.tempC || 22) * peakFactor) + (Math.random() - 0.5) * 1.5).toFixed(1),
        humidity: +((s.humidity || 47) + (Math.random() - 0.5) * 3).toFixed(0),
      }));
    });
  }

  const fetchAll = useCallback(async () => {
    try {
      const [envData, snmp, redfish, cls, alts] = await Promise.allSettled([
        api.getRoomSensors(),
        api.getSnmpData(),
        api.getRedfishServers(),
        api.getClusters(),
        api.getActiveAlerts(),
      ]);
      const allFailed = [envData, snmp, redfish, cls, alts].every(r => r.status === 'rejected');
      setIsOffline(allFailed);
      if (envData.status === 'fulfilled') {
        const sens = envData.value.sensors || [];
        setSensors(sens);
        setCrac(envData.value.crac || []);
        if (!replayHistory.length) setReplayHistory(buildReplayHistory(sens));
      }
      if (snmp.status    === 'fulfilled') setSnmpData(snmp.value);
      if (redfish.status === 'fulfilled') setRedfishData(redfish.value);
      if (cls.status     === 'fulfilled') setClusters(cls.value);
      if (alts.status    === 'fulfilled') setActiveAlerts(alts.value);
      setLastUpdate(new Date());
      setLoading(false);
    } catch { setIsOffline(true); }
  }, [replayHistory.length]);

  // Load saved layout from server
  useEffect(() => {
    api.getRoomLayout().then(data => {
      if (data?.racks?.length) setEditRacks(data.racks);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // Replay auto-advance
  useEffect(() => {
    if (replayMode) {
      replayTimerRef.current = setInterval(() => {
        setReplayIndex(i => {
          if (i >= 23) { setReplayMode(false); return 23; }
          return i + 1;
        });
      }, 800);
    } else {
      clearInterval(replayTimerRef.current);
    }
    return () => clearInterval(replayTimerRef.current);
  }, [replayMode]);

  // ── Zoom level sémantique ──────────────────────────────────────────────────
  // overview (<0.7): blocs colorés simples
  // standard (0.7–2.2): vue actuelle avec noms + compteurs
  // detail (>2.2): affiche les équipements dans chaque rack
  const zoomLevel = zoom < 0.7 ? 'overview' : zoom > 2.2 ? 'detail' : 'standard';

  // ── Zoom / Pan handlers ────────────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();
    const delta   = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.4, Math.min(3.5, zoom * delta));
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (editMode && dragRef.current) return;
    if (e.button !== 1 && !e.ctrlKey) return;
    isPanning.current = true;
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    // Edit mode rack drag
    if (editMode && dragRef.current) {
      const svgPos = clientToSVGGroup(e.clientX, e.clientY, svgRef.current, pan, zoom);
      const dx = svgPos.x - dragRef.current.startSVGX;
      const dy = svgPos.y - dragRef.current.startSVGY;
      setEditRacks(prev => prev.map(r =>
        r.id === dragRef.current.rackId
          ? { ...r, x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }
          : r
      ));
      return;
    }
    if (!isPanning.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  };

  const handleMouseUp = () => {
    isPanning.current  = false;
    dragRef.current    = null;
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Start dragging a rack in edit mode
  const startRackDrag = (e, rack) => {
    if (!editMode) return;
    e.stopPropagation();
    const svgPos = clientToSVGGroup(e.clientX, e.clientY, svgRef.current, pan, zoom);
    dragRef.current = {
      rackId: rack.id,
      origX:  rack.x,
      origY:  rack.y,
      startSVGX: svgPos.x,
      startSVGY: svgPos.y,
    };
  };

  const saveLayout = async () => {
    setSaveStatus('saving');
    try {
      await api.saveRoomLayout({ racks: editRacks });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const cancelEdit = () => {
    setEditRacks(RACKS_DEF.map(r => ({ ...r })));
    setEditMode(false);
  };

  // Which racks to render
  const displayRacks = editMode ? editRacks : editRacks;  // always use editRacks (loaded from server)

  // ── Dériver l'état santé d'un rack ────────────────────────────────────────
  function getRackStatus(rack) {
    if (rack.equipment.length === 0) return 'unknown';
    const alerts = activeAlerts.filter(a =>
      rack.equipment.some(e => a.sourceId?.includes(e.toLowerCase().replace(/-/g, '')))
    );
    if (alerts.some(a => a.severity === 'DISASTER')) return 'disaster';
    if (alerts.some(a => a.severity === 'CRITICAL')) return 'critical';
    if (alerts.some(a => a.severity === 'WARNING'))  return 'warning';
    for (const eq of rack.equipment) {
      const srv = Object.values(redfishData).find(s => s?.name?.includes(eq.split('-')[0]));
      if (srv && srv.system?.status !== 'OK') return 'warning';
    }
    return rack.equipment.length > 0 ? 'ok' : 'unknown';
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

  // Capteurs actifs (replay ou live)
  const activeSensors = (replayMode || replayIndex < 23) && replayHistory[replayIndex]
    ? replayHistory[replayIndex]
    : sensors;

  // ── KPIs globaux ──────────────────────────────────────────────────────────
  const totalCPU  = clusters.reduce((s, c) => s + (c.cpu?.total || 0), 0);
  const usedCPU   = clusters.reduce((s, c) => s + (c.cpu?.used  || 0), 0);
  const cpuPct    = totalCPU > 0 ? Math.round(usedCPU / totalCPU * 100) : 0;
  const totalRAM  = clusters.reduce((s, c) => s + (c.ram?.totalGB || 0), 0);
  const usedRAM   = clusters.reduce((s, c) => s + (c.ram?.usedGB  || 0), 0);
  const ramPct    = totalRAM > 0 ? Math.round(usedRAM / totalRAM * 100) : 0;
  const avgTempC  = activeSensors.length ? +(activeSensors.reduce((s, x) => s + (x.tempC || 22), 0) / activeSensors.length).toFixed(1) : 22.0;
  const avgHum    = activeSensors.length ? Math.round(activeSensors.reduce((s, x) => s + (x.humidity || 47), 0) / activeSensors.length) : 47;
  const upsInfo   = getUPSInfo();
  const critCount = activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'DISASTER').length;
  const warnCount = activeAlerts.filter(a => a.severity === 'WARNING').length;

  // ── Heatmap thermique IDW ──────────────────────────────────────────────────
  const heatmapCells = [];
  if (layers.heatmap && activeSensors.length > 0) {
    const cellW = 50, cellH = 40;
    for (let gy = 0; gy < 16; gy++) {
      for (let gx = 0; gx < 18; gx++) {
        const px = ROOM.x + gx * cellW + cellW / 2;
        const py = ROOM.y + gy * cellH + cellH / 2;
        if (px > ROOM.x + ROOM.w || py > ROOM.y + ROOM.h) continue;
        const t   = interpolateTemp(px, py, activeSensors);
        heatmapCells.push({ x: ROOM.x + gx * cellW, y: ROOM.y + gy * cellH, w: cellW, h: cellH, color: tempToColor(t), temp: t });
      }
    }
  }

  // ── Heatmap énergétique (densité W/m²) ──────────────────────────────────
  const energyCells = [];
  if (layers.energy) {
    displayRacks.forEach(rack => {
      const kw = RACK_POWER_KW[rack.id] || 1.0;
      const maxKw = 10;
      const intensity = Math.min(1, kw / maxKw);
      const r = Math.round(255 * intensity);
      const g = Math.round(255 * (1 - intensity * 0.8));
      energyCells.push({ x: rack.x, y: rack.y, w: rack.w, h: rack.h, color: `rgb(${r},${g},40)`, kw });
    });
  }

  // ── Heatmap incidents (densité alertes par zone) ──────────────────────────
  const incidentCells = [];
  if (layers.incidents && activeAlerts.length > 0) {
    displayRacks.forEach(rack => {
      const count = activeAlerts.filter(a =>
        rack.equipment.some(e => a.sourceId?.toLowerCase().includes(e.split('-')[0].toLowerCase()))
      ).length;
      if (count === 0) return;
      const alpha = Math.min(0.7, 0.2 + count * 0.15);
      incidentCells.push({ x: rack.x, y: rack.y, w: rack.w, h: rack.h, count, alpha });
    });
  }

  // ── Particules flux d'air ─────────────────────────────────────────────────
  // CRAC-01 (Nord) souffle vers la gauche → allée froide nord
  // CRAC-02 (Sud)  souffle vers la gauche → allée froide sud
  // L'air chaud monte des racks vers l'allée chaude
  const AIRFLOW_COLD_N = Array.from({ length: 8 }, (_, i) => ({
    id: `cn${i}`, delay: `${-(i * 0.55).toFixed(2)}s`, dur: `${(3.2 + i * 0.18).toFixed(2)}s`,
    path: 'M 565,107 Q 400,107 80,107',
    offset: i * 0.12,
    color: '#60A5FA',
  }));
  const AIRFLOW_COLD_S = Array.from({ length: 8 }, (_, i) => ({
    id: `cs${i}`, delay: `${-(i * 0.55).toFixed(2)}s`, dur: `${(3.5 + i * 0.18).toFixed(2)}s`,
    path: 'M 565,490 Q 400,490 80,490',
    offset: i * 0.12,
    color: '#60A5FA',
  }));
  const AIRFLOW_HOT = Array.from({ length: 6 }, (_, i) => ({
    id: `h${i}`, delay: `${-(i * 0.65).toFixed(2)}s`, dur: `${(2.8 + i * 0.25).toFixed(2)}s`,
    path: `M ${100 + i * 65},207 Q ${100 + i * 65},260 ${100 + i * 65},340`,
    color: '#FB923C',
  }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── BARRE D'ÉTAT GLOBALE ────────────────────────────────────────────── */}
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
          {/* Edit mode toggle */}
          {editMode ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={cancelEdit} style={{ color: '#6B7280' }}>
                <X size={12} /> Annuler
              </button>
              <button className="btn btn-primary btn-sm" onClick={saveLayout}
                style={{ opacity: saveStatus === 'saving' ? 0.7 : 1 }}>
                <Save size={12} /> {saveStatus === 'saving' ? 'Sauvegarde…' : saveStatus === 'saved' ? '✓ Sauvegardé' : 'Sauvegarder le plan'}
              </button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}
              title="Mode édition du plan">
              <Edit2 size={12} /> Éditer plan
            </button>
          )}
          {lastUpdate && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Màj {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
          <div style={{ width: 8, height: 8, borderRadius: '50%',
            background: loading ? '#F59E0B' : editMode ? '#A855F7' : '#10B981',
            boxShadow: `0 0 6px ${loading ? '#F59E0B' : editMode ? '#A855F7' : '#10B981'}`,
            animation: 'pulse 2s infinite' }} />
          <button className="btn btn-ghost btn-sm" onClick={fetchAll} title="Actualiser">
            <RefreshCw size={12} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAlertSidebar(!alertSidebar)}>
            <AlertTriangle size={12} /> {activeAlerts.length}
          </button>
        </div>
      </div>

      {/* ── BANDEAU MODE OFFLINE ──────────────────────────────────────────── */}
      {isOffline && (
        <div style={{
          background: '#7C3AED', color: 'white', padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexShrink: 0,
          borderBottom: '1px solid #6D28D9',
        }}>
          <WifiOff size={14} />
          <strong>MODE HORS LIGNE</strong> — Impossible de joindre le backend. Les données affichées sont le dernier état connu.
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'white' }} onClick={fetchAll}>
            <RefreshCw size={12} /> Réessayer
          </button>
        </div>
      )}

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── PANNEAU COUCHES (gauche) ────────────────────────────────────── */}
        <div style={{
          width: 180, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
          padding: 12, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>COUCHES</div>
          {Object.entries({
            racks:      'Racks & serveurs',
            power:      'Alimentation (UPS/PDU)',
            cooling:    'Refroidissement (CRAC)',
            sensors:    'Capteurs T°/HR',
            heatmap:    '🌡 Thermique IDW',
            energy:     '⚡ Densité énergie',
            incidents:  '🔴 Heatmap incidents',
            airflow:    '💨 Flux d\'air',
            security:   '🔒 Sécurité physique',
            redundancy: '♻ Zones redondance',
            alerts:     'Indicateurs alertes',
            network:    'Topologie réseau',
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

          {/* Indicateur de niveau de zoom */}
          <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 4,
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: 10 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>NIVEAU ZOOM</div>
            {(['overview','standard','detail']).map(lvl => (
              <div key={lvl} style={{
                display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2,
                color: zoomLevel === lvl ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: zoomLevel === lvl ? 700 : 400,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%',
                  background: zoomLevel === lvl ? 'var(--accent)' : 'var(--border)' }} />
                {lvl === 'overview' ? 'Vue d\'ensemble' : lvl === 'standard' ? 'Standard' : 'Détail équip.'}
              </div>
            ))}
            <div style={{ color: 'var(--text-muted)', marginTop: 3 }}>
              Zoom: {zoom.toFixed(2)}×
            </div>
          </div>

          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>VUE</div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 4 }} onClick={resetView}>
              <Maximize2 size={11} /> Réinitialiser
            </button>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              🖱 Molette: zoom<br />
              Ctrl+drag: déplacer{editMode && <><br />✏ Drag rack: déplacer</>}
            </div>
          </div>

          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>LÉGENDE</div>
            {Object.entries({ ok: 'Normal', warning: 'Attention', critical: 'Critique', offline: 'Hors ligne' }).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, marginBottom: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[k], flexShrink: 0 }} />
                {v}
              </div>
            ))}
            {layers.airflow && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60A5FA', flexShrink: 0 }} />
                  Air froid
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FB923C', flexShrink: 0 }} />
                  Air chaud
                </div>
              </>
            )}
          </div>

          {editMode && (
            <div style={{ marginTop: 8, padding: '8px', borderRadius: 4,
              background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', fontSize: 10 }}>
              <div style={{ color: '#A855F7', fontWeight: 700, marginBottom: 4 }}>MODE ÉDITION</div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Glissez les racks pour les repositionner, puis cliquez "Sauvegarder le plan".
              </div>
            </div>
          )}

          {/* Replay historique */}
          {replayHistory.length > 0 && (
            <div style={{ marginTop: 8, padding: '8px', borderRadius: 4,
              background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', fontSize: 10 }}>
              <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Clock size={10} style={{ marginRight: 4 }} />REPLAY 24H</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0 }}
                  onClick={() => setReplayMode(m => !m)}>
                  {replayMode ? <Pause size={11} /> : <Play size={11} />}
                </button>
              </div>
              <input type="range" min="0" max="23" value={replayIndex}
                onChange={e => { setReplayIndex(+e.target.value); setReplayMode(false); }}
                style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: 4 }} />
              <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                {replayIndex === 23 ? 'Maintenant' : `Il y a ${23 - replayIndex}h`}
              </div>
            </div>
          )}
        </div>

        {/* ── CANVAS SVG ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#0a0c10',
          cursor: editMode ? 'default' : 'crosshair' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg ref={svgRef} viewBox="0 0 1100 680"
            style={{ width: '100%', height: '100%', userSelect: 'none' }}>
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
              {/* Airflow paths (referenced by animateMotion) */}
              <path id="af-cold-n-main" d="M 565,107 C 450,107 300,107 80,107" />
              <path id="af-cold-s-main" d="M 565,490 C 450,490 300,490 80,490" />
              {[0,1,2,3,4,5].map(i => (
                <path key={i} id={`af-hot-${i}`}
                  d={`M ${95 + i * 62},205 C ${95 + i * 62},235 ${95 + i * 62},280 ${95 + i * 62},340`} />
              ))}
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

              {/* Fond grille */}
              <rect x="0" y="0" width="1100" height="680" fill="url(#grid)" />

              {/* ── Murs ─────────────────────────────────────────────────── */}
              <rect x={ROOM.x} y={ROOM.y} width={ROOM.w} height={ROOM.h}
                fill="rgba(15,20,30,0.7)" stroke={editMode ? '#A855F7' : '#2a4060'}
                strokeWidth={editMode ? 2 : 3} strokeDasharray={editMode ? '8,4' : undefined} rx="4" />

              {/* ── Porte ─────────────────────────────────────────────── */}
              <rect x={340} y={618} width={80} height={8} fill="#3B82F6" rx="2" />
              <text x={380} y={640} textAnchor="middle" fill="#6B7280" fontSize="10">Entrée</text>

              {/* ── Allées thermiques ──────────────────────────────────── */}
              {AISLES.map(a => (
                <rect key={a.id} x={a.x} y={a.y} width={a.w} height={a.h}
                  fill={a.type === 'cold' ? 'rgba(59,130,246,0.06)' : 'rgba(234,88,12,0.08)'}
                  stroke={a.type === 'cold' ? 'rgba(59,130,246,0.15)' : 'rgba(234,88,12,0.15)'}
                  strokeWidth="1" strokeDasharray="4,4" />
              ))}
              {zoomLevel !== 'overview' && (
                <>
                  <text x={35} y={112} fill="rgba(59,130,246,0.5)" fontSize="9" fontStyle="italic">❄ Allée froide Nord</text>
                  <text x={35} y={310} fill="rgba(234,88,12,0.6)" fontSize="9" fontStyle="italic">🔥 Allée chaude</text>
                  <text x={35} y={590} fill="rgba(59,130,246,0.5)" fontSize="9" fontStyle="italic">❄ Allée froide Sud</text>
                </>
              )}

              {/* ── Heatmap thermique IDW ──────────────────────────────── */}
              {layers.heatmap && heatmapCells.map((cell, i) => (
                <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                  fill={cell.color} opacity="0.25" />
              ))}

              {/* ── Heatmap énergétique ───────────────────────────────── */}
              {layers.energy && energyCells.map((cell, i) => (
                <g key={i}>
                  <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                    fill={cell.color} opacity="0.35" rx="3" />
                  {zoomLevel !== 'overview' && (
                    <text x={cell.x + cell.w / 2} y={cell.y + cell.h - 6}
                      textAnchor="middle" fill="white" fontSize="8" fontWeight="700">
                      {cell.kw} kW
                    </text>
                  )}
                </g>
              ))}

              {/* ── Heatmap incidents ─────────────────────────────────── */}
              {layers.incidents && incidentCells.map((cell, i) => (
                <g key={i}>
                  <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h}
                    fill="#DC2626" opacity={cell.alpha} rx="3" />
                  <text x={cell.x + cell.w / 2} y={cell.y + cell.h / 2 + 4}
                    textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
                    {cell.count}
                  </text>
                </g>
              ))}

              {/* ── Zones de redondance ───────────────────────────────── */}
              {layers.redundancy && REDUNDANCY_ZONES.map(z => (
                <g key={z.id}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h}
                    fill="none" stroke={z.color} strokeWidth="1.5"
                    strokeDasharray={z.type === 'cluster' ? '6,3' : '12,4'}
                    rx="6" opacity="0.7" />
                  {zoomLevel !== 'overview' && (
                    <text x={z.x + 6} y={z.y + 13} fill={z.color} fontSize="8" fontWeight="600">
                      {z.label}
                    </text>
                  )}
                </g>
              ))}

              {/* ── Animation flux d'air ───────────────────────────────── */}
              {layers.airflow && (
                <g opacity="0.85">
                  {/* Air froid Nord (CRAC-01 → allée froide nord) */}
                  {AIRFLOW_COLD_N.map(p => (
                    <circle key={p.id} r="3.5" fill="#60A5FA" opacity="0.8">
                      <animateMotion dur={p.dur} repeatCount="indefinite" begin={p.delay}>
                        <mpath href="#af-cold-n-main" />
                      </animateMotion>
                    </circle>
                  ))}
                  {/* Air froid Sud (CRAC-02 → allée froide sud) */}
                  {AIRFLOW_COLD_S.map(p => (
                    <circle key={p.id} r="3.5" fill="#60A5FA" opacity="0.8">
                      <animateMotion dur={p.dur} repeatCount="indefinite" begin={p.delay}>
                        <mpath href="#af-cold-s-main" />
                      </animateMotion>
                    </circle>
                  ))}
                  {/* Air chaud montant des racks → allée chaude */}
                  {AIRFLOW_HOT.map((p, i) => (
                    <circle key={p.id} r="3" fill="#FB923C" opacity="0.75">
                      <animateMotion dur={p.dur} repeatCount="indefinite" begin={p.delay}>
                        <mpath href={`#af-hot-${i}`} />
                      </animateMotion>
                    </circle>
                  ))}
                  {/* Labels flux */}
                  <text x={320} y={104} fill="#60A5FA" fontSize="8" opacity="0.6">
                    ← air froid
                  </text>
                  <text x={200} y={285} fill="#FB923C" fontSize="8" opacity="0.6">
                    ↓ air chaud
                  </text>
                </g>
              )}

              {/* ── Racks ───────────────────────────────────────────────── */}
              {layers.racks && displayRacks.map(rack => {
                const status  = getRackStatus(rack);
                const color   = STATUS_COLOR[status] || STATUS_COLOR.unknown;
                const isEmpty = rack.equipment.length === 0;
                const rackAlerts = activeAlerts.filter(a =>
                  rack.equipment.some(e => a.sourceId?.toLowerCase().includes(e.split('-')[0].toLowerCase()))
                );
                const isEditing = editMode;

                return (
                  <g key={rack.id}
                    style={{ cursor: isEditing ? 'move' : 'pointer' }}
                    onMouseDown={isEditing ? (e) => startRackDrag(e, rack) : undefined}
                    onClick={isEditing ? undefined : () => setSelectedRack(rack)}
                    onMouseEnter={isEditing ? undefined : (e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setTooltip({ type: 'rack', data: rack, status, alerts: rackAlerts, x: r.left + r.width / 2, y: r.top });
                    }}
                    onMouseLeave={isEditing ? undefined : () => setTooltip(null)}>

                    {/* Corps du rack */}
                    <rect x={rack.x} y={rack.y} width={rack.w} height={rack.h}
                      fill={isEmpty ? 'rgba(30,40,55,0.5)' : 'rgba(20,30,50,0.9)'}
                      stroke={isEditing ? '#A855F7' : color}
                      strokeWidth={isEditing ? 2 : (status !== 'ok' && status !== 'unknown' ? 2 : 1)}
                      rx="3" filter={status === 'critical' || status === 'disaster' ? 'url(#glow)' : undefined}
                    />
                    {/* Bandeau couleur en haut */}
                    <rect x={rack.x} y={rack.y} width={rack.w} height={5}
                      fill={isEditing ? '#A855F7' : color} rx="3" />

                    {/* ── Vue OVERVIEW: juste bloc coloré + nom ───── */}
                    {zoomLevel === 'overview' && (
                      <>
                        <text x={rack.x + rack.w / 2} y={rack.y + rack.h / 2 + 4}
                          textAnchor="middle" fill="white" fontSize="9" fontWeight="700">
                          {rack.name}
                        </text>
                      </>
                    )}

                    {/* ── Vue STANDARD: nom + desc + compteur + LEDs ── */}
                    {zoomLevel === 'standard' && (
                      <>
                        <text x={rack.x + rack.w / 2} y={rack.y + 22}
                          textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{rack.name}</text>
                        <text x={rack.x + rack.w / 2} y={rack.y + 33}
                          textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">{rack.desc}</text>
                        {!isEmpty && (
                          <>
                            <text x={rack.x + rack.w / 2} y={rack.y + 55}
                              textAnchor="middle" fill={color} fontSize="9">{rack.equipment.length} éq.</text>
                            {rack.equipment.slice(0, 4).map((eq, i) => (
                              <circle key={i}
                                cx={rack.x + 14 + i * 18} cy={rack.y + rack.h - 18}
                                r={5} fill={status === 'ok' ? '#10B981' : color} opacity="0.8" />
                            ))}
                          </>
                        )}
                      </>
                    )}

                    {/* ── Vue DETAIL: liste équipements dans le rack ── */}
                    {zoomLevel === 'detail' && (
                      <>
                        <text x={rack.x + rack.w / 2} y={rack.y + 16}
                          textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{rack.name}</text>
                        {rack.equipment.slice(0, 6).map((eq, i) => (
                          <g key={eq}>
                            <rect x={rack.x + 4} y={rack.y + 22 + i * 13}
                              width={rack.w - 8} height={11}
                              fill="rgba(79,142,247,0.15)" stroke="rgba(79,142,247,0.3)"
                              strokeWidth="0.5" rx="1" />
                            <circle cx={rack.x + 10} cy={rack.y + 27 + i * 13}
                              r={2.5} fill={status === 'ok' ? '#10B981' : color} />
                            <text x={rack.x + 16} y={rack.y + 30 + i * 13}
                              fill="rgba(255,255,255,0.8)" fontSize="6.5">
                              {eq.length > 15 ? eq.slice(0, 14) + '…' : eq}
                            </text>
                          </g>
                        ))}
                        {rack.equipment.length > 6 && (
                          <text x={rack.x + rack.w / 2} y={rack.y + rack.h - 6}
                            textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">
                            +{rack.equipment.length - 6} autres
                          </text>
                        )}
                      </>
                    )}

                    {/* Edit mode grip indicator */}
                    {isEditing && (
                      <text x={rack.x + rack.w - 12} y={rack.y + rack.h - 8}
                        fill="rgba(168,85,247,0.7)" fontSize="10">⠿</text>
                    )}

                    {/* Alerte badge */}
                    {layers.alerts && rackAlerts.length > 0 && !isEditing && (
                      <g>
                        <circle cx={rack.x + rack.w - 10} cy={rack.y + 18} r={8}
                          fill="#DC2626" opacity="0.9" filter="url(#glow-strong)" />
                        <text x={rack.x + rack.w - 10} y={rack.y + 22}
                          textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                          {rackAlerts.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ── Équipements hors rack (CRAC, TGBT) ───────────────── */}
              {EQUIPMENT_DEF.map(eq => {
                const isCrac = eq.type === 'crac';
                const cracSt = isCrac ? (crac.find(c => c.id === eq.id)?.status || 'unknown') : 'ok';
                const color  = STATUS_COLOR[cracSt === 'running' ? 'ok' : cracSt];
                const fill   = isCrac ? 'rgba(14,165,233,0.12)' : 'rgba(234,179,8,0.12)';
                const stroke = isCrac ? '#0EA5E9' : '#EAB308';

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
                    <text x={eq.x + eq.w / 2} y={eq.y + 22}
                      textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{eq.name}</text>
                    <text x={eq.x + eq.w / 2} y={eq.y + 34}
                      textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">{eq.subtype}</text>
                    {isCrac && zoomLevel !== 'overview' && (
                      <text x={eq.x + eq.w / 2} y={eq.y + eq.h - 12}
                        textAnchor="middle" fill={color} fontSize="9" fontWeight="600">
                        {cracSt === 'running' ? '▶ En marche' : '⏸ Arrêté'}
                      </text>
                    )}
                    {/* Indicateur flux d'air CRAC si airflow activé */}
                    {layers.airflow && isCrac && (
                      <text x={eq.x + 8} y={eq.y + eq.h / 2 + 4}
                        fill="#60A5FA" fontSize="14" opacity="0.7">←</text>
                    )}
                  </g>
                );
              })}

              {/* ── Capteurs environnementaux ──────────────────────────── */}
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
                    {sens && zoomLevel !== 'overview' && (
                      <text x={sd.x + 9} y={sd.y + 4} fill={col} fontSize="8" fontWeight="600">
                        {sens.tempC}°C
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ── Topologie réseau superposée ───────────────────────── */}
              {layers.network && (
                <g>
                  {NETWORK_LINKS.map((link, i) => (
                    <g key={i}>
                      <line
                        x1={link.from.x} y1={link.from.y}
                        x2={link.to.x}   y2={link.to.y}
                        stroke={link.type === 'fiber' ? '#06B6D4' : '#F59E0B'}
                        strokeWidth={link.type === 'fiber' ? 2 : 1.5}
                        strokeDasharray={link.type === 'copper' ? '4,3' : undefined}
                        opacity="0.7"
                      />
                      {zoomLevel !== 'overview' && (
                        <text
                          x={(link.from.x + link.to.x) / 2 + 4}
                          y={(link.from.y + link.to.y) / 2}
                          fill={link.type === 'fiber' ? '#06B6D4' : '#F59E0B'}
                          fontSize="7" fontWeight="600">
                          {link.label}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              )}

              {/* ── Sécurité physique ─────────────────────────────────── */}
              {layers.security && SECURITY_DEF.map(s => (
                <g key={s.id} style={{ cursor: 'help' }}
                  onMouseEnter={e => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setTooltip({ type: 'security', data: s, x: r.left + 10, y: r.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}>
                  {s.type === 'extincteur' && (
                    <>
                      <circle cx={s.x} cy={s.y} r={7} fill="#DC2626" opacity="0.85" />
                      <text x={s.x} y={s.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="700">E</text>
                    </>
                  )}
                  {s.type === 'camera' && (
                    <>
                      <polygon
                        points={`${s.x},${s.y - 6} ${s.x - 5},${s.y + 5} ${s.x + 5},${s.y + 5}`}
                        fill="#3B82F6" opacity="0.85"
                        transform={`rotate(${s.angle || 0}, ${s.x}, ${s.y})`}
                      />
                      <circle cx={s.x} cy={s.y} r={2} fill="white" opacity="0.9" />
                    </>
                  )}
                  {s.type === 'fumee' && (
                    <>
                      <circle cx={s.x} cy={s.y} r={6} fill="#A855F7" opacity="0.85" />
                      <text x={s.x} y={s.y + 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="700">S</text>
                    </>
                  )}
                  {s.type === 'badge' && (
                    <>
                      <rect x={s.x - 6} y={s.y - 6} width={12} height={10}
                        fill="#10B981" rx="2" opacity="0.85" />
                      <text x={s.x} y={s.y + 1} textAnchor="middle" fill="white" fontSize="6" fontWeight="700">B</text>
                    </>
                  )}
                  {s.type === 'bris' && (
                    <>
                      <polygon
                        points={`${s.x},${s.y - 8} ${s.x + 8},${s.y + 6} ${s.x - 8},${s.y + 6}`}
                        fill="#EF4444" stroke="#FCA5A5" strokeWidth="1" opacity="0.9"
                      />
                      <text x={s.x} y={s.y + 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="800">!</text>
                    </>
                  )}
                </g>
              ))}

              {/* ── Légende échelle ────────────────────────────────────── */}
              <g>
                <line x1={850} y1={650} x2={950} y2={650} stroke="#374151" strokeWidth="1.5" />
                <line x1={850} y1={645} x2={850} y2={655} stroke="#374151" strokeWidth="1.5" />
                <line x1={950} y1={645} x2={950} y2={655} stroke="#374151" strokeWidth="1.5" />
                <text x={900} y={665} textAnchor="middle" fill="#374151" fontSize="9">~2m</text>
              </g>

            </g>
          </svg>

          {/* ── Mini-carte (overview corner) ─────────────────────────── */}
          <MiniMap
            zoom={zoom} pan={pan}
            racks={displayRacks}
            activeAlerts={activeAlerts}
            sensors={activeSensors}
            onNavigate={(nx, ny) => setPan({ x: nx, y: ny })}
          />

          {/* ── Bandeau replay ───────────────────────────────────────── */}
          {(replayMode || replayIndex < 23) && (
            <div style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(79,142,247,0.9)', color: 'white', borderRadius: 20,
              padding: '4px 14px', fontSize: 11, fontWeight: 600, zIndex: 10,
              display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none',
            }}>
              <Clock size={11} />
              {replayIndex === 23 ? 'Maintenant (live)' : `📽 Replay — Il y a ${23 - replayIndex}h`}
              {replayMode && <span style={{ animation: 'pulse 1s infinite' }}>▶</span>}
            </div>
          )}

          {/* ── Tooltip flottant ──────────────────────────────────────── */}
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
                  {tooltip.alerts?.length > 0 && (
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
              {tooltip.type === 'security' && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.data.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Type: {tooltip.data.type}</div>
                  <div style={{ color: '#10B981', fontSize: 10, marginTop: 2 }}>✓ Opérationnel</div>
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

        {/* ── PANNEAU RACK SÉLECTIONNÉ ──────────────────────────────────── */}
        {selectedRack && !editMode && (
          <RackDetailPanel
            rack={selectedRack}
            alerts={activeAlerts}
            redfishData={redfishData}
            onClose={() => setSelectedRack(null)}
            navigate={navigate}
          />
        )}

        {/* ── SIDEBAR ALERTES ───────────────────────────────────────────── */}
        {alertSidebar && (
          <div style={{
            width: 320, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between' }}>
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
                  background: 'var(--bg-base)',
                  borderLeft: `3px solid ${STATUS_COLOR[a.severity?.toLowerCase()] || '#6B7280'}`,
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

// ─── Mini-carte (overview corner map) ────────────────────────────────────────

function MiniMap({ zoom, pan, racks, activeAlerts, sensors, onNavigate }) {
  const W = 160, H = 100;
  const SCALE_X = W / 1100, SCALE_Y = H / 680;

  // Viewport rectangle dans la mini-carte
  const vpW  = Math.min(W, W / zoom);
  const vpH  = Math.min(H, H / zoom);
  const vpX  = Math.max(0, Math.min(W - vpW, -pan.x * SCALE_X));
  const vpY  = Math.max(0, Math.min(H - vpH, -pan.y * SCALE_Y));

  return (
    <div style={{
      position: 'absolute', bottom: 12, right: 12, zIndex: 50,
      background: 'rgba(10,12,16,0.9)', border: '1px solid var(--border)',
      borderRadius: 6, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{ padding: '3px 8px', borderBottom: '1px solid var(--border)',
        fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
        VUE D'ENSEMBLE
      </div>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* Salle */}
        <rect x={ROOM.x * SCALE_X} y={ROOM.y * SCALE_Y}
          width={ROOM.w * SCALE_X} height={ROOM.h * SCALE_Y}
          fill="rgba(15,20,30,0.8)" stroke="#2a4060" strokeWidth="0.5" />

        {/* Racks */}
        {racks.map(rack => {
          const alerts = activeAlerts.filter(a =>
            rack.equipment.some(e => a.sourceId?.toLowerCase().includes(e.split('-')[0].toLowerCase()))
          );
          const color = alerts.length > 0 ? '#EA580C' : rack.equipment.length > 0 ? '#10B981' : '#374151';
          return (
            <rect key={rack.id}
              x={rack.x * SCALE_X} y={rack.y * SCALE_Y}
              width={rack.w * SCALE_X} height={rack.h * SCALE_Y}
              fill={color} opacity="0.75" rx="0.5" />
          );
        })}

        {/* Capteurs */}
        {sensors.slice(0, 8).map((s, i) => {
          const sd = SENSORS_DEF[i];
          if (!sd) return null;
          return (
            <circle key={i}
              cx={sd.x * SCALE_X} cy={sd.y * SCALE_Y}
              r={2} fill={s.tempC ? tempToColor(s.tempC) : '#6B7280'} opacity="0.9" />
          );
        })}

        {/* Viewport rectangle */}
        <rect x={vpX} y={vpY} width={vpW} height={vpH}
          fill="none" stroke="#4F8EF7" strokeWidth="1" opacity="0.7" />
      </svg>
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

      {/* Schéma élévation 42U */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>
          ÉLÉVATION RACK — 42U
        </div>
        <div style={{ background: '#0d1117', borderRadius: 4, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {Array.from({ length: 42 }, (_, i) => 42 - i).map(u => {
            const bg = u <= 2 ? '#1e3a2f' : u === 10 || u === 11 ? '#1a2e3e' : u >= 14 && u <= 15 ? '#2a2a0e' : 'transparent';
            return (
              <div key={u} style={{
                height: 6, borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: bg, display: 'flex', alignItems: 'center', paddingLeft: 4,
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
          const srv    = Object.values(redfishData).find(s => s?.name?.includes(eq.split('-')[0]));
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
                <div style={{ fontSize: 11, fontWeight: 500 }}>{eq}</div>
                {srv && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{srv.system?.model || ''}</div>}
              </div>
              {isESXi && <ChevronRight size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>

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
            <Server size={10} /> {eq.split('-').slice(0,2).join('-')}
          </button>
        ))}
      </div>
    </div>
  );
}
