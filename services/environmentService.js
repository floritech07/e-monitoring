'use strict';
/**
 * Service de simulation des capteurs environnementaux — Phase 1 complet
 * Température · Hygrométrie · Point de rosée · Pression diff. · Qualité air
 * PDU intelligents · Groupe électrogène · ATS/STS · THD/cos φ
 */

function fluctuate(base, spread = 1) {
  return +(base + (Math.random() - 0.5) * spread * 2).toFixed(1);
}

// ── Point de rosée (formule d'August-Roche-Magnus) ──────────────────────────
function dewPoint(tempC, humPct) {
  const a = 17.27, b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humPct / 100);
  return +((b * alpha) / (a - alpha)).toFixed(1);
}

// ── PDU Intelligents (2 PDU par rangée, 8 prises chacun) ────────────────────
const PDU_DEF = [
  { id: 'pdu-rack-a', name: 'PDU-A (APC AP7800)', rack: 'rack-a', phases: 1, circuitAmps: 20, outlets: 8 },
  { id: 'pdu-rack-b', name: 'PDU-B (APC AP7800)', rack: 'rack-b', phases: 1, circuitAmps: 20, outlets: 8 },
  { id: 'pdu-3ph-a',  name: 'PDU-3PH-A (Raritan PX3)', rack: null, phases: 3, circuitAmps: 32, outlets: 24 },
];

function getPDUStatus() {
  return PDU_DEF.map(pdu => ({
    ...pdu,
    timestamp: new Date().toISOString(),
    voltageV:   fluctuate(230, 3),
    currentA:   fluctuate(8, 2),
    powerKW:    fluctuate(1.8, 0.4),
    powerFactorCos: fluctuate(0.92, 0.04),
    thdPct:     fluctuate(4.5, 1.5),
    frequencyHz: fluctuate(50, 0.1),
    status:     'ok',
    outlets: Array.from({ length: pdu.outlets }, (_, i) => ({
      id:      i + 1,
      name:    `Prise ${i + 1}`,
      state:   i < 6 ? 'on' : (Math.random() > 0.9 ? 'on' : 'off'),
      powerW:  i < 6 ? fluctuate(220, 50) : 0,
      currentA: i < 6 ? fluctuate(0.95, 0.2) : 0,
    })),
  }));
}

// ── Groupe Électrogène ────────────────────────────────────────────────────────
let _gensetState = 'stopped';
let _gensetLastStart = null;

function getGensetStatus() {
  const running = _gensetState === 'running';
  return {
    id:             'genset-01',
    name:           'Groupe Électrogène Cummins C220D5',
    model:          'Cummins C220D5 — 220 kVA',
    status:         _gensetState,   // stopped | auto | test | running | fault
    fuelLevelPct:   fluctuate(72, 2),
    fuelLiters:     fluctuate(576, 16),
    engineTempC:    running ? fluctuate(85, 5) : fluctuate(28, 3),
    oilPressureBar: running ? fluctuate(3.2, 0.3) : 0,
    voltageV:       running ? fluctuate(400, 5) : 0,
    frequencyHz:    running ? fluctuate(50, 0.2) : 0,
    loadKW:         running ? fluctuate(85, 15) : 0,
    loadPct:        running ? fluctuate(39, 7) : 0,
    engineHours:    1247,
    lastTestDate:   '2026-04-15T10:00:00Z',
    lastStartDate:  _gensetLastStart,
    runningMinutes: running && _gensetLastStart ? Math.floor((Date.now() - new Date(_gensetLastStart).getTime()) / 60_000) : 0,
    alarms:         [],
    batteryV:       fluctuate(24.1, 0.3),
    coolantTempC:   running ? fluctuate(82, 4) : fluctuate(26, 2),
  };
}

// ── ATS / STS (Automatic Transfer Switch) ────────────────────────────────────
function getATSStatus() {
  return [
    {
      id:          'ats-main',
      name:        'ATS Principal — Entrée HT/Génset',
      model:       'Socomec ATYS 3S 160A',
      sourceActive: 'utility',    // utility | generator
      utilityOk:   true,
      generatorOk: _gensetState === 'running',
      voltageSource1V: fluctuate(400, 4),
      voltageSource2V: _gensetState === 'running' ? fluctuate(400, 5) : 0,
      lastTransferAt: null,
      transferTimeMs: 80,
      status:      'ok',
    },
    {
      id:          'sts-ups-a',
      name:        'STS Statique UPS-A',
      model:       'Socomec STATICS 200A',
      sourceActive: 'source1',
      source1Ok:   true,
      source2Ok:   true,
      voltageSource1V: fluctuate(230, 3),
      voltageSource2V: fluctuate(230, 3),
      lastTransferAt: null,
      transferTimeMs: 4,
      status:      'ok',
    },
  ];
}

// ── Qualité de l'air ──────────────────────────────────────────────────────────
function getAirQuality() {
  return {
    timestamp:  new Date().toISOString(),
    sensors: [
      {
        id: 'aq-main',
        location: 'Salle principale — milieu',
        pm25:     fluctuate(8, 3),      // µg/m³ (bon < 12)
        pm10:     fluctuate(15, 5),     // µg/m³ (bon < 20)
        co2Ppm:   fluctuate(650, 80),   // ppm (normal 400-1000)
        tvocPpb:  fluctuate(120, 40),   // ppb (bon < 220)
        status:   'ok',
      },
      {
        id: 'aq-battery-room',
        location: 'Local batteries UPS',
        pm25:     fluctuate(5, 2),
        pm10:     fluctuate(10, 3),
        co2Ppm:   fluctuate(500, 60),
        tvocPpb:  fluctuate(180, 50),   // plus élevé — émissions batteries
        h2Ppm:    fluctuate(0.3, 0.1),  // H₂ dégagé par batteries Pb
        status:   'ok',
      },
    ],
  };
}

// ── Pression différentielle allées ────────────────────────────────────────────
function getDifferentialPressure() {
  return {
    timestamp: new Date().toISOString(),
    sensors: [
      { id: 'dp-aisle-north', location: 'Allée froide Nord', pressurePa: fluctuate(12, 2),  status: 'ok', targetPa: 12.5 },
      { id: 'dp-aisle-south', location: 'Allée froide Sud',  pressurePa: fluctuate(11, 2),  status: 'ok', targetPa: 12.5 },
      { id: 'dp-subfloor',    location: 'Sous faux plancher', pressurePa: fluctuate(25, 3), status: 'ok', targetPa: 25   },
    ],
  };
}

// ── Portes avec journalisation ────────────────────────────────────────────────
const _doorEvents = [];
const DOORS = [
  { id: 'door-main', name: 'Porte principale salle serveur', location: 'Entrée nord' },
  { id: 'door-back', name: 'Porte accès technique arrière',  location: 'Sortie sud' },
  { id: 'door-rack-a', name: 'Armoire Rack-A (verrouillée)',  location: 'Rack A' },
];
let _doorStates = { 'door-main': 'closed', 'door-back': 'closed', 'door-rack-a': 'locked' };

function getDoorStatus() {
  return DOORS.map(d => ({
    ...d,
    state:       _doorStates[d.id] || 'unknown',
    lastEventAt: _doorEvents.findLast?.(e => e.doorId === d.id)?.timestamp || null,
  }));
}

function getDoorEvents(limit = 50) {
  return _doorEvents.slice(-limit);
}

function logDoorEvent(doorId, state, user = 'system') {
  _doorEvents.push({ doorId, state, user, timestamp: new Date().toISOString() });
  if (_doorEvents.length > 500) _doorEvents.shift();
  _doorStates[doorId] = state;
}

// ── THD + cos φ par circuit ───────────────────────────────────────────────────
function getPowerQuality() {
  return {
    timestamp: new Date().toISOString(),
    circuits: [
      {
        id: 'pq-arrivee-ht',
        name: 'Arrivée HT — Transformateur SBEE',
        voltageL1N: fluctuate(231, 3), voltageL2N: fluctuate(230, 3), voltageL3N: fluctuate(229, 3),
        currentL1A: fluctuate(42, 5), currentL2A: fluctuate(41, 5), currentL3A: fluctuate(43, 5),
        activePowerKW: fluctuate(28.5, 2),
        reactivePowerKVAR: fluctuate(6.2, 1),
        apparentPowerKVA: fluctuate(29.2, 2),
        cosPhi: fluctuate(0.96, 0.02),
        frequencyHz: fluctuate(50.01, 0.05),
        thdVoltPct: fluctuate(2.1, 0.5),
        thdCurrentPct: fluctuate(4.8, 1.2),
        imbalancePct: fluctuate(1.2, 0.5),
        status: 'ok',
      },
      {
        id: 'pq-sortie-ups',
        name: 'Sortie UPS — Tableau DC',
        voltageL1N: fluctuate(230, 2),
        currentL1A: fluctuate(18, 3),
        activePowerKW: fluctuate(4.1, 0.5),
        cosPhi: fluctuate(0.99, 0.01),
        frequencyHz: fluctuate(50.00, 0.01),
        thdVoltPct: fluctuate(1.2, 0.3),
        thdCurrentPct: fluctuate(2.8, 0.8),
        imbalancePct: 0,
        status: 'ok',
      },
    ],
  };
}

const SENSOR_POSITIONS = [
  { id: 'env-rack-a-top',    rack: 'rack-a', zone: 'cold-north', location: 'Rack A haut',     x: 150, y: 100 },
  { id: 'env-rack-a-mid',    rack: 'rack-a', zone: 'hot',        location: 'Rack A milieu',   x: 150, y: 230 },
  { id: 'env-rack-b-top',    rack: 'rack-b', zone: 'cold-south', location: 'Rack B haut',     x: 350, y: 100 },
  { id: 'env-rack-b-mid',    rack: 'rack-b', zone: 'hot',        location: 'Rack B milieu',   x: 350, y: 280 },
  { id: 'env-crac-a-inlet',  rack: null,     zone: 'crac-a',     location: 'CRAC-A entrée',   x: 650, y: 150 },
  { id: 'env-crac-b-inlet',  rack: null,     zone: 'crac-b',     location: 'CRAC-B entrée',   x: 650, y: 420 },
  { id: 'env-aisle-hot-mid', rack: null,     zone: 'hot',        location: 'Allée chaude mil',x: 300, y: 320 },
  { id: 'env-room-general',  rack: null,     zone: 'room',       location: 'Ambiant salle',   x: 500, y: 350 },
];

const BASE_TEMPS = {
  'cold-north':  16.5,
  'cold-south':  16.0,
  'hot':         21.0,
  'crac-a':      15.5,
  'crac-b':      16.0,
  'room':        18.0,
};

const BASE_HUMIDITY = {
  'cold-north':  47,
  'cold-south':  46,
  'hot':         42,
  'crac-a':      50,
  'crac-b':      49,
  'room':        47,
};

function getSensors() {
  return SENSOR_POSITIONS.map(s => {
    const tempBase = BASE_TEMPS[s.zone] || 22;
    const humBase  = BASE_HUMIDITY[s.zone] || 47;
    const temp     = fluctuate(tempBase, 1.5);
    const humidity = fluctuate(humBase, 3);
    const dp       = dewPoint(temp, humidity);

    let status = 'ok';
    if (temp > 35 || temp < 15) status = 'critical';
    else if (temp > 30 || humidity > 65 || humidity < 30) status = 'warning';

    return {
      ...s,
      timestamp:  new Date().toISOString(),
      tempC:      temp,
      humidity,
      dewPointC:  dp,
      smoke:      false,
      water:      false,
      status,
    };
  });
}

function getRoomSummary() {
  const sensors = getSensors();
  const temps   = sensors.map(s => s.tempC);
  const hums    = sensors.map(s => s.humidity);

  const avgTemp  = +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  const maxTemp  = Math.max(...temps);
  const avgHum   = +(hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(0);
  const hotAisle = sensors.filter(s => s.zone === 'hot').reduce((s, x) => s + x.tempC, 0) /
                   (sensors.filter(s => s.zone === 'hot').length || 1);

  return {
    avgTempC:     avgTemp,
    temperature:  avgTemp, // Alias for dashboard KPI
    maxTempC:     +maxTemp.toFixed(1),
    hotAisleTempC: +hotAisle.toFixed(1),
    avgHumidity:  +avgHum,
    humidity:     +avgHum, // Alias for dashboard KPI
    smokeAlert:   false,
    waterAlert:   false,
    ashrae: {
      compliant: avgTemp >= 18 && avgTemp <= 27,
      class: avgTemp <= 27 ? 'A1' : avgTemp <= 35 ? 'A2' : 'CRITICAL',
    },
    sensors,
  };
}

// Simulation heatmap : grille 20×14 de températures interpolées
function getHeatmapGrid() {
  const sensors = getSensors();
  const cols = 20, rows = 14;
  const grid = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = (c / (cols - 1)) * 860 + 50;
      const py = (r / (rows - 1)) * 520 + 80;
      let weightSum = 0, tempSum = 0;
      for (const s of sensors) {
        const d = Math.hypot(px - s.x * (860 / 700), py - s.y * (520 / 530));
        const w = d < 1 ? 1000 : 1 / (d * d);
        weightSum += w;
        tempSum   += w * s.tempC;
      }
      grid.push({ c, r, temp: +(tempSum / weightSum).toFixed(1) });
    }
  }
  return { cols, rows, grid };
}

function getCRACStatus() {
  return [
    {
      id: 'crac-a', name: 'CRAC-01 (Liebert)', status: 'running',
      supplyTempC: fluctuate(17, 0.5),
      returnTempC: fluctuate(28, 1),
      coolingCapacityKW: fluctuate(15, 0.5),
      powerConsumptionKW: fluctuate(5.2, 0.3),
      airflowM3h: fluctuate(4500, 100),
    },
    {
      id: 'crac-b', name: 'CRAC-02 (Liebert)', status: 'running',
      supplyTempC: fluctuate(18, 0.5),
      returnTempC: fluctuate(30, 1),
      coolingCapacityKW: fluctuate(12, 0.5),
      powerConsumptionKW: fluctuate(4.8, 0.3),
      airflowM3h: fluctuate(4000, 100),
    },
  ];
}

// ── TGBT — Tableau Général Basse Tension ─────────────────────────────────────
const TGBT_CIRCUITS = [
  { id:'tgbt-1', label:'Arrivée réseau EDF',      ratedA:400, type:'breaker', phase:3, load:'EDF principale' },
  { id:'tgbt-2', label:'Groupe électrogène',       ratedA:400, type:'breaker', phase:3, load:'Cummins C220D5' },
  { id:'tgbt-3', label:'TGBT → ATS/STS',          ratedA:250, type:'breaker', phase:3, load:'ATS-01' },
  { id:'tgbt-4', label:'UPS-A (Schneider 40kVA)',  ratedA:120, type:'breaker', phase:1, load:'UPS-01' },
  { id:'tgbt-5', label:'UPS-B (Schneider 20kVA)',  ratedA:80,  type:'breaker', phase:1, load:'UPS-02' },
  { id:'tgbt-6', label:'Climatisation CRAC-01',    ratedA:60,  type:'breaker', phase:3, load:'CRAC-01' },
  { id:'tgbt-7', label:'Climatisation CRAC-02',    ratedA:60,  type:'breaker', phase:3, load:'CRAC-02' },
  { id:'tgbt-8', label:'Éclairage salle serveurs', ratedA:16,  type:'breaker', phase:1, load:'Éclairage' },
  { id:'tgbt-9', label:'PDU-A Rack A',            ratedA:32,  type:'breaker', phase:1, load:'PDU-rack-a' },
  { id:'tgbt-10',label:'PDU-B Rack B',            ratedA:32,  type:'breaker', phase:1, load:'PDU-rack-b' },
  { id:'tgbt-11',label:'PDU-3PH Baie haute densité',ratedA:63,type:'breaker', phase:3, load:'PDU-3ph-a' },
  { id:'tgbt-12',label:'Réseau / Switch core',     ratedA:20,  type:'breaker', phase:1, load:'Switch Huawei' },
];

function getTGBTCircuits() {
  return {
    id: 'tgbt-main',
    name: 'TGBT Salle Serveurs SBEE',
    mainVoltage: fluctuate(400, 3),
    mainCurrentA: fluctuate(185, 10),
    totalKW: fluctuate(62, 5),
    powerFactorGlobal: fluctuate(0.91, 0.03),
    thdGlobal: fluctuate(4.2, 0.8),
    timestamp: new Date().toISOString(),
    circuits: TGBT_CIRCUITS.map(c => {
      const loadFactor = c.id === 'tgbt-8' ? 0.12 : (Math.random() * 0.4 + 0.3);
      const currentA = +(c.ratedA * loadFactor).toFixed(1);
      return {
        ...c,
        currentA,
        loadPct: Math.round(loadFactor * 100),
        voltageV: c.phase === 3 ? fluctuate(400, 2) : fluctuate(230, 2),
        powerKW: +(currentA * (c.phase === 3 ? 400 : 230) * (c.phase === 3 ? 1.732 : 1) * 0.92 / 1000).toFixed(2),
        status: loadFactor > 0.9 ? 'overload' : loadFactor > 0.75 ? 'warning' : 'normal',
        tripped: false,
      };
    }),
  };
}

// ── BMS — Batteries (strings + cellules) ─────────────────────────────────────
function getBMSBatteries() {
  const strings = Array.from({ length: 3 }, (_, si) => {
    const cells = Array.from({ length: 12 }, (_, ci) => {
      const voltage = fluctuate(2.18, 0.04);
      const tempC   = fluctuate(25, 2);
      const ok = voltage >= 2.05 && voltage <= 2.35 && tempC < 35;
      return { id: `s${si+1}c${ci+1}`, voltage, tempC, resistance: fluctuate(3.5, 0.8), status: ok ? 'ok' : 'warn' };
    });
    const avgV   = +(cells.reduce((s, c) => s + c.voltage, 0) / cells.length).toFixed(3);
    const maxTemp = Math.max(...cells.map(c => c.tempC));
    return {
      id:          `string-${si + 1}`,
      label:       `Batterie String ${si + 1}`,
      cells,
      voltageV:    +(avgV * 12).toFixed(1),
      currentA:    fluctuate(si === 0 ? 18 : 12, 3),
      capacityAh:  100,
      sohPct:      fluctuate(si === 2 ? 88 : 96, 2),
      socPct:      fluctuate(92, 3),
      maxTempC:    +maxTemp.toFixed(1),
      status:      cells.some(c => c.status !== 'ok') ? 'warning' : 'ok',
      lastInspect: `2026-0${si + 1}-15`,
    };
  });

  return {
    system: 'Schneider Galaxy VX — Batteries Plomb-Acide VRLA',
    totalStrings: strings.length,
    totalCells: strings.length * 12,
    overallSOC: +(strings.reduce((s, b) => s + b.socPct, 0) / strings.length).toFixed(1),
    overallSOH: +(strings.reduce((s, b) => s + b.sohPct, 0) / strings.length).toFixed(1),
    estimatedRuntimeMin: Math.round(fluctuate(28, 4)),
    nextMaintenanceDate: '2026-10-01',
    timestamp: new Date().toISOString(),
    strings,
  };
}

// ── WUE — Water/Power Usage Effectiveness ─────────────────────────────────────
function getWUE() {
  const itLoadKW   = fluctuate(38, 3);
  const coolingKW  = fluctuate(22, 2);
  const upsLossKW  = itLoadKW * 0.04;
  const lightingKW = 0.8;
  const totalFacilityKW = itLoadKW + coolingKW + upsLossKW + lightingKW;
  const pue = +(totalFacilityKW / itLoadKW).toFixed(3);

  return {
    timestamp: new Date().toISOString(),
    itLoadKW,
    coolingKW,
    upsLossKW: +upsLossKW.toFixed(2),
    lightingKW,
    totalFacilityKW: +totalFacilityKW.toFixed(2),
    pue,
    pueTarget: 1.5,
    pueStatus: pue < 1.5 ? 'good' : pue < 1.8 ? 'warning' : 'critical',
    coolingEfficiencyPct: +(100 - (coolingKW / totalFacilityKW) * 100).toFixed(1),
    carbonKgCo2h: +(totalFacilityKW * 0.41).toFixed(2),
    history: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      pue:  +(1.35 + Math.sin(i / 24 * Math.PI) * 0.15 + (Math.random() - 0.5) * 0.05).toFixed(3),
      itKW: +(38 + Math.sin(i / 24 * Math.PI) * 8 + (Math.random() - 0.5) * 3).toFixed(1),
    })),
  };
}

// ── CRAC étendu (HP/BP, compresseur, condensats, filtre) ─────────────────────
function getCRACDetailStatus() {
  return [
    {
      id: 'crac-a', name: 'CRAC-01 Liebert iCOM-S', model: 'Liebert PEX 15kW', status: 'running',
      supplyTempC:        fluctuate(17, 0.5),
      returnTempC:        fluctuate(28, 1),
      setpointC:          18,
      coolingCapacityKW:  fluctuate(15, 0.5),
      powerConsumptionKW: fluctuate(5.2, 0.3),
      airflowM3h:         fluctuate(4500, 100),
      cop:                fluctuate(2.9, 0.2),
      compressor: {
        state:            'running',
        speedPct:         fluctuate(78, 5),
        pressureHighBar:  fluctuate(18.5, 0.5),
        pressureLowBar:   fluctuate(4.2, 0.3),
        superheatK:       fluctuate(8, 1),
        subcoolingK:      fluctuate(5, 0.8),
        dischargeC:       fluctuate(72, 3),
        refrigerant:      'R410A',
      },
      filter: {
        pressureDropPa:   fluctuate(65, 10),
        efficiency:       'G4',
        lastChange:       '2026-02-01',
        nextChange:       '2026-08-01',
        cloggedPct:       fluctuate(40, 8),
      },
      condensate: {
        drainingOk:       true,
        levelMm:          fluctuate(12, 5),
        pumpStatus:       'ok',
        lastDrainCheck:   '2026-04-20',
      },
      alarms: [],
    },
    {
      id: 'crac-b', name: 'CRAC-02 Liebert iCOM-S', model: 'Liebert PEX 12kW', status: 'running',
      supplyTempC:        fluctuate(18, 0.5),
      returnTempC:        fluctuate(30, 1),
      setpointC:          18,
      coolingCapacityKW:  fluctuate(12, 0.5),
      powerConsumptionKW: fluctuate(4.8, 0.3),
      airflowM3h:         fluctuate(4000, 100),
      cop:                fluctuate(2.5, 0.2),
      compressor: {
        state:            'running',
        speedPct:         fluctuate(85, 5),
        pressureHighBar:  fluctuate(19.2, 0.5),
        pressureLowBar:   fluctuate(4.5, 0.3),
        superheatK:       fluctuate(9, 1),
        subcoolingK:      fluctuate(4.5, 0.8),
        dischargeC:       fluctuate(76, 3),
        refrigerant:      'R410A',
      },
      filter: {
        pressureDropPa:   fluctuate(82, 10),
        efficiency:       'G4',
        lastChange:       '2026-01-15',
        nextChange:       '2026-07-15',
        cloggedPct:       fluctuate(58, 8),
      },
      condensate: {
        drainingOk:       true,
        levelMm:          fluctuate(8, 4),
        pumpStatus:       'ok',
        lastDrainCheck:   '2026-04-18',
      },
      alarms: [{ severity: 'warning', msg: 'Filtre encrassement > 55% — contrôle recommandé' }],
    },
  ];
}

module.exports = {
  getSensors, getRoomSummary, getHeatmapGrid, getCRACStatus,
  getPDUStatus, getGensetStatus, getATSStatus,
  getAirQuality, getDifferentialPressure,
  getDoorStatus, getDoorEvents, logDoorEvent,
  getPowerQuality,
  getTGBTCircuits, getBMSBatteries, getWUE, getCRACDetailStatus,
  dewPoint,
};
