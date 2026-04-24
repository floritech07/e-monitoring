'use strict';
/**
 * Service de simulation des capteurs environnementaux Phase 1
 * Température, hygrométrie, fumée, fuite d'eau par rack
 */

function fluctuate(base, spread = 1) {
  return +(base + (Math.random() - 0.5) * spread * 2).toFixed(1);
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
  'cold-north':  21.0,
  'cold-south':  20.5,
  'hot':         32.0,
  'crac-a':      17.5,
  'crac-b':      18.0,
  'room':        22.0,
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

    let status = 'ok';
    if (temp > 35 || temp < 15) status = 'critical';
    else if (temp > 30 || humidity > 65 || humidity < 30) status = 'warning';

    return {
      ...s,
      timestamp:  new Date().toISOString(),
      tempC:      temp,
      humidity,
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
    maxTempC:     +maxTemp.toFixed(1),
    hotAisleTempC: +hotAisle.toFixed(1),
    avgHumidity:  +avgHum,
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

module.exports = { getSensors, getRoomSummary, getHeatmapGrid, getCRACStatus };
