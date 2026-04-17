/**
 * datacenterService.js
 *
 * Source de vérité de la topologie physique de la salle serveur SBEE :
 * Datacenter → Room → Rack → Device (monté sur une plage d'unités U).
 *
 * Persistance : fichier JSON atomique dans data/ (même pattern que storageService).
 * Destiné à alimenter le viewer 3D (pages/Datacenter3D) et, plus tard, les
 * adaptateurs hyperviseur/BMC qui viendront enrichir chaque device.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE     = path.join(DATA_DIR, 'datacenter.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Schéma par défaut ──────────────────────────────────────────────────────

const DEFAULT_DATACENTER = {
  id: 'dc-sbee',
  name: 'Salle serveur SBEE',
  updatedAt: new Date().toISOString(),
  rooms: [
    {
      id: 'room-main',
      name: 'Salle principale',
      // dimensions en mètres (axe Y = hauteur)
      dimensions: { width: 10, depth: 8, height: 3 },
      racks: []
    }
  ]
};

// Types d'équipements supportés (taxonomie extensible — utilisée par le 3D
// pour choisir couleur / icône / dimensions par défaut).
const DEVICE_TYPES = {
  'server.physical':   { label: 'Serveur physique',     color: '#4a90e2', defaultU: 2 },
  'server.hypervisor': { label: 'Hyperviseur ESXi',     color: '#22c55e', defaultU: 2 },
  'server.blade':      { label: 'Châssis lame',         color: '#3b82f6', defaultU: 10 },
  'storage.nas':       { label: 'NAS',                  color: '#f59e0b', defaultU: 2 },
  'storage.san':       { label: 'SAN / Baie disques',   color: '#f97316', defaultU: 3 },
  'backup.library':    { label: 'Librairie LTO',        color: '#a855f7', defaultU: 4 },
  'backup.server':     { label: 'Serveur Veeam',        color: '#8b5cf6', defaultU: 2 },
  'network.switch':    { label: 'Switch réseau',        color: '#06b6d4', defaultU: 1 },
  'network.router':    { label: 'Routeur',              color: '#0ea5e9', defaultU: 1 },
  'network.firewall':  { label: 'Firewall',             color: '#ef4444', defaultU: 1 },
  'power.ups':         { label: 'Onduleur',             color: '#facc15', defaultU: 3 },
  'power.pdu':         { label: 'PDU',                  color: '#eab308', defaultU: 1 },
  'power.battery':     { label: 'Batteries',            color: '#fbbf24', defaultU: 3 },
  'power.ecoflow':     { label: 'EcoFlow',              color: '#84cc16', defaultU: 2 },
  'env.hvac':          { label: 'Climatisation',        color: '#38bdf8', defaultU: 0 },
  'env.sensor':        { label: 'Capteur T°/humidité',  color: '#0891b2', defaultU: 0 },
  'peripheral.kvm':    { label: 'KVM / Écran',          color: '#64748b', defaultU: 1 },
  'peripheral.display':{ label: 'Écran de supervision', color: '#475569', defaultU: 0 },
  'other':             { label: 'Autre',                color: '#94a3b8', defaultU: 1 },
};

// ─── I/O atomique ───────────────────────────────────────────────────────────

function readDatacenter() {
  try {
    if (!fs.existsSync(FILE)) {
      writeDatacenter(DEFAULT_DATACENTER);
      return structuredClone(DEFAULT_DATACENTER);
    }
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch (e) {
    console.error('[Datacenter] Lecture impossible, fallback défaut :', e.message);
    return structuredClone(DEFAULT_DATACENTER);
  }
}

function writeDatacenter(dc) {
  dc.updatedAt = new Date().toISOString();
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(dc, null, 2));
  fs.renameSync(tmp, FILE);
  return dc;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function findRoom(dc, roomId) {
  return dc.rooms.find(r => r.id === roomId);
}

function findRack(dc, rackId) {
  for (const room of dc.rooms) {
    const rack = room.racks.find(r => r.id === rackId);
    if (rack) return { room, rack };
  }
  return null;
}

/**
 * Vérifie qu'une plage [uStart, uStart+uSize-1] ne chevauche aucun device
 * existant dans le rack (hors device exclu par id, utile pour update).
 */
function assertUnitRangeFree(rack, uStart, uSize, excludeDeviceId = null) {
  if (!Number.isInteger(uStart) || uStart < 1) {
    throw new Error(`uStart invalide (reçu : ${uStart})`);
  }
  if (!Number.isInteger(uSize) || uSize < 1) {
    throw new Error(`uSize invalide (reçu : ${uSize})`);
  }
  const uEnd = uStart + uSize - 1;
  if (uEnd > rack.uHeight) {
    throw new Error(`Dépassement : device occupe jusqu'à U${uEnd} mais le rack ne fait que ${rack.uHeight}U`);
  }
  for (const dev of rack.devices) {
    if (dev.id === excludeDeviceId) continue;
    const devEnd = dev.uStart + dev.uSize - 1;
    const overlap = !(uEnd < dev.uStart || uStart > devEnd);
    if (overlap) {
      throw new Error(`Chevauchement avec "${dev.name}" (U${dev.uStart}-U${devEnd})`);
    }
  }
}

// ─── API publique ───────────────────────────────────────────────────────────

function getDatacenter() {
  return readDatacenter();
}

function getDeviceTypes() {
  return DEVICE_TYPES;
}

function updateDatacenterMeta({ name }) {
  const dc = readDatacenter();
  if (name) dc.name = name;
  return writeDatacenter(dc);
}

function updateRoom(roomId, updates) {
  const dc = readDatacenter();
  const room = findRoom(dc, roomId);
  if (!room) throw new Error('Salle introuvable');
  if (updates.name)       room.name = updates.name;
  if (updates.dimensions) room.dimensions = { ...room.dimensions, ...updates.dimensions };
  writeDatacenter(dc);
  return room;
}

function addRack(roomId, rackData) {
  const dc = readDatacenter();
  const room = findRoom(dc, roomId);
  if (!room) throw new Error('Salle introuvable');

  const rack = {
    id:          rackData.id || uid('rack'),
    name:        rackData.name || `Rack ${room.racks.length + 1}`,
    position:    Number.isInteger(rackData.position) ? rackData.position : room.racks.length + 1,
    coords:      rackData.coords || { x: room.racks.length * 0.8, z: 0 },
    orientation: rackData.orientation || 0,
    uHeight:     rackData.uHeight || 42,
    vendor:      rackData.vendor || '',
    model:       rackData.model  || '',
    notes:       rackData.notes  || '',
    devices:     []
  };

  room.racks.push(rack);
  writeDatacenter(dc);
  return rack;
}

function updateRack(rackId, updates) {
  const dc = readDatacenter();
  const found = findRack(dc, rackId);
  if (!found) throw new Error('Rack introuvable');
  const { rack } = found;

  const allowed = ['name', 'position', 'coords', 'orientation', 'uHeight', 'vendor', 'model', 'notes'];
  for (const k of allowed) {
    if (updates[k] !== undefined) rack[k] = updates[k];
  }

  // Si on réduit uHeight, vérifier que rien ne dépasse
  if (updates.uHeight) {
    for (const dev of rack.devices) {
      if (dev.uStart + dev.uSize - 1 > rack.uHeight) {
        throw new Error(`Impossible : "${dev.name}" dépasserait la nouvelle hauteur`);
      }
    }
  }

  writeDatacenter(dc);
  return rack;
}

function deleteRack(rackId) {
  const dc = readDatacenter();
  for (const room of dc.rooms) {
    const idx = room.racks.findIndex(r => r.id === rackId);
    if (idx >= 0) {
      room.racks.splice(idx, 1);
      writeDatacenter(dc);
      return true;
    }
  }
  throw new Error('Rack introuvable');
}

function addDevice(rackId, deviceData) {
  const dc = readDatacenter();
  const found = findRack(dc, rackId);
  if (!found) throw new Error('Rack introuvable');
  const { rack } = found;

  const type = deviceData.type || 'other';
  const typeMeta = DEVICE_TYPES[type] || DEVICE_TYPES.other;
  const uSize = deviceData.uSize || typeMeta.defaultU || 1;
  const uStart = deviceData.uStart;

  assertUnitRangeFree(rack, uStart, uSize);

  const device = {
    id:           deviceData.id || uid('dev'),
    name:         deviceData.name || 'Nouvel équipement',
    type,
    manufacturer: deviceData.manufacturer || '',
    model:        deviceData.model || '',
    serial:       deviceData.serial || '',
    hostname:     deviceData.hostname || '',
    ip:           deviceData.ip || '',
    uStart,
    uSize,
    color:        deviceData.color || typeMeta.color,
    status:       deviceData.status || 'unknown',
    notes:        deviceData.notes || '',
    metadata:     deviceData.metadata || {},
    createdAt:    new Date().toISOString()
  };

  rack.devices.push(device);
  writeDatacenter(dc);
  return device;
}

function updateDevice(deviceId, updates) {
  const dc = readDatacenter();
  for (const room of dc.rooms) {
    for (const rack of room.racks) {
      const dev = rack.devices.find(d => d.id === deviceId);
      if (!dev) continue;

      const nextUStart = updates.uStart ?? dev.uStart;
      const nextUSize  = updates.uSize  ?? dev.uSize;
      if (updates.uStart !== undefined || updates.uSize !== undefined) {
        assertUnitRangeFree(rack, nextUStart, nextUSize, dev.id);
      }

      const allowed = ['name','type','manufacturer','model','serial','hostname','ip',
                       'uStart','uSize','color','status','notes','metadata'];
      for (const k of allowed) {
        if (updates[k] !== undefined) dev[k] = updates[k];
      }
      writeDatacenter(dc);
      return dev;
    }
  }
  throw new Error('Équipement introuvable');
}

function deleteDevice(deviceId) {
  const dc = readDatacenter();
  for (const room of dc.rooms) {
    for (const rack of room.racks) {
      const idx = rack.devices.findIndex(d => d.id === deviceId);
      if (idx >= 0) {
        rack.devices.splice(idx, 1);
        writeDatacenter(dc);
        return true;
      }
    }
  }
  throw new Error('Équipement introuvable');
}

module.exports = {
  getDatacenter,
  getDeviceTypes,
  updateDatacenterMeta,
  updateRoom,
  addRack,
  updateRack,
  deleteRack,
  addDevice,
  updateDevice,
  deleteDevice,
};
