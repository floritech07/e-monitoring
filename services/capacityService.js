'use strict';
/**
 * capacityService.js — NexusMonitor v2
 * Gère l'historique long terme et les prédictions (Régression Linéaire)
 * Analyse la saturation du stockage et du CPU à 30/60/90 jours.
 */

const fs = require('fs');
const path = require('path');
const ss = require('simple-statistics');

const DATA_FILE = path.join(__dirname, '..', 'data', 'capacity_history.json');
const RETENTION_DAYS = 365;

/**
 * Structure des données :
 * {
 *   "storage": [ { ts: Date, usedGB: number, totalGB: number }, ... ],
 *   "cpu":     [ { ts: Date, usedPercent: number }, ... ]
 * }
 */

function readHistory() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { storage: [], cpu: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { storage: [], cpu: [] };
  }
}

function saveHistory(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Capacity] Erreur sauvegarde historique:', e.message);
  }
}

/**
 * Enregistre un point de donnée quotidien
 */
function recordDailySnapshot(metrics) {
  const data = readHistory();
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Stockage (agrégat clusters ESXi)
  if (metrics.storage) {
    const entry = { date: now, usedGB: metrics.storage.usedGB, totalGB: metrics.storage.totalGB };
    const last = data.storage[data.storage.length - 1];
    if (!last || last.date !== now) {
      data.storage.push(entry);
    } else {
      data.storage[data.storage.length - 1] = entry; // update today
    }
  }

  // CPU (agrégat clusters ESXi)
  if (metrics.cpu) {
    const entry = { date: now, usedPct: metrics.cpu.usage };
    const last = data.cpu[data.cpu.length - 1];
    if (!last || last.date !== now) {
      data.cpu.push(entry);
    } else {
      data.cpu[data.cpu.length - 1] = entry; // update today
    }
  }

  // Retention
  if (data.storage.length > RETENTION_DAYS) data.storage.shift();
  if (data.cpu.length > RETENTION_DAYS) data.cpu.shift();

  saveHistory(data);
}

/**
 * Calcule la prédiction via régression linéaire
 * @param {Array} points - Array de { date, value }
 * @param {number} targetValue - Valeur cible (ex: 95% ou totalGB)
 * @returns {Object} { daysToSaturation, trendSlope, confidence }
 */
function predictSaturation(points, targetValue) {
  if (points.length < 5) return { error: 'Pas assez de données pour prédire' };

  // Convert dates to numbers (days from start)
  const startTime = new Date(points[0].date).getTime();
  const data = points.map(p => [
    (new Date(p.date).getTime() - startTime) / (1000 * 60 * 60 * 24), // x = jours
    p.value // y = metric
  ]);

  const lnr = ss.linearRegression(data);
  const func = ss.linearRegressionLine(lnr);

  // Pente (slope) : croissance journalière
  const slope = lnr.m;

  if (slope <= 0) return { daysToSaturation: Infinity, slope, message: 'Stable ou décroissant' };

  // Calculer quand func(x) = targetValue
  // targetValue = m * x + b => x = (targetValue - b) / m
  const saturationDay = (targetValue - lnr.b) / lnr.m;
  const currentDay = (Date.now() - startTime) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, Math.round(saturationDay - currentDay));

  return {
    daysRemaining,
    slopePerDay: slope,
    predictionDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString(),
    confidence: points.length > 30 ? 'high' : points.length > 15 ? 'medium' : 'low'
  };
}

function getPlanningReport() {
  const data = readHistory();

  // Storage Planning
  const storagePoints = data.storage.map(p => ({ date: p.date, value: p.usedGB }));
  const totalGB = data.storage.length ? data.storage[data.storage.length - 1].totalGB : 0;
  const storagePred = predictSaturation(storagePoints, totalGB * 0.95); // Seuil 95%

  // CPU Planning
  const cpuPoints = data.cpu.map(p => ({ date: p.date, value: p.usedPct }));
  const cpuPred = predictSaturation(cpuPoints, 90); // Seuil 90%

  return {
    history: data,
    storage: {
      currentUsedGB: storagePoints.length ? storagePoints[storagePoints.length - 1].value : 0,
      totalGB,
      prediction: storagePred
    },
    cpu: {
      currentUsedPct: cpuPoints.length ? cpuPoints[cpuPoints.length - 1].value : 0,
      prediction: cpuPred
    }
  };
}

module.exports = { recordDailySnapshot, getPlanningReport };
