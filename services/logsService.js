'use strict';
/**
 * Service Logs — Phase 5 stub
 * Syslog RFC 5424 + Windows Event Log (simulation Phase 0)
 */

const SOURCES = ['ESXi-01-SBEE', 'ESXi-02-SBEE', 'ESXi-03-SBEE', 'SW-CORE-01', 'UPS-SUKAM-01', 'NAS-SYNOLOGY-01', 'SICA-APP-01', 'AD-DC-01'];
const FACILITIES = ['kern', 'user', 'mail', 'daemon', 'auth', 'syslog', 'lpr', 'news'];
const SEVERITIES = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];
const SEV_WEIGHTS = [0.01, 0.02, 0.04, 0.07, 0.15, 0.15, 0.46, 0.10];

const LOG_TEMPLATES = [
  { sev: 'info',    fac: 'daemon',  src: 'ESXi-01-SBEE',    msg: 'vmx| VMXNET3: Tx queue restarted on vmnic0' },
  { sev: 'info',    fac: 'auth',    src: 'AD-DC-01',         msg: 'An account was successfully logged on. Account: mfchakoun' },
  { sev: 'warning', fac: 'daemon',  src: 'UPS-SUKAM-01',     msg: 'Battery charge below 40% — on_line mode' },
  { sev: 'error',   fac: 'kern',    src: 'ESXi-02-SBEE',     msg: 'scsi0 : reset adapter requested — timeout on LUN 2' },
  { sev: 'info',    fac: 'daemon',  src: 'NAS-SYNOLOGY-01',  msg: 'RAID health check completed — status: healthy' },
  { sev: 'warning', fac: 'syslog',  src: 'SW-CORE-01',       msg: 'Interface Gi1/0/48: input errors rate 0.03%' },
  { sev: 'info',    fac: 'daemon',  src: 'SICA-APP-01',      msg: 'Application heartbeat OK — uptime 12d 4h 22m' },
  { sev: 'critical',fac: 'kern',    src: 'ESXi-03-SBEE',     msg: 'Memory ECC error detected — correctable, DIMM slot B2' },
  { sev: 'info',    fac: 'auth',    src: 'AD-DC-01',         msg: 'Group Policy refresh completed successfully' },
  { sev: 'notice',  fac: 'daemon',  src: 'ESXi-01-SBEE',     msg: 'vMotion of VM SICA-APP-01 completed in 4.2s' },
];

let _logBuffer = [];
let _lastGen = 0;
const GEN_INTERVAL_MS = 3000;
const BUFFER_MAX = 2000;

function _generateLog() {
  const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const src = Math.random() < 0.7 ? tpl.src : SOURCES[Math.floor(Math.random() * SOURCES.length)];
  return {
    id:         `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp:  new Date().toISOString(),
    facility:   tpl.fac,
    severity:   tpl.sev,
    source:     src,
    message:    tpl.msg,
    raw:        `<${FACILITIES.indexOf(tpl.fac) * 8 + SEVERITIES.indexOf(tpl.sev)}>${new Date().toISOString()} ${src} ${tpl.msg}`,
  };
}

function getLogs({ limit = 200, severity = null, source = null, search = null } = {}) {
  const now = Date.now();
  // Génère de nouveaux logs si nécessaire
  if (now - _lastGen > GEN_INTERVAL_MS) {
    const count = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < count; i++) {
      _logBuffer.unshift(_generateLog());
    }
    if (_logBuffer.length > BUFFER_MAX) _logBuffer = _logBuffer.slice(0, BUFFER_MAX);
    _lastGen = now;
  }

  // Initialisation buffer si vide
  if (_logBuffer.length === 0) {
    for (let i = 0; i < 50; i++) _logBuffer.push(_generateLog());
    _logBuffer.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  let logs = _logBuffer;
  if (severity) logs = logs.filter(l => l.severity === severity);
  if (source)   logs = logs.filter(l => l.source.toLowerCase().includes(source.toLowerCase()));
  if (search)   logs = logs.filter(l => l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase()));

  return logs.slice(0, limit);
}

function getLogStats() {
  const logs = getLogs({ limit: 500 });
  const bySev = {};
  for (const sev of SEVERITIES) bySev[sev] = logs.filter(l => l.severity === sev).length;
  const bySrc = {};
  for (const src of SOURCES) bySrc[src] = logs.filter(l => l.source === src).length;
  return { total: logs.length, bySeverity: bySev, bySource: bySrc };
}

module.exports = { getLogs, getLogStats };
