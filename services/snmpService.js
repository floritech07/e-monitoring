'use strict';
/**
 * Collecteur SNMP v3 — NexusMonitor v2
 * Équipements : UPS Su-Kam, Switches HPE Aruba, CRAC, PDU
 * Protocole : SNMP v3, authPriv, SHA-256, AES-256
 *
 * Dépendance : npm install net-snmp
 * Si net-snmp absent → mode simulation automatique (POC Phase 0)
 */

let snmp;
try {
  snmp = require('net-snmp');
} catch {
  snmp = null;
}

// ─── OID catalogue ────────────────────────────────────────────────────────────

const OID = {
  // RFC 1213 — Système
  sysDescr:    '1.3.6.1.2.1.1.1.0',
  sysUpTime:   '1.3.6.1.2.1.1.3.0',
  sysName:     '1.3.6.1.2.1.1.5.0',

  // RFC 2863 — Interfaces
  ifNumber:         '1.3.6.1.2.1.2.1.0',
  ifDescr:          '1.3.6.1.2.1.2.2.1.2',    // table
  ifOperStatus:     '1.3.6.1.2.1.2.2.1.8',    // table : 1=up, 2=down
  ifAdminStatus:    '1.3.6.1.2.1.2.2.1.7',
  ifInOctets:       '1.3.6.1.2.1.2.2.1.10',   // table
  ifOutOctets:      '1.3.6.1.2.1.2.2.1.16',   // table
  ifInErrors:       '1.3.6.1.2.1.2.2.1.14',
  ifOutErrors:      '1.3.6.1.2.1.2.2.1.20',
  ifSpeed:          '1.3.6.1.2.1.2.2.1.5',

  // RFC 1628 — UPS MIB
  upsIdentManufacturer: '1.3.6.1.2.1.33.1.1.1.0',
  upsIdentModel:        '1.3.6.1.2.1.33.1.1.2.0',
  upsBatteryStatus:     '1.3.6.1.2.1.33.1.2.1.0',  // 1=unknown,2=normal,3=low,4=depleted
  upsSecondsOnBattery:  '1.3.6.1.2.1.33.1.2.2.0',
  upsEstimatedMinutes:  '1.3.6.1.2.1.33.1.2.3.0',
  upsEstimatedCharge:   '1.3.6.1.2.1.33.1.2.4.0',  // % charge
  upsBatteryVoltage:    '1.3.6.1.2.1.33.1.2.5.0',  // 0.1V
  upsBatteryTemperature:'1.3.6.1.2.1.33.1.2.7.0',  // °C
  upsInputVoltage:      '1.3.6.1.2.1.33.1.3.3.1.3',
  upsInputFrequency:    '1.3.6.1.2.1.33.1.3.3.1.2',
  upsOutputVoltage:     '1.3.6.1.2.1.33.1.4.4.1.2',
  upsOutputLoad:        '1.3.6.1.2.1.33.1.4.4.1.5',  // % charge sortie
  upsOutputCurrent:     '1.3.6.1.2.1.33.1.4.4.1.3',
  upsAlarmsPresent:     '1.3.6.1.2.1.33.1.6.1.0',

  // HPE Aruba — CPU (ENTITY-MIB / HPE-specific)
  hpSysCpuUtil:         '1.3.6.1.4.1.11.2.14.11.5.1.9.6.1.0',
  hpSysMemFreeBytes:    '1.3.6.1.4.1.11.2.14.11.5.1.9.6.3.0',
  hpSysMemTotalBytes:   '1.3.6.1.4.1.11.2.14.11.5.1.9.6.2.0',

  // ENTITY-MIB — Températures
  entPhysicalDescr:     '1.3.6.1.2.1.47.1.1.1.1.2',
  entSensorValue:       '1.3.6.1.4.1.9.9.91.1.1.1.1.4',  // Cisco — pour référence
};

// ─── Profils SNMP v3 depuis environnement ────────────────────────────────────

function buildV3Options(authKey, privKey, user) {
  if (!snmp) return null;
  return {
    version: snmp.Version3,
    engineID: 'NexusMonitorSBEE',
    backwardsCompatible: false,
  };
}

function buildSecurityOptions(user, authKey, privKey) {
  if (!snmp) return null;
  return {
    name: user,
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha256,
    authKey,
    privProtocol: snmp.PrivProtocols.aes256b,
    privKey,
  };
}

// ─── Session SNMP v3 ─────────────────────────────────────────────────────────

function createSession(host, user, authKey, privKey) {
  if (!snmp) return null;
  const options = buildV3Options(authKey, privKey, user);
  const secOpts = buildSecurityOptions(user, authKey, privKey);
  try {
    return snmp.createV3Session(host, secOpts, options);
  } catch (err) {
    console.error(`[SNMP] Impossible de créer session vers ${host}: ${err.message}`);
    return null;
  }
}

function closeSession(session) {
  if (session) try { session.close(); } catch {}
}

// ─── GET OIDs ────────────────────────────────────────────────────────────────

function snmpGet(session, oids) {
  return new Promise((resolve, reject) => {
    if (!session) return reject(new Error('No session'));
    session.get(oids, (err, varbinds) => {
      if (err) return reject(err);
      const result = {};
      for (const vb of varbinds) {
        if (snmp.isVarbindError(vb)) {
          result[vb.oid] = null;
        } else {
          result[vb.oid] = vb.value;
        }
      }
      resolve(result);
    });
  });
}

// ─── UPS Su-Kam polling ──────────────────────────────────────────────────────

async function pollUPS(deviceId = 'ups-01') {
  const cfg = {
    host:    process.env.SNMP_UPS_HOST,
    user:    process.env.SNMP_UPS_USER,
    authKey: process.env.SNMP_UPS_AUTH_KEY,
    privKey: process.env.SNMP_UPS_PRIV_KEY,
  };

  if (!cfg.host || !snmp) {
    return simulateUPS(deviceId);
  }

  const session = createSession(cfg.host, cfg.user, cfg.authKey, cfg.privKey);
  if (!session) return simulateUPS(deviceId);

  const oids = [
    OID.upsIdentManufacturer,
    OID.upsIdentModel,
    OID.upsBatteryStatus,
    OID.upsSecondsOnBattery,
    OID.upsEstimatedMinutes,
    OID.upsEstimatedCharge,
    OID.upsBatteryTemperature,
    OID.upsInputVoltage,
    OID.upsOutputVoltage,
    OID.upsOutputLoad,
    OID.upsAlarmsPresent,
    OID.sysUpTime,
  ];

  try {
    const raw = await snmpGet(session, oids);

    const batteryStatusMap = { 1: 'unknown', 2: 'normal', 3: 'low', 4: 'depleted' };
    const batteryStatus = batteryStatusMap[raw[OID.upsBatteryStatus]] || 'unknown';
    const secondsOnBattery = Number(raw[OID.upsSecondsOnBattery]) || 0;
    const inputStatus = secondsOnBattery > 0 ? 'on_battery' : 'on_line';

    return {
      id: deviceId,
      host: cfg.host,
      source: 'snmp_live',
      timestamp: new Date().toISOString(),
      status: {
        input: inputStatus,
        battery: batteryStatus,
        alarmsCount: Number(raw[OID.upsAlarmsPresent]) || 0,
      },
      battery: {
        chargePct:        Number(raw[OID.upsEstimatedCharge]) || 0,
        autonomyMin:      Number(raw[OID.upsEstimatedMinutes]) || 0,
        secondsOnBattery,
        temperatureC:     Number(raw[OID.upsBatteryTemperature]) || 0,
      },
      input: {
        voltageV:   (Number(raw[OID.upsInputVoltage]) || 0) / 10,
        status:     inputStatus,
      },
      output: {
        voltageV:   (Number(raw[OID.upsOutputVoltage]) || 0) / 10,
        loadPct:    Number(raw[OID.upsOutputLoad]) || 0,
      },
      system: {
        manufacturer: raw[OID.upsIdentManufacturer]?.toString() || 'Su-Kam',
        model:        raw[OID.upsIdentModel]?.toString() || 'Falcon+',
        uptimeS:      Math.floor((Number(raw[OID.sysUpTime]) || 0) / 100),
      },
    };
  } catch (err) {
    console.error(`[SNMP] Erreur polling UPS ${cfg.host}: ${err.message}`);
    return simulateUPS(deviceId);
  } finally {
    closeSession(session);
  }
}

// ─── Switch HPE Aruba polling ────────────────────────────────────────────────

async function pollSwitch(deviceId = 'sw-01') {
  const cfg = {
    host:    process.env.SNMP_SW_HOST,
    user:    process.env.SNMP_SW_USER,
    authKey: process.env.SNMP_SW_AUTH_KEY,
    privKey: process.env.SNMP_SW_PRIV_KEY,
  };

  if (!cfg.host || !snmp) {
    return simulateSwitch(deviceId);
  }

  const session = createSession(cfg.host, cfg.user, cfg.authKey, cfg.privKey);
  if (!session) return simulateSwitch(deviceId);

  const oids = [
    OID.sysDescr,
    OID.sysUpTime,
    OID.sysName,
    OID.ifNumber,
    OID.hpSysCpuUtil,
    OID.hpSysMemFreeBytes,
    OID.hpSysMemTotalBytes,
  ];

  try {
    const raw = await snmpGet(session, oids);

    const memTotal = Number(raw[OID.hpSysMemTotalBytes]) || 1;
    const memFree  = Number(raw[OID.hpSysMemFreeBytes]) || 0;

    return {
      id: deviceId,
      host: cfg.host,
      source: 'snmp_live',
      timestamp: new Date().toISOString(),
      system: {
        name:     raw[OID.sysName]?.toString() || cfg.host,
        descr:    raw[OID.sysDescr]?.toString() || '',
        uptimeS:  Math.floor((Number(raw[OID.sysUpTime]) || 0) / 100),
        portCount: Number(raw[OID.ifNumber]) || 0,
      },
      resources: {
        cpuPct:    Number(raw[OID.hpSysCpuUtil]) || 0,
        ramPct:    Math.round((1 - memFree / memTotal) * 100),
        ramTotalMB: Math.round(memTotal / 1024 / 1024),
        ramFreeMB:  Math.round(memFree / 1024 / 1024),
      },
      // Interfaces récupérées séparément (table walk)
      interfaces: [],
    };
  } catch (err) {
    console.error(`[SNMP] Erreur polling switch ${cfg.host}: ${err.message}`);
    return simulateSwitch(deviceId);
  } finally {
    closeSession(session);
  }
}

// ─── Simulation réaliste Phase 0 (sans équipement réel) ─────────────────────

function fluctuate(base, spread = 5) {
  return Math.round(base + (Math.random() - 0.5) * spread * 2);
}

function simulateUPS(id) {
  const chargePct     = fluctuate(87, 3);
  const inputOk       = Math.random() > 0.03;   // 3% chance coupure secteur simulée
  const loadPct       = fluctuate(42, 8);
  const batteryStatus = chargePct > 50 ? 'normal' : chargePct > 20 ? 'low' : 'depleted';

  return {
    id,
    host: process.env.SNMP_UPS_HOST || '192.168.10.50',
    source: 'simulation',
    timestamp: new Date().toISOString(),
    status: {
      input:        inputOk ? 'on_line' : 'on_battery',
      battery:      batteryStatus,
      alarmsCount:  inputOk ? 0 : 1,
    },
    battery: {
      chargePct,
      autonomyMin:      Math.round(chargePct * 1.2),   // ~1h12 à pleine charge
      secondsOnBattery: inputOk ? 0 : fluctuate(120, 60),
      temperatureC:     fluctuate(27, 2),
    },
    input: {
      voltageV:  inputOk ? fluctuate(220, 5) : 0,
      status:    inputOk ? 'on_line' : 'on_battery',
    },
    output: {
      voltageV: fluctuate(220, 3),
      loadPct,
    },
    system: {
      manufacturer: 'Su-Kam',
      model:        'Falcon+ 10KVA',
      uptimeS:      Math.floor(Date.now() / 1000) % (86400 * 30),
    },
  };
}

function simulateSwitch(id) {
  const portCount = 48;
  const interfaces = [];
  const upPorts    = [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 24, 25, 26, 27, 48]; // ports actifs SBEE

  for (let i = 1; i <= portCount; i++) {
    const isUp      = upPorts.includes(i);
    const speedMbps = i >= 47 ? 1000 : (i >= 25 ? 1000 : 100); // uplinks Gi
    const rxMbps    = isUp ? fluctuate(speedMbps * 0.2, speedMbps * 0.1) : 0;
    const txMbps    = isUp ? fluctuate(speedMbps * 0.15, speedMbps * 0.08) : 0;

    interfaces.push({
      index:     i,
      name:      i >= 47 ? `GigabitEthernet${i - 46}` : `FastEthernet0/${i}`,
      status:    isUp ? 'up' : 'down',
      speedMbps,
      rxMbps:    Math.max(0, rxMbps),
      txMbps:    Math.max(0, txMbps),
      rxErrors:  0,
      txErrors:  0,
    });
  }

  return {
    id,
    host: process.env.SNMP_SW_HOST || '192.168.10.1',
    source: 'simulation',
    timestamp: new Date().toISOString(),
    system: {
      name:      id === 'sw-core-01' ? 'SW-CORE-01-SBEE' : 'SW-ACCESS-01-SBEE',
      descr:     'HPE Aruba 2930F 48G 4SFP+ Switch',
      uptimeS:   Math.floor(Date.now() / 1000) % (86400 * 90),
      portCount,
    },
    resources: {
      cpuPct:    fluctuate(12, 5),
      ramPct:    fluctuate(35, 8),
      ramTotalMB: 512,
      ramFreeMB:  Math.round(512 * (1 - 0.35)),
    },
    interfaces,
  };
}

// ─── Collect ALL — appel unique pour tous les équipements configurés ─────────

const DEVICES = [
  { type: 'ups',    id: 'ups-sukam-01', fn: () => pollUPS('ups-sukam-01') },
  { type: 'ups',    id: 'ups-sukam-02', fn: () => simulateUPS('ups-sukam-02') },
  { type: 'switch', id: 'sw-core-01',   fn: () => pollSwitch('sw-core-01') },
  { type: 'switch', id: 'sw-access-01', fn: () => simulateSwitch('sw-access-01') },
];

let _cache = {};
let _lastCollection = 0;
const CACHE_TTL_MS = 30_000;   // rafraîchir toutes les 30s

async function collectAll() {
  const now = Date.now();
  if (now - _lastCollection < CACHE_TTL_MS && Object.keys(_cache).length) {
    return _cache;
  }

  const results = await Promise.allSettled(DEVICES.map(d => d.fn()));
  const data = {};

  for (let i = 0; i < DEVICES.length; i++) {
    const d = DEVICES[i];
    const r = results[i];
    if (r.status === 'fulfilled') {
      data[d.id] = { type: d.type, ...r.value };
    } else {
      console.error(`[SNMP] Échec collecte ${d.id}: ${r.reason?.message}`);
      data[d.id] = { type: d.type, id: d.id, error: r.reason?.message };
    }
  }

  _cache = data;
  _lastCollection = now;
  return data;
}

// ─── LLDP/CDP, VPN, WAN SLA Simulation ───────────────────────────────────────

function getNetworkDiscovery() {
  return {
    lldp: [
      { localPort: 'GigabitEthernet1/1', remoteDevice: 'ESXi-01-SBEE', remotePort: 'vmnic0', capabilities: 'Station Only' },
      { localPort: 'GigabitEthernet1/2', remoteDevice: 'ESXi-02-SBEE', remotePort: 'vmnic0', capabilities: 'Station Only' },
      { localPort: 'GigabitEthernet1/3', remoteDevice: 'ESXi-03-BACKUP', remotePort: 'vmnic0', capabilities: 'Station Only' },
    ],
    cdp: [
      { localPort: 'FastEthernet0/24', remoteDevice: 'Cisco-Router-WAN', remotePort: 'GigabitEthernet0/1', capabilities: 'Router, Switch' }
    ]
  };
}

function getVPNTunnels() {
  return [
    { id: 'vpn-parakou', name: 'VPN_IPSec_Parakou', peerIp: '197.xxx.xxx.10', status: 'Up', uptimeSeconds: 345600, rxBytes: 104857600, txBytes: 52428800 },
    { id: 'vpn-porto', name: 'VPN_IPSec_PortoNovo', peerIp: '197.xxx.xxx.20', status: 'Up', uptimeSeconds: 259200, rxBytes: 83886080, txBytes: 41943040 },
    { id: 'vpn-natitingou', name: 'VPN_IPSec_Natitingou', peerIp: '197.xxx.xxx.30', status: 'Down', uptimeSeconds: 0, rxBytes: 0, txBytes: 0 }
  ];
}

function getWANSLA() {
  return [
    { linkId: 'wan-isp1', isp: 'Benin Telecom', status: 'Active', latencyMs: fluctuate(15, 3), jitterMs: fluctuate(2, 1), packetLossPct: 0.1, bandwidthMbps: 100, utilizationPct: fluctuate(45, 10) },
    { linkId: 'wan-isp2', isp: 'Isocel', status: 'Active', latencyMs: fluctuate(25, 5), jitterMs: fluctuate(4, 2), packetLossPct: 0.5, bandwidthMbps: 50, utilizationPct: fluctuate(20, 5) }
  ];
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  pollUPS,
  pollSwitch,
  collectAll,
  simulateUPS,
  simulateSwitch,
  getNetworkDiscovery,
  getVPNTunnels,
  getWANSLA,
  OID,
};
