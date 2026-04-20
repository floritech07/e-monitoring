/**
 * scripts/seedDatacenter.js
 *
 * Peuple la topologie de la salle serveur SBEE à partir des informations
 * réelles fournies par l'administrateur. Idempotent : vide la salle avant
 * de réinsérer, pour qu'on puisse relancer sans empiler de doublons.
 *
 * Usage :  node scripts/seedDatacenter.js
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'datacenter.json');
const svc = require('../services/datacenterService');

// ─── Utilitaire : reset complet de la topologie ────────────────────────────

function resetTopology() {
  const fresh = {
    id: 'dc-sbee',
    name: 'Salle serveur SBEE',
    updatedAt: new Date().toISOString(),
    rooms: [
      {
        id: 'room-main',
        name: 'Salle serveur principale',
        dimensions: { width: 12, depth: 7, height: 3 },
        racks: []
      }
    ]
  };
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2));
  console.log('[seed] Topologie réinitialisée.');
}

// ─── Définition déclarative de la salle ────────────────────────────────────

// Les racks sont alignés sur une rangée (IBM → Intranet → PREPAID →
// VideoSurveillance), TELECOM est placé à l'écart (vide pour l'instant).
const RACKS = [
  {
    key: 'ibm',
    name: 'Rack IBM',
    uHeight: 42,
    coords: { x: -2.7, z: 0 },
    devices: [
      { uStart: 1,  uSize: 4, name: 'UPS Eaton 9910-E67',        type: 'power.ups',       manufacturer: 'Eaton',  model: '9910-E67',              serial: '10C7BJCR' },
      { uStart: 5,  uSize: 4, name: 'IBM Power S814',            type: 'server.physical', manufacturer: 'IBM',    model: 'Power S814',            serial: '828641A' },
      { uStart: 10, uSize: 2, name: 'IBM Storwize V3700 #1',     type: 'storage.san',     manufacturer: 'IBM',    model: 'Storwize V3700' },
      { uStart: 12, uSize: 2, name: 'IBM Storwize V3700 #2',     type: 'storage.san',     manufacturer: 'IBM',    model: 'Storwize V3700' },
      { uStart: 15, uSize: 2, name: 'IBM Storwize V3700 #3',     type: 'storage.san',     manufacturer: 'IBM',    model: 'Storwize V3700' },
      { uStart: 17, uSize: 1, name: 'IBM System x3550 M',        type: 'server.physical', manufacturer: 'IBM',    model: 'System x3550 M' },
      { uStart: 19, uSize: 1, name: 'Console KVM IBM',           type: 'peripheral.kvm',  manufacturer: 'IBM',    model: 'KVM Console' },
      { uStart: 25, uSize: 1, name: 'Lenovo SR630',              type: 'server.physical', manufacturer: 'Lenovo', model: 'SR630',                 serial: 'J303W6DZ' },
      { uStart: 26, uSize: 1, name: 'Cisco ASA 5545',            type: 'network.firewall',manufacturer: 'Cisco',  model: 'ASA 5545' },
      { uStart: 28, uSize: 1, name: 'IBM TAPE CBU (backup)',     type: 'backup.library',  manufacturer: 'IBM',    model: 'Tape Library', notes: 'Sauvegarde CBU' },
      { uStart: 30, uSize: 1, name: 'IBM TAPE MAIN (production)',type: 'backup.library',  manufacturer: 'IBM',    model: 'Tape Library', notes: 'Sauvegardes production' },
      { uStart: 32, uSize: 1, name: 'Switch fibre IBM 2498-24E #1', type: 'network.switch', manufacturer: 'IBM', model: '2498-24E' },
      { uStart: 33, uSize: 1, name: 'Switch fibre IBM 2498-24E #2', type: 'network.switch', manufacturer: 'IBM', model: '2498-24E' },
      { uStart: 34, uSize: 1, name: 'Switch Cisco 2960 #1',      type: 'network.switch',  manufacturer: 'Cisco',  model: 'Catalyst 2960' },
      { uStart: 36, uSize: 1, name: 'Switch Cisco 2960 #2',      type: 'network.switch',  manufacturer: 'Cisco',  model: 'Catalyst 2960' },
    ]
  },

  {
    key: 'intranet',
    name: 'Rack Intranet',
    uHeight: 42,
    coords: { x: -1.35, z: 0 },
    devices: [
      { uStart: 3,  uSize: 2, name: 'APC 2.2 kVA',               type: 'power.ups',       manufacturer: 'APC',    model: 'Smart-UPS 2.2kVA' },
      { uStart: 5,  uSize: 4, name: 'Dell OptiPlex 9020',        type: 'server.physical', manufacturer: 'Dell',   model: 'OptiPlex 9020', notes: 'Poste monté en rack' },
      { uStart: 10, uSize: 4, name: 'Synology DS1821+',          type: 'storage.nas',     manufacturer: 'Synology', model: 'DS1821+' },
      { uStart: 14, uSize: 1, name: 'HPE DL360 Gen9 #1',         type: 'server.physical', manufacturer: 'HPE',    model: 'ProLiant DL360 Gen9' },
      { uStart: 16, uSize: 2, name: 'HPE DL380 Gen8',            type: 'server.physical', manufacturer: 'HPE',    model: 'ProLiant DL380 Gen8' },
      { uStart: 19, uSize: 2, name: 'HPE DL380 Gen9',            type: 'server.physical', manufacturer: 'HPE',    model: 'ProLiant DL380 Gen9' },
      { uStart: 22, uSize: 1, name: 'HPE DL360 Gen9 #2',         type: 'server.physical', manufacturer: 'HPE',    model: 'ProLiant DL360 Gen9' },
      { uStart: 26, uSize: 1, name: 'HPE DL320 Gen8 v2',         type: 'server.physical', manufacturer: 'HPE',    model: 'ProLiant DL320 Gen8 v2' },
      { uStart: 29, uSize: 1, name: 'Synology DS1520+ #1',       type: 'storage.nas',     manufacturer: 'Synology', model: 'DS1520+' },
      { uStart: 30, uSize: 1, name: 'Cisco SG500-28P #1',        type: 'network.switch',  manufacturer: 'Cisco',  model: 'SG500-28P' },
      // CONFLIT signalé : l'utilisateur mentionne « A 31U un Cisco SG500-28P »
      // ET « A 30U, y'a aussi une Cisco SG500-28P » — traité comme 2 switches.
      { uStart: 31, uSize: 1, name: 'Cisco SG500-28P #2',        type: 'network.switch',  manufacturer: 'Cisco',  model: 'SG500-28P' },
      { uStart: 32, uSize: 1, name: 'Cisco Catalyst 3750',       type: 'network.switch',  manufacturer: 'Cisco',  model: 'Catalyst 3750' },
      { uStart: 33, uSize: 1, name: 'Cisco Catalyst 2960-S',     type: 'network.switch',  manufacturer: 'Cisco',  model: 'Catalyst 2960-S' },
      { uStart: 34, uSize: 1, name: 'Mikrotik CRS312-4C+8XG',    type: 'network.switch',  manufacturer: 'Mikrotik', model: 'CRS312-4C+8XG' },
      { uStart: 36, uSize: 1, name: 'Stockage HP (2 disques)',   type: 'storage.san',     manufacturer: 'HPE',    model: 'Stockage 2 disques' },
      { uStart: 38, uSize: 1, name: 'Cisco C3850-NM #1',         type: 'network.switch',  manufacturer: 'Cisco',  model: 'Catalyst 3850-NM' },
      { uStart: 41, uSize: 1, name: 'Cisco C3850-NM #2',         type: 'network.switch',  manufacturer: 'Cisco',  model: 'Catalyst 3850-NM' },
      // NOTE : le 2e Synology DS1520+ mentionné "de U29 à U32" n'a pas été
      // placé — la plage U29-U32 se heurte aux 3 switches Cisco. À clarifier.
    ]
  },

  {
    key: 'prepaid',
    name: 'Rack PREPAID',
    uHeight: 42,
    coords: { x: 0, z: 0 },
    devices: [
      { uStart: 5,  uSize: 2, name: 'HPE DL380 Gen10 #1',        type: 'server.hypervisor', manufacturer: 'HPE', model: 'ProLiant DL380 Gen10' },
      { uStart: 10, uSize: 2, name: 'HPE DL380 Gen10 #2',        type: 'server.hypervisor', manufacturer: 'HPE', model: 'ProLiant DL380 Gen10' },
      { uStart: 12, uSize: 1, name: 'Cisco ISE 3615 #1',         type: 'server.physical',   manufacturer: 'Cisco', model: 'ISE 3615' },
      { uStart: 13, uSize: 1, name: 'Cisco ISE 3615 #2',         type: 'server.physical',   manufacturer: 'Cisco', model: 'ISE 3615' },
      { uStart: 16, uSize: 2, name: 'HPE StoreOnce 3620',        type: 'backup.server',     manufacturer: 'HPE', model: 'StoreOnce 3620' },
      { uStart: 20, uSize: 1, name: 'KVM HPE LCD 8500',          type: 'peripheral.kvm',    manufacturer: 'HPE', model: 'LCD 8500' },
      { uStart: 23, uSize: 2, name: 'HPE MSA 2050',              type: 'storage.san',       manufacturer: 'HPE', model: 'MSA 2050' },
      { uStart: 26, uSize: 1, name: 'HPE DL360 Gen10 #1',        type: 'server.hypervisor', manufacturer: 'HPE', model: 'ProLiant DL360 Gen10' },
      { uStart: 28, uSize: 1, name: 'HPE DL360 Gen10 #2',        type: 'server.hypervisor', manufacturer: 'HPE', model: 'ProLiant DL360 Gen10' },
      { uStart: 30, uSize: 1, name: 'HPE DL360 Gen10 #3',        type: 'server.hypervisor', manufacturer: 'HPE', model: 'ProLiant DL360 Gen10' },
      { uStart: 33, uSize: 1, name: 'PRISM TSM 500i v1.1',       type: 'server.physical',   manufacturer: 'PRISM', model: 'TSM 500i v1.1', notes: 'Équipement prépayé' },
      { uStart: 35, uSize: 1, name: 'PRISM TSM 500i N55 v1.2',   type: 'server.physical',   manufacturer: 'PRISM', model: 'TSM 500i N55 v1.2', notes: 'Équipement prépayé' },
      { uStart: 36, uSize: 1, name: 'Cisco 2960 #1',             type: 'network.switch',    manufacturer: 'Cisco', model: 'Catalyst 2960' },
      { uStart: 38, uSize: 1, name: 'Cisco 2960 #2',             type: 'network.switch',    manufacturer: 'Cisco', model: 'Catalyst 2960' },
      { uStart: 40, uSize: 2, name: 'HPE DL380p Gen8',           type: 'server.physical',   manufacturer: 'HPE', model: 'ProLiant DL380p Gen8' },
    ]
  },

  {
    key: 'videosurveillance',
    name: 'Rack VidéoSurveillance',
    uHeight: 42,
    coords: { x: 1.35, z: 0 },
    devices: [
      { uStart: 7,  uSize: 4, name: 'Hikvision — Baie de stockage', type: 'storage.san',   manufacturer: 'Hikvision', model: 'Baie stockage NVR', notes: 'Vidéosurveillance' },
      { uStart: 11, uSize: 1, name: 'HPE ProLiant DL20 Gen10 Plus', type: 'server.physical', manufacturer: 'HPE', model: 'ProLiant DL20 Gen10 Plus' },
      { uStart: 15, uSize: 1, name: 'HPE ProLiant DL360 Gen10',   type: 'server.physical', manufacturer: 'HPE', model: 'ProLiant DL360 Gen10' },
      { uStart: 18, uSize: 2, name: 'HPE ProLiant DL380 Gen11',   type: 'server.physical', manufacturer: 'HPE', model: 'ProLiant DL380 Gen11' },
      { uStart: 21, uSize: 1, name: 'KVM HPE LCD 8500',           type: 'peripheral.kvm',  manufacturer: 'HPE', model: 'LCD 8500' },
      { uStart: 23, uSize: 2, name: 'HPE ProLiant DL380 Gen10',   type: 'server.physical', manufacturer: 'HPE', model: 'ProLiant DL380 Gen10' },
    ]
  },

  {
    key: 'telecom',
    name: 'Rack TELECOM',
    uHeight: 42,
    coords: { x: 3.3, z: 1.8 }, // à l'écart
    devices: [], // À compléter après la réunion avec le service réseau
  },
];

// ─── Exécution ─────────────────────────────────────────────────────────────

function seed() {
  resetTopology();

  const dc = svc.getDatacenter();
  const roomId = dc.rooms[0].id;
  let createdRacks = 0, createdDevices = 0, skipped = 0;

  for (const rackDef of RACKS) {
    const rack = svc.addRack(roomId, {
      name:        rackDef.name,
      uHeight:     rackDef.uHeight,
      coords:      rackDef.coords,
      orientation: rackDef.orientation || 0,
    });
    createdRacks++;
    console.log(`[seed] Rack créé : ${rack.name} (${rack.uHeight}U) @ x=${rack.coords.x}, z=${rack.coords.z}`);

    for (const dev of rackDef.devices) {
      try {
        const created = svc.addDevice(rack.id, dev);
        createdDevices++;
        console.log(`         + U${created.uStart}${created.uSize > 1 ? '-U' + (created.uStart + created.uSize - 1) : ''}  ${created.name}`);
      } catch (e) {
        skipped++;
        console.warn(`         ⚠ Skip "${dev.name}" (U${dev.uStart}) : ${e.message}`);
      }
    }
  }

  console.log(`\n[seed] ✅ Terminé : ${createdRacks} racks, ${createdDevices} équipements, ${skipped} ignorés.`);
}

seed();
