require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const cron     = require('node-cron');
const { exec } = require('child_process');

const metricsService  = require('./services/metricsService');
const vmwareService   = require('./services/vmwareService');
const alertsService   = require('./services/alertRulesService');   // upgraded
const activityService = require('./services/activityService');
const storageService  = require('./services/storageService');
const veeamService    = require('./services/veeamService');
const networkService  = require('./services/networkService');
const paymentService  = require('./services/paymentService');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
});

app.use(cors());
app.use(express.json());

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
// HOST ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/host/action', (req, res) => {
  const { action } = req.body;
  let cmd = '';
  switch (action) {
    case 'Redémarrage':     cmd = 'shutdown /r /t 5'; break;
    case 'Arrêt':           cmd = 'shutdown /s /t 5'; break;
    case 'Vidage du cache': cmd = 'echo "Nettoyage simulé"'; break;
    case 'Démarrage':       cmd = 'echo "Déjà allumé"'; break;
    default: return res.status(400).json({ error: 'Action inconnue' });
  }
  exec(cmd, (error) => {
    if (error) {
      activityService.log('error', `Échec de l'action [${action}]: ${error.message}`, 'System Host');
    } else {
      activityService.log('success', `Action [${action}] validée par l'OS`, 'System Host');
    }
  });
  activityService.log('warning', `Transmission de l'ordre [${action}] au noyau matériel...`, 'System Host');
  res.json({ success: true, message: `Commande OS exécutée: ${cmd}` });
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
// VEEAM INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/veeam', async (req, res) => {
  try {
    const data = await veeamService.getVeeamData(req.query.refresh === 'true');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message, connected: false, jobs: [], sessions: [], repos: [] });
  }
});

app.post('/api/veeam/jobs/:jobId/action', async (req, res) => {
  try {
    const { action } = req.body; // 'start' | 'stop'
    const result = await veeamService.triggerJobAction(req.params.jobId, action);
    if (result.success) {
      activityService.log('info', `Veeam job ${req.params.jobId} — action: ${action}`, 'Veeam Control');
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Veeam config endpoints
app.get('/api/veeam/config', (req, res) => {
  const cfg = storageService.getVeeamConfig();
  // Never return password
  res.json({ ...cfg, password: cfg.password ? '••••••••' : '' });
});

app.put('/api/veeam/config', (req, res) => {
  const existing = storageService.getVeeamConfig();
  const updated  = {
    ...existing,
    ...req.body,
    // Keep existing password if not provided
    password: req.body.password && req.body.password !== '••••••••'
      ? req.body.password
      : existing.password,
  };
  storageService.saveVeeamConfig(updated);
  activityService.log('info', 'Configuration Veeam mise à jour', 'Settings');
  res.json({ success: true });
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

app.get('/api/reports/backup', async (req, res) => {
  try {
    const veeam = await veeamService.getVeeamData();
    const jobs  = veeam.jobs || [];
    const successJobs = jobs.filter(j => j.lastResult === 'Success').length;

    res.json({
      generatedAt:     new Date().toISOString(),
      connected:       veeam.connected,
      totalJobs:       jobs.length,
      successJobs,
      failedJobs:      jobs.filter(j => j.lastResult === 'Failed').length,
      warningJobs:     jobs.filter(j => j.lastResult === 'Warning').length,
      successRatePct:  jobs.length ? Math.round((successJobs / jobs.length) * 100) : 0,
      jobs:            jobs.map(j => ({
        name:       j.name,
        type:       j.type,
        lastResult: j.lastResult,
        lastRun:    j.lastRun,
        rpoHours:   j.rpoHours,
        status:     j.statusInfo,
      })),
      repos: (veeam.repos || []).map(r => ({
        name:        r.name,
        totalGB:     r.totalSpaceGB,
        freeGB:      r.freeSpaceGB,
        usedPct:     r.usedPct,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// WEBSOCKET
// ─────────────────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`));
});

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST LOOP — every 3 seconds
// ─────────────────────────────────────────────────────────────────────────────

cron.schedule('*/3 * * * * *', async () => {
  try {
    const metrics = await metricsService.getHostMetrics();
    const vms     = await vmwareService.listVMs();

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

    io.emit('metrics_update', {
      metrics,
      vms: vmsWithHistory,
      alerts,
      activity,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error('[Broadcast] Error:', e.message);
  }
});

// ─── Network probe: every 60 seconds ─────────────────────────────────────────
cron.schedule('*/60 * * * * *', async () => {
  try {
    await networkService.probeAll();
    const assets = networkService.getAssetsWithStatus();
    io.emit('network_update', { assets, timestamp: Date.now() });
  } catch (e) {
    console.error('[Network probe] Error:', e.message);
  }
});

// ─── Veeam poll: every 5 minutes ─────────────────────────────────────────────
cron.schedule('0 */5 * * * *', async () => {
  try {
    const veeamData = await veeamService.pollVeeam();
    io.emit('veeam_update', { ...veeamData, timestamp: Date.now() });
  } catch (e) {
    console.error('[Veeam poll] Error:', e.message);
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
// START
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ SBEE Monitor backend running on port ${PORT}`);
  console.log(`   Storage:  ${require('path').join(__dirname, 'data')}`);
  // Run initial network probe in background
  setTimeout(() => networkService.probeAll().catch(() => {}), 2000);
});
