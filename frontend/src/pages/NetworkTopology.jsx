import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe, RefreshCw, ZoomIn, ZoomOut, Maximize2,
  Server, Monitor, Router, Shield, Wifi, WifiOff,
  Plus, Trash2, Activity, Clock, ChevronRight, X, Save
} from 'lucide-react';
import { api } from '../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  online:  '#22d3a3',
  warning: '#f5a623',
  offline: '#f5534b',
  unknown: '#545b78',
};

const TYPE_ICONS = {
  host:     Server,
  vm:       Monitor,
  router:   Globe,
  switch:   Activity,
  firewall: Shield,
  device:   Wifi,
};

function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.unknown;
}

// ─── SVG Topology Canvas ──────────────────────────────────────────────────────

function positionNodes(nodes, edges, width, height) {
  const cx  = width / 2;
  const cy  = height / 2;
  const pos = {};

  // Host always in centre
  const hostNode = nodes.find(n => n.type === 'host');
  if (hostNode) pos[hostNode.id] = { x: cx, y: cy };

  // VMs in inner ring
  const vms  = nodes.filter(n => n.type === 'vm');
  vms.forEach((vm, i) => {
    const angle = (i / vms.length) * 2 * Math.PI - Math.PI / 2;
    pos[vm.id] = { x: cx + Math.cos(angle) * 160, y: cy + Math.sin(angle) * 130 };
  });

  // Network assets in outer ring
  const netAssets = nodes.filter(n => n.type !== 'vm' && n.type !== 'host');
  netAssets.forEach((a, i) => {
    const angle = (i / netAssets.length) * 2 * Math.PI - Math.PI / 2;
    const r     = Math.max(260, 80 + netAssets.length * 30);
    pos[a.id]   = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  return pos;
}

// ─── Node Tooltip ─────────────────────────────────────────────────────────────

function NodeTooltip({ node, pos }) {
  if (!node || !pos) return null;
  return (
    <div style={{
      position: 'absolute',
      left: pos.x + 16,
      top:  pos.y - 20,
      background: 'var(--bg-elevated)',
      border: `1px solid ${getStatusColor(node.status)}44`,
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      minWidth: 180,
      pointerEvents: 'none',
      zIndex: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(node.status), display: 'inline-block', flexShrink: 0 }} />
        {node.label}
      </div>
      {node.ip && <div style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>{node.ip}</div>}
      <div style={{ marginTop: 6, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{node.type}</div>
      {node.latency != null && (
        <div style={{ marginTop: 4 }}>
          <span style={{ color: node.latency > 100 ? 'var(--warning)' : 'var(--success)' }}>
            {node.latency}ms
          </span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>latence</span>
        </div>
      )}
      {node.cpu != null && (
        <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
          CPU: <span style={{ color: 'var(--text-primary)' }}>{node.cpu}%</span>
          {node.ram != null && <> · RAM: <span style={{ color: 'var(--text-primary)' }}>{node.ram}%</span></>}
        </div>
      )}
    </div>
  );
}

// ─── SVG Graph ────────────────────────────────────────────────────────────────

function TopologySVG({ graph, width, height, onNodeClick }) {
  const [hover,  setHover]  = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [pan,    setPan]    = useState({ x: 0, y: 0 });
  const [zoom,   setZoom]   = useState(1);
  const [drag,   setDrag]   = useState(null);
  const svgRef  = useRef(null);

  const positions = positionNodes(graph.nodes || [], graph.edges || [], width, height);

  function handleWheel(e) {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  }

  function handleMouseDown(e) {
    if (e.target.tagName === 'svg' || e.target.tagName === 'line') {
      setDrag({ sx: e.clientX - pan.x, sy: e.clientY - pan.y });
    }
  }

  function handleMouseMove(e) {
    if (drag) setPan({ x: e.clientX - drag.sx, y: e.clientY - drag.sy });
  }

  function handleMouseUp() { setDrag(null); }

  function fitToScreen() { setPan({ x: 0, y: 0 }); setZoom(1); }

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { icon: ZoomIn,    title: 'Zoom +',      fn: () => setZoom(z => Math.min(3, z + 0.2)) },
          { icon: ZoomOut,   title: 'Zoom -',      fn: () => setZoom(z => Math.max(0.3, z - 0.2)) },
          { icon: Maximize2, title: 'Ajuster',     fn: fitToScreen },
        ].map(({ icon: Icon, title, fn }) => (
          <button key={title} title={title} onClick={fn} style={{
            width: 30, height: 30, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
          }}>
            <Icon size={13} />
          </button>
        ))}
      </div>

      {/* Status legends */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, display: 'flex', gap: 10, fontSize: 11 }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ textTransform: 'capitalize' }}>{status}</span>
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ cursor: drag ? 'grabbing' : 'grab', display: 'block' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {(graph.edges || []).map((edge, i) => {
            const sp = positions[edge.source];
            const ep = positions[edge.target];
            if (!sp || !ep) return null;
            const isDown = (graph.nodes || []).find(n => n.id === edge.target)?.status === 'offline';
            return (
              <line
                key={i}
                x1={sp.x} y1={sp.y} x2={ep.x} y2={ep.y}
                stroke={isDown ? '#f5534b44' : '#252938'}
                strokeWidth={isDown ? 1 : 1.5}
                strokeDasharray={isDown ? '4 4' : 'none'}
              />
            );
          })}

          {/* Nodes */}
          {(graph.nodes || []).map(node => {
            const p     = positions[node.id];
            if (!p) return null;
            const color = getStatusColor(node.status);
            const r     = node.type === 'host' ? 22 : 14;
            const isHov = hover?.id === node.id;

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick(node)}
                onMouseEnter={() => { setHover(node); setHoverPos({ x: p.x * zoom + pan.x, y: p.y * zoom + pan.y }); }}
                onMouseLeave={() => { setHover(null); setHoverPos(null); }}
              >
                {/* Halo */}
                {node.status !== 'offline' && (
                  <circle
                    cx={p.x} cy={p.y} r={r + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.2}
                    style={isHov ? { opacity: 0.5 } : undefined}
                  />
                )}
                {/* Pulse ring for offline */}
                {node.status === 'offline' && (
                  <circle cx={p.x} cy={p.y} r={r + 6} fill="none" stroke="#f5534b" strokeWidth={1.5} opacity={0.4} strokeDasharray="3 2" />
                )}
                {/* Main circle */}
                <circle
                  cx={p.x} cy={p.y} r={r}
                  fill={isHov ? `${color}33` : 'var(--bg-surface)'}
                  stroke={color}
                  strokeWidth={isHov ? 2.5 : 1.5}
                  filter={isHov ? 'url(#glow)' : undefined}
                />
                {/* Type icon (simplified to text) */}
                <text
                  x={p.x} y={p.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={node.type === 'host' ? 14 : 9}
                  fill={color}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {node.type === 'host' ? 'H'
                   : node.type === 'vm' ? 'VM'
                   : node.type === 'router' ? 'RT'
                   : node.type === 'switch' ? 'SW'
                   : node.type === 'firewall' ? 'FW'
                   : 'N'}
                </text>
                {/* Node label */}
                <text
                  x={p.x} y={p.y + r + 12}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--text-secondary)"
                  fontFamily="Inter, sans-serif"
                >
                  {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                </text>
                {node.latency != null && (
                  <text
                    x={p.x} y={p.y + r + 22}
                    textAnchor="middle"
                    fontSize={8}
                    fill={node.latency > 100 ? '#f5a623' : '#22d3a3'}
                    fontFamily="JetBrains Mono"
                  >
                    {node.latency}ms
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hover && hoverPos && <NodeTooltip node={hover} pos={hoverPos} />}
    </div>
  );
}

// ─── Asset Editor Modal ───────────────────────────────────────────────────────

function AssetModal({ asset, onClose, onSave }) {
  const [form, setForm] = useState(asset || { name: '', ip: '', type: 'router', pingEnabled: true, tags: [] });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {}
    setSaving(false);
  }

  const F = ({ label, name, type = 'text', ...rest }) => (
    <div>
      <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input
        type={type}
        value={form[name] || ''}
        onChange={e => setForm(p => ({ ...p, [name]: type === 'number' ? +e.target.value : e.target.value }))}
        style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
        {...rest}
      />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <form onSubmit={submit} className="card glass-panel fade-in" style={{ width: 440, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{asset ? 'Modifier l\'asset' : 'Ajouter un asset réseau'}</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <F label="Nom" name="name" placeholder="Switch Cœur" required />
          <F label="Adresse IP" name="ip" placeholder="192.168.1.1" required />
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</label>
            <select
              value={form.type || 'router'}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
            >
              {['router','switch','firewall','server','printer','device'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.pingEnabled || false} onChange={e => setForm(p => ({ ...p, pingEnabled: e.target.checked }))} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
            Activer le ping ICMP
          </label>
          <F label="Port TCP (optionnel)" name="tcpPort" type="number" placeholder="80" min={1} max={65535} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <RefreshCw size={13} className="rotate-animation" /> : <Save size={13} />}
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NetworkTopology({ metrics, vms }) {
  const [graph,     setGraph]     = useState({ nodes: [], edges: [] });
  const [assets,    setAssets]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [modal,     setModal]     = useState(null); // null | 'add' | asset object
  const [tab,       setTab]       = useState('topology');
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 520 });

  useEffect(() => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setDims({ w: r.width || 900, h: 520 });
    }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [topo, assetList] = await Promise.all([api.getTopology(), api.getNetworkAssets()]);
      setGraph(topo);
      setAssets(assetList);
    } catch {}
    setLoading(false);
  }

  async function handleSaveAsset(form) {
    if (form.id) {
      await api.updateAsset(form.id, form);
    } else {
      await api.createAsset(form);
    }
    load();
  }

  async function handleDeleteAsset(id) {
    if (!confirm('Supprimer cet asset réseau ?')) return;
    await api.deleteAsset(id);
    load();
  }

  async function handleProbeAsset(id) {
    await api.probeAsset(id);
    setTimeout(load, 1000);
  }

  const statusCounts = {
    online:  assets.filter(a => a.probeStatus === 'online').length,
    warning: assets.filter(a => a.probeStatus === 'warning').length,
    offline: assets.filter(a => a.probeStatus === 'offline').length,
    unknown: assets.filter(a => !a.probeStatus || a.probeStatus === 'unknown').length,
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title glow-text">Topologie Réseau</h1>
          <p className="page-subtitle">Vue topologique de l'infrastructure réseau SBEE</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
            <Plus size={13} /> Ajouter un asset
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'rotate-animation' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* Status KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="card glass-panel" style={{ padding: '12px 16px', borderColor: count > 0 && status === 'offline' ? 'rgba(245,83,75,0.3)' : 'var(--border)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{status}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: STATUS_COLORS[status], marginTop: 2, fontFamily: 'JetBrains Mono' }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: 20 }}>
        <div className={`tab-btn ${tab === 'topology' ? 'active' : ''}`} onClick={() => setTab('topology')}>
          <Globe size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />Topologie
        </div>
        <div className={`tab-btn ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          <Activity size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />Assets réseau
        </div>
      </div>

      {tab === 'topology' && (
        <div ref={containerRef} className="card glass-panel" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div className="empty-state" style={{ height: 520 }}>
              <div className="loading-spin" />Chargement de la topologie...
            </div>
          ) : graph.nodes.length === 0 ? (
            <div className="empty-state" style={{ height: 520 }}>
              <Globe size={48} style={{ opacity: 0.3 }} />
              <div>Aucun nœud réseau</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ajoutez des assets réseau pour visualiser la topologie</div>
            </div>
          ) : (
            <TopologySVG
              graph={graph}
              width={dims.w}
              height={dims.h}
              onNodeClick={setSelected}
            />
          )}

          {/* Node detail panel */}
          {selected && (
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 240,
              background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
              padding: 20, overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.label}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={13} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                {[
                  ['Type', selected.type],
                  ['Statut', selected.status],
                  ['IP', selected.ip || '—'],
                  ['Latence', selected.latency != null ? `${selected.latency}ms` : '—'],
                  ['CPU', selected.cpu != null ? `${selected.cpu}%` : '—'],
                  ['RAM', selected.ram != null ? `${selected.ram}%` : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'list' && (
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['Statut','Nom','IP','Type','Latence','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr
                  key={a.id}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: `${STATUS_COLORS[a.probeStatus] || STATUS_COLORS.unknown}22`,
                      color: STATUS_COLORS[a.probeStatus]  || STATUS_COLORS.unknown,
                      border: `1px solid ${STATUS_COLORS[a.probeStatus] || STATUS_COLORS.unknown}44`,
                      textTransform: 'capitalize',
                    }}>
                      {a.probeStatus || 'Inconnu'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{a.name}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-muted)' }}>{a.ip}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{a.type}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: a.latency > 100 ? 'var(--warning)' : 'var(--success)' }}>
                    {a.latency != null ? `${a.latency}ms` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" title="Sonder" onClick={() => handleProbeAsset(a.id)}>
                        <Wifi size={11} />
                      </button>
                      <button className="btn btn-sm btn-ghost" title="Modifier" onClick={() => setModal(a)}>
                        <ChevronRight size={11} />
                      </button>
                      <button className="btn btn-sm btn-danger" title="Supprimer" onClick={() => handleDeleteAsset(a.id)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun asset réseau configuré. Cliquez sur "Ajouter un asset".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <AssetModal
          asset={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSaveAsset}
        />
      )}
    </div>
  );
}
