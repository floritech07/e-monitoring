'use strict';
/**
 * Collecteur Redfish DMTF v1.x — NexusMonitor v2
 * Équipements : HPE ProLiant (iLO 5/6), Dell PowerEdge (iDRAC 9)
 * Standard : DMTF Redfish DSP0266 v1.20
 *
 * Si iLO non joignable → simulation réaliste (POC Phase 0)
 */

const https = require('https');

// Agent HTTPS qui ignore les certificats auto-signés iLO/iDRAC
const AGENT = new https.Agent({ rejectUnauthorized: false });

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────

function redfishGet(baseUrl, path, user, pass) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
    const url  = `${baseUrl}${path}`;

    const req = https.get(url, {
      agent: AGENT,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept:        'application/json',
        OData_Version: '4.0',
      },
      timeout: 8000,
    }, (res) => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 206) {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
        } else {
          reject(new Error(`HTTP ${res.statusCode} for ${path}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ─── Profils des serveurs HPE SBEE ───────────────────────────────────────────

const SERVERS = [
  {
    id:      'esxi-01',
    name:    'ESXi-01-SBEE',
    host:    process.env.REDFISH_ESXi01_HOST || '192.168.10.11',
    user:    process.env.REDFISH_ESXi01_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi01_PASS || '',
    model:   'HPE ProLiant DL380 Gen10',
    iloGen:  5,
  },
  {
    id:      'esxi-02',
    name:    'ESXi-02-SBEE',
    host:    process.env.REDFISH_ESXi02_HOST || '192.168.10.12',
    user:    process.env.REDFISH_ESXi02_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi02_PASS || '',
    model:   'HPE ProLiant DL380 Gen10',
    iloGen:  5,
  },
  {
    id:      'esxi-03',
    name:    'ESXi-03-BACKUP',
    host:    process.env.REDFISH_ESXi03_HOST || '192.168.10.13',
    user:    process.env.REDFISH_ESXi03_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi03_PASS || '',
    model:   'HPE ProLiant DL380 Gen10',
    iloGen:  5,
  },
  {
    id:      'esxi-04',
    name:    'ESXi-04-SBEE',
    host:    process.env.REDFISH_ESXi04_HOST || '192.168.10.14',
    user:    process.env.REDFISH_ESXi04_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi04_PASS || '',
    model:   'HPE ProLiant DL380 Gen10',
    iloGen:  5,
  },
  {
    id:      'esxi-05',
    name:    'ESXi-05-SBEE',
    host:    process.env.REDFISH_ESXi05_HOST || '192.168.10.15',
    user:    process.env.REDFISH_ESXi05_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi05_PASS || '',
    model:   'HPE ProLiant DL380 Gen10',
    iloGen:  5,
  },
  {
    id:      'esxi-06',
    name:    'ESXi-06-SBEE',
    host:    process.env.REDFISH_ESXi06_HOST || '192.168.10.16',
    user:    process.env.REDFISH_ESXi06_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi06_PASS || '',
    model:   'HPE ProLiant DL380 Gen10',
    iloGen:  5,
  },
  {
    id:      'esxi-07',
    name:    'ESXi-07-SBEE',
    host:    process.env.REDFISH_ESXi07_HOST || '192.168.10.17',
    user:    process.env.REDFISH_ESXi07_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi07_PASS || '',
    model:   'HPE ProLiant DL360 Gen10',
    iloGen:  5,
  },
  {
    id:      'esxi08',
    name:    'ESXi-08-SBEE',
    host:    process.env.REDFISH_ESXi08_HOST || '192.168.10.18',
    user:    process.env.REDFISH_ESXi08_USER || 'administrator',
    pass:    process.env.REDFISH_ESXi08_PASS || '',
    model:   'HPE ProLiant DL360 Gen10',
    iloGen:  5,
  },
];

// ─── Collecte réelle via Redfish ─────────────────────────────────────────────

async function pollServer(srv) {
  if (!srv.pass) return simulateServer(srv);

  const base = `https://${srv.host}`;
  try {
    // 1. Système (CPU, RAM, état général)
    const system = await redfishGet(base, '/redfish/v1/Systems/1', srv.user, srv.pass);

    // 2. Thermique (température + ventilateurs)
    const thermal = await redfishGet(
      base,
      '/redfish/v1/Chassis/1/Thermal',
      srv.user,
      srv.pass
    );

    // 3. Alimentation (PSU)
    const power = await redfishGet(
      base,
      '/redfish/v1/Chassis/1/Power',
      srv.user,
      srv.pass
    );

    // 4. Stockage (HPE iLO SmartArray)
    let storage = null;
    try {
      storage = await redfishGet(
        base,
        '/redfish/v1/Systems/1/Storage',
        srv.user,
        srv.pass
      );
    } catch { /* stockage optionnel */ }

    return buildServerMetrics(srv, system, thermal, power, storage);
  } catch (err) {
    console.warn(`[Redfish] ${srv.name} inaccessible (${err.message}) → simulation`);
    return simulateServer(srv);
  }
}

function buildServerMetrics(srv, system, thermal, power, storage) {
  // Températures CPU
  const cpuTemps = (thermal.Temperatures || [])
    .filter(t => t.PhysicalContext === 'CPU' || t.Name?.includes('CPU'))
    .map(t => ({
      name:       t.Name,
      readingC:   t.ReadingCelsius,
      upperCritC: t.UpperThresholdCritical,
      upperFatalC: t.UpperThresholdFatal,
      status:     t.Status?.Health || 'OK',
    }));

  const inletTemp = (thermal.Temperatures || [])
    .find(t => t.PhysicalContext === 'Intake' || t.Name?.includes('Inlet'));

  // Ventilateurs
  const fans = (thermal.Fans || []).map(f => ({
    name:    f.Name || f.MemberID,
    rpm:     f.Reading,
    unit:    f.ReadingUnits || 'RPM',
    status:  f.Status?.Health || 'OK',
  }));

  // Alimentation
  const psus = (power.PowerSupplies || []).map(p => ({
    name:          p.Name || p.MemberID,
    status:        p.Status?.Health || 'Unknown',
    state:         p.Status?.State || 'Enabled',
    inputWatts:    p.PowerInputWatts,
    outputWatts:   p.LastPowerOutputWatts,
    capacityWatts: p.PowerCapacityWatts,
    firmwareVer:   p.FirmwareVersion,
    model:         p.Model,
    serialNumber:  p.SerialNumber,
  }));

  const totalConsumedWatts = power.PowerControl?.[0]?.PowerConsumedWatts || 0;
  const capacityWatts      = power.PowerControl?.[0]?.PowerCapacityWatts || 0;

  // RAM
  const memSummary = system.MemorySummary || {};
  const totalRamGB = memSummary.TotalSystemMemoryGiB || 0;
  const ramStatus  = memSummary.Status?.Health || 'OK';

  // CPU
  const procSummary = system.ProcessorSummary || {};

  // Stockage disques
  const drives = [];
  if (storage?.Members) {
    // Juste le compte — walk complet trop verbeux pour Phase 0
    drives.push({ count: storage['Members@odata.count'] || 0 });
  }

  return {
    id:        srv.id,
    name:      srv.name,
    host:      srv.host,
    source:    'redfish_live',
    timestamp: new Date().toISOString(),
    system: {
      model:          system.Model || srv.model,
      serialNumber:   system.SerialNumber,
      biosVersion:    system.BiosVersion,
      status:         system.Status?.Health || 'OK',
      powerState:     system.PowerState || 'On',
      indicatorLED:   system.IndicatorLED,
      manufacturer:   system.Manufacturer || 'HPE',
    },
    cpu: {
      model:      procSummary.Model,
      count:      procSummary.Count || 2,
      status:     procSummary.Status?.Health || 'OK',
    },
    memory: {
      totalGB:    totalRamGB,
      status:     ramStatus,
    },
    thermal: {
      inletTempC:  inletTemp?.ReadingCelsius,
      cpuTemps,
      fans,
      overallStatus: thermal.Status?.Health || 'OK',
    },
    power: {
      consumedWatts:  totalConsumedWatts,
      capacityWatts,
      psus,
      overallStatus:  power.Status?.Health || 'OK',
    },
    storage: { drives },
  };
}

// ─── Simulation réaliste HPE ProLiant ────────────────────────────────────────

function fluctuate(base, spread = 3) {
  return +(base + (Math.random() - 0.5) * spread * 2).toFixed(1);
}

function simulateServer(srv) {
  const isDL380 = srv.model?.includes('DL380');
  const cpuCount = isDL380 ? 2 : 1;
  const ramGB    = isDL380 ? 192 : 128;

  const cpuTemps = [];
  for (let i = 1; i <= cpuCount; i++) {
    const base = 55 + i * 3;
    cpuTemps.push({
      name:        `CPU ${i} Temp`,
      readingC:    fluctuate(base, 4),
      upperCritC:  80,
      upperFatalC: 90,
      status:      'OK',
    });
  }

  const fans = [];
  const fanNames = ['Fan 1', 'Fan 2', 'Fan 3', 'Fan 4', 'Fan 5', 'Fan 6'];
  for (const fn of fanNames) {
    fans.push({
      name:   fn,
      rpm:    fluctuate(6600, 300),
      unit:   'RPM',
      status: 'OK',
    });
  }

  const psuCount = isDL380 ? 2 : 1;
  const psus = [];
  for (let i = 1; i <= psuCount; i++) {
    psus.push({
      name:          `Power Supply ${i}`,
      status:        'OK',
      state:         'Enabled',
      inputWatts:    fluctuate(320, 20),
      outputWatts:   fluctuate(280, 15),
      capacityWatts: 800,
      firmwareVer:   '1.00',
      model:         'HPE 800W FS Plat Plus Hot Plug',
      serialNumber:  `5YLDH0BB${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    });
  }

  const consumedWatts = psus.reduce((s, p) => s + (p.inputWatts || 0), 0);

  return {
    id:        srv.id,
    name:      srv.name,
    host:      srv.host,
    source:    'simulation',
    timestamp: new Date().toISOString(),
    system: {
      model:        srv.model,
      serialNumber: `SN${srv.id.replace('-', '').toUpperCase()}2019`,
      biosVersion:  'U30 v2.62 (11/19/2023)',
      status:       'OK',
      powerState:   'On',
      indicatorLED: 'Off',
      manufacturer: 'HPE',
    },
    cpu: {
      model:  isDL380
        ? 'Intel Xeon Gold 6230R @ 2.10GHz'
        : 'Intel Xeon Silver 4215R @ 3.20GHz',
      count:  cpuCount,
      status: 'OK',
    },
    memory: {
      totalGB: ramGB,
      status:  'OK',
    },
    thermal: {
      inletTempC:   fluctuate(22, 2),
      cpuTemps,
      fans,
      overallStatus: 'OK',
    },
    power: {
      consumedWatts,
      capacityWatts: isDL380 ? 1600 : 800,
      psus,
      overallStatus: 'OK',
    },
    storage: {
      drives: [{ count: isDL380 ? 8 : 4, status: 'OK' }],
    },
  };
}

// ─── SMART disques — simulation ──────────────────────────────────────────────

function simulateSMART(srv) {
  const isDL380 = srv.model?.includes('DL380');
  const driveCount = isDL380 ? 8 : 4;
  const drives = [];
  for (let i = 0; i < driveCount; i++) {
    const hours = Math.floor(8760 + Math.random() * 12000);
    drives.push({
      slot:             i,
      name:             `Bay ${i + 1}`,
      model:            i < 2 ? 'HP EG1200JEHMD 1.2TB SAS' : 'HP EH0300JDYTH 300GB SAS',
      serialNumber:     `PHY${(100000 + Math.floor(Math.random() * 900000)).toString()}`,
      capacityGB:       i < 2 ? 1200 : 300,
      interfaceType:    'SAS',
      rotationRPM:      10000,
      status:           'OK',
      smartStatus:      Math.random() > 0.05 ? 'PASSED' : 'CAUTION',
      powerOnHours:     hours,
      reallocatedSectors: Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0,
      pendingSectors:   0,
      uncorrectableErrors: 0,
      temperatureC:     fluctuate(35, 5),
      firmwareRevision: '4.01',
    });
  }
  return { serverId: srv.id, serverName: srv.name, timestamp: new Date().toISOString(), drives };
}

// ─── RAID Controller / BBU ────────────────────────────────────────────────────

function simulateRAIDStatus(srv) {
  const isDL380 = srv.model?.includes('DL380');
  return {
    serverId:   srv.id,
    serverName: srv.name,
    timestamp:  new Date().toISOString(),
    controllers: [
      {
        id:          'smartarray-p408i-a',
        name:        'HPE Smart Array P408i-a SR Gen10',
        status:      'OK',
        firmwareVer: '1.65-0',
        cacheGB:     isDL380 ? 4 : 2,
        cacheStatus: 'OK',
        bbu: {
          present:        true,
          status:         'OK',
          chargePercent:  fluctuate(100, 3),
          type:           'FBWC (Flash-Backed Write Cache)',
          capacitorStatus: 'OK',
          chargeWarning:  false,
        },
        logicalDrives: [
          {
            id:          'ld-0',
            name:        'Logical Drive 0',
            raidLevel:   isDL380 ? 'RAID 5' : 'RAID 10',
            status:      'OK',
            capacityGB:  isDL380 ? 3300 : 550,
            driveCount:  isDL380 ? 8 : 4,
            stripeSize:  256,
          },
        ],
      },
    ],
  };
}

// ─── SEL (System Event Log) — simulation ─────────────────────────────────────

const _SEL_TEMPLATES = [
  { severity: 'info',     sensor: 'Power Supply',    message: 'Power supply redundancy restored' },
  { severity: 'info',     sensor: 'System Board',    message: 'POST completed successfully' },
  { severity: 'warning',  sensor: 'Temperature',     message: 'Ambient temperature above upper non-critical threshold' },
  { severity: 'info',     sensor: 'Fan',             message: 'Fan redundancy has been degraded' },
  { severity: 'info',     sensor: 'Memory',          message: 'Memory ECC correctable error logged (DIMM A2)' },
  { severity: 'critical', sensor: 'Drive',           message: 'Drive failure predicted on Bay 3 — backup recommended' },
  { severity: 'info',     sensor: 'Network',         message: 'NIC team failover occurred — active adapter changed' },
  { severity: 'warning',  sensor: 'Power',           message: 'Input power outside acceptable range on supply 1' },
];

function simulateSEL(srv) {
  const events = [];
  const count = 20 + Math.floor(Math.random() * 30);
  for (let i = 0; i < count; i++) {
    const tpl = _SEL_TEMPLATES[Math.floor(Math.random() * _SEL_TEMPLATES.length)];
    const msAgo = Math.floor(Math.random() * 7 * 86_400_000);
    events.push({
      id:        i + 1,
      timestamp: new Date(Date.now() - msAgo).toISOString(),
      severity:  tpl.severity,
      sensor:    tpl.sensor,
      message:   tpl.message,
      source:    srv.name,
    });
  }
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { serverId: srv.id, serverName: srv.name, timestamp: new Date().toISOString(), events, total: events.length };
}

// ─── API publique ─────────────────────────────────────────────────────────────

let _cache = {};
let _lastCollection = 0;
const CACHE_TTL_MS = 60_000;   // Redfish polling toutes les 60s (équipements sensibles)

async function collectAllServers() {
  const now = Date.now();
  if (now - _lastCollection < CACHE_TTL_MS && Object.keys(_cache).length) {
    return _cache;
  }

  const results = await Promise.allSettled(SERVERS.map(srv => pollServer(srv)));
  const data = {};

  for (let i = 0; i < SERVERS.length; i++) {
    const srv = SERVERS[i];
    const r   = results[i];
    if (r.status === 'fulfilled') {
      data[srv.id] = r.value;
    } else {
      console.error(`[Redfish] Erreur ${srv.name}: ${r.reason?.message}`);
      data[srv.id] = simulateServer(srv);
    }
  }

  _cache = data;
  _lastCollection = now;
  return data;
}

async function getServer(id) {
  const all = await collectAllServers();
  return all[id] || null;
}

async function getServerThermal(id) {
  const srv = SERVERS.find(s => s.id === id);
  if (!srv) return null;
  const data = await pollServer(srv);
  return data.thermal;
}

async function getServerPower(id) {
  const srv = SERVERS.find(s => s.id === id);
  if (!srv) return null;
  const data = await pollServer(srv);
  return data.power;
}

async function getServerSMART(id) {
  const srv = SERVERS.find(s => s.id === id);
  if (!srv) return null;
  return simulateSMART(srv);
}

async function getServerRAID(id) {
  const srv = SERVERS.find(s => s.id === id);
  if (!srv) return null;
  return simulateRAIDStatus(srv);
}

async function getServerSEL(id) {
  const srv = SERVERS.find(s => s.id === id);
  if (!srv) return null;
  return simulateSEL(srv);
}

module.exports = {
  collectAllServers,
  getServer,
  getServerThermal,
  getServerPower,
  getServerSMART,
  getServerRAID,
  getServerSEL,
  SERVERS,
};
