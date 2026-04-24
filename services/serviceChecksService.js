'use strict';
/**
 * Service de checks actifs — Phase 4/6
 * TCP · HTTP/HTTPS · SMTP · IMAP · LDAP · DNS · Ping · SSL expiry · Script
 * Arbre de dépendances, fenêtres de maintenance, historique
 */

const net    = require('net');
const http   = require('http');
const https  = require('https');
const tls    = require('tls');
const dns    = require('dns').promises;
const { exec, spawn } = require('child_process');
const fs     = require('fs');
const path   = require('path');
const EventEmitter = require('events');

const DATA_FILE = path.join(__dirname, '../data/service_checks.json');
const HIST_MAX  = 100;   // points d'historique par service
const CHECK_INTERVAL_MS = 30_000;

// ── Définitions de services par défaut (SBEE contexte) ───────────────────────

const DEFAULT_SERVICES = [
  // IceWarp Mail
  { id: 'icewarp-smtp',   host: '10.1.1.10', port: 25,   type: 'smtp',  name: 'IceWarp SMTP',          group: 'Mail',     criticality: 'critical', interval: 30, depends: [] },
  { id: 'icewarp-imap',   host: '10.1.1.10', port: 993,  type: 'tcp',   name: 'IceWarp IMAP/S',        group: 'Mail',     criticality: 'critical', interval: 30, depends: ['icewarp-smtp'] },
  { id: 'icewarp-https',  host: '10.1.1.10', port: 443,  type: 'https', name: 'IceWarp Webmail HTTPS', group: 'Mail',     criticality: 'critical', interval: 60, depends: [] },
  { id: 'icewarp-mariadb',host: '10.1.1.10', port: 3306, type: 'tcp',   name: 'IceWarp MariaDB',       group: 'Mail',     criticality: 'critical', interval: 30, depends: [] },

  // Active Directory
  { id: 'ad-ldap',        host: '10.1.1.5',  port: 389,  type: 'ldap',  name: 'AD LDAP',               group: 'Identity', criticality: 'critical', interval: 30, depends: [] },
  { id: 'ad-ldaps',       host: '10.1.1.5',  port: 636,  type: 'tcp',   name: 'AD LDAPS',              group: 'Identity', criticality: 'critical', interval: 30, depends: [] },
  { id: 'ad-kerberos',    host: '10.1.1.5',  port: 88,   type: 'tcp',   name: 'AD Kerberos',           group: 'Identity', criticality: 'critical', interval: 30, depends: [] },
  { id: 'ad-dns',         host: '10.1.1.5',  port: 53,   type: 'dns',   name: 'AD DNS',                group: 'Identity', criticality: 'critical', interval: 30, depends: [] },

  // vCenter
  { id: 'vcenter-https',  host: '10.1.1.20', port: 443,  type: 'https', name: 'vCenter HTTPS',         group: 'Virt',     criticality: 'critical', interval: 60, depends: [] },
  { id: 'vcenter-web',    host: '10.1.1.20', port: 9443, type: 'tcp',   name: 'vCenter Web Client',    group: 'Virt',     criticality: 'warning',  interval: 60, depends: [] },

  // Veeam
  { id: 'veeam-one',      host: '10.1.1.14', port: 1239, type: 'tcp',   name: 'Veeam ONE Server',      group: 'Backup',   criticality: 'critical', interval: 60, depends: [] },
  { id: 'veeam-web',      host: '10.1.1.14', port: 1340, type: 'tcp',   name: 'Veeam ONE Web',         group: 'Backup',   criticality: 'warning',  interval: 60, depends: [] },

  // NAS Synology
  { id: 'nas-smb',        host: '10.1.1.30', port: 445,  type: 'tcp',   name: 'NAS Synology SMB',      group: 'Stockage', criticality: 'critical', interval: 30, depends: [] },
  { id: 'nas-nfs',        host: '10.1.1.30', port: 2049, type: 'tcp',   name: 'NAS NFS',               group: 'Stockage', criticality: 'warning',  interval: 30, depends: [] },
  { id: 'nas-https',      host: '10.1.1.30', port: 5001, type: 'https', name: 'NAS DSM HTTPS',         group: 'Stockage', criticality: 'warning',  interval: 60, depends: [] },

  // ESXi hosts
  { id: 'esxi01-mgmt',    host: '192.168.10.11', port: 443, type: 'https', name: 'ESXi-01 Management', group: 'ESXi', criticality: 'critical', interval: 30, depends: [] },
  { id: 'esxi02-mgmt',    host: '192.168.10.12', port: 443, type: 'https', name: 'ESXi-02 Management', group: 'ESXi', criticality: 'critical', interval: 30, depends: [] },
  { id: 'esxi03-mgmt',    host: '192.168.10.13', port: 443, type: 'https', name: 'ESXi-03 Management', group: 'ESXi', criticality: 'warning',  interval: 30, depends: [] },

  // Monitoring itself
  { id: 'nexus-api',      host: '127.0.0.1', port: 3001, type: 'http',  name: 'NexusMonitor API',      group: 'Supervision', criticality: 'warning', interval: 30, depends: [] },
];

// ── État interne ──────────────────────────────────────────────────────────────

let _services  = [];
let _results   = {};   // serviceId → { status, latencyMs, message, checkedAt, history[] }
let _maint     = [];   // { id, serviceId, start, end, reason, createdBy }
let _checkLoop = null;

class ServiceChecksService extends EventEmitter {
  constructor() {
    super();
    this._load();
    this._initResults();
  }

  // ── Persistance ─────────────────────────────────────────────────────────────

  _load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        _services = d.services || DEFAULT_SERVICES;
        _maint    = d.maintenanceWindows || [];
      } else {
        _services = JSON.parse(JSON.stringify(DEFAULT_SERVICES));
      }
    } catch (_) {
      _services = JSON.parse(JSON.stringify(DEFAULT_SERVICES));
    }
  }

  _save() {
    try {
      const tmp = DATA_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ services: _services, maintenanceWindows: _maint }, null, 2));
      fs.renameSync(tmp, DATA_FILE);
    } catch (_) {}
  }

  _initResults() {
    _services.forEach(s => {
      if (!_results[s.id]) {
        _results[s.id] = { status: 'unknown', latencyMs: null, message: 'Pas encore vérifié', checkedAt: null, history: [] };
      }
    });
  }

  // ── Checks individuels ──────────────────────────────────────────────────────

  async _checkTCP(host, port, timeoutMs = 5000) {
    return new Promise(resolve => {
      const start = Date.now();
      const sock  = new net.Socket();
      let done = false;
      const finish = (ok, msg) => {
        if (done) return; done = true;
        sock.destroy();
        resolve({ ok, latencyMs: Date.now() - start, message: msg });
      };
      sock.setTimeout(timeoutMs);
      sock.connect(port, host, () => finish(true, `TCP OK (${port})`));
      sock.on('error', (e) => finish(false, `TCP FAIL: ${e.message}`));
      sock.on('timeout', ()  => finish(false, `TCP TIMEOUT after ${timeoutMs}ms`));
    });
  }

  async _checkHTTP(host, port, useTLS = false, path = '/', timeoutMs = 8000) {
    return new Promise(resolve => {
      const start = Date.now();
      const options = { host, port, path, method: 'GET', timeout: timeoutMs,
        rejectUnauthorized: false, headers: { 'User-Agent': 'NexusMonitor/2.0' } };
      const mod = useTLS ? https : http;
      const req = mod.request(options, (res) => {
        res.destroy();
        const lat = Date.now() - start;
        const ok  = res.statusCode < 500;
        resolve({ ok, latencyMs: lat, message: `HTTP ${res.statusCode} (${lat}ms)` });
      });
      req.on('error', (e) => resolve({ ok: false, latencyMs: Date.now() - start, message: `HTTP FAIL: ${e.message}` }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, latencyMs: timeoutMs, message: `HTTP TIMEOUT` }); });
      req.end();
    });
  }

  async _checkSMTP(host, port = 25, timeoutMs = 8000) {
    return new Promise(resolve => {
      const start = Date.now();
      const sock  = new net.Socket();
      let   buf   = '';
      let   done  = false;
      const finish = (ok, msg) => {
        if (done) return; done = true;
        sock.destroy();
        resolve({ ok, latencyMs: Date.now() - start, message: msg });
      };
      sock.setTimeout(timeoutMs);
      sock.connect(port, host, () => {});
      sock.on('data', (d) => {
        buf += d.toString();
        if (buf.includes('\n')) {
          if (buf.startsWith('220')) {
            sock.write('EHLO nexusmonitor.sbee.bj\r\n');
            setTimeout(() => finish(true, `SMTP OK: ${buf.split('\n')[0].trim()}`), 500);
          } else {
            finish(false, `SMTP banner: ${buf.slice(0, 80)}`);
          }
        }
      });
      sock.on('error', (e) => finish(false, `SMTP FAIL: ${e.message}`));
      sock.on('timeout',()  => finish(false, 'SMTP TIMEOUT'));
    });
  }

  async _checkIMAP(host, port = 993, timeoutMs = 6000) {
    return new Promise(resolve => {
      const start = Date.now();
      const sock  = tls.connect({ host, port, rejectUnauthorized: false }, () => {});
      let   done  = false;
      const finish = (ok, msg) => {
        if (done) return; done = true;
        try { sock.destroy(); } catch (_) {}
        resolve({ ok, latencyMs: Date.now() - start, message: msg });
      };
      sock.setTimeout(timeoutMs);
      sock.on('data', (d) => {
        const banner = d.toString().trim();
        finish(banner.startsWith('*'), `IMAP: ${banner.slice(0, 60)}`);
      });
      sock.on('error', (e) => finish(false, `IMAP FAIL: ${e.message}`));
      sock.on('timeout',()  => finish(false, 'IMAP TIMEOUT'));
    });
  }

  async _checkLDAP(host, port = 389, timeoutMs = 5000) {
    // Basic LDAP: send anonymous bind request (RFC 4511), check response code
    return new Promise(resolve => {
      const start = Date.now();
      // Minimal LDAP anonymous bind PDU
      const bindReq = Buffer.from([
        0x30, 0x0c,             // SEQUENCE
        0x02, 0x01, 0x01,       // messageID = 1
        0x60, 0x07,             // bindRequest
        0x02, 0x01, 0x03,       // version = 3
        0x04, 0x00,             // dn = ""
        0x80, 0x00,             // simple auth = ""
      ]);
      const sock = new net.Socket();
      let done = false;
      const finish = (ok, msg) => {
        if (done) return; done = true;
        sock.destroy();
        resolve({ ok, latencyMs: Date.now() - start, message: msg });
      };
      sock.setTimeout(timeoutMs);
      sock.connect(port, host, () => sock.write(bindReq));
      sock.on('data', (d) => {
        // resultCode 0 = success (byte at index 11 for a simple bind response)
        const rc = d[11] ?? -1;
        finish(rc === 0 || rc === 7, `LDAP bind resultCode=${rc}`);
      });
      sock.on('error', (e) => finish(false, `LDAP FAIL: ${e.message}`));
      sock.on('timeout',()  => finish(false, 'LDAP TIMEOUT'));
    });
  }

  async _checkDNS(host, record = 'sbee.bj', timeoutMs = 5000) {
    const start = Date.now();
    try {
      const resolver = new dns.Resolver();
      resolver.setServers([`${host}:53`]);
      await Promise.race([
        resolver.resolve4(record),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), timeoutMs)),
      ]);
      return { ok: true, latencyMs: Date.now() - start, message: `DNS OK: ${record}` };
    } catch (e) {
      return { ok: false, latencyMs: Date.now() - start, message: `DNS FAIL: ${e.message}` };
    }
  }

  async _checkSSLExpiry(host, port = 443) {
    return new Promise(resolve => {
      const sock = tls.connect({ host, port, rejectUnauthorized: false }, () => {
        const cert = sock.getPeerCertificate();
        sock.destroy();
        if (!cert?.valid_to) {
          return resolve({ ok: false, daysLeft: null, message: 'Pas de certificat' });
        }
        const expiry   = new Date(cert.valid_to);
        const daysLeft = Math.floor((expiry - Date.now()) / 86_400_000);
        const ok       = daysLeft > 14;
        resolve({
          ok,
          daysLeft,
          message: `SSL expire dans ${daysLeft}j (${expiry.toLocaleDateString('fr-FR')})`,
          subject: cert.subject?.CN || 'inconnu',
        });
      });
      sock.on('error', (e) => resolve({ ok: false, daysLeft: null, message: `SSL FAIL: ${e.message}` }));
      sock.setTimeout(6000, () => { sock.destroy(); resolve({ ok: false, daysLeft: null, message: 'SSL TIMEOUT' }); });
    });
  }

  async _checkPing(host, count = 2) {
    return new Promise(resolve => {
      const start = Date.now();
      const cmd   = process.platform === 'win32' ? `ping -n ${count} ${host}` : `ping -c ${count} -W 3 ${host}`;
      exec(cmd, { timeout: 10000 }, (err, stdout) => {
        const lat  = Date.now() - start;
        if (err) {
          return resolve({ ok: false, latencyMs: lat, message: `PING FAIL: ${host}` });
        }
        const match = stdout.match(/[Aa]verage.*?=\s*([\d.]+)\s*ms|rtt.*?=[\d.]+\/([\d.]+)/);
        const avg   = match ? parseFloat(match[1] || match[2]) : Math.round(lat / count);
        resolve({ ok: true, latencyMs: avg, message: `PING OK: ${avg}ms (${host})` });
      });
    });
  }

  // ── Dispatch check par type ──────────────────────────────────────────────────

  async _runCheck(svc) {
    switch (svc.type) {
      case 'tcp':   return this._checkTCP(svc.host, svc.port);
      case 'http':  return this._checkHTTP(svc.host, svc.port, false, svc.path || '/');
      case 'https': return this._checkHTTP(svc.host, svc.port, true,  svc.path || '/');
      case 'smtp':  return this._checkSMTP(svc.host, svc.port);
      case 'imap':  return this._checkIMAP(svc.host, svc.port);
      case 'ldap':  return this._checkLDAP(svc.host, svc.port);
      case 'dns':   return this._checkDNS(svc.host);
      case 'ping':  return this._checkPing(svc.host);
      case 'ssl':   return this._checkSSLExpiry(svc.host, svc.port || 443);
      default:      return this._checkTCP(svc.host, svc.port);
    }
  }

  // ── Vérification d'une maintenance active ───────────────────────────────────

  _inMaintenance(serviceId) {
    const now = Date.now();
    return _maint.some(m =>
      (m.serviceId === serviceId || m.serviceId === '*') &&
      new Date(m.start).getTime() <= now &&
      new Date(m.end).getTime()   >= now
    );
  }

  // ── Boucle de checks ────────────────────────────────────────────────────────

  async _checkOne(svc) {
    if (this._inMaintenance(svc.id)) {
      _results[svc.id] = { ...(_results[svc.id] || {}), status: 'maintenance', message: 'En maintenance planifiée', checkedAt: new Date().toISOString() };
      return;
    }

    // Vérifier les parents (dépendances) — si parent down, ne pas checker
    if (svc.depends?.length) {
      const anyParentDown = svc.depends.some(pid => _results[pid]?.status === 'critical');
      if (anyParentDown) {
        _results[svc.id] = { ...(_results[svc.id] || {}), status: 'unreachable', message: 'Parent down — check supprimé', checkedAt: new Date().toISOString() };
        return;
      }
    }

    const result = await this._runCheck(svc).catch(e => ({ ok: false, latencyMs: null, message: e.message }));
    const prevStatus = _results[svc.id]?.status;

    const newStatus = result.ok ? 'ok' : (svc.criticality === 'critical' ? 'critical' : 'warning');

    const entry = {
      status:    newStatus,
      latencyMs: result.latencyMs,
      message:   result.message,
      checkedAt: new Date().toISOString(),
      history:   [...(_results[svc.id]?.history || [])].slice(-HIST_MAX),
    };
    entry.history.push({ t: Date.now(), ok: result.ok, ms: result.latencyMs });

    _results[svc.id] = entry;

    if (prevStatus !== newStatus) {
      this.emit('status_change', {
        serviceId: svc.id,
        serviceName: svc.name,
        host:    svc.host,
        port:    svc.port,
        group:   svc.group,
        criticality: svc.criticality,
        prevStatus,
        newStatus,
        message: result.message,
        timestamp: entry.checkedAt,
      });
    }
  }

  async checkAll() {
    await Promise.allSettled(_services.map(s => this._checkOne(s)));
  }

  startLoop() {
    if (_checkLoop) return;
    this.checkAll();
    _checkLoop = setInterval(() => this.checkAll(), CHECK_INTERVAL_MS);
  }

  stopLoop() {
    if (_checkLoop) { clearInterval(_checkLoop); _checkLoop = null; }
  }

  // ── API publique ────────────────────────────────────────────────────────────

  getServices()  { return _services; }
  getResults()   { return _results; }

  getServiceMatrix() {
    const groups = {};
    for (const svc of _services) {
      if (!groups[svc.group]) groups[svc.group] = [];
      groups[svc.group].push({ ...svc, result: _results[svc.id] || null });
    }
    return groups;
  }

  getStats() {
    const all = _services.map(s => _results[s.id]?.status || 'unknown');
    return {
      total:       all.length,
      ok:          all.filter(s => s === 'ok').length,
      critical:    all.filter(s => s === 'critical').length,
      warning:     all.filter(s => s === 'warning').length,
      maintenance: all.filter(s => s === 'maintenance').length,
      unknown:     all.filter(s => s === 'unknown' || s === 'unreachable').length,
    };
  }

  addService(svc) {
    const id = svc.id || `svc-${Date.now()}`;
    const newSvc = { id, interval: 60, criticality: 'warning', depends: [], ...svc };
    _services.push(newSvc);
    _results[id] = { status: 'unknown', latencyMs: null, message: 'Pas encore vérifié', checkedAt: null, history: [] };
    this._save();
    return newSvc;
  }

  updateService(id, data) {
    const idx = _services.findIndex(s => s.id === id);
    if (idx < 0) return null;
    _services[idx] = { ..._services[idx], ...data, id };
    this._save();
    return _services[idx];
  }

  deleteService(id) {
    _services = _services.filter(s => s.id !== id);
    delete _results[id];
    this._save();
  }

  checkNow(id) {
    const svc = _services.find(s => s.id === id);
    if (!svc) return Promise.reject(new Error('Service non trouvé'));
    return this._checkOne(svc).then(() => _results[id]);
  }

  // SSL expiry vérification pour tous les services HTTPS/TLS
  async getSslReport() {
    const tlsServices = _services.filter(s => ['https', 'imap', 'ssl'].includes(s.type));
    const results = await Promise.allSettled(
      tlsServices.map(s => this._checkSSLExpiry(s.host, s.port).then(r => ({ ...r, serviceId: s.id, name: s.name, host: s.host })))
    );
    return results.map(r => r.value || r.reason);
  }

  // Maintenance windows
  addMaintenance(m) {
    const id = `maint-${Date.now()}`;
    const entry = { id, ...m, createdAt: new Date().toISOString() };
    _maint.push(entry);
    this._save();
    return entry;
  }

  removeMaintenance(id) {
    _maint = _maint.filter(m => m.id !== id);
    this._save();
  }

  getMaintenanceWindows() { return _maint; }

  // Arbre de dépendances
  getDependencyTree() {
    const tree = {};
    for (const svc of _services) {
      tree[svc.id] = {
        id: svc.id, name: svc.name, group: svc.group,
        status: _results[svc.id]?.status || 'unknown',
        depends: svc.depends || [],
        dependents: _services.filter(s => s.depends?.includes(svc.id)).map(s => s.id),
      };
    }
    return tree;
  }
}

const engine = new ServiceChecksService();
engine.startLoop();

module.exports = engine;
