'use strict';
/**
 * Serveur Syslog UDP réel — RFC 5424 + RFC 3164 (legacy)
 * Écoute sur UDP 514 (ou SYSLOG_PORT) + corrélation basique
 * Rétention configurable : fichiers journaliers YYYY-MM-DD.ndjson (LOG_RETENTION_DAYS)
 */

const dgram  = require('dgram');
const net    = require('net');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const EventEmitter = require('events');

const UDP_PORT       = parseInt(process.env.SYSLOG_PORT || '5140');
const TCP_PORT       = parseInt(process.env.SYSLOG_TCP_PORT || '5141');
const BUFFER_MAX     = 5000;
let   RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '7');

// ── Répertoire de stockage sur disque ────────────────────────────────────────
const LOG_DIR = path.join(__dirname, '..', 'data', 'syslog_archive');
try { if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) {}

function todayFile() {
  const d = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `${d}.ndjson`);
}

function appendLogToDisk(log) {
  try {
    fs.appendFileSync(todayFile(), JSON.stringify(log) + '\n', { flag: 'a' });
  } catch (_) {}
}

function purgeOldLogs() {
  try {
    const cutoff = Date.now() - RETENTION_DAYS * 86400_000;
    for (const f of fs.readdirSync(LOG_DIR)) {
      if (!f.endsWith('.ndjson')) continue;
      const dateStr = f.replace('.ndjson', '');
      const ts = new Date(dateStr).getTime();
      if (!isNaN(ts) && ts < cutoff) {
        fs.unlinkSync(path.join(LOG_DIR, f));
        console.log(`[Syslog] Purge fichier ancien: ${f}`);
      }
    }
  } catch (_) {}
}

function getRetentionConfig() {
  let files = [];
  try {
    files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.ndjson')).sort();
  } catch (_) {}
  const totalBytes = files.reduce((s, f) => {
    try { return s + fs.statSync(path.join(LOG_DIR, f)).size; } catch { return s; }
  }, 0);
  return {
    retentionDays: RETENTION_DAYS,
    logDir:        LOG_DIR,
    archivedFiles: files.length,
    totalSizeKB:   Math.round(totalBytes / 1024),
    oldest:        files[0]?.replace('.ndjson', '') || null,
    newest:        files.at(-1)?.replace('.ndjson', '') || null,
  };
}

function setRetentionDays(days) {
  RETENTION_DAYS = Math.max(1, Math.min(365, parseInt(days) || 7));
  purgeOldLogs();
  return getRetentionConfig();
}

// Purge au démarrage
purgeOldLogs();
// Purge quotidienne à minuit
setInterval(purgeOldLogs, 24 * 3600_000);

// ── Parseurs RFC ──────────────────────────────────────────────────────────────

const FACILITIES = ['kern','user','mail','daemon','auth','syslog','lpr','news','uucp','clock','authpriv','ftp','ntp','audit','alert','cron','local0','local1','local2','local3','local4','local5','local6','local7'];
const SEVERITIES = ['emergency','alert','critical','error','warning','notice','info','debug'];

function parsePRI(raw) {
  const m = raw.match(/^<(\d+)>/);
  if (!m) return { facility: 'user', severity: 'info', remaining: raw };
  const pri = parseInt(m[1]);
  return {
    facility:  FACILITIES[Math.floor(pri / 8)] || 'user',
    severity:  SEVERITIES[pri % 8] || 'info',
    remaining: raw.slice(m[0].length),
  };
}

function parseRFC5424(msg) {
  // <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID [SD] MSG
  const r5 = /^<(\d+)>(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\[.*?\]|-)\s*(.*)/s;
  const m  = msg.match(r5);
  if (m) {
    const pri = parseInt(m[1]);
    return {
      format:    'rfc5424',
      facility:  FACILITIES[Math.floor(pri / 8)] || 'user',
      severity:  SEVERITIES[pri % 8] || 'info',
      version:   m[2],
      timestamp: m[3] === '-' ? new Date().toISOString() : m[3],
      hostname:  m[4] === '-' ? 'unknown' : m[4],
      appName:   m[5] === '-' ? '-' : m[5],
      procId:    m[6] === '-' ? null : m[6],
      msgId:     m[7] === '-' ? null : m[7],
      sd:        m[8] === '-' ? null : m[8],
      message:   m[9].trim(),
    };
  }
  return null;
}

function parseRFC3164(msg) {
  // <PRI>TIMESTAMP HOST TAG: MSG
  const { facility, severity, remaining } = parsePRI(msg);
  // Timestamp: Mon DD HH:MM:SS or ISO
  const r3 = /^(\w{3}\s+\d+\s+[\d:]+)\s+(\S+)\s+([^:]+):\s*(.*)/s;
  const m  = remaining.match(r3);
  if (m) {
    const ts = new Date(m[1] + ' ' + new Date().getFullYear());
    return {
      format:    'rfc3164',
      facility, severity,
      timestamp: isNaN(ts) ? new Date().toISOString() : ts.toISOString(),
      hostname:  m[2],
      appName:   m[3].trim(),
      procId:    null, msgId: null, sd: null,
      message:   m[4].trim(),
    };
  }
  // Fallback minimal
  return {
    format: 'unknown', facility, severity,
    timestamp: new Date().toISOString(),
    hostname: 'unknown', appName: '-', procId: null, msgId: null, sd: null,
    message: remaining.trim(),
  };
}

function parseMessage(rawBuffer) {
  const msg = rawBuffer.toString('utf8').trim();
  return parseRFC5424(msg) || parseRFC3164(msg);
}

// ── Corrélation basique ───────────────────────────────────────────────────────

const CORRELATION_RULES = [
  {
    id: 'brute-force-ssh',
    name: 'Tentatives SSH excessives',
    pattern: /sshd.*Failed|sshd.*Invalid user|sshd.*authentication failure/i,
    windowMs: 60_000,
    threshold: 5,
    severity: 'critical',
    description: 'Probable attaque brute-force SSH',
  },
  {
    id: 'brute-force-rdp',
    name: 'Tentatives RDP/NTLM excessives',
    pattern: /EventID 4625|NTLM authentication failed|logon failure/i,
    windowMs: 60_000,
    threshold: 5,
    severity: 'critical',
    description: 'Probable attaque brute-force RDP/Windows',
  },
  {
    id: 'disk-error-recurring',
    name: 'Erreurs disque répétées',
    pattern: /scsi.*error|ata.*error|disk.*I\/O error|RAID.*degraded/i,
    windowMs: 300_000,
    threshold: 3,
    severity: 'critical',
    description: 'Défaillance disque potentielle',
  },
  {
    id: 'ups-battery-events',
    name: 'Événements UPS répétés',
    pattern: /on battery|battery low|UPS.*alarm|on_battery/i,
    windowMs: 300_000,
    threshold: 2,
    severity: 'warning',
    description: 'Instabilité alimentation UPS détectée',
  },
  {
    id: 'service-crash-loop',
    name: 'Service en crash-loop',
    pattern: /segfault|core dumped|process.*crashed|service.*failed.*start/i,
    windowMs: 180_000,
    threshold: 3,
    severity: 'critical',
    description: 'Service en boucle de redémarrage',
  },
  {
    id: 'esxi-memory-ecc',
    name: 'Erreurs mémoire ECC',
    pattern: /ECC error|memory error|DIMM.*error/i,
    windowMs: 600_000,
    threshold: 2,
    severity: 'critical',
    description: 'Erreurs mémoire ECC détectées sur serveur',
  },
];

const _corrWindows = {};  // ruleId+hostname → [timestamps]

function runCorrelation(log, emitFn) {
  for (const rule of CORRELATION_RULES) {
    if (!rule.pattern.test(log.message)) continue;
    const key = `${rule.id}:${log.hostname}`;
    if (!_corrWindows[key]) _corrWindows[key] = [];
    const now  = Date.now();
    _corrWindows[key] = _corrWindows[key].filter(t => now - t < rule.windowMs);
    _corrWindows[key].push(now);
    if (_corrWindows[key].length >= rule.threshold) {
      emitFn({
        type:        'correlation',
        ruleId:      rule.id,
        ruleName:    rule.name,
        description: rule.description,
        severity:    rule.severity,
        hostname:    log.hostname,
        count:       _corrWindows[key].length,
        windowMs:    rule.windowMs,
        timestamp:   new Date().toISOString(),
        triggerLog:  log,
      });
      _corrWindows[key] = [];  // reset après déclenchement
    }
  }
}

// ── Signature cryptographique ─────────────────────────────────────────────────

const LOG_SIGN_KEY = process.env.LOG_SIGN_KEY || crypto.randomBytes(32).toString('hex');

function signLog(log) {
  const payload = `${log.timestamp}|${log.hostname}|${log.severity}|${log.message}`;
  return crypto.createHmac('sha256', LOG_SIGN_KEY).update(payload).digest('hex').slice(0, 16);
}

// ── Service principal ─────────────────────────────────────────────────────────

class SyslogServer extends EventEmitter {
  constructor() {
    super();
    this._buffer   = [];
    this._stats    = { received: 0, parsed: 0, parseErrors: 0, correlations: 0 };
    this._udpSrv   = null;
    this._tcpSrv   = null;
    this._started  = false;
  }

  _ingest(rawBuffer, remoteInfo) {
    this._stats.received++;
    let log;
    try {
      log = parseMessage(rawBuffer);
      this._stats.parsed++;
    } catch (_) {
      this._stats.parseErrors++;
      return;
    }

    // Enrichissement
    log.id         = `syslog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    log.receivedAt = new Date().toISOString();
    log.remoteIp   = remoteInfo?.address || 'unknown';
    log.raw        = rawBuffer.toString('utf8').trim().slice(0, 512);
    log.signature  = signLog(log);

    // Buffer circulaire en mémoire + écriture disque
    this._buffer.unshift(log);
    if (this._buffer.length > BUFFER_MAX) this._buffer = this._buffer.slice(0, BUFFER_MAX);
    appendLogToDisk(log);

    // Corrélation
    runCorrelation(log, (event) => {
      this._stats.correlations++;
      this.emit('correlation', event);
    });

    this.emit('log', log);
  }

  start() {
    if (this._started) return;
    this._started = true;

    // UDP server
    this._udpSrv = dgram.createSocket('udp4');
    this._udpSrv.on('message', (msg, rinfo) => this._ingest(msg, rinfo));
    this._udpSrv.on('error', (e) => {
      if (e.code === 'EACCES') {
        console.warn(`[Syslog] Port UDP ${UDP_PORT} refusé (root requis pour 514). Utiliser SYSLOG_PORT=5140`);
      } else {
        console.error('[Syslog UDP]', e.message);
      }
    });
    this._udpSrv.bind(UDP_PORT, () => {
      console.log(`[Syslog] Serveur UDP démarré sur port ${UDP_PORT}`);
    });

    // TCP server (pour rsyslog/syslog-ng reliable)
    this._tcpSrv = net.createServer((sock) => {
      let buf = '';
      sock.setEncoding('utf8');
      sock.on('data', (d) => {
        buf += d;
        let nl;
        while ((nl = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, nl).trim();
          if (line) this._ingest(Buffer.from(line), { address: sock.remoteAddress });
          buf = buf.slice(nl + 1);
        }
      });
      sock.on('error', () => {});
    });
    this._tcpSrv.listen(TCP_PORT, () => {
      console.log(`[Syslog] Serveur TCP démarré sur port ${TCP_PORT}`);
    });
  }

  stop() {
    if (this._udpSrv) this._udpSrv.close();
    if (this._tcpSrv) this._tcpSrv.close();
    this._started = false;
  }

  getLogs({ limit = 200, severity = null, source = null, search = null } = {}) {
    let logs = this._buffer;
    if (severity) logs = logs.filter(l => l.severity === severity);
    if (source)   logs = logs.filter(l => (l.hostname || '').toLowerCase().includes(source.toLowerCase()));
    if (search)   logs = logs.filter(l => l.message.toLowerCase().includes(search.toLowerCase()) || (l.hostname || '').toLowerCase().includes(search.toLowerCase()));
    return logs.slice(0, limit);
  }

  getStats() {
    const bySev = {};
    for (const sev of SEVERITIES) bySev[sev] = this._buffer.filter(l => l.severity === sev).length;
    const bySrc = {};
    for (const l of this._buffer) {
      const h = l.hostname || 'unknown';
      bySrc[h] = (bySrc[h] || 0) + 1;
    }
    return {
      ...this._stats,
      buffered: this._buffer.length,
      bySeverity: bySev,
      bySource: bySrc,
      udpPort: UDP_PORT,
      tcpPort: TCP_PORT,
      signKey: LOG_SIGN_KEY.slice(0, 8) + '…',
    };
  }

  getCorrelationRules() { return CORRELATION_RULES; }
  isStarted()          { return this._started; }
  getRetentionConfig() { return getRetentionConfig(); }
  setRetentionDays(d)  { return setRetentionDays(d); }
}

const server = new SyslogServer();
module.exports = server;
