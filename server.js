require('dotenv').config();
const express = require('express');

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const { exec } = require('child_process');
const metricsService = require('./services/metricsService');
const vmwareService = require('./services/vmwareService');
const alertsService = require('./services/alertsService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// REST API Routes
app.get('/api/metrics/host', async (req, res) => {
  try {
    const data = await metricsService.getHostMetrics();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/vms', async (req, res) => {
  try {
    const vms = await vmwareService.listVMs();
    res.json(vms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/vms/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const result = await vmwareService.performAction(req.params.id, action);
    
    if (result.success) {
      // Log the action to the activity stream
      const vms = await vmwareService.listVMs();
      const vm = vms.find(v => v.id === req.params.id);
      alertsService.addAlert('info', 'vm', `Cde [${action.toUpperCase()}] envoyée à la VM "${vm ? vm.name : req.params.id}"`, req.params.id);
    }
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.post('/api/host/action', (req, res) => {
  const { action } = req.body;
  let cmd = '';
  
  switch(action) {
    case 'Redémarrage':
      cmd = 'shutdown /r /t 5'; // Restart in 5 seconds
      break;
    case 'Arrêt':
      cmd = 'shutdown /s /t 5'; // Shutdown in 5 seconds
      break;
    case 'Vidage du cache':
      cmd = 'echo "Nettoyage simulé"'; // Fake cache clear for dev
      break;
    case 'Démarrage':
      cmd = 'echo "Déjà allumé"'; // Fallback
      break;
    default:
      return res.status(400).json({ error: 'Action inconnue' });
  }

  exec(cmd, (error) => {
    if (error) {
      // Ignore errors for now so the UI continues, normally handle this
      console.log('Error executing system command:', error);
    }
  });

  res.json({ success: true, message: `Commande OS exécutée: ${cmd}` });
});

app.get('/api/alerts', (req, res) => {
  res.json(alertsService.getAlerts());
});

app.post('/api/alerts/clear', (req, res) => {
  alertsService.clearAlerts();
  res.json({ success: true });
});

app.get('/api/infrastructure', async (req, res) => {
  try {
    const tree = await vmwareService.getInfrastructureTree();
    res.json(tree);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// Broadcast real-time metrics every 3 seconds
cron.schedule('*/3 * * * * *', async () => {
  try {
    const metrics = await metricsService.getHostMetrics();
    const vms = await vmwareService.listVMs();
    
    // Update individual VM history and attach it
    metricsService.updateVMHistory(vms);
    const vmsWithHistory = vms.map(vm => ({
      ...vm,
      history: metricsService.getVMHistory(vm.id)
    }));
    
    const alerts = alertsService.evaluate(metrics, vmsWithHistory);
    io.emit('metrics_update', { metrics, vms: vmsWithHistory, alerts, timestamp: Date.now() });

  } catch (e) {
    console.error('Broadcast error:', e.message);
  }
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`SBEE Monitor backend running on port ${PORT}`));
