'use strict';
/**
 * Service planning d'astreinte + incidents ITIL auto-créés
 * Rotations hebdomadaires, escalade N1→N2→N3, tickets INC-YYYY-XXXX
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/oncall.json');

// ── Incidents ITIL ────────────────────────────────────────────────────────────

const ITIL_STATUSES = ['nouveau', 'en_cours', 'en_attente', 'résolu', 'fermé'];
const ITIL_PRIORITIES = {
  DISASTER: 1, CRITICAL: 2, WARNING: 3, INFO: 4,
};

let _incidents   = [];
let _schedules   = [];   // rotations hebdomadaires
let _overrides   = [];   // remplacements ponctuels

function _ticketRef() {
  const year  = new Date().getFullYear();
  const count = (_incidents.filter(i => i.ticketRef?.startsWith(`INC-${year}`)).length + 1)
    .toString().padStart(4, '0');
  return `INC-${year}-${count}`;
}

// ── Persistance ──────────────────────────────────────────────────────────────

function _load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      _incidents = d.incidents  || [];
      _schedules = d.schedules  || _defaultSchedules();
      _overrides = d.overrides  || [];
    } else {
      _schedules = _defaultSchedules();
    }
  } catch (_) {
    _schedules = _defaultSchedules();
  }
}

function _save() {
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({ incidents: _incidents, schedules: _schedules, overrides: _overrides }, null, 2));
    fs.renameSync(tmp, DATA_FILE);
  } catch (_) {}
}

function _defaultSchedules() {
  return [
    {
      id: 'rotation-n1',
      name: 'Astreinte N1 — Exploitation',
      level: 'N1',
      rotation: [
        { name: 'Raoul CHAKOUN',   phone: process.env.ONCALL_N1_PHONE_1 || '+22961000001', email: 'raoulchakoun@gmail.com' },
        { name: 'Technicien SBEE', phone: process.env.ONCALL_N1_PHONE_2 || '+22961000002', email: 'dsitd@sbee.bj' },
      ],
      currentIndex: 0,
      rotateEveryDays: 7,
      startDate: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'rotation-n2',
      name: 'Astreinte N2 — Expertise',
      level: 'N2',
      rotation: [
        { name: 'Chef Département DSITD', phone: process.env.ONCALL_N2_PHONE || '+22961000010', email: 'dsi@sbee.bj' },
      ],
      currentIndex: 0,
      rotateEveryDays: 30,
      startDate: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'rotation-n3',
      name: 'Astreinte N3 — Direction',
      level: 'N3',
      rotation: [
        { name: 'Directeur Général SBEE', phone: process.env.ONCALL_N3_PHONE || '+22961000020', email: 'dg@sbee.bj' },
      ],
      currentIndex: 0,
      rotateEveryDays: 30,
      startDate: new Date().toISOString().slice(0, 10),
    },
  ];
}

// ── API publique ──────────────────────────────────────────────────────────────

_load();

// Qui est d'astreinte maintenant pour un niveau donné
function getCurrentOnCall(level = 'N1') {
  const now = Date.now();

  // Vérifier les overrides ponctuels
  const override = _overrides.find(o =>
    o.level === level &&
    new Date(o.start).getTime() <= now &&
    new Date(o.end).getTime() >= now
  );
  if (override) return { ...override.person, level, source: 'override', overrideId: override.id };

  const sched = _schedules.find(s => s.level === level);
  if (!sched || !sched.rotation.length) return null;

  // Calculer index courant basé sur date de départ + rotation
  const start   = new Date(sched.startDate).getTime();
  const elapsed = Math.floor((now - start) / (86_400_000 * sched.rotateEveryDays));
  const idx     = elapsed % sched.rotation.length;
  return { ...sched.rotation[idx], level, source: 'schedule', scheduleId: sched.id };
}

// Créer un incident ITIL automatiquement depuis une alerte
function createIncidentFromAlert(alert) {
  const priority = ITIL_PRIORITIES[alert.level] || 3;
  const incident = {
    id:          `incident-${Date.now()}`,
    ticketRef:   _ticketRef(),
    title:       `[${alert.level}] ${alert.sourceId || 'inconnu'} — ${(alert.message || '').slice(0, 80)}`,
    description: alert.message || '',
    source:      'auto',
    alertKey:    alert.key,
    alertLevel:  alert.level,
    priority,
    status:      'nouveau',
    assignedTo:  null,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    resolvedAt:  null,
    closedAt:    null,
    notes:       [],
    escalations: [],
    sla: {
      responseTarget:   [480, 60, 30, 5][priority - 1],    // minutes
      resolutionTarget: [2880, 480, 120, 30][priority - 1],
      responseBreached: false,
      resolutionBreached: false,
    },
  };

  // Auto-assigner à l'astreinte N1
  const onCall = getCurrentOnCall('N1');
  if (onCall) {
    incident.assignedTo = onCall.name;
    incident.escalations.push({
      level: 'N1',
      person: onCall.name,
      phone:  onCall.phone,
      notifiedAt: new Date().toISOString(),
      method: 'auto',
    });
  }

  _incidents.unshift(incident);
  if (_incidents.length > 1000) _incidents = _incidents.slice(0, 1000);
  _save();
  return incident;
}

function getIncidents({ status = null, limit = 50, priority = null } = {}) {
  let list = _incidents;
  if (status)   list = list.filter(i => i.status === status);
  if (priority) list = list.filter(i => i.priority === parseInt(priority));
  return list.slice(0, limit);
}

function getIncident(id) {
  return _incidents.find(i => i.id === id || i.ticketRef === id) || null;
}

function updateIncident(id, data) {
  const idx = _incidents.findIndex(i => i.id === id || i.ticketRef === id);
  if (idx < 0) return null;
  _incidents[idx] = { ..._incidents[idx], ...data, id: _incidents[idx].id, updatedAt: new Date().toISOString() };
  if (data.status === 'résolu' && !_incidents[idx].resolvedAt) _incidents[idx].resolvedAt = new Date().toISOString();
  if (data.status === 'fermé'  && !_incidents[idx].closedAt)   _incidents[idx].closedAt   = new Date().toISOString();
  _save();
  return _incidents[idx];
}

function addNote(id, { user, text }) {
  const incident = _incidents.find(i => i.id === id || i.ticketRef === id);
  if (!incident) return null;
  incident.notes.push({ user, text, timestamp: new Date().toISOString() });
  incident.updatedAt = new Date().toISOString();
  _save();
  return incident;
}

function escalateIncident(id, toLevel) {
  const incident = _incidents.find(i => i.id === id || i.ticketRef === id);
  if (!incident) return null;
  const person = getCurrentOnCall(toLevel);
  incident.escalations.push({
    level: toLevel,
    person: person?.name || 'inconnu',
    phone:  person?.phone || null,
    notifiedAt: new Date().toISOString(),
    method: 'manual',
  });
  incident.updatedAt = new Date().toISOString();
  _save();
  return { incident, escalatedTo: person };
}

function getIncidentStats() {
  const all = _incidents;
  return {
    total:      all.length,
    nouveau:    all.filter(i => i.status === 'nouveau').length,
    enCours:    all.filter(i => i.status === 'en_cours').length,
    résolu:     all.filter(i => i.status === 'résolu').length,
    fermé:      all.filter(i => i.status === 'fermé').length,
    priorité1:  all.filter(i => i.priority === 1).length,
    priorité2:  all.filter(i => i.priority === 2).length,
    mttrMinutes: (() => {
      const resolved = all.filter(i => i.resolvedAt && i.createdAt);
      if (!resolved.length) return null;
      const avg = resolved.reduce((s, i) => s + (new Date(i.resolvedAt) - new Date(i.createdAt)), 0) / resolved.length;
      return Math.round(avg / 60_000);
    })(),
  };
}

// Planning
function getSchedules()  { return _schedules; }
function getOverrides()  { return _overrides; }

function addOverride(o) {
  const entry = { id: `ovr-${Date.now()}`, ...o, createdAt: new Date().toISOString() };
  _overrides.push(entry);
  _save();
  return entry;
}

function removeOverride(id) {
  _overrides = _overrides.filter(o => o.id !== id);
  _save();
}

function updateSchedule(id, data) {
  const idx = _schedules.findIndex(s => s.id === id);
  if (idx < 0) return null;
  _schedules[idx] = { ..._schedules[idx], ...data, id };
  _save();
  return _schedules[idx];
}

module.exports = {
  getCurrentOnCall,
  createIncidentFromAlert,
  getIncidents, getIncident, updateIncident, addNote, escalateIncident,
  getIncidentStats,
  getSchedules, getOverrides, addOverride, removeOverride, updateSchedule,
};
