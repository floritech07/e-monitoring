/**
 * AlertRulesPage.jsx
 * CRUD editor for threshold-based alert rules with live preview.
 */
import { useState, useEffect } from 'react';
import {
  Bell, Plus, Trash2, Save, Edit2, CheckCircle, X,
  RefreshCw, ToggleLeft, ToggleRight, AlertTriangle,
  Info, Zap
} from 'lucide-react';
import { api } from '../api';

const METRIC_OPTIONS = [
  { value: 'cpu.usage',        label: 'CPU — Utilisation (%)',       unit: '%'  },
  { value: 'ram.percent',      label: 'RAM — Utilisation (%)',       unit: '%'  },
  { value: 'disk.percent',     label: 'Disque — Utilisation (%)',    unit: '%'  },
  { value: 'network.rx_sec',   label: 'Réseau — Réception (B/s)',    unit: 'B/s'},
  { value: 'network.tx_sec',   label: 'Réseau — Émission (B/s)',     unit: 'B/s'},
];

const SEV_OPTIONS  = ['critical','warning','info'];
const OP_OPTIONS   = ['>','>=','<','<=','=='];
const CAT_OPTIONS  = ['cpu','ram','disk','network','vm','backup','other'];

const SEV_STYLES = {
  critical: { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'rgba(245,83,75,0.3)'  },
  warning:  { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(245,166,35,0.3)' },
  info:     { color: 'var(--info)',    bg: 'var(--info-bg)',    border: 'rgba(79,142,247,0.3)' },
};

function SevBadge({ sev }) {
  const s = SEV_STYLES[sev] || SEV_STYLES.info;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {sev}
    </span>
  );
}

const EMPTY_RULE = {
  metric:    'cpu.usage',
  op:        '>',
  threshold: 85,
  severity:  'critical',
  message:   '{{metric}} à {{value}}{{unit}}',
  category:  'cpu',
  source:    'host',
  enabled:   true,
};

function RuleFormModal({ rule, onClose, onSave }) {
  const [form,    setForm]    = useState(rule ? { ...rule } : { ...EMPTY_RULE });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  function upd(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.message) { setError('Le message est requis.'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (ex) {
      setError(ex.message);
    }
    setSaving(false);
  }

  const metaMetric = METRIC_OPTIONS.find(m => m.value === form.metric);

  const InputStyle = { width: '100%', padding: '7px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' };
  const SelectStyle = { ...InputStyle };
  const LabelStyle  = { fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backdropFilter: 'blur(4px)' }}>
      <form onSubmit={submit} className="card glass-panel fade-in" style={{ width: 520, padding: 32, maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--glass-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{rule?.id ? 'Modifier la règle' : 'Nouvelle règle d\'alerte'}</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--bg-elevated)' }}><X size={14} /></button>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', background: 'var(--danger-bg)', border: '1px solid rgba(245,83,75,0.2)', borderRadius: 6, color: 'var(--danger)', fontSize: 12, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 14 }}>
          {/* Metric */}
          <div>
            <label style={LabelStyle}>Métrique</label>
            <select style={SelectStyle} value={form.metric} onChange={e => upd('metric', e.target.value)}>
              {METRIC_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Condition row */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
            <div>
              <label style={LabelStyle}>Opérateur</label>
              <select style={SelectStyle} value={form.op} onChange={e => upd('op', e.target.value)}>
                {OP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={LabelStyle}>Seuil {metaMetric?.unit ? `(${metaMetric.unit})` : ''}</label>
              <input type="number" style={InputStyle} value={form.threshold} onChange={e => upd('threshold', parseFloat(e.target.value))} required />
            </div>
          </div>

          {/* Severity / Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={LabelStyle}>Sévérité</label>
              <select style={SelectStyle} value={form.severity} onChange={e => upd('severity', e.target.value)}>
                {SEV_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={LabelStyle}>Catégorie</label>
              <select style={SelectStyle} value={form.category} onChange={e => upd('category', e.target.value)}>
                {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Message template */}
          <div>
            <label style={LabelStyle}>{'Message (supporte {{value}}, {{mount}})'}</label>
            <input type="text" style={InputStyle} value={form.message} onChange={e => upd('message', e.target.value)} placeholder="CPU usage critique: {{value}}%" required />
          </div>

          {/* Preview */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Aperçu</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SevBadge sev={form.severity} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {form.message.replace('{{value}}', form.threshold).replace('{{unit}}', metaMetric?.unit || '')} (si {form.metric} {form.op} {form.threshold})
              </span>
            </div>
          </div>

          {/* Enabled */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.enabled} onChange={e => upd('enabled', e.target.checked)} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
            Règle activée
          </label>
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

function RuleRow({ rule, onEdit, onDelete, onToggle }) {
  const sty = SEV_STYLES[rule.severity] || SEV_STYLES.info;
  const metricMeta = METRIC_OPTIONS.find(m => m.value === rule.metric);

  return (
    <tr
      style={{ borderBottom: '1px solid var(--border)', opacity: rule.enabled ? 1 : 0.5, transition: 'all 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '11px 14px', width: 36 }}>
        <button title={rule.enabled ? 'Désactiver' : 'Activer'} onClick={() => onToggle(rule)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
          {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        </button>
      </td>
      <td style={{ padding: '11px 14px' }}>
        <SevBadge sev={rule.severity} />
      </td>
      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
        {metricMeta?.label || rule.metric}
      </td>
      <td style={{ padding: '11px 14px', fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>
        {rule.op} {rule.threshold}{metricMeta?.unit || ''}
      </td>
      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-primary)', maxWidth: 260 }}>
        {rule.message}
      </td>
      <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
        {rule.category}
      </td>
      <td style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm btn-ghost" onClick={() => onEdit(rule)}><Edit2 size={11} /></button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(rule.id)}><Trash2 size={11} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function AlertRulesPage() {
  const [rules,   setRules]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'new' | rule object
  const [saved,   setSaved]   = useState(false);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setRules(await api.getRules()); } catch {}
    setLoading(false);
  }

  async function handleSave(form) {
    if (form.id) {
      await api.updateRule(form.id, form);
    } else {
      await api.createRule(form);
    }
    await load();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette règle ?')) return;
    await api.deleteRule(id);
    load();
  }

  async function handleToggle(rule) {
    await api.updateRule(rule.id, { ...rule, enabled: !rule.enabled });
    load();
  }

  const filtered = filter === 'all' ? rules : rules.filter(r => r.severity === filter);
  const counts   = { all: rules.length, critical: 0, warning: 0, info: 0 };
  rules.forEach(r => { counts[r.severity] = (counts[r.severity] || 0) + 1; });

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title glow-text">Règles d'Alertes</h1>
          <p className="page-subtitle">Configurez les seuils et conditions déclenche-alertes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={14} /> Nouvelle règle
        </button>
      </div>

      {saved && (
        <div style={{ padding: '10px 16px', background: 'var(--success-bg)', border: '1px solid rgba(34,211,163,0.2)', borderRadius: 8, color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle size={14} /> Règle sauvegardée avec succès
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all','critical','warning','info'].map(f => {
          const s = SEV_STYLES[f] || { color: 'var(--accent)', bg: 'var(--accent-glow)', border: 'rgba(79,142,247,0.3)' };
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: 0.5,
                background: active ? s.bg : 'transparent', color: active ? s.color : 'var(--text-muted)',
                border: `1px solid ${active ? s.border : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? 'Toutes' : f} ({counts[f] || 0})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spin" /></div>
      ) : (
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <Bell size={40} style={{ opacity: 0.3 }} />
              <div>Aucune règle trouvée</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setModal('new')}>
                <Plus size={12} /> Créer la première règle
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['','Sévérité','Métrique','Condition','Message','Catégorie','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(rule => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onEdit={setModal}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <RuleFormModal
          rule={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
