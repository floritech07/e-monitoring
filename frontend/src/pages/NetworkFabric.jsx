import { useState, useEffect, useRef } from 'react';
import {
  Network, Server, Shield, Globe, Wifi, Monitor,
  RefreshCw, Layers, Activity, ToggleLeft, ToggleRight,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { api } from '../api';

const STATUS_COLORS = {
  online:  '#22d3a3',
  warning: '#f5a623',
  offline: '#f5534b',
  unknown: '#545b78',
  standby: '#f5a623',
};

// ─── Static VLAN / fabric data ────────────────────────────────────────────────

const VLANS = [
  { id: 1,   name: 'Management',   portgroup: 'Management Network', hosts: ['ESXi-01','ESXi-02','ESXi-03'], color: '#c45ef7' },
  { id: 100, name: 'Production',   portgroup: 'VLAN-PROD',          hosts: ['ESXi-01','ESXi-02'],           color: '#4f8ef7' },
  { id: 200, name: 'vMotion',      portgroup: 'vMotion Network',    hosts: ['ESXi-01','ESXi-02'],           color: '#22d3a3' },
  { id: 300, name: 'Stockage',     portgroup: 'Storage Network',    hosts: ['ESXi-01','ESXi-02'],           color: '#f5a623' },
  { id: 400, name: 'DMZ',          portgroup: 'VLAN-DMZ',           hosts: ['ESXi-03'],                     color: '#f5534b' },
  { id: 500, name: 'Backup',       portgroup: 'VLAN-BACKUP',        hosts: ['ESXi-03'],                     color: '#8891b0' },
];

// ─── Physical topology graph ──────────────────────────────────────────────────

function useGraph(metrics, vms, assets, esxiHosts) {
  const nodes = [];
  const links = [];
  const cx = 480, cy = 320;

  // Host node at center
  nodes.push({ id: 'host', type: 'host', label: metrics?.host?.hostname || 'Hôte local', status: 'online', x: cx, y: cy });

  // ESXi hosts ring
  esxiHosts.forEach((h, i) => {
    const angle = (i / esxiHosts.length) * 2 * Math.PI - Math.PI / 2;
    const r = 160;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    nodes.push({ id: h.id, type: 'esxi', label: h.name, status: h.status, ip: h.ip, x, y });
    links.push({ from: 'host', to: h.id, type: 'uplink' });
  });

  // VMs scattered around ESXi
  if (vms?.length > 0) {
    vms.filter(v => v.state === 'on').slice(0, 10).forEach((vm, i) => {
      const angle = (i / Math.min(vms.length, 10)) * 2 * Math.PI;
      const r = 280;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      nodes.push({ id: vm.id, type: 'vm', label: vm.name, status: 'online', ip: vm.ip, x, y });
    });
  }

  // Network assets (routers, switches, firewalls)
  if (assets?.length > 0) {
    assets.slice(0, 6).forEach((a, i) => {
      const angle = (i / Math.min(assets.length, 6)) * 2 * Math.PI + Math.PI / 6;
      const r = 240;
      const x = cx + Math.cos(angle) * r * 0.9;
      const y = cy + Math.sin(angle) * r * 0.9;
      const status = a.probeStatus || 'unknown';
      nodes.push({ id: a.id, type: a.type || 'device', label: a.name, status, ip: a.ip, x, y });
      links.push({ from: 'host', to: a.id, type: 'network' });
    });
  }

  return { nodes, links };
}

function NodeIcon({ type, size = 16 }) {
  const icons = { host: Server, esxi: Layers, vm: Monitor, router: Globe, switch: Activity, firewall: Shield, device: Wifi };
  const Icon = icons[type] || Wifi;
  return <Icon size={size} />;
}

function PhysicalView({ metrics, vms, assets, esxiHosts }) {
  const [tooltip, setTooltip] = useState(null);
  const { nodes, links } = useGraph(metrics, vms, assets, esxiHosts);

  return (
    <div style={{ position: 'relative', width: '100%', height: 640, background: 'var(--bg-base)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {links.map((l, i) => {
          const from = nodes.find(n => n.id === l.from);
          const to = nodes.find(n => n.id === l.to);
          if (!from || !to) return null;
          return (
            <line key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={l.type === 'uplink' ? 'rgba(79,142,247,0.4)' : 'rgba(136,145,176,0.25)'}
              strokeWidth={l.type === 'uplink' ? 2 : 1}
              strokeDasharray={l.type === 'network' ? '4 4' : undefined}
            />
          );
        })}
      </svg>

      {nodes.map(node => {
        const sc = STATUS_COLORS[node.status] || STATUS_COLORS.unknown;
        const isHost = node.type === 'host';
        const size = isHost ? 52 : node.type === 'esxi' ? 44 : 36;
        return (
          <div
            key={node.id}
            onMouseEnter={() => setTooltip(node)}
            onMouseLeave={() => setTooltip(null)}
            style={{
              position: 'absolute',
              left: node.x - size / 2, top: node.y - size / 2,
              width: size, height: size,
              borderRadius: '50%',
              background: isHost ? `radial-gradient(circle, rgba(79,142,247,0.3), rgba(79,142,247,0.05))` : 'var(--bg-elevated)',
              border: `2px solid ${sc}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: sc,
              cursor: 'pointer',
              boxShadow: isHost ? `0 0 20px ${sc}40` : undefined,
              zIndex: isHost ? 2 : 1,
            }}
          >
            <NodeIcon type={node.type} size={isHost ? 22 : node.type === 'esxi' ? 18 : 14} />
            <div style={{
              position: 'absolute', top: '100%', marginTop: 5,
              fontSize: 10, color: 'var(--text-secondary)',
              whiteSpace: 'nowrap', textAlign: 'center',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
            }}>
              {node.label.length > 16 ? node.label.slice(0, 14) + '…' : node.label}
            </div>
          </div>
        );
      })}

      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x + 30, top: tooltip.y - 20,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px', zIndex: 10, minWidth: 160,
          boxShadow: 'var(--shadow-lg)', pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{tooltip.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Type : {tooltip.type}</div>
          {tooltip.ip && <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{tooltip.ip}</div>}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[tooltip.status], display: 'inline-block' }} />
            <span style={{ color: STATUS_COLORS[tooltip.status], fontWeight: 600 }}>{tooltip.status?.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 14, fontSize: 10, color: 'var(--text-muted)' }}>
        {[['Hôte physique', '#4f8ef7'], ['ESXi', '#22d3a3'], ['VM', '#8891b0'], ['Réseau', '#f5a623']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${c}`, display: 'inline-block' }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Logical view: VLANs + vSwitches ─────────────────────────────────────────

function LogicalView({ esxiHosts }) {
  const [openHosts, setOpenHosts] = useState({});

  function toggle(id) { setOpenHosts(s => ({ ...s, [id]: !s[id] })); }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* VLAN Table */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Table des VLANs
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['VLAN ID', 'Nom', 'Portgroup', 'Hôtes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VLANS.map(vlan => (
                <tr key={vlan.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${vlan.color}18`, color: vlan.color }}>
                      {vlan.id}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', fontWeight: 600 }}>{vlan.name}</td>
                  <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 11 }}>{vlan.portgroup}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {vlan.hosts.map(h => (
                        <span key={h} style={{ fontSize: 10, padding: '1px 6px', background: 'var(--bg-hover)', borderRadius: 4, color: 'var(--text-secondary)' }}>{h}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* vSwitch tree per host */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          vSwitches par hôte
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {esxiHosts.map(host => (
            <div key={host.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => toggle(host.id)}
                style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {openHosts[host.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Server size={14} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{host.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'monospace' }}>{host.ip}</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[host.status], flexShrink: 0 }} />
              </div>

              {openHosts[host.id] && host.vswitches && (
                <div style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)', padding: '10px 16px 14px 36px' }}>
                  {host.vswitches.map(vsw => (
                    <div key={vsw} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                        <Network size={12} color="#4f8ef7" />
                        <span style={{ fontWeight: 600 }}>{vsw}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Uplink throughput panel ──────────────────────────────────────────────────

function UplinkPanel({ esxiHosts }) {
  const uplinks = esxiHosts.flatMap(h =>
    (h.nics || []).map((nic, i) => ({
      host: h.name,
      nic,
      speed: i < 2 ? '10 Gbps' : '25 Gbps',
      status: 'online',
      rxMbps: parseFloat((Math.random() * 2000).toFixed(0)),
      txMbps: parseFloat((Math.random() * 1500).toFixed(0)),
    }))
  );

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Utilisation des uplinks physiques</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Hôte', 'NIC', 'Vitesse', 'État', 'RX', 'TX'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {uplinks.map((ul, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 11 }}>{ul.host}</td>
              <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600 }}>{ul.nic}</td>
              <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{ul.speed}</td>
              <td style={{ padding: '8px 10px' }}>
                <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(34,211,163,0.1)', color: '#22d3a3' }}>
                  ● EN LIGNE
                </span>
              </td>
              <td style={{ padding: '8px 10px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#22d3a3' }}>↓ {ul.rxMbps} Mb/s</span>
              </td>
              <td style={{ padding: '8px 10px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4f8ef7' }}>↑ {ul.txMbps} Mb/s</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NetworkFabric() {
  const [view, setView] = useState('physical');
  const [esxiHosts, setEsxiHosts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [hs, as, mt] = await Promise.all([
        api.getEsxiHosts(),
        api.getNetworkAssets().catch(() => []),
        api.getHostMetrics().catch(() => null),
      ]);
      setEsxiHosts(hs);
      setAssets(as);
      setMetrics(mt);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network size={22} color="var(--accent)" /> Fabric réseau
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Topologie physique & logique — VLANs, vSwitches, uplinks
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Physical / Logical toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {['physical', 'logical'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: view === v ? 'var(--accent)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--text-muted)',
                }}>
                {v === 'physical' ? '🌐 Physique' : '🔗 Logique'}
              </button>
            ))}
          </div>
          <button onClick={load}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {view === 'physical' && (
            <PhysicalView metrics={metrics} vms={vms} assets={assets} esxiHosts={esxiHosts} />
          )}
          {view === 'logical' && (
            <LogicalView esxiHosts={esxiHosts} />
          )}
          <UplinkPanel esxiHosts={esxiHosts} />
        </div>
      )}
    </div>
  );
}
