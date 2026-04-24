'use strict';
/**
 * Moteur d'alertes NexusMonitor v2 — 4 niveaux ITIL
 * INFO / WARNING / CRITICAL / DISASTER
 *
 * Fonctionnalités :
 *  - Évaluation de règles sur métriques en entrée
 *  - Anti-flap : confirmation pendant N secondes avant déclenchement
 *  - Déduplication : une alerte active par (rule + source_id)
 *  - Escalade automatique N1 (5 min) → N2 (15 min) → N3 (30 min)
 *  - Fermeture automatique quand la condition disparaît
 *  - Notification email via nodemailer (si SMTP configuré)
 *  - Émission WebSocket (Socket.IO) vers tous les clients connectés
 *  - Persistance JSON + création incident ITIL dans cmdbService
 */

const fs        = require('fs');
const path      = require('path');
const EventEmitter = require('events');

const DATA_DIR    = path.join(__dirname, '..', 'data');
const ALERTS_FILE = path.join(DATA_DIR, 'active_alerts.json');
const HIST_FILE   = path.join(DATA_DIR, 'alerts_history.json');
const MAX_HISTORY = 500;

// ─── Niveaux & priorités ─────────────────────────────────────────────────────

const LEVELS = {
  INFO:     { priority: 1, color: '#38bdf8', slaResponseMin: 480, slaResolutionMin: 2880 },
  WARNING:  { priority: 2, color: '#fbbf24', slaResponseMin: 60,  slaResolutionMin: 480  },
  CRITICAL: { priority: 3, color: '#f97316', slaResponseMin: 30,  slaResolutionMin: 120  },
  DISASTER: { priority: 4, color: '#ef4444', slaResponseMin: 5,   slaResolutionMin: 30   },
};

// ─── Règles par défaut (complétées par alert_rules en DB Phase 1) ─────────────

const DEFAULT_RULES = [
  // UPS
  { id: 'r001', name: 'UPS Batterie critique',    severity: 'CRITICAL', source: 'snmp', metric: 'ups.battery.chargePct',      condition: 'lt', threshold: 20, durationS: 60 },
  { id: 'r002', name: 'UPS Batterie faible',      severity: 'WARNING',  source: 'snmp', metric: 'ups.battery.chargePct',      condition: 'lt', threshold: 40, durationS: 120 },
  { id: 'r003', name: 'UPS Sur batterie',         severity: 'CRITICAL', source: 'snmp', metric: 'ups.status.input',           condition: 'eq', threshold: 'on_battery', durationS: 10 },
  { id: 'r004', name: 'UPS Charge sortie élevée', severity: 'WARNING',  source: 'snmp', metric: 'ups.output.loadPct',         condition: 'gt', threshold: 80, durationS: 120 },
  { id: 'r005', name: 'UPS Température batterie', severity: 'WARNING',  source: 'snmp', metric: 'ups.battery.temperatureC',   condition: 'gt', threshold: 35, durationS: 60 },
  { id: 'r006', name: 'UPS Batterie déchargée',   severity: 'DISASTER', source: 'snmp', metric: 'ups.battery.chargePct',      condition: 'lt', threshold: 5,  durationS: 0 },
  // Serveurs Redfish
  { id: 'r010', name: 'Serveur CPU temp critique',severity: 'DISASTER', source: 'redfish', metric: 'thermal.cpuTemps.readingC', condition: 'gt', threshold: 85, durationS: 30 },
  { id: 'r011', name: 'Serveur CPU temp élevée',  severity: 'WARNING',  source: 'redfish', metric: 'thermal.cpuTemps.readingC', condition: 'gt', threshold: 75, durationS: 60 },
  { id: 'r012', name: 'Ventilateur arrêté',       severity: 'CRITICAL', source: 'redfish', metric: 'thermal.fans.rpm',          condition: 'lt', threshold: 300, durationS: 30 },
  { id: 'r013', name: 'PSU défaillante',          severity: 'DISASTER', source: 'redfish', metric: 'power.psus.status',         condition: 'neq', threshold: 'OK', durationS: 0 },
  // ESXi
  { id: 'r020', name: 'ESXi CPU saturé',          severity: 'WARNING',  source: 'esxi', metric: 'host.cpu.usedPct',    condition: 'gt', threshold: 85, durationS: 300 },
  { id: 'r021', name: 'ESXi RAM saturée',         severity: 'CRITICAL', source: 'esxi', metric: 'host.ram.usedPct',    condition: 'gt', threshold: 90, durationS: 300 },
  { id: 'r022', name: 'ESXi hôte hors ligne',     severity: 'DISASTER', source: 'esxi', metric: 'host.status',         condition: 'eq', threshold: 'offline', durationS: 0 },
  // Veeam
  { id: 'r030', name: 'Backup job échoué',        severity: 'CRITICAL', source: 'veeam', metric: 'job.lastResult',         condition: 'eq', threshold: 'Failed', durationS: 0 },
  { id: 'r031', name: 'SLA RPO dépassé',          severity: 'WARNING',  source: 'veeam', metric: 'sla.compliantPct',       condition: 'lt', threshold: 95, durationS: 0 },
  { id: 'r032', name: 'Repository > 85% plein',  severity: 'WARNING',  source: 'veeam', metric: 'repo.usedPct',           condition: 'gt', threshold: 85, durationS: 0 },
  // Switch
  { id: 'r040', name: 'Interface réseau DOWN',    severity: 'CRITICAL', source: 'snmp', metric: 'if.status',    condition: 'eq', threshold: 'down', durationS: 30 },
  { id: 'r041', name: 'Switch CPU > 80%',        severity: 'WARNING',  source: 'snmp', metric: 'switch.cpuPct', condition: 'gt', threshold: 80, durationS: 300 },
];

// ─── Stockage état ─────────────────────────────────────────────────────────

class AlertStore {
  constructor() {
    this._active  = this._load(ALERTS_FILE) || {};
    this._history = this._load(HIST_FILE)   || [];
    // Pending : { key → { firstSeenAt, value } } pour anti-flap
    this._pending = {};
  }

  _load(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return null; }
  }

  _save(file, data) {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }

  save() {
    this._save(ALERTS_FILE, this._active);
    this._save(HIST_FILE,   this._history.slice(-MAX_HISTORY));
  }

  getActive()  { return Object.values(this._active); }
  getHistory() { return this._history; }

  upsert(alert) {
    const existing = this._active[alert.key];
    if (existing) {
      existing.updatedAt    = alert.updatedAt;
      existing.value        = alert.value;
      existing.occurrences  = (existing.occurrences || 1) + 1;
      return { action: 'updated', alert: existing };
    }
    this._active[alert.key] = alert;
    return { action: 'created', alert };
  }

  resolve(key, resolvedAt) {
    const alert = this._active[key];
    if (!alert) return null;
    alert.status     = 'resolved';
    alert.resolvedAt = resolvedAt;
    this._history.push({ ...alert });
    delete this._active[key];
    return alert;
  }

  escalate(key, level, notifiedAt) {
    const alert = this._active[key];
    if (!alert) return;
    alert.escalationLevel   = level;
    alert[`n${level}NotifiedAt`] = notifiedAt;
  }
}

// ─── Évaluateur de condition ──────────────────────────────────────────────────

function evaluate(value, condition, threshold) {
  const v = typeof value === 'string' ? value : Number(value);
  const t = threshold;
  switch (condition) {
    case 'gt':  return v > t;
    case 'lt':  return v < t;
    case 'gte': return v >= t;
    case 'lte': return v <= t;
    case 'eq':  return v === t || String(v) === String(t);
    case 'neq': return v !== t && String(v) !== String(t);
    default:    return false;
  }
}

// ─── Moteur principal ─────────────────────────────────────────────────────────

class AlertEngine extends EventEmitter {
  constructor() {
    super();
    this.store  = new AlertStore();
    this.rules  = [...DEFAULT_RULES];
    this._io    = null;   // Socket.IO instance injectée depuis server.js
    this._mailer = null;  // nodemailer transport
    this._initMailer();
  }

  _initMailer() {
    if (!process.env.SMTP_HOST) return;
    try {
      const nodemailer = require('nodemailer');
      this._mailer = nodemailer.createTransport({
        host:   process.env.SMTP_HOST,
        port:   Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch { /* nodemailer optionnel */ }
  }

  // Injecter Socket.IO depuis server.js : engine.setIO(io)
  setIO(io) { this._io = io; }

  // ─── Injecter des données à évaluer ────────────────────────────────────────

  /**
   * Évalue un ensemble de métriques plates contre toutes les règles.
   * @param {object} metrics - ex: { 'ups.battery.chargePct': 18, 'ups.status.input': 'on_battery', ... }
   * @param {string} sourceId - ex: 'ups-sukam-01'
   */
  evaluate(metrics, sourceId) {
    const now = Date.now();
    const triggered = new Set();

    for (const rule of this.rules) {
      const rawValue = metrics[rule.metric];
      if (rawValue === undefined || rawValue === null) continue;

      const condMet = evaluate(rawValue, rule.condition, rule.threshold);
      const key     = `${rule.id}::${sourceId}`;

      if (condMet) {
        // Anti-flap : la condition doit tenir pendant durationS
        if (rule.durationS > 0) {
          if (!this.store._pending[key]) {
            this.store._pending[key] = { firstSeenAt: now, value: rawValue };
            continue;
          }
          const elapsed = (now - this.store._pending[key].firstSeenAt) / 1000;
          if (elapsed < rule.durationS) continue;
        }

        triggered.add(key);
        delete this.store._pending[key];

        const { action, alert } = this.store.upsert({
          key,
          ruleId:    rule.id,
          ruleName:  rule.name,
          severity:  rule.severity,
          source:    rule.source,
          sourceId,
          metric:    rule.metric,
          condition: rule.condition,
          threshold: rule.threshold,
          value:     rawValue,
          status:    'active',
          escalationLevel: 0,
          occurrences: 1,
          createdAt:  new Date().toISOString(),
          updatedAt:  new Date().toISOString(),
        });

        if (action === 'created') {
          this._onNewAlert(alert);
        }
      } else {
        // Condition disparue → résoudre
        delete this.store._pending[key];
        const resolved = this.store.resolve(key, new Date().toISOString());
        if (resolved) {
          this._onResolvedAlert(resolved);
        }
      }
    }

    this.store.save();
    this._checkEscalations();
  }

  // ─── Callbacks ─────────────────────────────────────────────────────────────

  _onNewAlert(alert) {
    console.log(`[ALERT][${alert.severity}] ${alert.ruleName} — ${alert.sourceId} (${alert.value})`);
    this.emit('new_alert', alert);
    this._broadcastWS('alert:new', alert);
    this._sendEmail(alert);
  }

  _onResolvedAlert(alert) {
    console.log(`[ALERT RESOLVED] ${alert.ruleName} — ${alert.sourceId}`);
    this.emit('alert_resolved', alert);
    this._broadcastWS('alert:resolved', alert);
  }

  // ─── Escalade ITIL ─────────────────────────────────────────────────────────

  _checkEscalations() {
    const now      = Date.now();
    const active   = this.store.getActive();

    for (const alert of active) {
      if (['INFO', 'WARNING'].includes(alert.severity) && alert.escalationLevel >= 1) continue;

      const ageMin = (now - new Date(alert.createdAt).getTime()) / 60000;
      const lvl    = LEVELS[alert.severity];
      if (!lvl) continue;

      if (alert.escalationLevel < 1 && ageMin >= 5) {
        this.store.escalate(alert.key, 1, new Date().toISOString());
        this._notifyEscalation(alert, 1);
      } else if (alert.escalationLevel < 2 && ageMin >= 15) {
        this.store.escalate(alert.key, 2, new Date().toISOString());
        this._notifyEscalation(alert, 2);
      } else if (alert.escalationLevel < 3 && ageMin >= 30) {
        this.store.escalate(alert.key, 3, new Date().toISOString());
        this._notifyEscalation(alert, 3);
      }
    }
  }

  _notifyEscalation(alert, level) {
    const labels = ['', 'N1 (Technicien)', 'N2 (Responsable)', 'N3 (Astreinte DSI)'];
    console.log(`[ESCALADE] ${labels[level]} — ${alert.ruleName} [${alert.severity}] depuis ${alert.createdAt}`);
    this._broadcastWS('alert:escalated', { ...alert, escalationLevel: level });

    if (level >= 2) {
      this._sendEmail({
        ...alert,
        ruleName: `[ESCALADE ${labels[level]}] ${alert.ruleName}`,
      });
    }
  }

  // ─── Notifications ──────────────────────────────────────────────────────────

  _broadcastWS(event, data) {
    if (this._io) {
      this._io.emit(event, data);
    }
  }

  _sendEmail(alert) {
    if (!this._mailer || !process.env.ALERT_EMAIL_TO) return;

    const levelInfo = LEVELS[alert.severity] || LEVELS.WARNING;
    const subject   = `[NexusMonitor][${alert.severity}] ${alert.ruleName} — ${alert.sourceId}`;
    const body = `
Alerte NexusMonitor v2 — SBEE DSITD
=====================================
Règle     : ${alert.ruleName}
Sévérité  : ${alert.severity}
Source    : ${alert.sourceId} (${alert.source})
Métrique  : ${alert.metric} = ${alert.value}
Condition : ${alert.condition} ${alert.threshold}
Depuis    : ${alert.createdAt}
=====================================
SLA Réponse : ${levelInfo.slaResponseMin} min
SLA Résolution : ${levelInfo.slaResolutionMin} min
=====================================
→ Consulter : http://nexusmonitor.sbee.bj/alerts
`.trim();

    this._mailer.sendMail({
      from:    process.env.SMTP_USER || 'nexusmonitor@sbee.bj',
      to:      process.env.ALERT_EMAIL_TO,
      subject,
      text:    body,
    }).catch(err => console.error('[EMAIL]', err.message));
  }

  // ─── API publique ────────────────────────────────────────────────────────────

  getActiveAlerts()  { return this.store.getActive(); }
  getAlertHistory()  { return this.store.getHistory(); }

  getStats() {
    const active = this.store.getActive();
    return {
      total:    active.length,
      disaster: active.filter(a => a.severity === 'DISASTER').length,
      critical: active.filter(a => a.severity === 'CRITICAL').length,
      warning:  active.filter(a => a.severity === 'WARNING').length,
      info:     active.filter(a => a.severity === 'INFO').length,
    };
  }

  acknowledgeAlert(key, user) {
    const alert = this.store._active[key];
    if (!alert) return null;
    alert.ackBy = user;
    alert.ackAt = new Date().toISOString();
    alert.status = 'acknowledged';
    this.store.save();
    this._broadcastWS('alert:acked', alert);
    return alert;
  }

  addRule(rule) {
    const exists = this.rules.find(r => r.id === rule.id);
    if (exists) Object.assign(exists, rule);
    else this.rules.push(rule);
  }

  LEVELS() { return LEVELS; }
}

// Singleton
const engine = new AlertEngine();
module.exports = engine;
