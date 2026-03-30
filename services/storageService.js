/**
 * storageService.js
 * JSON-file-based persistence layer for rules, custom assets, Veeam config,
 * silences, and acknowledged alerts — mirrors a lightweight "database" for
 * the single-node SBEE Monitoring stack.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure the data directory exists at startup.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Generic read helper.  Returns the parsed JSON or `defaultValue` when the
 * file doesn't exist or is corrupt.
 */
function read(filename, defaultValue = {}) {
  const fp = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(fp)) return defaultValue;
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

/**
 * Generic write helper (atomic — writes to a tmp file then renames).
 */
function write(filename, data) {
  const fp    = path.join(DATA_DIR, filename);
  const tmp   = fp + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, fp);
}

// ─── Alert Rules ────────────────────────────────────────────────────────────

const RULES_FILE = 'alert_rules.json';

const DEFAULT_RULES = [
  { id: 'cpu_critical',  metric: 'cpu.usage',    op: '>',  threshold: 85,  severity: 'critical', message: 'CPU usage critique: {{value}}%',     enabled: true,  category: 'cpu',     source: 'host' },
  { id: 'ram_critical',  metric: 'ram.percent',  op: '>',  threshold: 90,  severity: 'critical', message: 'RAM surchargée: {{value}}%',           enabled: true,  category: 'ram',     source: 'host' },
  { id: 'disk_warning',  metric: 'disk.percent', op: '>',  threshold: 85,  severity: 'warning',  message: 'Disque {{mount}} à {{value}}%',        enabled: true,  category: 'disk',    source: 'host' },
  { id: 'disk_critical', metric: 'disk.percent', op: '>',  threshold: 95,  severity: 'critical', message: 'Disque {{mount}} critique: {{value}}%', enabled: true,  category: 'disk',    source: 'host' },
  { id: 'cpu_high',      metric: 'cpu.usage',    op: '>',  threshold: 70,  severity: 'warning',  message: 'CPU élevé: {{value}}%',                enabled: true,  category: 'cpu',     source: 'host' },
];

function getRules() {
  const saved = read(RULES_FILE, { rules: DEFAULT_RULES });
  return saved.rules || DEFAULT_RULES;
}

function saveRules(rules) {
  write(RULES_FILE, { rules });
}

function addRule(rule) {
  const rules = getRules();
  const newRule = {
    ...rule,
    id: rule.id || `rule_${Date.now()}`,
    enabled: rule.enabled !== false
  };
  rules.push(newRule);
  saveRules(rules);
  return newRule;
}

function updateRule(id, updates) {
  const rules = getRules();
  const idx = rules.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rules[idx] = { ...rules[idx], ...updates };
  saveRules(rules);
  return rules[idx];
}

function deleteRule(id) {
  const rules = getRules().filter(r => r.id !== id);
  saveRules(rules);
}

// ─── Silences ────────────────────────────────────────────────────────────────

const SILENCES_FILE = 'silences.json';

function getSilences() {
  const { silences = [] } = read(SILENCES_FILE, { silences: [] });
  const now = Date.now();
  // Purge expired silences automatically
  return silences.filter(s => s.endsAt > now);
}

function addSilence(silence) {
  const silences = getSilences();
  const entry = {
    id:        `sil_${Date.now()}`,
    ruleId:    silence.ruleId || null,
    assetId:   silence.assetId || null,
    category:  silence.category || null,
    reason:    silence.reason || '',
    createdAt: Date.now(),
    endsAt:    Date.now() + (silence.durationMs || 3600_000)
  };
  silences.push(entry);
  write(SILENCES_FILE, { silences });
  return entry;
}

function removeSilence(id) {
  const silences = getSilences().filter(s => s.id !== id);
  write(SILENCES_FILE, { silences });
}

function isSilenced(category, assetId) {
  return getSilences().some(s =>
    (s.category === category || s.category === null) &&
    (s.assetId  === assetId  || s.assetId  === null)
  );
}

// ─── Acknowledged Alerts ─────────────────────────────────────────────────────

const ACK_FILE = 'acked_alerts.json';

function getAckedAlerts() {
  return read(ACK_FILE, { acked: [] }).acked || [];
}

function ackAlert(alertId, user, comment = '') {
  const acked = getAckedAlerts();
  acked.push({ alertId, user, comment, ackedAt: Date.now() });
  write(ACK_FILE, { acked });
}

function isAcked(alertId) {
  return getAckedAlerts().some(a => a.alertId === alertId);
}

// ─── Veeam Configuration ─────────────────────────────────────────────────────

const VEEAM_FILE = 'veeam_config.json';

function getVeeamConfig() {
  return read(VEEAM_FILE, {
    enabled: false,
    url: '',
    username: '',
    password: '',
    rpoThresholdHours: 24
  });
}

function saveVeeamConfig(cfg) {
  write(VEEAM_FILE, cfg);
}

// ─── Payment Alert Rules ───────────────────────────────────────────────────

const PAYMENT_RULES_FILE = 'payment_rules.json';

const DEFAULT_PAYMENT_RULES = [
  { id: 'prepaid_drop',  type: 'PREPAID',  operator: 'ALL',  threshold: 30,  intervalMin: 60,  enabled: true,  severity: 'critical' },
  { id: 'postpaid_drop', type: 'POSTPAID', operator: 'ALL',  threshold: 30,  intervalMin: 60,  enabled: true,  severity: 'critical' }
];

function getPaymentRules() {
  return read(PAYMENT_RULES_FILE, { rules: DEFAULT_PAYMENT_RULES }).rules || DEFAULT_PAYMENT_RULES;
}

function savePaymentRules(rules) {
  write(PAYMENT_RULES_FILE, { rules });
}

// ─── Custom Network Assets ────────────────────────────────────────────────────

const ASSETS_FILE = 'custom_assets.json';

const DEFAULT_ASSETS = [
  { id: 'gw-main',   name: 'Passerelle Principale', type: 'router',  ip: '192.168.1.1',  snmpCommunity: 'public', pingEnabled: true, tags: ['network','core'] },
  { id: 'sw-core',   name: 'Switch Cœur',            type: 'switch',  ip: '192.168.1.2',  snmpCommunity: 'public', pingEnabled: true, tags: ['network'] },
  { id: 'fw-sbee',   name: 'Firewall SBEE',           type: 'firewall',ip: '192.168.1.254',snmpCommunity: 'public', pingEnabled: true, tags: ['security'] },
];

function getAssets() {
  return read(ASSETS_FILE, { assets: DEFAULT_ASSETS }).assets || DEFAULT_ASSETS;
}

function saveAsset(asset) {
  const assets = getAssets();
  const idx = assets.findIndex(a => a.id === asset.id);
  if (idx >= 0) {
    assets[idx] = { ...assets[idx], ...asset };
  } else {
    assets.push({ ...asset, id: asset.id || `asset_${Date.now()}` });
  }
  write(ASSETS_FILE, { assets });
  return assets.find(a => a.id === asset.id);
}

function deleteAsset(id) {
  const assets = getAssets().filter(a => a.id !== id);
  write(ASSETS_FILE, { assets });
}

// ─── Alert History (persistent log) ──────────────────────────────────────────

const HISTORY_FILE = 'alert_history.json';
const MAX_HISTORY  = 500;

function appendAlertHistory(alert) {
  const { history = [] } = read(HISTORY_FILE, { history: [] });
  history.unshift({ ...alert, persistedAt: Date.now() });
  write(HISTORY_FILE, { history: history.slice(0, MAX_HISTORY) });
}

function getAlertHistory(limit = 100) {
  return (read(HISTORY_FILE, { history: [] }).history || []).slice(0, limit);
}

// ─── External Endpoints (vCenter, ESXi, Hyper-V) ─────────────────────────────

const ENDPOINTS_FILE = 'endpoints.json';

function getEndpoints() {
  const { endpoints = [] } = read(ENDPOINTS_FILE, { endpoints: [] });
  return endpoints;
}

function addEndpoint(endpoint) {
  const endpoints = getEndpoints();
  const newEndpoint = {
    ...endpoint,
    id: `ep_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'online' // Default mock status for newly added infrastructures
  };
  endpoints.push(newEndpoint);
  write(ENDPOINTS_FILE, { endpoints });
  return newEndpoint;
}

function deleteEndpoint(id) {
  const endpoints = getEndpoints().filter(e => e.id !== id);
  write(ENDPOINTS_FILE, { endpoints });
}

module.exports = {
  // Rules
  getRules, addRule, updateRule, deleteRule,
  // Silences
  getSilences, addSilence, removeSilence, isSilenced,
  // Acked
  ackAlert, isAcked, getAckedAlerts,
  // Veeam
  getVeeamConfig, saveVeeamConfig,
  // Assets
  getAssets, saveAsset, deleteAsset,
  // Payment Rules
  getPaymentRules, savePaymentRules,
  // Alert history
  appendAlertHistory, getAlertHistory,
  // Endpoints
  getEndpoints, addEndpoint, deleteEndpoint,
};
