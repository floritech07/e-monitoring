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
  'server.physical':   { label: 'Serveur physique',       color: '#4a90e2', defaultU: 2 },
  'server.hypervisor': { label: 'Hyperviseur ESXi',       color: '#22c55e', defaultU: 2 },
  'server.blade':      { label: 'Châssis lame',           color: '#3b82f6', defaultU: 10 },
  'storage.nas':       { label: 'NAS',                    color: '#f59e0b', defaultU: 2 },
  'storage.san':       { label: 'SAN / Baie disques',     color: '#f97316', defaultU: 3 },
  'backup.library':    { label: 'Librairie LTO',          color: '#a855f7', defaultU: 4 },
  'backup.server':     { label: 'Serveur Veeam',          color: '#8b5cf6', defaultU: 2 },
  'network.switch':    { label: 'Switch réseau',          color: '#06b6d4', defaultU: 1 },
  'network.router':    { label: 'Routeur',                color: '#0ea5e9', defaultU: 1 },
  'network.firewall':  { label: 'Firewall',               color: '#ef4444', defaultU: 1 },
  'power.ups':         { label: 'Onduleur',               color: '#facc15', defaultU: 3 },
  'power.pdu':         { label: 'PDU',                    color: '#eab308', defaultU: 1 },
  'power.battery':     { label: 'Batteries',              color: '#fbbf24', defaultU: 3 },
  'power.ecoflow':     { label: 'EcoFlow',                color: '#84cc16', defaultU: 2 },
  'env.hvac':          { label: 'Climatisation',          color: '#38bdf8', defaultU: 0 },
  'env.sensor':        { label: 'Capteur T°/humidité',    color: '#0891b2', defaultU: 0 },
  'peripheral.kvm':    { label: 'KVM / Écran',            color: '#64748b', defaultU: 1 },
  'peripheral.display':{ label: 'Écran de supervision',   color: '#475569', defaultU: 0 },
  'vending.hsm':       { label: 'HSM vente prépayée',     color: '#d946ef', defaultU: 1 }, // PRISM TSM, etc.
  'infra.shelf':       { label: 'Étagère (support)',      color: '#78716c', defaultU: 1 },
  'other':             { label: 'Autre',                  color: '#94a3b8', defaultU: 1 },
};

// Valeurs valides pour la description spatiale fine d'un équipement
const VALID_SLOTS    = ['full', 'left', 'right'];
const VALID_DEPTHS   = ['full', 'front', 'back'];
const VALID_MOUNTS   = ['rail', 'shelf', 'loose'];

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
 * Détermine si deux équipements se chevauchent *physiquement* dans un rack,
 * en tenant compte de :
 *   - la plage d'unités U
 *   - le slot latéral (full / left / right)
 *   - la profondeur (full / front / back)
 *   - le type de montage (rail / shelf / loose)
 *
 * Exceptions "non-conflit" :
 *   - shelf + loose dans la même zone → OK (l'un porte l'autre)
 *   - loose + loose dans la même zone → OK (empilement accepté)
 *   - slots opposés (left/right) sans recouvrement
 *   - profondeurs opposées (front/back) sans recouvrement
 */
function devicesConflict(a, b) {
  const aEnd = a.uStart + a.uSize - 1;
  const bEnd = b.uStart + b.uSize - 1;
  if (aEnd < b.uStart || a.uStart > bEnd) return false; // pas de recouvrement U

  const aSlot  = a.slot  || 'full';
  const bSlot  = b.slot  || 'full';
  const aDepth = a.depth || 'full';
  const bDepth = b.depth || 'full';
  const aMount = a.mounting || 'rail';
  const bMount = b.mounting || 'rail';

  // Slots latéraux opposés : pas de collision
  if ((aSlot === 'left' && bSlot === 'right') || (aSlot === 'right' && bSlot === 'left')) {
    return false;
  }
  // Profondeurs opposées : pas de collision
  if ((aDepth === 'front' && bDepth === 'back') || (aDepth === 'back' && bDepth === 'front')) {
    return false;
  }
  // Étagère + objet posé dessus : OK
  if ((aMount === 'shelf' && bMount === 'loose') || (aMount === 'loose' && bMount === 'shelf')) {
    return false;
  }
  // Deux "loose" : empilement accepté
  if (aMount === 'loose' && bMount === 'loose') return false;

  return true;
}

function assertUnitRangeFree(rack, candidate, excludeDeviceId = null) {
  const uStart = candidate.uStart;
  const uSize  = candidate.uSize;
  if (!Number.isInteger(uStart) || uStart < 1) {
    throw new Error(`uStart invalide (reçu : ${uStart})`);
  }
  if (!Number.isInteger(uSize) || uSize < 1) {
    throw new Error(`uSize invalide (reçu : ${uSize})`);
  }
  const uEnd = uStart + uSize - 1;
  if (uEnd > rack.uHeight) {
    throw new Error(`Dépassement : l'équipement occupe jusqu'à U${uEnd} mais le rack ne fait que ${rack.uHeight}U`);
  }

  for (const dev of rack.devices) {
    if (dev.id === excludeDeviceId) continue;
    if (devicesConflict(candidate, dev)) {
      const devEnd = dev.uStart + dev.uSize - 1;
      const descr = [
        `"${dev.name}"`,
        `U${dev.uStart}${devEnd > dev.uStart ? '-U' + devEnd : ''}`,
        dev.slot && dev.slot !== 'full'   ? dev.slot   : null,
        dev.depth && dev.depth !== 'full' ? dev.depth  : null,
        dev.mounting && dev.mounting !== 'rail' ? dev.mounting : null,
      ].filter(Boolean).join(' · ');
      throw new Error(`Collision physique avec ${descr}`);
    }
  }
}

function sanitizeSpatial(input) {
  const slot     = VALID_SLOTS.includes(input.slot)       ? input.slot     : 'full';
  const depth    = VALID_DEPTHS.includes(input.depth)     ? input.depth    : 'full';
  const mounting = VALID_MOUNTS.includes(input.mounting)  ? input.mounting : 'rail';
  return { slot, depth, mounting };
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
  const spatial = sanitizeSpatial(deviceData);

  assertUnitRangeFree(rack, { uStart, uSize, ...spatial });

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
    ...spatial,
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
      const nextSpatial = sanitizeSpatial({
        slot:     updates.slot     ?? dev.slot,
        depth:    updates.depth    ?? dev.depth,
        mounting: updates.mounting ?? dev.mounting,
      });

      // Revalider le placement si toute dimension spatiale change
      const spatialKeys = ['uStart','uSize','slot','depth','mounting'];
      if (spatialKeys.some(k => updates[k] !== undefined)) {
        assertUnitRangeFree(rack,
          { uStart: nextUStart, uSize: nextUSize, ...nextSpatial },
          dev.id);
      }

      const allowed = ['name','type','manufacturer','model','serial','hostname','ip',
                       'uStart','uSize','slot','depth','mounting',
                       'color','status','notes','metadata'];
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
