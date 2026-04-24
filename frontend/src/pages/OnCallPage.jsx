import { useState, useEffect, useCallback } from 'react';
import { Phone, User, Clock, AlertTriangle, CheckCircle, ArrowUpCircle, MessageSquare, Calendar, RefreshCw } from 'lucide-react';
import { api } from '../api';

const PRIORITY_CFG = {
  1: { label: 'DÉSASTRE', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  2: { label: 'CRITIQUE',  color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  3: { label: 'MAJEUR',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  4: { label: 'MINEUR',    color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
};

const STATUS_CFG = {
  nouveau:     { label: 'NOUVEAU',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  en_cours:    { label: 'EN COURS',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  en_attente:  { label: 'EN ATTENTE',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  résolu:      { label: 'RÉSOLU',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  fermé:       { label: 'FERMÉ',        color: '#374151', bg: 'rgba(55,65,81,0.12)' },
};

function PriorityBadge({ p }) {
  const cfg = PRIORITY_CFG[p] || PRIORITY_CFG[4];
  return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>P{p} {cfg.label}</span>;
}

function StatusBadge({ s }) {
  const cfg = STATUS_CFG[s] || STATUS_CFG.nouveau;
  return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
}

function OnCallCard({ level, person }) {
  if (!person) return (
    <div className="card glass-panel" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>ASTREINTE {level}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Non configuré</div>
    </div>
  );
  return (
    <div className="card glass-panel" style={{ padding: 20, borderLeft: '3px solid var(--accent)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Astreinte {level}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
          {(person.name || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{person.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{person.source === 'override' ? '📌 Remplacement ponctuel' : '🔄 Rotation programmée'}</div>
        </div>
      </div>
      {person.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
          <Phone size={12} />{person.phone}
        </div>
      )}
      {person.email && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{person.email}</div>
      )}
    </div>
  );
}

function IncidentRow({ inc, onSelect }) {
  const age = Math.round((Date.now() - new Date(inc.createdAt).getTime()) / 60_000);
  const ageStr = age < 60 ? `${age}min` : `${Math.round(age / 60)}h`;

  return (
    <tr
      onClick={() => onSelect(inc)}
      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace' }}>{inc.ticketRef}</div>
      </td>
      <td style={{ padding: '10px 12px', maxWidth: 320 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</div>
      </td>
      <td style={{ padding: '10px 12px' }}><PriorityBadge p={inc.priority} /></td>
      <td style={{ padding: '10px 12px' }}><StatusBadge s={inc.status} /></td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{inc.assignedTo || '–'}</td>
      <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{ageStr}</td>
      <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
        {inc.escalations?.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f59e0b' }}>
            <ArrowUpCircle size={11} />N{inc.escalations[inc.escalations.length - 1].level?.replace('N', '')}
          </span>
        )}
      </td>
    </tr>
  );
}

function IncidentDetail({ inc, onClose, onUpdate }) {
  const [status, setStatus]   = useState(inc.status);
  const [noteText, setNote]   = useState('');
  const [saving, setSaving]   = useState(false);

  async function handleUpdate() {
    setSaving(true);
    try { await onUpdate(inc.id, { status }); } finally { setSaving(false); }
  }

  async function handleNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.addIncidentNote(inc.id, { user: 'Opérateur', text: noteText });
      setNote('');
      await onUpdate(inc.id, {});
    } finally { setSaving(false); }
  }

  async function handleEscalate(level) {
    setSaving(true);
    try { await api.escalateIncident(inc.id, level); await onUpdate(inc.id, {}); } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div className="card glass-panel" style={{ width: 600, maxHeight: '85vh', overflowY: 'auto', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace', marginBottom: 4 }}>{inc.ticketRef}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{inc.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            ['Priorité',  <PriorityBadge p={inc.priority} />],
            ['Statut',    <StatusBadge s={inc.status} />],
            ['Assigné à', inc.assignedTo || '–'],
            ['Créé le',   new Date(inc.createdAt).toLocaleString('fr-FR')],
            ['Réponse SLA', `${inc.sla?.responseTarget}min`],
            ['Résolution SLA', `${inc.sla?.resolutionTarget}min`],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>

        {inc.description && (
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-hover)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DESCRIPTION</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{inc.description}</div>
          </div>
        )}

        {/* Escalades */}
        {inc.escalations?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>ESCALADES</div>
            {inc.escalations.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{e.level}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{e.person}</span>
                {e.phone && <span style={{ color: 'var(--text-muted)' }}>{e.phone}</span>}
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{new Date(e.notifiedAt).toLocaleTimeString('fr-FR')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {inc.notes?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>NOTES</div>
            {inc.notes.map((n, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 6, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>{n.user}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(n.timestamp).toLocaleString('fr-FR')}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{n.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, flex: 1 }}>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={handleUpdate} disabled={saving} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
              Mettre à jour
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              placeholder="Ajouter une note…"
              value={noteText}
              onChange={e => setNote(e.target.value)}
              rows={2}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, resize: 'none' }}
            />
            <button onClick={handleNote} disabled={!noteText.trim() || saving} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, alignSelf: 'flex-end' }}>
              <MessageSquare size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Escalader :</span>
            {['N2', 'N3'].map(l => (
              <button key={l} onClick={() => handleEscalate(l)} disabled={saving} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontSize: 12 }}>
                <ArrowUpCircle size={11} style={{ display: 'inline', marginRight: 4 }} />{l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnCallPage() {
  const [onCall, setOnCall]         = useState({});
  const [incidents, setIncidents]   = useState([]);
  const [stats, setStats]           = useState({});
  const [selected, setSelected]     = useState(null);
  const [statusFilter, setStatus]   = useState('');
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    try {
      const [oc, inc, st] = await Promise.all([
        api.getOnCallCurrent(),
        api.getIncidents({ limit: 100 }),
        api.getIncidentStats(),
      ]);
      setOnCall(oc);
      setIncidents(Array.isArray(inc) ? inc : []);
      setStats(st);
    } catch { /* graceful */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  async function handleUpdate(id, data) {
    try {
      if (Object.keys(data).length > 0) await api.updateIncident(id, data);
      await load();
      if (selected?.id === id) {
        setSelected(prev => ({ ...prev, ...data }));
      }
    } catch (e) { console.error(e); }
  }

  const filtered = incidents.filter(i => !statusFilter || i.status === statusFilter);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Astreinte & Incidents ITIL</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Planning d'astreinte N1/N2/N3 — tickets INC-{new Date().getFullYear()}</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
          <RefreshCw size={14} />Actualiser
        </button>
      </div>

      {/* On-call cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <OnCallCard level="N1" person={onCall.N1} />
        <OnCallCard level="N2" person={onCall.N2} />
        <OnCallCard level="N3" person={onCall.N3} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total',      value: stats.total    || 0, color: 'var(--text-primary)' },
          { label: 'Nouveaux',   value: stats.nouveau  || 0, color: '#ef4444' },
          { label: 'En cours',   value: stats.enCours  || 0, color: '#f59e0b' },
          { label: 'Résolus',    value: stats.résolu   || 0, color: '#22c55e' },
          { label: 'MTTR',       value: stats.mttrMinutes != null ? `${stats.mttrMinutes}min` : '–', color: '#38bdf8' },
        ].map(k => (
          <div key={k.label} className="card glass-panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['', 'Tous'], ...Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: statusFilter === k ? 'var(--accent)' : 'var(--bg-surface)', color: statusFilter === k ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
            {l}
          </button>
        ))}
      </div>

      {/* Incidents table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <div className="card glass-panel" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-hover)' }}>
                {['Ticket', 'Titre', 'Priorité', 'Statut', 'Assigné à', 'Âge', 'Escalade'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => (
                <IncidentRow key={inc.id} inc={inc} onSelect={setSelected} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
              {statusFilter ? 'Aucun incident avec ce statut' : 'Aucun incident enregistré'}
            </div>
          )}
        </div>
      )}

      {selected && (
        <IncidentDetail
          inc={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
