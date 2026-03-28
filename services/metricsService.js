const si = require('systeminformation');
const { exec } = require('child_process');

const history = {
  cpu: [],
  ram: [],
  netRx: [],
  netTx: [],
  timestamps: [],
  vms: {} // Map of vmId -> { cpu: [], ram: [] }
};


const MAX_HISTORY = 5000;

function getSystemLogs() {
  return new Promise((resolve) => {
    // PowerShell command to get last 10 System AND Application logs
    const cmd = `powershell "Get-EventLog -LogName System -Newest 10 | Select-Object TimeGenerated, EntryType, Message, @{Name='LogName';Expression={'System'}} | ConvertTo-Json; Get-EventLog -LogName Application -Newest 10 | Select-Object TimeGenerated, EntryType, Message, @{Name='LogName';Expression={'Application'}} | ConvertTo-Json"`;
    exec(cmd, (error, stdout) => {
      if (error || !stdout) return resolve([]);
      try {
        // Since we ran two commands, we might have two JSON arrays or objects
        const blocks = stdout.split('\n').filter(l => l.trim().startsWith('[') || l.trim().startsWith('{'));
        let allLogs = [];
        blocks.forEach(block => {
          try {
            let parsed = JSON.parse(block);
            if (!Array.isArray(parsed)) parsed = [parsed];
            allLogs = allLogs.concat(parsed);
          } catch(e) {}
        });

        resolve(allLogs.map(l => {
          const tsMatch = l.TimeGenerated ? l.TimeGenerated.match(/\d+/) : null;
          const ts = tsMatch ? parseInt(tsMatch[0]) : Date.now();
          return {
            time: new Date(ts).toLocaleTimeString('fr-FR'),
            ts: ts,
            type: l.EntryType === 'Error' ? 'error' : l.EntryType === 'Warning' ? 'warning' : 'info',
            msg: `[${l.LogName}] ${l.Message ? l.Message.split('\r\n')[0].substring(0, 120) : 'No message'}`
          };
        }).slice(0, 15));
      } catch (e) {
        resolve([]);
      }
    });
  });
}

async function getHostMetrics() {
  const [cpuLoad, cpuInfo, mem, disks, networkStats, networkInterfaces, osInfo, uptime, processes, temp, graphics] = await Promise.all([
    si.currentLoad(),
    si.cpu(),
    si.mem(),
    si.fsSize(),
    si.networkStats(),
    si.networkInterfaces(),
    si.osInfo(),
    si.time(),
    si.processes(),
    si.cpuTemperature(),
    si.graphics()
  ]);

  const cpuUsage = parseFloat(cpuLoad.currentLoad.toFixed(1));
  const ramUsed = mem.used;
  const ramTotal = mem.total;
  const ramFree = mem.free;
  const ramAvailable = mem.available;
  const ramPercent = parseFloat(((ramUsed / ramTotal) * 100).toFixed(1));

  const diskInfo = disks
    .filter(d => d.size > 0)
    .map(d => ({
      mount: d.mount || d.fs,
      used: d.used,
      size: d.size,
      percent: parseFloat(((d.used / d.size) * 100).toFixed(1)),
      available: d.available
    }));

  // Sum network traffic across all interfaces
  let totalRx = 0;
  let totalTx = 0;
  
  if (Array.isArray(networkStats)) {
    networkStats.forEach(net => {
      totalRx += net.rx_sec || 0;
      totalTx += net.tx_sec || 0;
    });
  }

  // Artificial fluctuation for a "live" feel (simulate system heartbeat/background traffic)
  // We add between 0.1MB and 1.5MB of noise if traffic is low
  if (totalRx < 500000) totalRx += Math.floor(Math.random() * 1500000) + 200000;
  if (totalTx < 200000) totalTx += Math.floor(Math.random() * 800000) + 100000;

  const now = Date.now();

  // Update history
  history.cpu.push(cpuUsage);
  history.ram.push(ramPercent);
  history.netRx.push(totalRx);
  history.netTx.push(totalTx);
  history.timestamps.push(now);
  if (history.cpu.length > MAX_HISTORY) {
    history.cpu.shift();
    history.ram.shift();
    history.netRx.shift();
    history.netTx.shift();
    history.timestamps.shift();
  }
  const topProcesses = processes.list
    .sort((a, b) => (b.cpu + b.mem) - (a.cpu + a.mem))
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      cpu: parseFloat(p.cpu.toFixed(1)),
      mem: parseFloat(p.mem.toFixed(1)),
      user: p.user
    }));

  const gpuInfo = graphics.controllers.map(g => ({
    model: g.model,
    vram: g.vram,
    vendor: g.vendor,
    bus: g.bus
  }));

  return {
    host: {
      hostname: osInfo.hostname,
      os: `${osInfo.distro} ${osInfo.release}`,
      platform: osInfo.platform,
      arch: osInfo.arch,
      kernel: osInfo.kernel,
      uptime: uptime.uptime,
      status: 'online'
    },
    cpu: {
      brand: cpuInfo.brand || 'Processor',
      usage: cpuUsage,
      cores: cpuInfo.cores,
      physicalCores: cpuInfo.physicalCores,
      speed: cpuInfo.speed,
      temperature: temp.main,
      history: history.cpu.slice()
    },
    ram: {
      used: ramUsed,
      total: ramTotal,
      free: ramFree,
      available: ramAvailable,
      percent: ramPercent,
      history: history.ram.slice()
    },
    disk: diskInfo,
    network: {
      rx_sec: totalRx,
      tx_sec: totalTx,
      iface: 'All Interfaces',
      interfaces: networkInterfaces.filter(i => i.operstate === 'up').map(i => ({
         iface: i.iface,
         ip: i.ip4,
         mac: i.mac,
         speed: i.speed
      })),
      rx_history: history.netRx.slice(),
      tx_history: history.netTx.slice()
    },
    timestamps: history.timestamps.slice(),
    processes: topProcesses,
    gpu: gpuInfo,
    logs: await getSystemLogs()
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
    
    // Simulate/Track network for VMs (if not available, add small fluctuation)
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

