'use strict';
/**
 * CMDB Service — NexusMonitor v2
 * Phase 0 : persistance JSON (data/cmdb.json)
 * Phase 1 : migration vers PostgreSQL (schéma dans sql/init.sql)
 *
 * Gère l'inventaire complet des CI (Configuration Items) SBEE :
 * serveurs, switches, UPS, VMs, clusters, sites, CRAC, PDU, baies
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, '..', 'data');
const CMDB_FILE  = path.join(DATA_DIR, 'cmdb.json');

// ─── Données initiales SBEE ──────────────────────────────────────────────────

const INITIAL_CMDB = {
  version: '0.1',
  updatedAt: new Date().toISOString(),
  items: [
    // ── Site ──
    {
      id: 'site-sbee-cotonou',
      name: 'SBEE — Salle Serveur Cotonou',
      type: 'site',
      subtype: 'datacenter',
      status: 'active',
      location: 'Cotonou, Bénin',
      manufacturer: 'SBEE',
      model: 'Salle Serveur Principale DSITD',
      tags: ['production', 'primaire'],
      customAttrs: { tier: 'Tier II', surface_m2: 45, racks_count: 4 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },

    // ── Racks ──
    {
      id: 'rack-a',
      name: 'Rack A — Serveurs Production',
      type: 'rack',
      status: 'active',
      parentId: 'site-sbee-cotonou',
      location: 'Rangée 1, Position A',
      manufacturer: 'APC',
      model: 'NetShelter SX 42U',
      customAttrs: { units: 42, occupiedUnits: 18, powerKW: 5 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rack-b',
      name: 'Rack B — Stockage & Backup',
      type: 'rack',
      status: 'active',
      parentId: 'site-sbee-cotonou',
      location: 'Rangée 1, Position B',
      manufacturer: 'APC',
      model: 'NetShelter SX 42U',
      customAttrs: { units: 42, occupiedUnits: 14, powerKW: 3.5 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },

    // ── Serveurs ESXi ──
    {
      id: 'esxi-01',
      name: 'ESXi-01-SBEE',
      type: 'server',
      subtype: 'esxi_host',
      status: 'active',
      ipAddress: '192.168.10.11',
      hostname: 'esxi-01.sbee.bj',
      parentId: 'rack-a',
      rackId: 'rack-a',
      rackUnit: 1,
      rackHeight: 2,
      manufacturer: 'HPE',
      model: 'ProLiant DL380 Gen10',
      serialNumber: 'CZJ9290000',
      firmwareVer: 'iLO 5 v2.82',
      purchaseDate: '2022-03-15',
      warrantyEnd: '2027-03-15',
      eolDate: '2029-12-31',
      supplier: 'HPE Bénin / Maroc',
      supportLevel: 'silver',
      contractRef: 'HPE-SBEE-2022-001',
      tags: ['production', 'cluster-prod', 'esxi'],
      customAttrs: {
        cpu_model: 'Intel Xeon Gold 6230R',
        cpu_sockets: 2,
        cpu_cores: 26,
        ram_gb: 192,
        ilo_ip: '192.168.10.111',
        cluster: 'cl-prod',
      },
      createdAt: '2022-03-20T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'esxi-02',
      name: 'ESXi-02-SBEE',
      type: 'server',
      subtype: 'esxi_host',
      status: 'active',
      ipAddress: '192.168.10.12',
      hostname: 'esxi-02.sbee.bj',
      parentId: 'rack-a',
      rackId: 'rack-a',
      rackUnit: 3,
      rackHeight: 2,
      manufacturer: 'HPE',
      model: 'ProLiant DL380 Gen10',
      serialNumber: 'CZJ9290001',
      firmwareVer: 'iLO 5 v2.82',
      purchaseDate: '2022-03-15',
      warrantyEnd: '2027-03-15',
      eolDate: '2029-12-31',
      supplier: 'HPE Bénin / Maroc',
      supportLevel: 'silver',
      contractRef: 'HPE-SBEE-2022-001',
      tags: ['production', 'cluster-prod', 'esxi'],
      customAttrs: {
        cpu_model: 'Intel Xeon Gold 6230R',
        cpu_sockets: 2,
        cpu_cores: 26,
        ram_gb: 192,
        ilo_ip: '192.168.10.112',
        cluster: 'cl-prod',
      },
      createdAt: '2022-03-20T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'esxi-03',
      name: 'ESXi-03-SBEE',
      type: 'server',
      subtype: 'esxi_host',
      status: 'active',
      ipAddress: '192.168.10.13',
      hostname: 'esxi-03.sbee.bj',
      parentId: 'rack-b',
      rackId: 'rack-b',
      rackUnit: 1,
      rackHeight: 2,
      manufacturer: 'HPE',
      model: 'ProLiant DL360 Gen10',
      serialNumber: 'CZJ9290002',
      firmwareVer: 'iLO 5 v2.80',
      purchaseDate: '2022-03-15',
      warrantyEnd: '2027-03-15',
      eolDate: '2029-12-31',
      supplier: 'HPE Bénin / Maroc',
      supportLevel: 'silver',
      contractRef: 'HPE-SBEE-2022-001',
      tags: ['backup', 'cluster-backup', 'esxi'],
      customAttrs: {
        cpu_model: 'Intel Xeon Silver 4215R',
        cpu_sockets: 1,
        cpu_cores: 8,
        ram_gb: 128,
        ilo_ip: '192.168.10.113',
        cluster: 'cl-backup',
      },
      createdAt: '2022-03-20T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },

    // ── Switches ──
    {
      id: 'sw-core-01',
      name: 'SW-CORE-01',
      type: 'switch',
      subtype: 'core_switch',
      status: 'active',
      ipAddress: '192.168.10.1',
      hostname: 'sw-core-01.sbee.bj',
      parentId: 'rack-a',
      rackId: 'rack-a',
      rackUnit: 10,
      rackHeight: 1,
      manufacturer: 'HPE',
      model: 'Aruba 2930F 48G 4SFP+',
      serialNumber: 'CN80KBM007',
      firmwareVer: 'WC.16.11.0010',
      purchaseDate: '2021-06-01',
      warrantyEnd: '2026-06-01',
      tags: ['production', 'core-network', 'mgmt'],
      customAttrs: {
        ports: 48,
        uplink_ports: 4,
        vlan_count: 6,
        snmp_community: 'nexusv3',
        snmp_version: 3,
      },
      createdAt: '2021-06-15T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sw-access-01',
      name: 'SW-ACCESS-01',
      type: 'switch',
      subtype: 'access_switch',
      status: 'active',
      ipAddress: '192.168.10.2',
      parentId: 'rack-a',
      rackId: 'rack-a',
      rackUnit: 11,
      rackHeight: 1,
      manufacturer: 'HPE',
      model: 'Aruba 2530-24G',
      serialNumber: 'CN81KBM008',
      firmwareVer: 'YA.16.10.0019',
      purchaseDate: '2021-06-01',
      warrantyEnd: '2026-06-01',
      tags: ['access-network'],
      customAttrs: { ports: 24, vlan_count: 4 },
      createdAt: '2021-06-15T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },

    // ── UPS ──
    {
      id: 'ups-sukam-01',
      name: 'UPS-SUKAM-01',
      type: 'ups',
      subtype: 'online_ups',
      status: 'active',
      ipAddress: '192.168.10.50',
      parentId: 'rack-a',
      rackId: 'rack-a',
      rackUnit: 14,
      rackHeight: 2,
      manufacturer: 'Su-Kam',
      model: 'Falcon+ 10KVA',
      serialNumber: 'SK2021001',
      purchaseDate: '2021-01-10',
      warrantyEnd: '2024-01-10',
      eolDate: '2026-01-10',
      tags: ['ups', 'rack-a', 'critical'],
      customAttrs: {
        capacity_kva: 10,
        battery_type: 'VRLA AGM',
        battery_count: 8,
        autonomy_min_full_load: 45,
        last_battery_change: '2023-06-15',
        snmp_enabled: true,
      },
      createdAt: '2021-01-15T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ups-sukam-02',
      name: 'UPS-SUKAM-02',
      type: 'ups',
      subtype: 'online_ups',
      status: 'active',
      ipAddress: '192.168.10.51',
      parentId: 'rack-b',
      rackId: 'rack-b',
      rackUnit: 14,
      rackHeight: 2,
      manufacturer: 'Su-Kam',
      model: 'Falcon+ 6KVA',
      serialNumber: 'SK2021002',
      purchaseDate: '2021-01-10',
      warrantyEnd: '2024-01-10',
      eolDate: '2026-01-10',
      tags: ['ups', 'rack-b'],
      customAttrs: { capacity_kva: 6, battery_type: 'VRLA AGM', snmp_enabled: true },
      createdAt: '2021-01-15T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },

    // ── Stockage ──
    {
      id: 'nas-synology-01',
      name: 'NAS-SYNOLOGY-01',
      type: 'storage',
      subtype: 'nas',
      status: 'active',
      ipAddress: '192.168.10.60',
      parentId: 'rack-b',
      rackId: 'rack-b',
      rackUnit: 5,
      rackHeight: 2,
      manufacturer: 'Synology',
      model: 'RackStation RS3621xs+',
      serialNumber: 'SY2022NAS01',
      purchaseDate: '2022-05-01',
      warrantyEnd: '2025-05-01',
      tags: ['storage', 'nas', 'nfs', 'backup-target'],
      customAttrs: {
        capacity_tb: 72,
        protocol: ['NFS', 'iSCSI', 'SMB'],
        raid_type: 'RAID 6',
        drives_count: 12,
        dsm_version: '7.2',
      },
      createdAt: '2022-05-10T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'san-hpe-msa-01',
      name: 'SAN-HPE-MSA-01',
      type: 'storage',
      subtype: 'san',
      status: 'active',
      ipAddress: '192.168.10.61',
      parentId: 'rack-b',
      rackId: 'rack-b',
      rackUnit: 7,
      rackHeight: 2,
      manufacturer: 'HPE',
      model: 'MSA 2060 SAS',
      serialNumber: 'SN2060MSA001',
      purchaseDate: '2022-03-15',
      warrantyEnd: '2027-03-15',
      tags: ['storage', 'san', 'fc', 'production'],
      customAttrs: {
        capacity_tb: 24,
        protocol: ['FC', 'iSCSI'],
        controllers: 2,
        drives_count: 12,
        drives_type: 'SAS 10K',
      },
      createdAt: '2022-03-20T00:00:00Z',
      updatedAt: new Date().toISOString(),
    },
  ],
};

// ─── Persistance ──────────────────────────────────────────────────────────────

function _load() {
  try {
    const raw = fs.readFileSync(CMDB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function _save(db) {
  db.updatedAt = new Date().toISOString();
  const tmp = CMDB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, CMDB_FILE);
}

function _getDB() {
  let db = _load();
  if (!db) {
    db = INITIAL_CMDB;
    _save(db);
  }
  return db;
}

function _generateId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── API CMDB ────────────────────────────────────────────────────────────────

function getAllItems(filter = {}) {
  const db = _getDB();
  let items = db.items;

  if (filter.type)    items = items.filter(i => i.type === filter.type);
  if (filter.subtype) items = items.filter(i => i.subtype === filter.subtype);
  if (filter.status)  items = items.filter(i => i.status === filter.status);
  if (filter.tag)     items = items.filter(i => i.tags?.includes(filter.tag));
  if (filter.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.ipAddress?.includes(q) ||
      i.model?.toLowerCase().includes(q) ||
      i.serialNumber?.toLowerCase().includes(q)
    );
  }

  return items;
}

function getItem(id) {
  const db = _getDB();
  return db.items.find(i => i.id === id) || null;
}

function getItemChildren(parentId) {
  const db = _getDB();
  return db.items.filter(i => i.parentId === parentId);
}

function createItem(data) {
  const db = _getDB();
  const item = {
    id:        data.id || _generateId(data.type || 'item'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status:    'active',
    tags:      [],
    customAttrs: {},
    ...data,
  };
  db.items.push(item);
  _save(db);
  return item;
}

function updateItem(id, updates) {
  const db   = _getDB();
  const idx  = db.items.findIndex(i => i.id === id);
  if (idx === -1) return null;

  db.items[idx] = {
    ...db.items[idx],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  _save(db);
  return db.items[idx];
}

function deleteItem(id) {
  const db  = _getDB();
  const idx = db.items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  db.items.splice(idx, 1);
  _save(db);
  return true;
}

function getStats() {
  const db    = _getDB();
  const items = db.items;

  const byType = {};
  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
  }

  const warrantyExpiring = items.filter(i => {
    if (!i.warrantyEnd) return false;
    const daysLeft = (new Date(i.warrantyEnd) - Date.now()) / 86400000;
    return daysLeft >= 0 && daysLeft <= 90;
  });

  const eolApproaching = items.filter(i => {
    if (!i.eolDate) return false;
    const daysLeft = (new Date(i.eolDate) - Date.now()) / 86400000;
    return daysLeft >= 0 && daysLeft <= 365;
  });

  return {
    total:             items.length,
    active:            items.filter(i => i.status === 'active').length,
    maintenance:       items.filter(i => i.status === 'maintenance').length,
    decommissioned:    items.filter(i => i.status === 'decommissioned').length,
    byType,
    warrantyExpiringSoon: warrantyExpiring.length,
    eolApproachingSoon:   eolApproaching.length,
  };
}

// ─── Relations CI ─────────────────────────────────────────────────────────────

function getRelationTree(rootId) {
  const db     = _getDB();
  const itemMap = Object.fromEntries(db.items.map(i => [i.id, i]));

  function buildNode(id) {
    const item = itemMap[id];
    if (!item) return null;
    const children = db.items
      .filter(i => i.parentId === id)
      .map(i => buildNode(i.id))
      .filter(Boolean);
    return { ...item, children };
  }

  return buildNode(rootId);
}

module.exports = {
  getAllItems,
  getItem,
  getItemChildren,
  createItem,
  updateItem,
  deleteItem,
  getStats,
  getRelationTree,
};
