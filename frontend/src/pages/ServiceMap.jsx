import { useState, useEffect } from 'react';
import {
  Server, Database, Shield, Globe, Mail, Cpu, Layers, Zap,
  Activity, Box, Plus, X, Edit2, Trash2, ChevronDown, ChevronUp,
  RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, ExternalLink
} from 'lucide-react';
import { api } from '../api';

const ICON_MAP = {
  server:   Server,
  database: Database,
  shield:   Shield,
  globe:    Globe,
  mail:     Mail,
  cpu:      Cpu,
  layers:   Layers,
  zap:      Zap,
  activity: Activity,
  box:      Box,
};

const CATEGORY_COLORS = {
  'ERP':            '#4f8ef7',
  'Paiement':       '#22d3a3',
  'Infrastructure': '#c45ef7',
  'Communication':  '#f5a623',
  'Base de données':'#f5534b',
  'Sauvegarde':     '#8891b0',
  'Supervision':    '#22d3a3',
};

const CRITICALITY_COLORS = {
  critical: '#f5534b',
  high:     '#f5a623',
  medium:   '#4f8ef7',
  low:      '#22d3a3',
};

const CRITICALITY_LABELS = {
  critical: 'CRITIQUE',
  high:     'IMPORTANT',
  medium:   'NORMAL',
  low:      'FAIBLE',
};

function StatusBadge({ state }) {
  const cfg = state === 'on'
    ? { bg: 'rgba(34,211,163,0.12)', color: '#22d3a3', border: 'rgba(34,211,163,0.3)', icon: CheckCircle, label: 'OPÉRATIONNEL' }
    : { bg: 'rgba(245,83,75,0.12)',  color: '#f5534b', border: 'rgba(245,83,75,0.3)',  icon: XCircle,     label: 'HORS LIGNE'    };
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function ServiceCard({ svc, vmState, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[svc.icon] || Server;
  const catColor = CATEGORY_COLORS[svc.category] || '#4f8ef7';
  const critColor = CRITICALITY_COLORS[svc.criticality] || '#4f8ef7';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
      {/* Top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${catColor}, ${catColor}88)` }} />

      <div style={{ padding: 18 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: `${catColor}18`, borderRadius: 10, padding: 10 }}>
              <Icon size={20} color={catColor} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{svc.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{svc.category}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <StatusBadge state={vmState} />
            <span style={{
              padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700,
              background: `${critColor}18`, color: critColor,
            }}>
              {CRITICALITY_LABELS[svc.criticality]}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          {svc.description}
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          <MetaItem label="VM" value={svc.vmName} icon="💻" />
          <MetaItem label="Hôte" value={svc.hostName} icon="🖥" />
          <MetaItem label="IP" value={svc.ip} mono />
          <MetaItem label="SLA cible" value={`${svc.slaTarget}%`} color={svc.slaTarget >= 99.9 ? '#22d3a3' : '#f5a623'} />
        </div>

        {/* Ports */}
        {svc.ports?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {svc.ports.map(p => (
              <span key={p} style={{ fontFamily: 'monospace', fontSize: 10, padding: '2px 6px', background: 'var(--bg-hover)', borderRadius: 4, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                :{p}
              </span>
            ))}
          </div>
        )}

        {/* Expandable detail */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: 0, width: '100%', justifyContent: 'center' }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Réduire' : 'Détails'}
        </button>

        {expanded && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>
              Contacts
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              {(svc.contacts || []).map(c => (
                <span key={c} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(79,142,247,0.1)', borderRadius: 10, color: 'var(--accent)', border: '1px solid rgba(79,142,247,0.2)' }}>
                  {c}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Enregistré le {new Date(svc.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <button onClick={() => onEdit(svc)}
            style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11 }}>
            <Edit2 size={11} /> Modifier
          </button>
          <button onClick={() => onDelete(svc.id)}
            style={{ background: 'rgba(245,83,75,0.08)', border: '1px solid rgba(245,83,75,0.2)', color: '#f5534b', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, icon, mono, color }) {
  return (
    <div style={{ fontSize: 11 }}>
      <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 1 }}>{icon && `${icon} `}{label}</span>
      <span style={{ color: color || 'var(--text-secondary)', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}

// ─── Modal CRUD ────────────────────────────────────────────────────────────────

const ICONS_LIST = Object.keys(ICON_MAP);
const CATEGORIES = Object.keys(CATEGORY_COLORS);
const CRITICALITIES = ['critical', 'high', 'medium', 'low'];

function ServiceModal({ svc, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', description: '', icon: 'server', category: 'Infrastructure',
    vmName: '', hostName: '', ip: '', ports: '',
    slaTarget: 99.9, criticality: 'medium', contacts: '',
    ...svc,
    ports: svc?.ports?.join(', ') || '',
    contacts: svc?.contacts?.join(', ') || '',
  });

  function handleSave() {
    const data = {
      ...form,
      ports: form.ports.split(',').map(p => parseInt(p.trim())).filter(Boolean),
      contacts: form.contacts.split(',').map(c => c.trim()).filter(Boolean),
      slaTarget: parseFloat(form.slaTarget),
    };
    onSave(data);
  }

  const field = (label, key, type = 'text', opts = {}) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>{label}</label>
      {opts.select ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13 }}>
          {opts.options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder || ''}
          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{svc?.id ? 'Modifier le service' : 'Nouveau service'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <div style={{ paddingRight: 10 }}>
            {field('Nom du service', 'name', 'text', { placeholder: 'Ex: SICA Application' })}
            {field('Catégorie', 'category', 'text', { select: true, options: CATEGORIES })}
            {field('Icône', 'icon', 'text', { select: true, options: ICONS_LIST })}
            {field('Criticité', 'criticality', 'text', { select: true, options: CRITICALITIES.map(c => ({ value: c, label: CRITICALITY_LABELS[c] })) })}
            {field('SLA cible (%)', 'slaTarget', 'number')}
          </div>
          <div style={{ paddingLeft: 10 }}>
            {field('Nom VM', 'vmName', 'text', { placeholder: 'Ex: SICA-APP-01' })}
            {field('Hôte ESXi', 'hostName', 'text', { placeholder: 'Ex: ESXi-01-SBEE' })}
            {field('Adresse IP', 'ip', 'text', { placeholder: '192.168.1.x' })}
            {field('Ports (séparés par ,)', 'ports', 'text', { placeholder: '80, 443, 8080' })}
            {field('Contacts (séparés par ,)', 'contacts', 'text', { placeholder: 'DSI SBEE, DFC' })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '9px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
            Annuler
          </button>
          <button onClick={handleSave}
            style={{ padding: '9px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {svc?.id ? 'Enregistrer' : 'Créer le service'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ServiceMap() {
  const [services, setServices] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterCat, setFilterCat] = useState('Tous');

  async function load() {
    setLoading(true);
    try {
      const [svcs, hs] = await Promise.all([api.getServicesMap(), api.getEsxiHosts()]);
      setServices(svcs);
      setHosts(hs);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function getVmState(svc) {
    // Derive state from ESXi host availability (host online = service on)
    const host = hosts.find(h => h.name === svc.hostName || h.id === svc.hostId);
    return host?.status === 'online' ? 'on' : 'off';
  }

  async function handleSave(data) {
    if (data.id) await api.updateService(data.id, data);
    else await api.createService(data);
    setModal(null);
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce service ?')) return;
    await api.deleteService(id);
    load();
  }

  const categories = ['Tous', ...new Set(services.map(s => s.category))];
  const filtered = filterCat === 'Tous' ? services : services.filter(s => s.category === filterCat);

  const onlineCount = services.filter(s => getVmState(s) === 'on').length;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={22} color="var(--accent)" /> Carte des services métier
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {onlineCount}/{services.length} services opérationnels
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setModal({})}
            style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} /> Ajouter un service
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(
          services.reduce((acc, s) => { acc[s.criticality] = (acc[s.criticality] || 0) + 1; return acc; }, {})
        ).map(([crit, count]) => (
          <div key={crit} className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CRITICALITY_COLORS[crit] || '#4f8ef7', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{CRITICALITY_LABELS[crit]}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: CRITICALITY_COLORS[crit] }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 600,
              background: filterCat === cat ? 'var(--accent)' : 'var(--bg-elevated)',
              color: filterCat === cat ? '#fff' : 'var(--text-muted)',
              border: filterCat === cat ? 'none' : '1px solid var(--border)',
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(svc => (
            <ServiceCard
              key={svc.id}
              svc={svc}
              vmState={getVmState(svc)}
              onEdit={s => setModal(s)}
              onDelete={handleDelete}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              Aucun service dans cette catégorie.
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <ServiceModal svc={modal.id ? modal : undefined} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
