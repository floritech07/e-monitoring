'use strict';
/**
 * metricsService v2 — NexusMonitor
 * Collecte les métriques de la salle serveur SBEE
 * (SNMP → UPS + switches, Redfish → serveurs HPE, ESXi simulation)
 *
 * Suppression scope v1 : supervision PC administrateur (systeminformation)
 * ADR-004 : hors périmètre NexusMonitor v2
 */

const snmpService    = require('./snmpService');
const redfishService = require('./redfishService');
const esxiService    = require('./esxiService');

// ─── Historique léger (pour graphes WebSocket) ────────────────────────────────

const MAX_HISTORY = 120;   // 4 min à 2s/point

const history = {
  ups_charge:     [],
  ups_load:       [],
  esxi_cpu:       [],
  esxi_ram:       [],
  timestamps:     [],
  vms: {},
};

function pushHistory(key, value) {
  history[key].push(value);
  if (history[key].length > MAX_HISTORY) history[key].shift();
}

// ─── Collecte principale ──────────────────────────────────────────────────────

async function getHostMetrics() {
  // Collecter en parallèle sans bloquer si un équipement est hors ligne
  const [snmpData, redfishData, clusters] = await Promise.all([
    snmpService.collectAll().catch(() => ({})),
    redfishService.collectAllServers().catch(() => ({})),
    esxiService.getClusters().catch(() => []),
  ]);

  const now = Date.now();

  // ── UPS ──────────────────────────────────────────────────────────────────────
  const upsEntries = Object.values(snmpData).filter(d => d.type === 'ups');
  const primaryUPS = upsEntries[0] || snmpService.simulateUPS('ups-sukam-01');

  const upsMetrics = {
    count:       upsEntries.length,
    primary:     primaryUPS,
    allOnLine:   upsEntries.every(u => u.status?.input === 'on_line'),
    avgChargePct: upsEntries.length
      ? Math.round(upsEntries.reduce((s, u) => s + (u.battery?.chargePct || 0), 0) / upsEntries.length)
      : primaryUPS.battery?.chargePct || 0,
  };

  // ── Switches ─────────────────────────────────────────────────────────────────
  const switchEntries = Object.values(snmpData).filter(d => d.type === 'switch');
  const switchMetrics = switchEntries.map(sw => ({
    id:       sw.id,
    name:     sw.system?.name || sw.id,
    cpuPct:   sw.resources?.cpuPct || 0,
    ramPct:   sw.resources?.ramPct || 0,
    portCount: sw.system?.portCount || 0,
    upPorts:  (sw.interfaces || []).filter(i => i.status === 'up').length,
    status:   'online',
  }));

  // ── Serveurs hardware ─────────────────────────────────────────────────────────
  const serverEntries = Object.values(redfishData);
  const serversHealthy = serverEntries.every(s => s.system?.status === 'OK');
  const maxCpuTempC = serverEntries.reduce((max, s) => {
    const temps = s.thermal?.cpuTemps?.map(t => t.readingC) || [];
    return Math.max(max, ...temps, 0);
  }, 0);
  const totalConsumedW = serverEntries.reduce((s, srv) => s + (srv.power?.consumedWatts || 0), 0);

  // ── ESXi clusters agrégés ────────────────────────────────────────────────────
  const totalCPU = clusters.reduce((s, c) => s + (c.cpu?.total || 0), 0);
  const usedCPU  = clusters.reduce((s, c) => s + (c.cpu?.used  || 0), 0);
  const totalRAM = clusters.reduce((s, c) => s + (c.ram?.totalGB || 0), 0);
  const usedRAM  = clusters.reduce((s, c) => s + (c.ram?.usedGB  || 0), 0);

  const cpuPct = totalCPU > 0 ? Math.round((usedCPU / totalCPU) * 100) : 0;
  const ramPct = totalRAM > 0 ? Math.round((usedRAM / totalRAM) * 100) : 0;

  // ── Mise à jour historique ────────────────────────────────────────────────────
  pushHistory('ups_charge', upsMetrics.avgChargePct);
  pushHistory('ups_load',   primaryUPS.output?.loadPct || 0);
  pushHistory('esxi_cpu',   cpuPct);
  pushHistory('esxi_ram',   ramPct);
  history.timestamps.push(now);
  if (history.timestamps.length > MAX_HISTORY) history.timestamps.shift();

  // ── Structure de retour (compatible avec le broadcast WebSocket existant) ─────
  return {
    // host → résumé de la salle serveur (remplace les infos PC v1)
    host: {
      hostname:    'SALLE-SERVEUR-SBEE',
      os:          'NexusMonitor v2 / Datacenter Supervision',
      platform:    'datacenter',
      status:      serversHealthy && upsMetrics.allOnLine ? 'online' : 'warning',
      uptime:      Math.floor(process.uptime()),
      location:    'Cotonou, Bénin — DSITD SBEE',
      serversCount: serverEntries.length,
      clustersCount: clusters.length,
      totalConsumedWatts: totalConsumedW,
      maxCpuTempC,
    },
    // cpu → agrégat ESXi clusters
    cpu: {
      brand:   `${clusters.length} Cluster(s) ESXi — ${totalCPU} vCPU total`,
      usage:   cpuPct,
      cores:   totalCPU,
      used:    usedCPU,
      history: history.esxi_cpu.slice(),
    },
    // ram → agrégat ESXi clusters
    ram: {
      total:   totalRAM * 1024 * 1024 * 1024,    // en octets pour compatibilité
      used:    usedRAM  * 1024 * 1024 * 1024,
      percent: ramPct,
      totalGB: totalRAM,
      usedGB:  usedRAM,
      history: history.esxi_ram.slice(),
    },
    // disk → placeholder (Phase 1 : remplacé par storage SNMP)
    disk: [],
    // network → placeholder (Phase 1 : remplacé par SNMP interfaces)
    network: {
      rx_sec: 0,
      tx_sec: 0,
      switches: switchMetrics,
      rx_history: [],
      tx_history: [],
    },
    // Métriques DC spécifiques
    ups:     upsMetrics,
    servers: serverEntries,
    clusters,
    snmp:    snmpData,
    timestamps: history.timestamps.slice(),
    // Compatibilité : pas de processus Windows, pas de logs locaux
    processes: [],
    logs:      [],
    health: {
      score:  serversHealthy && upsMetrics.allOnLine ? 92 : 65,
      status: serversHealthy && upsMetrics.allOnLine ? 'INFRASTRUCTURE SAINE' : 'ATTENTION REQUISE',
      advice: serversHealthy && upsMetrics.allOnLine
        ? 'Tous les équipements opèrent dans les plages nominales. Aucune alarme active.'
        : 'Un ou plusieurs équipements nécessitent une vérification. Consulter les alertes actives.',
    },
  };
}

function updateVMHistory(vms) {
  if (!vms) return;
  vms.forEach(vm => {
    if (!history.vms[vm.id]) {
      history.vms[vm.id] = { cpu: [], ram: [], netRx: [], netTx: [] };
    }
    history.vms[vm.id].cpu.push(vm.cpu?.usage || 0);
    history.vms[vm.id].ram.push(vm.ram?.percent || 0);
    const rx = vm.network?.rx_sec || (vm.state === 'on' ? Math.floor(Math.random() * 500000) + 100000 : 0);
    const tx = vm.network?.tx_sec || (vm.state === 'on' ? Math.floor(Math.random() * 200000) + 50000 : 0);
    history.vms[vm.id].netRx.push(rx);
    history.vms[vm.id].netTx.push(tx);
    if (history.vms[vm.id].cpu.length > MAX_HISTORY) {
      history.vms[vm.id].cpu.shift();
      history.vms[vm.id].ram.shift();
      history.vms[vm.id].netRx.shift();
      history.vms[vm.id].netTx.shift();
    }
  });
}

function getVMHistory(vmId) {
  return history.vms[vmId] || { cpu: [], ram: [], netRx: [], netTx: [] };
}

module.exports = { getHostMetrics, updateVMHistory, getVMHistory };
