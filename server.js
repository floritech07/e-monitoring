require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const cron     = require('node-cron');
const { exec } = require('child_process');

const metricsService    = require('./services/metricsService');
const vmwareService     = require('./services/virtualizationService');  // universal hypervisor detection
const alertsService     = require('./services/alertRulesService');   // upgraded
const activityService   = require('./services/activityService');
const storageService    = require('./services/storageService');
const networkService    = require('./services/networkService');
const paymentService    = require('./services/paymentService');
const veeamService      = require('./services/veeamService');
const datacenterService = require('./services/datacenterService');
const esxiService       = require('./services/esxiService');
const servicesMapService= require('./services/servicesMapService');
const storageTopoService= require('./services/storageTopoService');
const snmpService       = require('./services/snmpService');
const redfishService    = require('./services/redfishService');
const cmdbService       = require('./services/cmdbService');
const alertEngine       = require('./services/alertEngineService');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
});

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// SELF-HEALING & PERMISSIONS (Windows Auto-Setup)
// ─────────────────────────────────────────────────────────────────────────────

async function checkHostPermissions() {
  if (process.platform !== 'win32') return;

  console.log('[Security] 🛡️ Vérification des permissions de l\'hôte...');
  
  return new Promise((resolve) => {
    // Check for Admin Rights
    exec('net session', (err) => {
      const isAdmin = !err;
      const port = process.env.PORT || 3001;

      if (!isAdmin) {
        console.warn('\n[Security] ⚠️  ATTENTION: L\'application ne tourne pas en mode ADMINISTRATEUR.');
        console.warn('   Certaines métriques (TPM, Hyper-V, SMART) seront manquantes.');
        console.warn('   Le pare-feu ne pourra pas être configuré automatiquement.\n');
        return resolve();
      }

      console.log('[Security] ✅ Droits Administrateur détectés.');
      
      // Auto-configure Firewall & ExecutionPolicy via PowerShell
      const setupCmd = `powershell -Command "
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force;
        if (!(Get-NetFirewallRule -DisplayName 'SBEE-Monitor-API' -ErrorAction SilentlyContinue)) {
          New-NetFirewallRule -DisplayName 'SBEE-Monitor-API' -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port}
        }
        if (!(Get-NetFirewallRule -DisplayName 'SBEE-Monitor-UI' -ErrorAction SilentlyContinue)) {
          New-NetFirewallRule -DisplayName 'SBEE-Monitor-UI' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173
        }
      "`;

      exec(setupCmd, (setupErr) => {
        if (setupErr) {
          console.error('[Security] ❌ Erreur lors de l\'auto-configuration:', setupErr.message);
        } else {
          console.log('[Security] 🌐 Pare-feu et Politiques d\'exécution configurés automatiquement.');
        }
        resolve();
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HOST METRICS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/metrics/host', async (req, res) => {
  try {
    res.json(await metricsService.getHostMetrics());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL MACHINES
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/vms', async (req, res) => {
  try {
    res.json(await vmwareService.listVMs());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── System Scan & Hypervisor Detection ──────────────────────────────────────

app.get('/api/system/scan', async (req, res) => {
  try {
    res.json(await vmwareService.getSystemScanReport());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/system/hypervisors', async (req, res) => {
  try {
    const hv = await vmwareService.detectHypervisors();
    res.json(hv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/vms/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const result     = await vmwareService.performAction(req.params.id, action);

    if (result.success) {
      const vms = await vmwareService.listVMs();
      const vm  = vms.find(v => v.id === req.params.id);
      alertsService.addExternalAlert({
        level:    'info',
        severity: 'info',
        category: 'vm',
        message:  `Commande [${action.toUpperCase()}] envoyée à la VM "${vm ? vm.name : req.params.id}"`,
        source:   req.params.id,
        ruleId:   `vmaction_${req.params.id}_${action}`,
      });
      activityService.log('info', `Action ${action.toUpperCase()} initiée sur ${vm ? vm.name : req.params.id}`, 'VMWare Control');
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HOST ACTIONS — v2 : actions sur infrastructure DC (hors scope : actions PC local)
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/host/action', (_req, res) => {
  // Actions PC administrateur supprimées (ADR-004 — hors périmètre NexusMonitor v2)
  res.status(410).json({ error: 'Actions PC local supprimées en v2. Utilisez /api/esxi/vms/:id/action pour les VMs.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/alerts', (req, res) => {
  res.json(alertsService.getAlerts());
});

app.get('/api/alerts/all', (req, res) => {
  const limit = parseInt(req.query.limit) || 200;
  res.json(alertsService.getAllAlerts(limit));
});

app.get('/api/alerts/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(storageService.getAlertHistory(limit));
});

app.post('/api/alerts/clear', (req, res) => {
  alertsService.clearAlerts();
  res.json({ success: true });
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { user, comment } = req.body;
  const result = alertsService.acknowledgeAlert(parseInt(req.params.id), user || 'Opérateur', comment || '');
  if (!result) return res.status(404).json({ error: 'Alerte non trouvée' });
  activityService.log('info', `Alerte #${req.params.id} acquittée par ${user || 'Opérateur'}`, 'Alert Manager');
  res.json(result);
});

// ─────────────────────────────────────────────────────────────────────────────
// ALERT RULES (CRUD)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/rules', (req, res) => {
  res.json(storageService.getRules());
});

app.post('/api/rules', (req, res) => {
  const rule = storageService.addRule(req.body);
  activityService.log('info', `Règle d'alerte créée: "${rule.id}"`, 'Alert Rules');
  res.status(201).json(rule);
});

app.put('/api/rules/:id', (req, res) => {
  const rule = storageService.updateRule(req.params.id, req.body);
  if (!rule) return res.status(404).json({ error: 'Règle non trouvée' });
  activityService.log('info', `Règle d'alerte modifiée: "${req.params.id}"`, 'Alert Rules');
  res.json(rule);
});

app.delete('/api/rules/:id', (req, res) => {
  storageService.deleteRule(req.params.id);
  activityService.log('info', `Règle d'alerte supprimée: "${req.params.id}"`, 'Alert Rules');
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SILENCES
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/silences', (req, res) => {
  res.json(storageService.getSilences());
});

app.post('/api/silences', (req, res) => {
  const silence = storageService.addSilence(req.body);
  activityService.log('info', `Silence créé pour "${req.body.category}" (${req.body.durationMs / 60_000} min)`, 'Alert Silence');
  res.status(201).json(silence);
});

app.delete('/api/silences/:id', (req, res) => {
  storageService.removeSilence(req.params.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/activity', (req, res) => {
  res.json(activityService.getActivities());
});

// ─────────────────────────────────────────────────────────────────────────────
// INFRASTRUCTURE TREE
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/infrastructure', async (req, res) => {
  try {
    res.json(await vmwareService.getInfrastructureTree());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL ENDPOINTS (vCenter, ESXi, Hyper-V)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/endpoints', (req, res) => {
  res.json(storageService.getEndpoints());
});

app.post('/api/endpoints', (req, res) => {
  const endpoint = storageService.addEndpoint(req.body);
  activityService.log('info', `Nouveau point d'accès infrastructure ajouté: ${endpoint.name} (${endpoint.type})`, 'Infrastructure');
  res.status(201).json(endpoint);
});

app.delete('/api/endpoints/:id', (req, res) => {
  storageService.deleteEndpoint(req.params.id);
  activityService.log('info', `Point d'accès infrastructure supprimé: ${req.params.id}`, 'Infrastructure');
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// TERMINAL
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/terminal/exec', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Commande vide' });
  activityService.log('info', `Commande terminal: ${command}`, 'Terminal Interface');
  exec(command, (error, stdout, stderr) => {
    res.json({
      success:   !error,
      output:    stdout || stderr || (error ? error.message : 'Action exécutée sans retour console.'),
      timestamp: new Date().toLocaleTimeString('fr-FR')
    });
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// VEEAM BACKUP CONFIG & ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/veeam', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    res.json(await veeamService.getVeeamData(refresh));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/veeam/config', (req, res) => {
  res.json(storageService.getVeeamConfig());
});

app.put('/api/veeam/config', (req, res) => {
  storageService.saveVeeamConfig(req.body);
  res.json({ success: true });
});

app.post('/api/veeam/jobs/:id/action', async (req, res) => {
  try {
    const result = await veeamService.triggerJobAction(req.params.id, req.body.action);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/backup', async (req, res) => {
  try {
    const data = await veeamService.getVeeamData();
    res.json({
      generatedAt: new Date().toISOString(),
      jobs: data.jobs,
      summary: {
        total: data.jobs.length,
        success: data.jobs.filter(j => j.statusInfo.severity === 'success').length,
        failures: data.jobs.filter(j => j.statusInfo.severity === 'critical').length
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// NETWORK ASSETS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/network/assets', (req, res) => {
  res.json(networkService.getAssetsWithStatus());
});

app.post('/api/network/assets', (req, res) => {
  const asset = storageService.saveAsset(req.body);
  activityService.log('info', `Asset réseau ajouté: "${req.body.name}"`, 'Network Assets');
  res.status(201).json(asset);
});

app.put('/api/network/assets/:id', (req, res) => {
  const asset = storageService.saveAsset({ ...req.body, id: req.params.id });
  res.json(asset);
});

app.delete('/api/network/assets/:id', (req, res) => {
  storageService.deleteAsset(req.params.id);
  res.json({ success: true });
});

app.post('/api/network/assets/:id/probe', async (req, res) => {
  try {
    const assets = storageService.getAssets();
    const asset  = assets.find(a => a.id === req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset non trouvé' });
    const result = await networkService.probeAsset(asset);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/network/assets/:id/history', (req, res) => {
  res.json(networkService.getAssetHistory(req.params.id));
});

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT MONITORING
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/payments/trends/prepaid', async (req, res) => {
  try {
    const data = await paymentService.getPrepaidTrend(req.query.range);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/payments/trends/postpaid', async (req, res) => {
  try {
    const data = await paymentService.getPostpaidTrend(req.query.range);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/payments/stats', async (req, res) => {
  try {
    const data = await paymentService.getTrends();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PAYMENT RULES (CRUD) ────────────────────────────────────────────────────

app.get('/api/payments/rules', (req, res) => {
  res.json(storageService.getPaymentRules());
});

app.post('/api/payments/rules', (req, res) => {
  const rules = storageService.getPaymentRules();
  const rule  = { ...req.body, id: `payrule_${Date.now()}` };
  rules.push(rule);
  storageService.savePaymentRules(rules);
  activityService.log('info', `Règle de paiement ajoutée: ${rule.id}`, 'Payment Monitor');
  res.status(201).json(rule);
});

app.put('/api/payments/rules/:id', (req, res) => {
  let rules = storageService.getPaymentRules();
  const idx = rules.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Règle non trouvée' });
  rules[idx] = { ...rules[idx], ...req.body };
  storageService.savePaymentRules(rules);
  res.json(rules[idx]);
});

app.delete('/api/payments/rules/:id', (req, res) => {
  let rules = storageService.getPaymentRules().filter(r => r.id !== req.params.id);
  storageService.savePaymentRules(rules);
  res.json({ success: true });
});


// ─────────────────────────────────────────────────────────────────────────────
// TOPOLOGY
// ─────────────────────────────────────────────────────────────────────────────

let cachedMetrics = null;
let cachedVMs     = [];

app.get('/api/network/topology', async (req, res) => {
  try {
    const graph = networkService.getTopologyGraph(cachedMetrics, cachedVMs);
    res.json(graph);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS (basic availability summary)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/reports/availability', (req, res) => {
  const assets  = networkService.getAssetsWithStatus();
  const online  = assets.filter(a => a.probeStatus === 'online').length;
  const total   = assets.length;
  const hostUp  = cachedMetrics ? 1 : 0;

  res.json({
    generatedAt: new Date().toISOString(),
    period:      req.query.period || '24h',
    hostUptime:  cachedMetrics?.host?.uptime || null,
    hostStatus:  cachedMetrics ? 'online' : 'unknown',
    networkAssets: {
      total,
      online,
      offline: total - online,
      availabilityPct: total > 0 ? Math.round((online / total) * 100 * 10) / 10 : 100,
    },
    vmsTotal:   cachedVMs.length,
    vmsOnline:  cachedVMs.filter(v => v.state === 'on').length,
    alerts:     {
      active:   alertsService.getAlerts().length,
      critical: alertsService.getAlerts().filter(a => a.severity === 'critical').length,
    },
    assets: assets.map(a => ({
      id:             a.id,
      name:           a.name,
      ip:             a.ip,
      type:           a.type,
      status:         a.probeStatus,
      latency:        a.latency,
      lastProbed:     a.lastProbed,
    })),
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// DATACENTER TOPOLOGY (Rooms / Racks / Devices) — alimente le viewer 3D
// ─────────────────────────────────────────────────────────────────────────────

function broadcastTopology() {
  io.emit('topology_update', {
    datacenter: datacenterService.getDatacenter(),
    timestamp: Date.now()
  });
}

app.get('/api/datacenter', (req, res) => {
  try {
    res.json(datacenterService.getDatacenter());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/datacenter/device-types', (req, res) => {
  res.json(datacenterService.getDeviceTypes());
});

app.put('/api/datacenter', (req, res) => {
  try {
    const dc = datacenterService.updateDatacenterMeta(req.body);
    activityService.log('info', `Méta-données datacenter mises à jour`, 'Datacenter');
    broadcastTopology();
    res.json(dc);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/datacenter/rooms/:roomId', (req, res) => {
  try {
    const room = datacenterService.updateRoom(req.params.roomId, req.body);
    activityService.log('info', `Salle "${room.name}" mise à jour`, 'Datacenter');
    broadcastTopology();
    res.json(room);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/datacenter/rooms/:roomId/racks', (req, res) => {
  try {
    const rack = datacenterService.addRack(req.params.roomId, req.body);
    activityService.log('success', `Rack "${rack.name}" ajouté (${rack.uHeight}U)`, 'Datacenter');
    broadcastTopology();
    res.status(201).json(rack);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/datacenter/racks/:rackId', (req, res) => {
  try {
    const rack = datacenterService.updateRack(req.params.rackId, req.body);
    activityService.log('info', `Rack "${rack.name}" modifié`, 'Datacenter');
    broadcastTopology();
    res.json(rack);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/datacenter/racks/:rackId', (req, res) => {
  try {
    datacenterService.deleteRack(req.params.rackId);
    activityService.log('warning', `Rack ${req.params.rackId} supprimé`, 'Datacenter');
    broadcastTopology();
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/datacenter/racks/:rackId/devices', (req, res) => {
  try {
    const device = datacenterService.addDevice(req.params.rackId, req.body);
    activityService.log('success', `Équipement "${device.name}" monté en U${device.uStart}`, 'Datacenter');
    broadcastTopology();
    res.status(201).json(device);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/datacenter/devices/:deviceId', (req, res) => {
  try {
    const device = datacenterService.updateDevice(req.params.deviceId, req.body);
    activityService.log('info', `Équipement "${device.name}" modifié`, 'Datacenter');
    broadcastTopology();
    res.json(device);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/datacenter/devices/:deviceId', (req, res) => {
  try {
    datacenterService.deleteDevice(req.params.deviceId);
    activityService.log('warning', `Équipement ${req.params.deviceId} retiré`, 'Datacenter');
    broadcastTopology();
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ESXi / Clusters / Virtualisation
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/esxi/clusters', async (req, res) => {
  try { res.json(await esxiService.getClusters()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/esxi/hosts', async (req, res) => {
  try { res.json(await esxiService.getHosts()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/esxi/hosts/:id', async (req, res) => {
  try {
    const host = await esxiService.getHost(req.params.id);
    if (!host) return res.status(404).json({ error: 'Hôte non trouvé' });
    res.json(host);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/esxi/hosts/:id/vms', async (req, res) => {
  try { res.json(await esxiService.getHostVMs(req.params.id)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/esxi/hosts/:id/storage', async (req, res) => {
  try { res.json(await esxiService.getHostStorage(req.params.id)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/esxi/hosts/:id/network', async (req, res) => {
  try { res.json(await esxiService.getHostNetwork(req.params.id)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/esxi/hosts/:id/perf', async (req, res) => {
  try { res.json(await esxiService.getHostPerfHistory(req.params.id)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/esxi/vms/:id/action', async (req, res) => {
  try {
    const result = await esxiService.esxiVmAction(req.params.id, req.body.action);
    if (result.success) activityService.log('info', result.message, 'ESXi');
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// Services Métier (Service Map)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/services-map', (req, res) => {
  try { res.json(servicesMapService.getServices()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/services-map', (req, res) => {
  try { res.json(servicesMapService.saveService(req.body)); } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/services-map/:id', (req, res) => {
  try { res.json(servicesMapService.saveService({ ...req.body, id: req.params.id })); } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/services-map/:id', (req, res) => {
  try { servicesMapService.deleteService(req.params.id); res.json({ success: true }); } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// Topologie Stockage
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/storage/topology', (req, res) => {
  try { res.json(storageTopoService.getStorageTopology()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/storage/stats', (req, res) => {
  try { res.json(storageTopoService.getStorageStats()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SNMP — UPS & Switches
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/snmp/collect', async (_req, res) => {
  try { res.json(await snmpService.collectAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/snmp/ups/:id', async (req, res) => {
  try { res.json(await snmpService.pollUPS(req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/snmp/switch/:id', async (req, res) => {
  try { res.json(await snmpService.pollSwitch(req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REDFISH — Serveurs HPE ProLiant (iLO)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/redfish/servers', async (_req, res) => {
  try { res.json(await redfishService.collectAllServers()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/redfish/servers/:id', async (req, res) => {
  try {
    const srv = await redfishService.getServer(req.params.id);
    if (!srv) return res.status(404).json({ error: 'Serveur non trouvé' });
    res.json(srv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/redfish/servers/:id/thermal', async (req, res) => {
  try {
    const t = await redfishService.getServerThermal(req.params.id);
    if (!t) return res.status(404).json({ error: 'Serveur non trouvé' });
    res.json(t);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/redfish/servers/:id/power', async (req, res) => {
  try {
    const p = await redfishService.getServerPower(req.params.id);
    if (!p) return res.status(404).json({ error: 'Serveur non trouvé' });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// CMDB — Inventaire Configuration Items
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/cmdb', (req, res) => {
  try { res.json(cmdbService.getAllItems(req.query)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/cmdb/stats', (_req, res) => {
  try { res.json(cmdbService.getStats()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/cmdb/:id', (req, res) => {
  const item = cmdbService.getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'CI non trouvé' });
  res.json(item);
});

app.get('/api/cmdb/:id/tree', (req, res) => {
  const tree = cmdbService.getRelationTree(req.params.id);
  if (!tree) return res.status(404).json({ error: 'CI non trouvé' });
  res.json(tree);
});

app.get('/api/cmdb/:id/children', (req, res) => {
  res.json(cmdbService.getItemChildren(req.params.id));
});

app.post('/api/cmdb', (req, res) => {
  try {
    const item = cmdbService.createItem(req.body);
    activityService.log('info', `CMDB : CI créé "${item.name}" (${item.type})`, 'CMDB');
    res.status(201).json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/cmdb/:id', (req, res) => {
  try {
    const item = cmdbService.updateItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'CI non trouvé' });
    activityService.log('info', `CMDB : CI modifié "${item.name}"`, 'CMDB');
    res.json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/cmdb/:id', (req, res) => {
  const ok = cmdbService.deleteItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'CI non trouvé' });
  activityService.log('warning', `CMDB : CI supprimé ${req.params.id}`, 'CMDB');
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALERT ENGINE v2 — 4 niveaux ITIL, escalade, acquittement
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/alerts/active', (_req, res) => {
  res.json(alertEngine.getActiveAlerts());
});

app.get('/api/alerts/engine/stats', (_req, res) => {
  res.json(alertEngine.getStats());
});

app.get('/api/alerts/engine/history', (_req, res) => {
  res.json(alertEngine.getAlertHistory());
});

app.post('/api/alerts/engine/:key/ack', (req, res) => {
  const alert = alertEngine.acknowledgeAlert(req.params.key, req.body.user || 'Opérateur');
  if (!alert) return res.status(404).json({ error: 'Alerte non trouvée' });
  activityService.log('info', `Alerte acquittée par ${req.body.user || 'Opérateur'}`, 'Alert Engine');
  res.json(alert);
});

// Health check endpoint (utilisé par docker-compose healthcheck)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// WEBSOCKET
// ─────────────────────────────────────────────────────────────────────────────

// Injecter Socket.IO dans le moteur d'alertes v2
alertEngine.setIO(io);

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.emit('topology_update', {
    datacenter: datacenterService.getDatacenter(),
    timestamp: Date.now()
  });
  // Envoyer l'état des alertes actives au nouveau client
  socket.emit('alerts_state', {
    active:  alertEngine.getActiveAlerts(),
    stats:   alertEngine.getStats(),
    timestamp: Date.now()
  });
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`));
});

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST LOOP — every 2 seconds (Reduced from 1s for better PC performance)
// ─────────────────────────────────────────────────────────────────────────────

cron.schedule('*/2 * * * * *', async () => {
  try {
    const metrics = await metricsService.getHostMetrics();
    const vms     = await vmwareService.listVMs();

    // Detect state changes on VMs
    vms.forEach(vm => {
      const cached = cachedVMs.find(c => c.id === vm.id);
      if (cached && cached.state !== vm.state) {
        const actionText = vm.state === 'on' ? 'démarrée' : 'arrêtée';
        const type = vm.state === 'on' ? 'success' : 'warning';
        activityService.log(type, `La VM "${vm.name}" a été ${actionText} (Détection système)`, 'VM Monitor');
      }
    });

    metricsService.updateVMHistory(vms);
    const vmsWithHistory = vms.map(vm => ({
      ...vm,
      history: metricsService.getVMHistory(vm.id)
    }));

    // Cache for topology & reports
    cachedMetrics = metrics;
    cachedVMs     = vmsWithHistory;

    const alerts   = alertsService.evaluate(metrics, vmsWithHistory);
    const activity = activityService.getActivities();

    // Alimenter le moteur d'alertes v2 avec les métriques datacenter aplaties
    if (metrics.ups?.primary) {
      const u = metrics.ups.primary;
      alertEngine.evaluate({
        'ups.battery.chargePct':    u.battery?.chargePct,
        'ups.battery.temperatureC': u.battery?.temperatureC,
        'ups.output.loadPct':       u.output?.loadPct,
        'ups.status.input':         u.status?.input,
      }, u.id || 'ups-sukam-01');
    }

    io.emit('metrics_update', {
      metrics,
      vms: vmsWithHistory,
      alerts,
      alertsV2: alertEngine.getStats(),
      activity,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error('[Broadcast] Error:', e.message);
  }
});

// ─── Network probe: every 60 seconds ─────────────────────────────────────────
let lastNetworkAssets = [];
cron.schedule('*/60 * * * * *', async () => {
  try {
    await networkService.probeAll();
    const assets = networkService.getAssetsWithStatus();
    
    // Detect network status changes
    assets.forEach(asset => {
      const prev = lastNetworkAssets.find(a => a.id === asset.id);
      if (prev && prev.probeStatus !== asset.probeStatus) {
        const type = asset.probeStatus === 'online' ? 'success' : (asset.probeStatus === 'offline' ? 'error' : 'warning');
        const actionText = asset.probeStatus === 'online' ? 'établie' : (asset.probeStatus === 'offline' ? 'perdue' : 'instable');
        activityService.log(type, `Connexion avec "${asset.name}" (${asset.ip}) ${actionText}`, 'Network Monitor');
      }
    });
    lastNetworkAssets = JSON.parse(JSON.stringify(assets));

    io.emit('network_update', { assets, timestamp: Date.now() });
  } catch (e) {
    console.error('[Network probe] Error:', e.message);
  }
});


// ─── Payment evaluation: every 5 minutes ─────────────────────────────────────
cron.schedule('0 */5 * * * *', async () => {
  try {
    await paymentService.evaluateTransactions();
    const prepaid = await paymentService.getPrepaidTrend();
    const postpaid = await paymentService.getPostpaidTrend();
    io.emit('payment_update', { prepaid, postpaid, timestamp: Date.now() });
  } catch (e) {
    console.error('[Payment evaluation] Error:', e.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FRONTEND SERVING (PRODUCTION MODE)
// ─────────────────────────────────────────────────────────────────────────────
const path = require('path');
const frontendPath = path.join(__dirname, 'frontend', 'dist');

// If the frontend has been built, serve it statically!
app.use(express.static(frontendPath));

// Catch-all route to serve index.html for React Router (Single Page Application)
// Note: Express v5 uses '/{*path}' instead of '*'
app.get('/{*path}', (req, res) => {
  // Only serve index.html for non-API routes
  const fs = require('fs');
  if (!req.path.startsWith('/api/') && fs.existsSync(path.join(frontendPath, 'index.html'))) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint not found or Frontend not built.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ SBEE Monitor backend running on port ${PORT}`);
  console.log(`   Storage:  ${require('path').join(__dirname, 'data')}`);
  console.log(`   Machine:  ${process.platform}/${process.arch} - ${require('os').hostname()}`);
  
  // Run Self-Healing
  await checkHostPermissions();
  
  // Run initial network probe in background
  setTimeout(() => networkService.probeAll().catch(() => {}), 3000);
});
