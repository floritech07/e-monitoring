'use strict';
/**
 * Service Logs — Phase 5 stub
 * Syslog RFC 5424 + Windows Event Log (simulation Phase 0)
 */

const SOURCES = ['ESXi-01-SBEE', 'ESXi-02-SBEE', 'ESXi-03-SBEE', 'SW-CORE-01', 'UPS-SUKAM-01', 'NAS-SYNOLOGY-01', 'SICA-APP-01', 'AD-DC-01',
                 'WEF-AD-DC-01', 'WEF-SRV-EXCHANGE', 'WEF-SRV-SGBD'];
const FACILITIES = ['kern', 'user', 'mail', 'daemon', 'auth', 'syslog', 'lpr', 'news'];
const SEVERITIES = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];
const SEV_WEIGHTS = [0.01, 0.02, 0.04, 0.07, 0.15, 0.15, 0.46, 0.10];

const LOG_TEMPLATES = [
  { sev: 'info',    fac: 'daemon',  src: 'ESXi-01-SBEE',       ip: '192.168.10.11', msg: 'vmx| VMXNET3: Tx queue restarted on vmnic0' },
  { sev: 'info',    fac: 'auth',    src: 'AD-DC-01',            ip: '192.168.10.20', msg: 'An account was successfully logged on. Account: mfchakoun' },
  { sev: 'warning', fac: 'daemon',  src: 'UPS-SUKAM-01',        ip: '192.168.1.1',   msg: 'Battery charge below 40% — on_line mode' },
  { sev: 'error',   fac: 'kern',    src: 'ESXi-02-SBEE',        ip: '192.168.10.12', msg: 'scsi0 : reset adapter requested — timeout on LUN 2' },
  { sev: 'info',    fac: 'daemon',  src: 'NAS-SYNOLOGY-01',     ip: '192.168.10.50', msg: 'RAID health check completed — status: healthy' },
  { sev: 'warning', fac: 'syslog',  src: 'SW-CORE-01',          ip: '192.168.1.2',   msg: 'Interface Gi1/0/48: input errors rate 0.03%' },
  { sev: 'info',    fac: 'daemon',  src: 'SICA-APP-01',         ip: '192.168.10.100',msg: 'Application heartbeat OK — uptime 12d 4h 22m' },
  { sev: 'critical',fac: 'kern',    src: 'ESXi-03-SBEE',        ip: '192.168.10.13', msg: 'Memory ECC error detected — correctable, DIMM slot B2' },
  { sev: 'info',    fac: 'auth',    src: 'AD-DC-01',            ip: '192.168.10.20', msg: 'Group Policy refresh completed successfully' },
  { sev: 'notice',  fac: 'daemon',  src: 'ESXi-01-SBEE',        ip: '192.168.10.11', msg: 'vMotion of VM SICA-APP-01 completed in 4.2s' },
  // WEF — Windows Event Log entries
  { sev: 'info',    fac: 'auth',    src: 'WEF-AD-DC-01',        ip: '192.168.10.21', msg: 'Windows Security: Logon success. User: SBEE\\admin1 EventID:4624', eventId: 4624, channel: 'Security', computer: 'AD-DC-01.sbee.bj' },
  { sev: 'warning', fac: 'syslog',  src: 'WEF-AD-DC-01',        ip: '192.168.10.21', msg: 'Windows Security: Account locked out. User: SBEE\\testuser EventID:4740', eventId: 4740, channel: 'Security', computer: 'AD-DC-01.sbee.bj' },
  { sev: 'error',   fac: 'daemon',  src: 'WEF-SRV-EXCHANGE',    ip: '192.168.10.30', msg: 'MSExchangeTransport: Message delivery failed — queue backpressure EventID:15002', eventId: 15002, channel: 'Application', computer: 'SRV-EXCHANGE.sbee.bj' },
  { sev: 'info',    fac: 'daemon',  src: 'WEF-SRV-SGBD',        ip: '192.168.10.40', msg: 'MSSQLSERVER: Database SBEE_PROD backup completed successfully EventID:18264', eventId: 18264, channel: 'Application', computer: 'SRV-SGBD.sbee.bj' },
  { sev: 'critical',fac: 'auth',    src: 'WEF-AD-DC-01',        ip: '185.220.101.5', msg: 'Windows Security: Special logon from external IP — potential brute force EventID:4648', eventId: 4648, channel: 'Security', computer: 'AD-DC-01.sbee.bj' },
  { sev: 'warning', fac: 'syslog',  src: 'WEF-SRV-SGBD',        ip: '192.168.10.40', msg: 'Windows Disk: Drive C: usage > 85% EventID:2013', eventId: 2013, channel: 'System', computer: 'SRV-SGBD.sbee.bj' },
];

let _logBuffer = [];
let _lastGen = 0;
const GEN_INTERVAL_MS = 3000;
const BUFFER_MAX = 2000;

function _generateLog() {
  const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const src = Math.random() < 0.7 ? tpl.src : SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const entry = {
    id:         `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp:  new Date().toISOString(),
    facility:   tpl.fac,
    severity:   tpl.sev,
    source:     src,
    ip:         tpl.ip || null,
    message:    tpl.msg,
    raw:        `<${FACILITIES.indexOf(tpl.fac) * 8 + SEVERITIES.indexOf(tpl.sev)}>${new Date().toISOString()} ${src} ${tpl.msg}`,
  };
  if (tpl.eventId)  entry.eventId  = tpl.eventId;
  if (tpl.channel)  entry.channel  = tpl.channel;
  if (tpl.computer) entry.computer = tpl.computer;
  return entry;
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
