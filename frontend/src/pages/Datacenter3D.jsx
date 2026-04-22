import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Server, Layers, Plus, Trash2, RefreshCw, MapPin, Info,
  Thermometer, Zap, HardDrive, Network, Cpu, Save, X,
  LayoutGrid, Rotate3D,
} from 'lucide-react';
import { api } from '../api';
import { useSocket } from '../hooks/useSocket';
import DatacenterScene from '../components/datacenter3d/DatacenterScene';
import RacksRow2D from '../components/datacenter2d/RacksRow2D';
import DeviceWidget from '../components/datacenter2d/DeviceWidget';

/**
 * Page principale du jumeau numérique 3D.
 *
 * Organisation :
 *  - header : compteurs + bouton refresh + bouton "Ajouter un rack"
 *  - corps : canvas 3D (2/3) + panneau latéral de sélection (1/3)
 *  - modales : formulaires d'ajout rack / équipement
 */
export default function Datacenter3D() {
  const navigate = useNavigate();
  const { datacenter: liveDatacenter, connected } = useSocket();
  const [datacenter, setDatacenter] = useState(null);
  const [deviceTypes, setDeviceTypes] = useState({});
  const [selection, setSelection] = useState({ kind: null, id: null });
  const [error, setError] = useState(null);
  const [showAddRack, setShowAddRack] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  // Mode de vue : '2d' (rack elevation réaliste DCIM) par défaut, '3d' (showcase)
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('datacenter.viewMode') || '2d'; }
    catch { return '2d'; }
  });
  useEffect(() => {
    try { localStorage.setItem('datacenter.viewMode', viewMode); } catch {}
  }, [viewMode]);

  // Chargement initial via REST (au cas où le WS prenne une seconde à pousser)
  useEffect(() => {
    Promise.all([api.getDatacenter(), api.getDeviceTypes()])
      .then(([dc, types]) => { setDatacenter(dc); setDeviceTypes(types); })
      .catch(e => setError(e.message));
  }, []);

  // Actualisation temps réel via Socket.IO
  useEffect(() => { if (liveDatacenter) setDatacenter(liveDatacenter); }, [liveDatacenter]);

  const room = datacenter?.rooms?.[0] || null;
  const stats = useMemo(() => {
    if (!room) return { racks: 0, devices: 0, uTotal: 0, uUsed: 0 };
    const racks   = room.racks.length;
    const devices = room.racks.reduce((s, r) => s + r.devices.length, 0);
    const uTotal  = room.racks.reduce((s, r) => s + (r.uHeight || 42), 0);
    const uUsed   = room.racks.reduce((s, r) => s + r.devices.reduce((a, d) => a + (d.uSize || 0), 0), 0);
    return { racks, devices, uTotal, uUsed };
  }, [room]);

  const selectedRack = useMemo(() => {
    if (selection.kind !== 'rack') return null;
    return room?.racks.find(r => r.id === selection.id) || null;
  }, [selection, room]);

  const selectedDevice = useMemo(() => {
    if (selection.kind !== 'device') return null;
    for (const r of room?.racks || []) {
      const d = r.devices.find(x => x.id === selection.id);
      if (d) return { device: d, rack: r };
    }
    return null;
  }, [selection, room]);

  async function refresh() {
    try { setDatacenter(await api.getDatacenter()); } catch (e) { setError(e.message); }
  }

  async function handleAddRack(data) {
    try {
      await api.addRack(room.id, data);
      setShowAddRack(false);
      await refresh();
    } catch (e) { setError(e.message); }
  }

  async function handleAddDevice(data) {
    try {
      const rackId = data.rackId;
      const { rackId: _, ...body } = data;
      await api.addDevice(rackId, body);
      setShowAddDevice(false);
      await refresh();
    } catch (e) { setError(e.message); }
  }

  async function handleDeleteRack(rackId) {
    if (!confirm('Supprimer ce rack et tous ses équipements ?')) return;
    try { await api.deleteRack(rackId); setSelection({ kind: null, id: null }); await refresh(); }
    catch (e) { setError(e.message); }
  }

  async function handleDeleteDevice(deviceId) {
    if (!confirm('Retirer cet équipement du rack ?')) return;
    try { await api.deleteDevice(deviceId); setSelection({ kind: null, id: null }); await refresh(); }
    catch (e) { setError(e.message); }
  }

  // Drag & drop 2D : déplacement d'un équipement vers un U libre du même rack.
  // Le backend valide la position via assertUnitRangeFree() — si conflit, on affiche l'erreur.
  async function handleMoveDevice(deviceId, newUStart) {
    try {
      await api.updateDevice(deviceId, { uStart: newUStart });
      await refresh();
    } catch (e) {
      setError(`Déplacement refusé : ${e.message}`);
      // Recharge quand même pour reprendre l'état serveur (au cas où l'UI optimiste diverge)
      await refresh();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: 'var(--bg-primary, #0b0c10)' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Box size={22} color="var(--accent, #5794f2)" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0' }}>
              {datacenter?.name || 'Jumeau numérique — Salle serveur'}
            </div>
            <div style={{ fontSize: 11, color: '#8e8e8e' }}>
              {room?.name} · {stats.racks} racks · {stats.devices} équipements · {stats.uUsed}/{stats.uTotal}U occupés
              {connected ? (
                <span style={{ color: '#22c55e', marginLeft: 8 }}>● temps réel</span>
              ) : (
                <span style={{ color: '#ef4444', marginLeft: 8 }}>● hors ligne</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Toggle vue 2D ↔ 3D */}
          <div style={viewToggleStyle}>
            <button
              style={viewMode === '2d' ? viewToggleBtnActive : viewToggleBtn}
              onClick={() => setViewMode('2d')}
              title="Vue rack réaliste (DCIM)"
            >
              <LayoutGrid size={13} /> 2D
            </button>
            <button
              style={viewMode === '3d' ? viewToggleBtnActive : viewToggleBtn}
              onClick={() => setViewMode('3d')}
              title="Vue 3D immersive"
            >
              <Rotate3D size={13} /> 3D
            </button>
          </div>
          <button style={btnStyle} onClick={refresh} title="Recharger">
            <RefreshCw size={14} /> Actualiser
          </button>
          <button style={btnPrimaryStyle} onClick={() => setShowAddRack(true)}>
            <Plus size={14} /> Ajouter un rack
          </button>
          <button
            style={{ ...btnPrimaryStyle, background: '#22c55e' }}
            onClick={() => setShowAddDevice(true)}
            disabled={!room?.racks.length}
            title={room?.racks.length ? '' : 'Créez d\'abord un rack'}
          >
            <Plus size={14} /> Ajouter un équipement
          </button>
        </div>
      </div>

      {error && (
        <div style={errorBannerStyle}>
          <X size={14} style={{ cursor: 'pointer' }} onClick={() => setError(null)} />
          {error}
        </div>
      )}

      {/* Corps : 3D + panneau latéral */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {!room ? (
            <div style={emptyStyle}>
              <Server size={48} opacity={0.3} />
              <div>Chargement de la topologie…</div>
            </div>
          ) : room.racks.length === 0 ? (
            <div style={emptyStyle}>
              <Layers size={48} opacity={0.3} />
              <div style={{ fontSize: 14, color: '#e8eaf0' }}>Aucun rack dans la salle</div>
              <div style={{ fontSize: 12, color: '#8e8e8e' }}>
                Cliquez sur « Ajouter un rack » pour modéliser le premier rack de la SBEE.
              </div>
              <button style={btnPrimaryStyle} onClick={() => setShowAddRack(true)}>
                <Plus size={14} /> Créer le premier rack
              </button>
            </div>
          ) : viewMode === '3d' ? (
            <DatacenterScene
              room={room}
              selectedRackId={selection.kind === 'rack' ? selection.id : null}
              selectedDeviceId={selection.kind === 'device' ? selection.id : null}
              onSelectRack={(r) => setSelection({ kind: 'rack', id: r.id })}
              onSelectDevice={(d) => setSelection({ kind: 'device', id: d.id })}
              onBackgroundClick={() => setSelection({ kind: null, id: null })}
            />
          ) : (
            <RacksRow2D
              room={room}
              selectedRackId={selection.kind === 'rack' ? selection.id : null}
              selectedDeviceId={selection.kind === 'device' ? selection.id : null}
              onSelectRack={(r) => setSelection({ kind: 'rack', id: r.id })}
              onSelectDevice={(d) => setSelection({ kind: 'device', id: d.id })}
              onBackgroundClick={() => setSelection({ kind: null, id: null })}
              onMoveDevice={handleMoveDevice}
            />
          )}

          {/* Légende flottante — uniquement en mode 3D (la 2D a sa propre légende intégrée) */}
          {room?.racks.length > 0 && viewMode === '3d' && (
            <div style={legendStyle}>
              <div style={{ fontSize: 10, color: '#8e8e8e', marginBottom: 4 }}>NAVIGATION</div>
              <div style={{ fontSize: 11, color: '#e8eaf0' }}>🖱️ Clic-gauche : rotation</div>
              <div style={{ fontSize: 11, color: '#e8eaf0' }}>🖱️ Clic-droit : panoramique</div>
              <div style={{ fontSize: 11, color: '#e8eaf0' }}>🖱️ Molette : zoom</div>
            </div>
          )}
        </div>

        {/* Panneau latéral — affiche uniquement l'idle/rack ; le device utilise le widget flottant */}
        <div style={sidePanelStyle}>
          {(selection.kind === null || selection.kind === 'device') && (
            <IdlePanel stats={stats} room={room} />
          )}
          {selectedRack && (
            <RackPanel
              rack={selectedRack}
              onClose={() => setSelection({ kind: null, id: null })}
              onDelete={() => handleDeleteRack(selectedRack.id)}
              onAddDevice={() => setShowAddDevice(true)}
            />
          )}
        </div>
      </div>

      {/* Widget flottant d'équipement — remplace le panneau latéral device */}
      {selectedDevice && (
        <DeviceWidget
          device={selectedDevice.device}
          rack={selectedDevice.rack}
          typeMeta={deviceTypes[selectedDevice.device.type]}
          onClose={() => setSelection({ kind: null, id: null })}
          onDelete={() => handleDeleteDevice(selectedDevice.device.id)}
          onOpenDetails={(d) => navigate(`/datacenter-3d/device/${d.id}`)}
        />
      )}

      {showAddRack && (
        <AddRackModal onClose={() => setShowAddRack(false)} onSubmit={handleAddRack} />
      )}
      {showAddDevice && (
        <AddDeviceModal
          racks={room?.racks || []}
          deviceTypes={deviceTypes}
          preselectRackId={selection.kind === 'rack' ? selection.id : null}
          onClose={() => setShowAddDevice(false)}
          onSubmit={handleAddDevice}
        />
      )}
    </div>
  );
}

// ─── Panneaux latéraux ─────────────────────────────────────────────────────

function IdlePanel({ stats, room }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={panelTitle}><Info size={14} /> Vue d'ensemble</div>
      <StatRow icon={<Layers size={12} />}   label="Racks"        value={stats.racks} />
      <StatRow icon={<Server size={12} />}   label="Équipements"  value={stats.devices} />
      <StatRow icon={<HardDrive size={12} />}label="U occupés"    value={`${stats.uUsed} / ${stats.uTotal}`} />
      <StatRow icon={<MapPin size={12} />}   label="Dimensions"
        value={room ? `${room.dimensions.width}×${room.dimensions.depth} m` : '—'} />

      <div style={{ marginTop: 18, fontSize: 11, color: '#8e8e8e', lineHeight: 1.6 }}>
        Sélectionnez un rack ou un équipement dans la scène 3D pour en voir le détail.
      </div>
    </div>
  );
}

function RackPanel({ rack, onClose, onDelete, onAddDevice }) {
  const uUsed = rack.devices.reduce((s, d) => s + d.uSize, 0);
  return (
    <div style={{ padding: 16 }}>
      <PanelHeader title={rack.name} subtitle={`Rack · ${rack.uHeight}U`} onClose={onClose} />
      <StatRow label="Constructeur" value={rack.vendor || '—'} />
      <StatRow label="Modèle"       value={rack.model  || '—'} />
      <StatRow label="Position"     value={`x=${rack.coords?.x?.toFixed(1)}m · z=${rack.coords?.z?.toFixed(1)}m`} />
      <StatRow label="Orientation"  value={`${rack.orientation || 0}°`} />
      <StatRow label="Occupation"   value={`${uUsed} / ${rack.uHeight} U (${Math.round(uUsed / rack.uHeight * 100)}%)`} />

      <div style={{ margin: '12px 0', height: 1, background: '#2c3235' }} />

      <div style={{ fontSize: 11, color: '#8e8e8e', marginBottom: 6 }}>ÉQUIPEMENTS ({rack.devices.length})</div>
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {rack.devices.length === 0 ? (
          <div style={{ fontSize: 11, color: '#8e8e8e', fontStyle: 'italic' }}>Rack vide.</div>
        ) : (
          rack.devices.slice().sort((a, b) => a.uStart - b.uStart).map(d => (
            <div key={d.id} style={deviceRowStyle}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
              <div style={{ flex: 1, fontSize: 11 }}>
                <div style={{ color: '#e8eaf0' }}>{d.name}</div>
                <div style={{ color: '#8e8e8e', fontSize: 10 }}>U{d.uStart}{d.uSize > 1 ? `–${d.uStart + d.uSize - 1}` : ''} · {d.type}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        <button style={btnSmallStyle} onClick={onAddDevice}><Plus size={12} /> Équipement</button>
        <button style={btnSmallDangerStyle} onClick={onDelete}><Trash2 size={12} /> Supprimer</button>
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle, color, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {color && <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#8e8e8e' }}>{subtitle}</div>
      </div>
      <button style={closeBtnStyle} onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 11, borderBottom: '1px solid #1a1f26' }}>
      <span style={{ color: '#8e8e8e', display: 'flex', gap: 6, alignItems: 'center' }}>{icon}{label}</span>
      <span style={{ color: '#e8eaf0', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

// ─── Modales ────────────────────────────────────────────────────────────────

function AddRackModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '', uHeight: 42, vendor: '', model: '',
    coords: { x: 0, z: 0 }, orientation: 0, notes: ''
  });
  return (
    <Modal title="Nouveau rack" onClose={onClose}>
      <Field label="Nom du rack" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="R1" autoFocus />
      <Field label="Hauteur (U)" type="number" value={form.uHeight} onChange={v => setForm(f => ({ ...f, uHeight: Number(v) }))} />
      <Field label="Constructeur" value={form.vendor} onChange={v => setForm(f => ({ ...f, vendor: v }))} placeholder="APC, Dell, Huawei…" />
      <Field label="Modèle" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} placeholder="NetShelter SX 42U" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="Position X (m)" type="number" step="0.1" value={form.coords.x}
          onChange={v => setForm(f => ({ ...f, coords: { ...f.coords, x: Number(v) } }))} />
        <Field label="Position Z (m)" type="number" step="0.1" value={form.coords.z}
          onChange={v => setForm(f => ({ ...f, coords: { ...f.coords, z: Number(v) } }))} />
        <Field label="Rotation (°)" type="number" value={form.orientation}
          onChange={v => setForm(f => ({ ...f, orientation: Number(v) }))} />
      </div>
      <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Refroidissement, PDU, remarques…" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button style={btnStyle} onClick={onClose}>Annuler</button>
        <button style={btnPrimaryStyle} onClick={() => onSubmit(form)} disabled={!form.name}>
          <Save size={13} /> Créer le rack
        </button>
      </div>
    </Modal>
  );
}

function AddDeviceModal({ racks, deviceTypes, preselectRackId, onClose, onSubmit }) {
  const [form, setForm] = useState({
    rackId: preselectRackId || racks[0]?.id || '',
    name: '', type: 'server.physical', manufacturer: '', model: '',
    hostname: '', ip: '', serial: '',
    uStart: 1, uSize: 2, status: 'online', notes: '',
    slot: 'full', depth: 'full', mounting: 'rail',
  });

  // Quand on change de type, ajuster uSize au defaultU du type
  useEffect(() => {
    const meta = deviceTypes[form.type];
    if (meta?.defaultU) setForm(f => ({ ...f, uSize: meta.defaultU }));
  }, [form.type, deviceTypes]);

  const selectedRack = racks.find(r => r.id === form.rackId);

  return (
    <Modal title="Nouvel équipement" onClose={onClose} width={520}>
      <Select label="Rack cible" value={form.rackId} onChange={v => setForm(f => ({ ...f, rackId: v }))}>
        {racks.map(r => <option key={r.id} value={r.id}>{r.name} ({r.uHeight}U)</option>)}
      </Select>
      <Field label="Nom" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="SRV-ESXI-01, UPS-MAIN, NAS-PROD…" autoFocus />
      <Select label="Type d'équipement" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}>
        {Object.entries(deviceTypes).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </Select>

      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="Constructeur" value={form.manufacturer} onChange={v => setForm(f => ({ ...f, manufacturer: v }))} placeholder="HPE, Huawei, IBM…" />
        <Field label="Modèle" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} placeholder="ProLiant DL380 Gen10" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="Position U (début)" type="number" value={form.uStart}
          onChange={v => setForm(f => ({ ...f, uStart: Number(v) }))} />
        <Field label="Taille (U)" type="number" value={form.uSize}
          onChange={v => setForm(f => ({ ...f, uSize: Number(v) }))} />
        <Field label="Statut"     value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} placeholder="online / offline / warning / critical" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Select label="Largeur (slot)" value={form.slot} onChange={v => setForm(f => ({ ...f, slot: v }))}>
          <option value="full">Pleine largeur</option>
          <option value="left">Moitié gauche</option>
          <option value="right">Moitié droite</option>
        </Select>
        <Select label="Profondeur" value={form.depth} onChange={v => setForm(f => ({ ...f, depth: v }))}>
          <option value="full">Pleine profondeur</option>
          <option value="front">Façade uniquement</option>
          <option value="back">Fond uniquement</option>
        </Select>
        <Select label="Type de montage" value={form.mounting} onChange={v => setForm(f => ({ ...f, mounting: v }))}>
          <option value="rail">Sur rails 19"</option>
          <option value="shelf">Étagère (support)</option>
          <option value="loose">Posé (non fixé)</option>
        </Select>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="Hostname" value={form.hostname} onChange={v => setForm(f => ({ ...f, hostname: v }))} placeholder="srv-esxi-01.sbee.local" />
        <Field label="IP"       value={form.ip}       onChange={v => setForm(f => ({ ...f, ip: v }))} placeholder="10.0.0.10" />
        <Field label="N° série" value={form.serial}   onChange={v => setForm(f => ({ ...f, serial: v }))} />
      </div>

      <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />

      {selectedRack && (
        <div style={{ fontSize: 10, color: '#8e8e8e', padding: '8px 10px', background: '#111418', borderRadius: 3, marginTop: 6 }}>
          ℹ️ {selectedRack.name} occupe {selectedRack.devices.reduce((s, d) => s + d.uSize, 0)}/{selectedRack.uHeight}U.
          Plages libres : {freeRanges(selectedRack).join(', ') || 'aucune'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button style={btnStyle} onClick={onClose}>Annuler</button>
        <button style={btnPrimaryStyle} onClick={() => onSubmit(form)} disabled={!form.name || !form.rackId}>
          <Save size={13} /> Monter l'équipement
        </button>
      </div>
    </Modal>
  );
}

function freeRanges(rack) {
  const occupied = new Array(rack.uHeight + 1).fill(false);
  for (const d of rack.devices) {
    for (let u = d.uStart; u < d.uStart + d.uSize; u++) occupied[u] = true;
  }
  const ranges = [];
  let start = null;
  for (let u = 1; u <= rack.uHeight; u++) {
    if (!occupied[u] && start === null) start = u;
    if ((occupied[u] || u === rack.uHeight) && start !== null) {
      const end = occupied[u] ? u - 1 : u;
      ranges.push(start === end ? `U${start}` : `U${start}–U${end}`);
      start = null;
    }
  }
  return ranges;
}

// ─── Composants utilitaires UI ─────────────────────────────────────────────

function Modal({ title, children, onClose, width = 440 }) {
  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={{ ...modalStyle, width }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>{title}</div>
          <button style={closeBtnStyle} onClick={onClose}><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, autoFocus, step }) {
  return (
    <label style={{ display: 'block', marginBottom: 8, fontSize: 11, color: '#8e8e8e', flex: 1 }}>
      {label}
      <input
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={inputStyle}
      />
    </label>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 8, fontSize: 11, color: '#8e8e8e' }}>
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        {children}
      </select>
    </label>
  );
}

// ─── Styles inline ──────────────────────────────────────────────────────────

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 18px', borderBottom: '1px solid #2c3235', background: '#111418',
};
const panelTitle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8e8e8e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 };
const sidePanelStyle = { width: 320, borderLeft: '1px solid #2c3235', background: '#0f1115', overflowY: 'auto' };
const emptyStyle = {
  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: 12, color: '#8e8e8e',
  background: '#0b0c10',
};
const legendStyle = {
  position: 'absolute', bottom: 12, right: 12, padding: '10px 12px',
  background: 'rgba(15,17,21,0.85)', border: '1px solid #2c3235', borderRadius: 3,
  backdropFilter: 'blur(6px)',
};
const btnStyle = {
  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: 11,
  background: '#181b1f', border: '1px solid #2c3235', color: '#e8eaf0', borderRadius: 2, cursor: 'pointer',
};
const viewToggleStyle = {
  display: 'flex', background: '#0b0d11', border: '1px solid #2c3235', borderRadius: 3, padding: 2, marginRight: 6,
};
const viewToggleBtn = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', fontSize: 11,
  background: 'transparent', border: 'none', color: '#8e8e8e', cursor: 'pointer', borderRadius: 2,
};
const viewToggleBtnActive = { ...viewToggleBtn, background: '#3274d9', color: '#ffffff', fontWeight: 600 };
const btnPrimaryStyle = { ...btnStyle, background: '#3274d9', borderColor: '#3274d9', fontWeight: 600 };
const btnSmallStyle = { ...btnStyle, padding: '5px 9px', fontSize: 10 };
const btnSmallDangerStyle = { ...btnSmallStyle, background: '#3a1a1a', borderColor: '#5a2626', color: '#f87171' };
const closeBtnStyle = { background: 'transparent', border: 'none', color: '#8e8e8e', cursor: 'pointer', padding: 4 };
const errorBannerStyle = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 11,
  background: 'rgba(239,68,68,0.12)', color: '#f87171', borderBottom: '1px solid rgba(239,68,68,0.3)',
};
const modalBackdropStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(3px)',
};
const modalStyle = {
  background: '#111418', border: '1px solid #2c3235', borderRadius: 4, padding: 18,
  boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
};
const inputStyle = {
  width: '100%', marginTop: 3, padding: '6px 8px', background: '#0b0c10',
  border: '1px solid #2c3235', color: '#e8eaf0', fontSize: 12, borderRadius: 2, boxSizing: 'border-box',
};
const deviceRowStyle = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px',
  borderBottom: '1px solid #1a1f26',
};
