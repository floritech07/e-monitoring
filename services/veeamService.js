/**
 * veeamService.js
 * Veeam Backup & Replication REST API v7 integration.
 * Polls jobs, sessions, repositories and emits platform alerts.
 */

const https  = require('https');
const http   = require('http');
const storage = require('./storageService');
const alertsService = require('./alertRulesService');

let token         = null;
let tokenExpiry   = 0;
let cachedJobs    = [];
let cachedSessions= [];
let cachedRepos   = [];
let lastPollTime  = 0;
const POLL_TTL_MS = 5 * 60_000; // 5-minute cache

/**
 * Low-level HTTP helper for Veeam REST API.
 */
function veeamRequest(cfg, path, options = {}) {
  return new Promise((resolve, reject) => {
    const url    = new URL(path, cfg.url);
    const isHttps = url.protocol === 'https:';
    const lib    = isHttps ? https : http;

    const reqOpts = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname + (url.search || ''),
      method:   options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      rejectUnauthorized: false, // Self-signed certs common in enterprise Veeam
    };

    const req = lib.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * Obtain an OAuth2 bearer token from Veeam.
 */
async function authenticate(cfg) {
  if (token && Date.now() < tokenExpiry) return true;

  const formBody = `grant_type=password&username=${encodeURIComponent(cfg.username)}&password=${encodeURIComponent(cfg.password)}`;

  return new Promise((resolve, reject) => {
    const url    = new URL('/api/oauth2/token', cfg.url);
    const isHttps = url.protocol === 'https:';
    const lib    = isHttps ? https : http;

    const reqOpts = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'x-api-version':  '1.1',
      },
      rejectUnauthorized: false,
    };

    const req = lib.request(reqOpts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            token       = parsed.access_token;
            tokenExpiry = Date.now() + (parsed.expires_in || 3600) * 1000 - 60_000;
            resolve(true);
          } else {
            reject(new Error(`Veeam auth failed: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(formBody);
    req.end();
  });
}

/**
 * Map Veeam job result status to platform severity.
 */
function mapSessionStatus(result) {
  if (!result) return { ok: false, severity: 'warning', label: 'Inconnu' };
  const r = (result || '').toLowerCase();
  if (r === 'success')  return { ok: true,  severity: 'success', label: 'Succès' };
  if (r === 'warning')  return { ok: true,  severity: 'warning', label: 'Attention' };
  if (r === 'failed' || r === 'failure') return { ok: false, severity: 'critical', label: 'Échec' };
  if (r === 'running')  return { ok: true,  severity: 'info',    label: 'En cours' };
  return { ok: false, severity: 'warning', label: result };
}

/**
 * Calculate RPO in hours from lastEndTime.
 */
function calcRPO(lastEndTime) {
  if (!lastEndTime) return null;
  const last = new Date(lastEndTime).getTime();
  return Math.round((Date.now() - last) / 3600_000 * 10) / 10;
}

/**
 * Poll Veeam API for all data.
 */
async function pollVeeam() {
  const cfg = storage.getVeeamConfig();
  if (!cfg.enabled || !cfg.url) {
    return { jobs: [], sessions: [], repos: [], connected: false, error: 'Veeam non configuré' };
  }

  try {
    await authenticate(cfg);

    const [jobsRes, sessionsRes, reposRes] = await Promise.all([
      veeamRequest(cfg, '/api/v1/jobs'),
      veeamRequest(cfg, '/api/v1/sessions?limit=100'),
      veeamRequest(cfg, '/api/v1/backupRepositories'),
    ]);

    const jobs     = (jobsRes.body?.data || []).map(j => ({
      id:           j.id,
      name:         j.name,
      type:         j.type,
      isEnabled:    j.isEnabled,
      schedule:     j.schedule,
      lastRun:      j.lastRun,
      nextRun:      j.nextRun,
      lastResult:   j.lastResult,
      rpoHours:     calcRPO(j.lastRun?.endTime),
      statusInfo:   mapSessionStatus(j.lastResult),
    }));

    const sessions = (sessionsRes.body?.data || []).map(s => ({
      id:               s.id,
      jobId:            s.jobId,
      jobName:          s.jobName,
      state:            s.state,
      result:           s.result,
      creationTime:     s.creationTime,
      endTime:          s.endTime,
      durationSeconds:  s.statistics?.duration,
      transferredBytes: s.statistics?.transferredData,
      processedObjects: s.statistics?.processedObjects,
      bottleneck:       s.statistics?.bottleneck,
      statusInfo:       mapSessionStatus(s.result),
    }));

    const repos = (reposRes.body?.data || []).map(r => ({
      id:               r.id,
      name:             r.name,
      type:             r.type,
      totalSpaceGB:     Math.round((r.capacity || 0) / (1024**3)),
      freeSpaceGB:      Math.round((r.freeSpace || 0) / (1024**3)),
      usedPct:          r.capacity ? Math.round(100 - (r.freeSpace / r.capacity * 100)) : 0,
    }));

    cachedJobs     = jobs;
    cachedSessions = sessions;
    cachedRepos    = repos;
    lastPollTime   = Date.now();

    // --- Alert generation ---
    const rpoThreshold = cfg.rpoThresholdHours || 24;
    for (const job of jobs) {
      const ruleId = `veeam_${job.id}`;
      if (job.lastResult === 'Failed') {
        alertsService.addExternalAlert({
          level:    'critical',
          severity: 'critical',
          category: 'backup',
          message:  `Backup "${job.name}" en échec — dernier résultat: FAILED`,
          source:   'Veeam B&R',
          ruleId,
        });
      } else if (job.lastResult === 'Warning') {
        alertsService.addExternalAlert({
          level:    'warning',
          severity: 'warning',
          category: 'backup',
          message:  `Backup "${job.name}" terminé avec des avertissements`,
          source:   'Veeam B&R',
          ruleId: ruleId + '_warn',
        });
      }
      if (job.rpoHours !== null && job.rpoHours > rpoThreshold) {
        alertsService.addExternalAlert({
          level:    'warning',
          severity: 'warning',
          category: 'backup',
          message:  `RPO dépassé pour "${job.name}": ${job.rpoHours}h (seuil: ${rpoThreshold}h)`,
          source:   'Veeam B&R',
          ruleId: ruleId + '_rpo',
        });
      }
    }

    return { jobs, sessions, repos, connected: true };
  } catch (e) {
    console.error('[Veeam] Poll error:', e.message);
    return {
      jobs: cachedJobs,
      sessions: cachedSessions,
      repos: cachedRepos,
      connected: false,
      error: e.message,
    };
  }
}

/**
 * Returns cached Veeam data, refreshing if stale.
 */
async function getVeeamData(forceRefresh = false) {
  const stale = (Date.now() - lastPollTime) > POLL_TTL_MS;
  if (forceRefresh || stale) {
    return pollVeeam();
  }
  const cfg = storage.getVeeamConfig();
  return {
    jobs:      cachedJobs,
    sessions:  cachedSessions,
    repos:     cachedRepos,
    connected: cfg.enabled && !!cfg.url,
  };
}

/**
 * Trigger a Veeam job start/stop action.
 */
async function triggerJobAction(jobId, action) {
  const cfg = storage.getVeeamConfig();
  if (!cfg.enabled) return { success: false, error: 'Veeam non configuré' };

  try {
    await authenticate(cfg);
    const endpoint = action === 'start'
      ? `/api/v1/jobs/${jobId}/start`
      : `/api/v1/jobs/${jobId}/stop`;

    const res = await veeamRequest(cfg, endpoint, { method: 'POST' });
    if (res.status >= 200 && res.status < 300) {
      return { success: true, message: `Action ${action} déclenchée sur le job ${jobId}` };
    }
    return { success: false, error: `Veeam API: HTTP ${res.status}` };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── GFS Simulation ──────────────────────────────────────────────────────────

const GFS_POLICIES_SIM = [
  { jobName: 'Backup-VM-Prod-Daily',  daily: 7,  weekly: 4, monthly: 3, yearly: 1 },
  { jobName: 'Backup-VM-Backup-Daily', daily: 7,  weekly: 4, monthly: 0, yearly: 0 },
  { jobName: 'Backup-Files-Exchange', daily: 14, weekly: 8, monthly: 6, yearly: 2 },
];

function makeRestorePoints(jobName, count = 20) {
  const points = [];
  const policy = GFS_POLICIES_SIM.find(p => p.jobName === jobName) || { daily: 7, weekly: 0, monthly: 0, yearly: 0 };
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const ts    = new Date(now - i * 24 * 3600_000);
    const dayN  = i + 1;
    const isWeekly  = dayN % 7  === 0 && policy.weekly  > 0 && Math.floor(dayN / 7)  <= policy.weekly;
    const isMonthly = dayN % 30 === 0 && policy.monthly > 0 && Math.floor(dayN / 30) <= policy.monthly;
    const isYearly  = dayN === 365    && policy.yearly  > 0;
    const isDaily   = dayN <= policy.daily && !isWeekly && !isMonthly;

    let gfsType = null;
    if (isYearly)  gfsType = 'yearly';
    else if (isMonthly) gfsType = 'monthly';
    else if (isWeekly)  gfsType = 'weekly';
    else if (isDaily)   gfsType = 'daily';

    const immutable = gfsType === 'monthly' || gfsType === 'yearly';
    const sizeGB    = +(15 + Math.random() * 40).toFixed(1);

    points.push({
      id:          `rp-${jobName.replace(/\s/g,'-')}-${i}`,
      jobName,
      timestamp:   ts.toISOString(),
      sizeGB,
      type:        i === 0 ? 'Full' : i % 7 === 0 ? 'Incremental (weekly)' : 'Incremental',
      gfsType,
      immutable,
      immutableUntil: immutable
        ? new Date(ts.getTime() + (gfsType === 'yearly' ? 365 : 90) * 24 * 3600_000).toISOString()
        : null,
      status:      Math.random() > 0.05 ? 'OK' : 'Warning',
    });
  }
  return points;
}

function getGFSData() {
  const jobs = ['Backup-VM-Prod-Daily', 'Backup-VM-Backup-Daily', 'Backup-Files-Exchange'];
  const restorePoints = jobs.flatMap(j => makeRestorePoints(j, 35));
  return {
    policies:      GFS_POLICIES_SIM,
    restorePoints,
    immutableCount: restorePoints.filter(p => p.immutable).length,
    totalSizeGB:    +restorePoints.reduce((s, p) => s + p.sizeGB, 0).toFixed(1),
  };
}

// ─── Nouvelles Simulations Veeam ─────────────────────────────────────────────

const SIM_SUREBACKUP = [
  { job: 'SureBackup-AD', lastRun: '2026-04-22 02:00', result: 'Success', duration: '14 min', vms: 2 },
  { job: 'SureBackup-Exchange', lastRun: '2026-04-21 03:00', result: 'Success', duration: '22 min', vms: 1 },
  { job: 'SureBackup-Prod', lastRun: '2026-04-20 04:00', result: 'Warning', duration: '35 min', vms: 3 }
];

const SIM_REPLICATION = [
  { src: 'VM-AD-01', srcHost: 'esxi-01', rep: 'VM-AD-01_REP', dstHost: 'esxi-03', lagMin: 3, lastSync: '2026-04-24 08:30', ok: true },
  { src: 'VM-EXCHANGE', srcHost: 'esxi-01', rep: 'VM-EXCHANGE_REP', dstHost: 'esxi-03', lagMin: 7, lastSync: '2026-04-24 08:25', ok: true }
];

const SIM_UNPROTECTED_VMS = [
  { name: 'VM-TEST-SGBD',   host: 'esxi-02-sbee', os: 'Ubuntu 22.04', lastBackupDays: 45, diskGB: 120, vcpu: 4, ramGB: 8 },
  { name: 'VM-DEV-WEBAPP',  host: 'esxi-01-sbee', os: 'Debian 11',    lastBackupDays: 12, diskGB: 60,  vcpu: 2, ramGB: 4 }
];

const SIM_OBJECT_STORAGE = {
  configured: true,
  repositories: [
    { name: 'AWS S3 Glacier', type: 'S3', capacityGB: 50000, usedGB: 12000, immutability: true },
    { name: 'Azure Blob Archive', type: 'Azure Blob', capacityGB: 20000, usedGB: 5000, immutability: false }
  ]
};

function getSureBackup() { return SIM_SUREBACKUP; }
function getReplication() { return SIM_REPLICATION; }
function getUnprotectedVMs() { return SIM_UNPROTECTED_VMS; }
function getObjectStorage() { return SIM_OBJECT_STORAGE; }

module.exports = { 
  getVeeamData, pollVeeam, triggerJobAction, getGFSData,
  getSureBackup, getReplication, getUnprotectedVMs, getObjectStorage
};
