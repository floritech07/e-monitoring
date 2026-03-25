/**
 * alertRulesService.js
 * Dynamic threshold-based alert evaluation against live metrics.
 * Replaces the hard-coded thresholds in alertsService.js with rules
 * stored via storageService so operators can edit them via the UI.
 */

const storage = require('./storageService');

let alerts   = [];
let alertId  = 1;

// ─── Core evaluate ────────────────────────────────────────────────────────────

/**
 * Applies a comparison operator between value and threshold.
 */
function compare(value, op, threshold) {
  switch (op) {
    case '>':  return value >  threshold;
    case '>=': return value >= threshold;
    case '<':  return value <  threshold;
    case '<=': return value <= threshold;
    case '==': return value == threshold; // eslint-disable-line eqeqeq
    default:   return false;
  }
}

/**
 * Resolves the nested metric value from a metrics object using a dot-path.
 * Supports: "cpu.usage", "ram.percent", "disk.percent" (iterated per disk),
 * "network.rx_sec", "network.tx_sec".
 */
function resolveMetric(metrics, metricPath) {
  const parts = metricPath.split('.');
  let val     = metrics;
  for (const p of parts) {
    if (val === undefined || val === null) return [];
    if (Array.isArray(val)) {
      // e.g. disk[] — expand into multiple values with mount context
      return val.map(item => ({ value: item[p], context: item }));
    }
    val = val[p];
  }
  return [{ value: val, context: {} }];
}

function renderMessage(template, value, context) {
  return template
    .replace('{{value}}', typeof value === 'number' ? value.toFixed(1) : value)
    .replace('{{mount}}', context.mount || '');
}

function addAlert({ id, level, category, message, source, severity, ruleId }) {
  const existing = alerts.find(a =>
    a.ruleId === ruleId &&
    a.source === source &&
    !a.resolved &&
    !a.acknowledged
  );
  if (!existing) {
    const alert = {
      id:          id || alertId++,
      level:       level || severity,
      severity:    severity || level,
      category,
      message,
      source,
      ruleId,
      timestamp:   Date.now(),
      resolved:    false,
      acknowledged: false,
      ackUser:     null,
      ackComment:  null,
    };
    alerts.push(alert);
    // Persist to history
    try { storage.appendAlertHistory(alert); } catch {}
    return alert;
  }
  return existing;
}

function resolveRule(ruleId, source) {
  alerts
    .filter(a => a.ruleId === ruleId && a.source === source && !a.resolved)
    .forEach(a => { a.resolved = true; a.resolvedAt = Date.now(); });
}

/**
 * Main evaluation entry point. Called every broadcast tick.
 * @param {object} metrics  — host metrics from metricsService
 * @param {Array}  vms      — VM list from vmwareService
 * @returns {Array}          — current active alert list
 */
function evaluate(metrics, vms) {
  const rules  = storage.getRules().filter(r => r.enabled);
  const source = metrics?.host?.hostname || 'host';

  for (const rule of rules) {
    // Skip silenced categories
    if (storage.isSilenced(rule.category, source)) {
      resolveRule(rule.id, source);
      continue;
    }

    const resolved = resolveMetric(metrics, rule.metric);

    let anyFired = false;
    for (const { value, context } of resolved) {
      if (value === undefined || value === null) continue;
      if (compare(value, rule.op, rule.threshold)) {
        anyFired = true;
        addAlert({
          level:    rule.severity,
          severity: rule.severity,
          category: rule.category,
          message:  renderMessage(rule.message, value, context),
          source,
          ruleId:   rule.id,
        });
      }
    }

    if (!anyFired) {
      resolveRule(rule.id, source);
    }
  }

  // VM offline alerts
  if (vms) {
    vms.forEach(vm => {
      const ruleId = `vm_offline_${vm.id}`;
      if (vm.state === 'off') {
        addAlert({
          level:    'info',
          severity: 'info',
          category: 'vm',
          message:  `VM "${vm.name}" hors ligne`,
          source:   vm.id,
          ruleId,
        });
      } else {
        resolveRule(ruleId, vm.id);
      }
    });
  }

  // Purge very old resolved alerts (keep last 200)
  const cutoff   = Date.now() - 24 * 3600_000;
  const resolved = alerts.filter(a => a.resolved && a.resolvedAt && a.resolvedAt < cutoff);
  if (resolved.length > 0) {
    alerts = alerts.filter(a => !(a.resolved && a.resolvedAt && a.resolvedAt < cutoff));
  }

  return getAlerts();
}

function getAlerts() {
  return [...alerts]
    .filter(a => !a.resolved)
    .sort((a, b) => {
      const sev = { critical: 3, warning: 2, info: 1 };
      const diff = (sev[b.severity] || 0) - (sev[a.severity] || 0);
      return diff !== 0 ? diff : b.timestamp - a.timestamp;
    });
}

function getAllAlerts(limit = 200) {
  return [...alerts]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

function acknowledgeAlert(alertId, user, comment) {
  const alert = alerts.find(a => a.id === alertId);
  if (!alert) return null;
  alert.acknowledged = true;
  alert.ackUser      = user;
  alert.ackComment   = comment || '';
  alert.ackedAt      = Date.now();
  storage.ackAlert(alertId, user, comment);
  return alert;
}

function clearAlerts() {
  alerts.forEach(a => { a.resolved = true; a.resolvedAt = Date.now(); });
}

function addExternalAlert({ level, severity, category, message, source, ruleId }) {
  return addAlert({ level, severity, category, message, source, ruleId: ruleId || `ext_${Date.now()}` });
}

module.exports = {
  evaluate,
  getAlerts,
  getAllAlerts,
  acknowledgeAlert,
  clearAlerts,
  addExternalAlert,
};
