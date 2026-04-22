import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Cpu, HardDrive, Network, Zap, Thermometer,
  Activity, AlertTriangle, Server, Box, Clock, Gauge, Database,
  Shield, Wifi, BatteryCharging, Layers, Info, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from 'recharts';
import Device2D from '../components/datacenter2d/Device2D';
import { useTheme } from '../components/datacenter2d/useTheme';
import { getPalette, detectBrand, statusLedColor } from '../components/datacenter2d/constants';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';

/**
 * Page de détails complets d'un équipement de la salle serveur.
 *
 * Organisation :
 *  - Colonne gauche (~420 px) : rendu façade + fond + carte d'identité détaillée
 *  - Colonne droite (reste) : tableau de bord de monitoring spécifique au type
 *
 * Les données de monitoring sont actuellement des séries simulées réalistes — elles
 * seront remplacées par des métriques live (SNMP v2c/v3, Redfish, vCenter REST,
 * Prometheus) dans le Jalon F proper. La structure de la page ne changera pas.
 */
export default function DeviceDetail() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const P     = getPalette(theme);
  const { datacenter: liveDatacenter } = useSocket();

  const [datacenter, setDatacenter] = useState(null);
  const [error, setError] = useState(null);

  // Chargement initial
  useEffect(() => {
    api.getDatacenter().then(setDatacenter).catch(e => setError(e.message));
  }, []);
  useEffect(() => { if (liveDatacenter) setDatacenter(liveDatacenter); }, [liveDatacenter]);

  // Retrouver le device + son rack
  const found = useMemo(() => {
    if (!datacenter) return null;
    for (const room of datacenter.rooms || []) {
      for (const rack of room.racks || []) {
        const d = rack.devices.find(x => x.id === deviceId);
        if (d) return { device: d, rack, room };
      }
    }
    return null;
  }, [datacenter, deviceId]);

  if (error) {
    return <FullMsg P={P}><AlertTriangle size={36} />{error}</FullMsg>;
  }
  if (!datacenter) {
    return <FullMsg P={P}><Activity size={36} /> Chargement…</FullMsg>;
  }
  if (!found) {
    return (
      <FullMsg P={P}>
        <Box size={36} />
        Équipement introuvable.
        <button style={backBtn} onClick={() => navigate('/datacenter-3d')}>
          <ArrowLeft size={12} /> Retour à la salle serveur
        </button>
      </FullMsg>
    );
  }

  const { device, rack, room } = found;
  const brandKey = detectBrand(device);
  const statusColor = statusLedColor(device.status, theme);

  return (
    <div style={pageStyle(P)}>
      {/* Bandeau supérieur */}
      <div style={topBarStyle(P)}>
        <button style={backBtn} onClick={() => navigate('/datacenter-3d')}>
          <ArrowLeft size={14} /> Salle serveur
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: P.labelLight, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }} className={`dc2d-led-${device.status === 'online' ? 'online' : device.status === 'warning' ? 'warning' : device.status === 'critical' ? 'critical' : ''}`} />
            {device.name}
            <span style={{ fontSize: 11, fontWeight: 500, color: P.labelDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {device.type}
            </span>
          </div>
          <div style={{ fontSize: 11, color: P.labelDim }}>
            {room.name} · {rack.name} · U{device.uStart}{device.uSize > 1 ? `–U${device.uStart + device.uSize - 1}` : ''} ·{' '}
            {device.manufacturer} {device.model} {brandKey !== 'generic' && `(${brandKey.toUpperCase()})`}
          </div>
        </div>
        <button style={refreshBtn(P)} onClick={() => api.getDatacenter().then(setDatacenter)}>
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      <div style={bodyStyle}>
        {/* Colonne gauche : rendu physique + fiche */}
        <aside style={leftColStyle(P)}>
          <SidePanel P={P} title="Vue façade" icon={<Box size={12} />}>
            <DeviceSVG device={device} side="front" theme={theme} />
          </SidePanel>
          <SidePanel P={P} title="Vue arrière" icon={<Network size={12} />}>
            <DeviceSVG device={device} side="back" theme={theme} />
          </SidePanel>

          <SidePanel P={P} title="Identité" icon={<Info size={12} />}>
            <FieldRow P={P} k="Constructeur" v={device.manufacturer || '—'} />
            <FieldRow P={P} k="Modèle"       v={device.model || '—'} />
            <FieldRow P={P} k="N° de série"  v={device.serial || '—'} mono />
            <FieldRow P={P} k="Hostname"     v={device.hostname || '—'} />
            <FieldRow P={P} k="IP gestion"   v={device.ip || '—'} mono />
            <FieldRow P={P} k="Statut"       v={device.status} />
          </SidePanel>

          <SidePanel P={P} title="Emplacement physique" icon={<Layers size={12} />}>
            <FieldRow P={P} k="Salle"         v={room.name} />
            <FieldRow P={P} k="Rack"          v={rack.name} />
            <FieldRow P={P} k="Unité U"       v={`U${device.uStart}${device.uSize > 1 ? `–U${device.uStart + device.uSize - 1}` : ''}`} mono />
            <FieldRow P={P} k="Taille"        v={`${device.uSize}U`} />
            <FieldRow P={P} k="Largeur"       v={device.slot === 'left' ? '½ gauche' : device.slot === 'right' ? '½ droite' : 'Pleine largeur'} />
            <FieldRow P={P} k="Profondeur"    v={device.depth === 'front' ? 'Façade' : device.depth === 'back' ? 'Fond' : 'Pleine profondeur'} />
            <FieldRow P={P} k="Montage"       v={device.mounting === 'shelf' ? 'Étagère' : device.mounting === 'loose' ? 'Posé' : 'Rails 19″'} />
          </SidePanel>

          {device.notes && (
            <SidePanel P={P} title="Notes exploitation" icon={<Shield size={12} />}>
              <div style={{ fontSize: 11, color: P.labelMid, lineHeight: 1.6 }}>{device.notes}</div>
            </SidePanel>
          )}
        </aside>

        {/* Colonne droite : monitoring par type */}
        <section style={rightColStyle}>
          <MonitoringForType device={device} P={P} theme={theme} />
        </section>
      </div>
    </div>
  );
}

// ─── Dispatcher type → panneaux de monitoring ───────────────────────────────

function MonitoringForType({ device, P, theme }) {
  switch (device.type) {
    case 'server.physical':
    case 'server.hypervisor':
    case 'server.blade':
    case 'backup.server':
      return <ServerMonitoring device={device} P={P} theme={theme} />;
    case 'network.switch':
    case 'network.router':
    case 'network.firewall':
      return <NetworkMonitoring device={device} P={P} theme={theme} />;
    case 'storage.nas':
    case 'storage.san':
    case 'backup.library':
      return <StorageMonitoring device={device} P={P} theme={theme} />;
    case 'power.ups':
    case 'power.battery':
    case 'power.ecoflow':
      return <UPSMonitoring device={device} P={P} theme={theme} />;
    case 'power.pdu':
      return <PDUMonitoring device={device} P={P} theme={theme} />;
    case 'vending.hsm':
      return <HSMMonitoring device={device} P={P} theme={theme} />;
    default:
      return <GenericMonitoring device={device} P={P} theme={theme} />;
  }
}

// ─── Server (ESXi/Linux/Windows physique) ──────────────────────────────────

function ServerMonitoring({ device, P, theme }) {
  const cpuPct  = useSimulated(device, 42, 12);
  const ramPct  = useSimulated(device, 68, 8);
  const diskPct = useSimulated(device, 31, 4);
  const tempC   = useSimulated(device, 48, 5);

  const cpuSeries = useSimSeries(device, 24, 42, 18);
  const netSeries = useSimSeries(device, 24, 150, 80);
  const fanData = [
    { name: 'Fan 1', rpm: 4200 + (device.id.length * 13) % 400 },
    { name: 'Fan 2', rpm: 4150 + (device.id.length * 17) % 400 },
    { name: 'Fan 3', rpm: 4300 + (device.id.length * 19) % 400 },
    { name: 'Fan 4', rpm: 4180 + (device.id.length * 23) % 400 },
    { name: 'Fan 5', rpm: 4220 + (device.id.length * 29) % 400 },
    { name: 'Fan 6', rpm: 4250 + (device.id.length * 31) % 400 },
  ];

  return (
    <>
      <SectionTitle P={P} icon={<Server size={14} />} text="Ressources système" />
      <div style={gridStyle}>
        <MetricCard P={P} icon={<Cpu size={14} color="#3b82f6" />} label="CPU" value={`${cpuPct}%`} accent="#3b82f6" sub={`${device.manufacturer === 'HPE' ? 'Xeon Silver 4210R · 10 cores × 2' : '2× CPU · 20 cores'}`}>
          <Donut value={cpuPct} color="#3b82f6" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Database size={14} color="#22c55e" />} label="RAM" value={`${ramPct}%`} accent="#22c55e" sub="128 GB DDR4 ECC">
          <Donut value={ramPct} color="#22c55e" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<HardDrive size={14} color="#f59e0b" />} label="Stockage" value={`${diskPct}%`} accent="#f59e0b" sub="2× 1.2 TB SAS + 2× 960 GB SSD (RAID 1+1)">
          <Donut value={diskPct} color="#f59e0b" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Thermometer size={14} color="#ef4444" />} label="Température CPU" value={`${tempC}°C`} accent="#ef4444" sub="Seuil critique : 85°C">
          <Gauge01 value={Math.min(100, (tempC / 85) * 100)} color="#ef4444" P={P} />
        </MetricCard>
      </div>

      <SectionTitle P={P} icon={<Activity size={14} />} text="Courbes 30 dernières minutes" />
      <div style={gridStyle}>
        <ChartCard P={P} title="Charge CPU %">
          <AreaChart data={cpuSeries}>
            <defs>
              <linearGradient id="grad-cpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={P.badgeBorder} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" stroke={P.labelDim} tick={{ fontSize: 10 }} />
            <YAxis stroke={P.labelDim} tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip contentStyle={tipStyle(P, theme)} />
            <Area dataKey="v" stroke="#3b82f6" strokeWidth={1.8} fill="url(#grad-cpu)" />
          </AreaChart>
        </ChartCard>

        <ChartCard P={P} title="Trafic réseau (Mbit/s)">
          <AreaChart data={netSeries}>
            <defs>
              <linearGradient id="grad-net" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={P.badgeBorder} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" stroke={P.labelDim} tick={{ fontSize: 10 }} />
            <YAxis stroke={P.labelDim} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tipStyle(P, theme)} />
            <Area dataKey="v" stroke="#22d3ee" strokeWidth={1.8} fill="url(#grad-net)" />
          </AreaChart>
        </ChartCard>
      </div>

      <SectionTitle P={P} icon={<Wifi size={14} />} text="Ventilateurs (RPM)" />
      <div style={{ background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 10, padding: 14 }}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={fanData}>
            <CartesianGrid stroke={P.badgeBorder} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke={P.labelDim} tick={{ fontSize: 10 }} />
            <YAxis stroke={P.labelDim} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tipStyle(P, theme)} />
            <Bar dataKey="rpm" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {device.type === 'server.hypervisor' && (
        <>
          <SectionTitle P={P} icon={<Box size={14} />} text="Composition virtualisation (ESXi / vSphere)" />
          <ESXiInventory device={device} P={P} />
        </>
      )}

      <PendingBanner P={P} text="📡 Les valeurs affichées sont des simulations réalistes. Connectez l'agent SBEE ou configurez Redfish/iLO/iDRAC pour remonter les métriques live." />
    </>
  );
}

function ESXiInventory({ device, P }) {
  const hash = hashCode(device.id);
  const vms = Array.from({ length: 4 + hash % 4 }, (_, i) => {
    const names = ['vm-adb-01', 'vm-web-02', 'vm-ad-01', 'vm-mail', 'vm-proxy', 'vm-apps', 'vm-backup', 'vm-dev'];
    const os   = ['Ubuntu 22.04', 'Windows Server 2022', 'Debian 12', 'Rocky Linux 9', 'RHEL 8'];
    return {
      id: i,
      name: names[(hash + i) % names.length],
      os:   os[(hash + i) % os.length],
      cpu:  2 + i,
      ram:  4 * (1 + i % 3),
      state: i % 5 === 3 ? 'off' : 'on',
    };
  });
  return (
    <div style={{ background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '20px 1.5fr 1.5fr 60px 60px 60px', gap: 8, padding: '8px 12px', fontSize: 10, fontWeight: 700, color: P.labelDim, letterSpacing: 0.6, borderBottom: `1px solid ${P.badgeBorder}`, background: P.badgeBg }}>
        <div />
        <div>VM</div>
        <div>OS INVITÉ</div>
        <div>vCPU</div>
        <div>RAM</div>
        <div>ÉTAT</div>
      </div>
      {vms.map(vm => (
        <div key={vm.id} style={{ display: 'grid', gridTemplateColumns: '20px 1.5fr 1.5fr 60px 60px 60px', gap: 8, padding: '9px 12px', fontSize: 11, color: P.labelLight, borderBottom: `1px dashed ${P.badgeBorder}` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: vm.state === 'on' ? '#22c55e' : '#64748b', alignSelf: 'center' }}
                className={vm.state === 'on' ? 'dc2d-led-online' : ''} />
          <div style={{ fontFamily: 'monospace' }}>{vm.name}</div>
          <div>{vm.os}</div>
          <div style={{ fontFamily: 'monospace' }}>{vm.cpu}</div>
          <div style={{ fontFamily: 'monospace' }}>{vm.ram} Gi</div>
          <div style={{ color: vm.state === 'on' ? '#22c55e' : '#64748b', fontWeight: 600 }}>
            {vm.state === 'on' ? 'Powered On' : 'Powered Off'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Network (switch / router / firewall) ──────────────────────────────────

function NetworkMonitoring({ device, P, theme }) {
  const ports = Array.from({ length: 24 }, (_, i) => {
    const hash = hashCode(device.id + i);
    const active = hash % 100 < 72;
    const speed = active ? (hash % 10 < 2 ? 10000 : 1000) : 0;
    return {
      n: i + 1,
      active,
      speed,
      tx: active ? (hash * 7) % 180 : 0,
      rx: active ? (hash * 13) % 220 : 0,
      status: active ? 'up' : 'down',
    };
  });
  const activeCount = ports.filter(p => p.active).length;
  const totalTx = ports.reduce((s, p) => s + p.tx, 0);
  const totalRx = ports.reduce((s, p) => s + p.rx, 0);

  const cpuPct = useSimulated(device, 18, 6);
  const memPct = useSimulated(device, 54, 4);

  return (
    <>
      <SectionTitle P={P} icon={<Network size={14} />} text="État des ports" />
      <div style={{ background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 11, color: P.labelMid }}>
          <span><b style={{ color: P.labelLight }}>{activeCount}/{ports.length}</b> actifs</span>
          <span>TX <b style={{ color: '#22d3ee', fontFamily: 'monospace' }}>{totalTx.toFixed(0)} Mbit/s</b></span>
          <span>RX <b style={{ color: '#a3e635', fontFamily: 'monospace' }}>{totalRx.toFixed(0)} Mbit/s</b></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
          {ports.map(p => (
            <div key={p.n}
                 style={{
                   position: 'relative',
                   height: 44, borderRadius: 4,
                   background: p.active ? (p.speed === 10000 ? 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)' : 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)') : '#1a1d22',
                   border: `1px solid ${p.active ? '#15803d' : '#2a2f37'}`,
                   display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                   fontSize: 8, fontWeight: 700,
                   color: p.active ? '#ffffff' : P.labelDim,
                 }}
                 title={`Port ${p.n} · ${p.active ? `${p.speed}Mb/s · TX ${p.tx.toFixed(0)} / RX ${p.rx.toFixed(0)}` : 'link down'}`}
            >
              <div style={{ fontSize: 8 }}>{p.n}</div>
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: p.active ? '#fef08a' : '#3a3f46',
                marginTop: 2,
              }} className={p.active ? 'dc2d-led-activity' : ''} />
              <div style={{ fontSize: 6, fontFamily: 'monospace', opacity: 0.8 }}>
                {p.active ? (p.speed === 10000 ? '10G' : '1G') : 'DN'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle P={P} icon={<Cpu size={14} />} text="Santé équipement" />
      <div style={gridStyle}>
        <MetricCard P={P} icon={<Cpu size={14} color="#3b82f6" />} label="CPU" value={`${cpuPct}%`} accent="#3b82f6" sub="ASIC + supervision">
          <Donut value={cpuPct} color="#3b82f6" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Database size={14} color="#22c55e" />} label="Mémoire" value={`${memPct}%`} accent="#22c55e" sub="FIB / MAC table">
          <Donut value={memPct} color="#22c55e" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Clock size={14} color="#a855f7" />} label="Uptime" value="37j 14h" accent="#a855f7" sub="Dernier reboot : 14/03" />
        <MetricCard P={P} icon={<Shield size={14} color="#f59e0b" />} label="VLANs" value="18" accent="#f59e0b" sub="dont 3 trunkés" />
      </div>

      <SectionTitle P={P} icon={<Activity size={14} />} text="Trafic cumulé (30 min)" />
      <ChartCard P={P} title="TX vs RX">
        <AreaChart data={useSimSeriesDual(device, 24)}>
          <defs>
            <linearGradient id="grad-tx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-rx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3e635" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={P.badgeBorder} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" stroke={P.labelDim} tick={{ fontSize: 10 }} />
          <YAxis stroke={P.labelDim} tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={tipStyle(P, theme)} />
          <Area dataKey="tx" stroke="#22d3ee" strokeWidth={1.6} fill="url(#grad-tx)" name="TX" />
          <Area dataKey="rx" stroke="#a3e635" strokeWidth={1.6} fill="url(#grad-rx)" name="RX" />
        </AreaChart>
      </ChartCard>

      <PendingBanner P={P} text="📡 Connectez SNMP v2c/v3 (OID IF-MIB + ENTITY-MIB) pour remonter les vraies valeurs de ports, STP, VLANs et compteurs d'erreurs." />
    </>
  );
}

// ─── Storage (NAS / SAN / tape library) ────────────────────────────────────

function StorageMonitoring({ device, P, theme }) {
  const slotCount = device.type === 'backup.library' ? 24 : 5;
  const slots = Array.from({ length: slotCount }, (_, i) => {
    const hash = hashCode(device.id + 'd' + i);
    const health = hash % 100 > 94 ? 'warning' : hash % 100 > 98 ? 'critical' : 'ok';
    return {
      i, health,
      capacity: device.type === 'backup.library' ? 6 : [4, 8, 12][hash % 3],
      used: Math.max(5, hash % 80),
      label: device.type === 'backup.library' ? `LTO6 · C${i + 1}` : `Disk ${i + 1}`,
    };
  });

  const iops = useSimulated(device, 480, 120);
  const mbps = useSimulated(device, 180, 80);

  return (
    <>
      <SectionTitle P={P} icon={<HardDrive size={14} />} text={device.type === 'backup.library' ? 'Magasin de bandes LTO' : 'Santé des disques'} />
      <div style={{ background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(8, slotCount)}, 1fr)`, gap: 8 }}>
          {slots.map(s => (
            <div key={s.i} style={{
              padding: '10px 8px',
              border: `1px solid ${s.health === 'ok' ? 'rgba(34,197,94,0.4)' : s.health === 'warning' ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.6)'}`,
              background: s.health === 'ok' ? 'rgba(34,197,94,0.08)' : s.health === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.15)',
              borderRadius: 6,
              fontSize: 10,
            }}>
              <div style={{ color: P.labelLight, fontWeight: 700, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ color: P.labelDim, fontFamily: 'monospace' }}>{s.capacity} TB</div>
              {device.type !== 'backup.library' && (
                <div style={{ marginTop: 6, height: 4, background: '#1a1d22', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${s.used}%`, height: '100%', background: s.used > 80 ? '#ef4444' : s.used > 60 ? '#f59e0b' : '#22c55e' }} />
                </div>
              )}
              <div style={{ color: P.labelDim, fontSize: 9, marginTop: 4 }}>
                {s.health === 'ok' ? '✓ OK' : s.health === 'warning' ? '⚠ SMART' : '✖ PRÉDÉFAUT'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {device.type !== 'backup.library' && (
        <>
          <SectionTitle P={P} icon={<Gauge size={14} />} text="Performance I/O" />
          <div style={gridStyle}>
            <MetricCard P={P} icon={<Activity size={14} color="#8b5cf6" />} label="IOPS" value={`${iops}`} accent="#8b5cf6" sub="Lecture + écriture" />
            <MetricCard P={P} icon={<Network size={14} color="#22d3ee" />} label="Débit" value={`${mbps} MB/s`} accent="#22d3ee" sub="Moyenne 5 min" />
            <MetricCard P={P} icon={<Shield size={14} color="#22c55e" />} label="RAID" value="RAID 5" accent="#22c55e" sub={`${slotCount - 1}+1 · dégradation 0`} />
            <MetricCard P={P} icon={<Layers size={14} color="#f59e0b" />} label="Volumes" value="3" accent="#f59e0b" sub="Pool principal" />
          </div>
        </>
      )}

      <PendingBanner P={P} text="📡 Synology DSM 7.2 expose les métriques via SNMP v3 ou Synology API. Pour HPE StoreEver, brancher le port Ethernet management → CLI via SSH." />
    </>
  );
}

// ─── UPS ───────────────────────────────────────────────────────────────────

function UPSMonitoring({ device, P, theme }) {
  const battery  = useSimulated(device, 92, 6);
  const load     = useSimulated(device, 48, 15);
  const runtime  = Math.round((battery / 100) * 22);
  const inputV   = 228 + (hashCode(device.id) % 10) - 5;
  const outputV  = 230;

  return (
    <>
      <SectionTitle P={P} icon={<BatteryCharging size={14} />} text="Énergie & batterie" />
      <div style={gridStyle}>
        <MetricCard P={P} icon={<BatteryCharging size={14} color="#22c55e" />} label="Batterie" value={`${battery}%`} accent="#22c55e" sub={`Autonomie ≈ ${runtime} min`}>
          <Donut value={battery} color="#22c55e" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Zap size={14} color="#f59e0b" />} label="Charge" value={`${load}%`} accent="#f59e0b" sub="De la capacité nominale">
          <Donut value={load} color="#f59e0b" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Activity size={14} color="#3b82f6" />} label="Tension entrée" value={`${inputV} V`} accent="#3b82f6" sub="Nominal 230 V · ±10 %" />
        <MetricCard P={P} icon={<Activity size={14} color="#a855f7" />} label="Tension sortie" value={`${outputV} V`} accent="#a855f7" sub="Online double-conversion" />
      </div>

      <SectionTitle P={P} icon={<AlertTriangle size={14} />} text="Événements récents" />
      <div style={{ background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 10, overflow: 'hidden' }}>
        {[
          { t: '14:22', lvl: 'info', msg: 'Auto-test batterie hebdomadaire : OK (durée 12 s)' },
          { t: '03:14', lvl: 'warning', msg: 'Tension entrée brève (< 2s) → bascule batterie, retour secteur immédiat' },
          { t: 'hier 23:08', lvl: 'info', msg: 'Mise à jour firmware UPS disponible : v4.12 → v4.15' },
          { t: 'hier 19:51', lvl: 'info', msg: 'Coupure EDF secteur 3 min 12 s · bascule batterie OK · 87 % → 81 %' },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 14px', fontSize: 11, color: P.labelMid, borderBottom: `1px dashed ${P.badgeBorder}` }}>
            <span style={{ color: P.labelDim, fontFamily: 'monospace', width: 80 }}>{e.t}</span>
            <span style={{ color: e.lvl === 'warning' ? '#f59e0b' : '#22c55e', fontWeight: 700, textTransform: 'uppercase', width: 56, fontSize: 9, letterSpacing: 0.6 }}>
              {e.lvl}
            </span>
            <span>{e.msg}</span>
          </div>
        ))}
      </div>

      <PendingBanner P={P} text="📡 APC PowerChute / Eaton Intelligent Power Manager expose les valeurs via SNMP PowerNet-MIB et UPS-MIB (RFC 1628)." />
    </>
  );
}

// ─── PDU ───────────────────────────────────────────────────────────────────

function PDUMonitoring({ device, P, theme }) {
  const outletCount = 12;
  const outlets = Array.from({ length: outletCount }, (_, i) => {
    const hash = hashCode(device.id + 'o' + i);
    const on = hash % 100 < 80;
    return {
      i, on,
      amps: on ? ((hash % 200) / 100).toFixed(2) : '0.00',
      watts: on ? ((hash % 2000)) : 0,
      label: `Outlet ${i + 1}`,
    };
  });
  const totalW = outlets.reduce((s, o) => s + o.watts, 0);
  const totalA = outlets.reduce((s, o) => s + parseFloat(o.amps), 0).toFixed(2);

  return (
    <>
      <SectionTitle P={P} icon={<Zap size={14} />} text="Charge globale" />
      <div style={gridStyle}>
        <MetricCard P={P} icon={<Zap size={14} color="#f59e0b" />} label="Puissance" value={`${(totalW / 1000).toFixed(2)} kW`} accent="#f59e0b" sub={`Capacité 7.4 kW · ${Math.round(totalW / 74)}%`}>
          <Donut value={Math.min(100, totalW / 74)} color="#f59e0b" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Activity size={14} color="#3b82f6" />} label="Courant" value={`${totalA} A`} accent="#3b82f6" sub="Nominal 32 A" />
        <MetricCard P={P} icon={<Network size={14} color="#22c55e" />} label="Outlets actifs" value={`${outlets.filter(o => o.on).length}/${outletCount}`} accent="#22c55e" sub="Commutables individuellement" />
        <MetricCard P={P} icon={<Thermometer size={14} color="#ef4444" />} label="Température" value="34°C" accent="#ef4444" sub="Seuil 50°C" />
      </div>

      <SectionTitle P={P} icon={<List size={14} />} text="Prises" />
      <div style={{ background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1fr 1fr 80px', gap: 8, padding: '8px 14px', fontSize: 10, fontWeight: 700, color: P.labelDim, letterSpacing: 0.6, borderBottom: `1px solid ${P.badgeBorder}` }}>
          <div>#</div>
          <div>LIBELLÉ</div>
          <div>COURANT</div>
          <div>PUISSANCE</div>
          <div>ÉTAT</div>
        </div>
        {outlets.map(o => (
          <div key={o.i} style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1fr 1fr 80px', gap: 8, padding: '7px 14px', fontSize: 11, color: P.labelLight, borderBottom: `1px dashed ${P.badgeBorder}` }}>
            <div style={{ fontFamily: 'monospace', color: P.labelDim }}>{o.i + 1}</div>
            <div>{o.label}</div>
            <div style={{ fontFamily: 'monospace' }}>{o.amps} A</div>
            <div style={{ fontFamily: 'monospace' }}>{o.watts} W</div>
            <div style={{ color: o.on ? '#22c55e' : '#64748b', fontWeight: 700 }}>{o.on ? '● ON' : '○ OFF'}</div>
          </div>
        ))}
      </div>

      <PendingBanner P={P} text="📡 Eaton ePDU G3 et APC Rack PDU 2G exposent des OID individuels par prise via SNMP. Switch per-outlet supporté." />
    </>
  );
}

// ─── HSM (vending) ──────────────────────────────────────────────────────────

function HSMMonitoring({ device, P, theme }) {
  const txRate = useSimulated(device, 42, 12);
  const cardsDay = useSimulated(device, 1840, 120);
  const paperPct = useSimulated(device, 67, 6);

  return (
    <>
      <SectionTitle P={P} icon={<Activity size={14} />} text="Activité transactions" />
      <div style={gridStyle}>
        <MetricCard P={P} icon={<Activity size={14} color="#3b82f6" />} label="TX / min" value={`${txRate}`} accent="#3b82f6" sub="Achats + rechargements" />
        <MetricCard P={P} icon={<Database size={14} color="#a855f7" />} label="Cartes traitées (jour)" value={`${cardsDay}`} accent="#a855f7" sub="STS prépaiement" />
        <MetricCard P={P} icon={<List size={14} color="#22c55e" />} label="Niveau papier" value={`${paperPct}%`} accent="#22c55e" sub="Ruban thermique">
          <Donut value={paperPct} color="#22c55e" P={P} />
        </MetricCard>
        <MetricCard P={P} icon={<Shield size={14} color="#ef4444" />} label="Tamper" value="OK" accent="#ef4444" sub="Capot scellé · pas d'alarme" />
      </div>

      <PendingBanner P={P} text="📡 PRISM TSM 500i expose l'état via API propriétaire PRISM HSM + journaux syslog vers le central SBEE." />
    </>
  );
}

// ─── Generic fallback ──────────────────────────────────────────────────────

function GenericMonitoring({ device, P, theme }) {
  return (
    <>
      <SectionTitle P={P} icon={<Info size={14} />} text="Monitoring générique" />
      <div style={{ padding: 30, textAlign: 'center', background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 10 }}>
        <Info size={36} color={P.labelDim} style={{ marginBottom: 10 }} />
        <div style={{ color: P.labelLight, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Pas de panneau de monitoring dédié pour ce type.
        </div>
        <div style={{ color: P.labelDim, fontSize: 11, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
          Le type « {device.type} » n'a pas encore de tableau de bord spécifique.
          Utilisez les informations d'identité et d'emplacement à gauche.
        </div>
      </div>
    </>
  );
}

// ─── Composants utilitaires UI ─────────────────────────────────────────────

function DeviceSVG({ device, side, theme }) {
  const w = 360;
  const h = Math.max(60, Math.min(180, (device.uSize || 1) * 34));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <Device2D device={device} x={0} y={0} width={w} height={h} theme={theme} side={side} />
    </svg>
  );
}

function SidePanel({ P, title, icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, letterSpacing: 0.7, fontWeight: 700,
        color: P.labelDim, textTransform: 'uppercase',
        padding: '4px 8px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {icon}{title}
      </div>
      <div style={{
        background: P.badgeBg,
        border: `1px solid ${P.badgeBorder}`,
        borderRadius: 10,
        padding: 12,
      }}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ P, k, v, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: `1px dashed ${P.badgeBorder}` }}>
      <span style={{ color: P.labelDim }}>{k}</span>
      <span style={{ color: P.labelLight, fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ P, icon, text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, fontWeight: 700, color: P.labelLight,
      margin: '18px 0 10px 2px',
      textTransform: 'uppercase', letterSpacing: 0.6,
    }}>
      {icon}{text}
    </div>
  );
}

function MetricCard({ P, icon, label, value, accent, sub, children }) {
  return (
    <div style={{
      background: P.badgeBg,
      border: `1px solid ${P.badgeBorder}`,
      borderRadius: 10,
      padding: 14,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: accent,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: P.labelDim, letterSpacing: 0.3 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: P.labelLight, marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: P.labelDim, marginTop: 2 }}>{sub}</div>}
      {children && <div style={{ marginTop: 8, height: 60 }}>{children}</div>}
    </div>
  );
}

function ChartCard({ P, title, children }) {
  return (
    <div style={{
      background: P.badgeBg,
      border: `1px solid ${P.badgeBorder}`,
      borderRadius: 10,
      padding: 14,
    }}>
      <div style={{ fontSize: 11, color: P.labelDim, marginBottom: 8, fontWeight: 600, letterSpacing: 0.4 }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={170}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Donut({ value, color, P }) {
  const data = [
    { name: 'used', v: value },
    { name: 'free', v: 100 - value },
  ];
  return (
    <ResponsiveContainer width="100%" height={60}>
      <PieChart>
        <Pie data={data} dataKey="v" innerRadius={16} outerRadius={26} startAngle={90} endAngle={-270} stroke="none">
          <Cell fill={color} />
          <Cell fill={P.badgeBorder} />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function Gauge01({ value, color, P }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ v: value, fill: color }]} startAngle={180} endAngle={0}>
        <RadialBar dataKey="v" clockWise background={{ fill: P.badgeBorder }} cornerRadius={3} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

function PendingBanner({ P, text }) {
  return (
    <div style={{
      marginTop: 18, padding: '12px 14px',
      background: 'rgba(56, 189, 248, 0.08)',
      border: '1px solid rgba(56, 189, 248, 0.22)',
      borderRadius: 8,
      fontSize: 11, color: P.labelMid, lineHeight: 1.6,
    }}>
      {text}
    </div>
  );
}

function FullMsg({ P, children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '80vh', gap: 14, color: P.labelMid,
    }}>
      {children}
    </div>
  );
}

// ─── Helpers : séries simulées déterministes ────────────────────────────────

function hashCode(str) {
  let h = 0; for (let i = 0; i < (str || '').length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function useSimulated(device, baseline, amplitude) {
  const h = hashCode(device.id);
  return Math.max(0, Math.min(100, Math.round(baseline + Math.sin(h * 0.7) * amplitude)));
}

function useSimSeries(device, points, baseline, amplitude) {
  const h = hashCode(device.id);
  return Array.from({ length: points }, (_, i) => ({
    t: `T-${points - i}`,
    v: Math.max(0, Math.round(baseline + Math.sin((h + i) * 0.35) * amplitude + Math.cos((h + i) * 0.7) * (amplitude / 2))),
  }));
}

function useSimSeriesDual(device, points) {
  const h = hashCode(device.id);
  return Array.from({ length: points }, (_, i) => ({
    t: `T-${points - i}`,
    tx: Math.max(0, Math.round(180 + Math.sin((h + i) * 0.42) * 80)),
    rx: Math.max(0, Math.round(220 + Math.cos((h + i) * 0.31) * 90)),
  }));
}

// ─── Styles racine ──────────────────────────────────────────────────────────

const pageStyle = (P) => ({
  minHeight: 'calc(100vh - 56px)',
  background: `linear-gradient(180deg, ${P.pageBgTop} 0%, ${P.pageBgBot} 100%)`,
  color: P.labelLight,
  fontFamily: 'Inter, system-ui, sans-serif',
});

const topBarStyle = (P) => ({
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '14px 22px',
  background: P.badgeBg,
  borderBottom: `1px solid ${P.badgeBorder}`,
});

const backBtn = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 12px',
  background: 'transparent',
  border: '1px solid rgba(100, 116, 139, 0.3)',
  color: '#94a3b8',
  borderRadius: 6,
  fontSize: 11, fontWeight: 600,
  cursor: 'pointer',
};

const refreshBtn = (P) => ({
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 12px',
  background: P.badgeBg,
  border: `1px solid ${P.badgeBorder}`,
  color: P.labelMid,
  borderRadius: 6, fontSize: 11,
  cursor: 'pointer',
});

const bodyStyle = {
  display: 'flex',
  gap: 18,
  padding: 18,
};

const leftColStyle = (P) => ({
  width: 420,
  flexShrink: 0,
});

const rightColStyle = {
  flex: 1, minWidth: 0,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 14,
};

const tipStyle = (P, theme) => ({
  background: theme === 'light' ? '#ffffff' : '#12151b',
  border: `1px solid ${P.badgeBorder}`,
  borderRadius: 6,
  fontSize: 11,
  color: P.labelLight,
});

// Dummy List icon (lucide has it)
function List(props) { return <Layers {...props} />; }
