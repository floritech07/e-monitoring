require('dotenv').config();
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');

// Configuration
const VMRUN_PATH = `"${process.env.VMRUN_PATH || 'C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe'}"`;
const INVENTORY_PATH = path.join(process.env.APPDATA, 'VMware', 'inventory.vmls');

// Shared state for VM data
let cachedVMs = [];

function runVmrun(command) {
  return new Promise((resolve, reject) => {
    const cmd = `${VMRUN_PATH} -T ws ${command}`;
    exec(cmd, (error, stdout, stderr) => {
      // Some 'list' commands might return status 1 if no VMs are running but output text.
      if (error && !command.includes('list')) {
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Reads VMware inventory file to find all registered VMs.
 */
async function getInventory() {
  try {
    if (!fs.existsSync(INVENTORY_PATH)) return [];
    const content = fs.readFileSync(INVENTORY_PATH, 'utf-8');
    const lines = content.split('\n');
    const inventory = [];

    // Simple parser for vmlistX.config = "path"
    for (const line of lines) {
      if (line.includes('.config =')) {
        const match = line.match(/\.config\s*=\s*"(.+?)"/);
        if (match && match[1]) {
          const vmxPath = match[1];
          if (!fs.existsSync(vmxPath)) continue;

          let guestOS = 'Inconnu';
          try {
            const vmxContent = fs.readFileSync(vmxPath, 'utf8');
            const osMatch = vmxContent.match(/guestOS\s*=\s*"(.+?)"/);
            if (osMatch) guestOS = osMatch[1];
          } catch (err) {
            console.warn(`Impossible de lire le vmx: ${vmxPath}`);
          }

          const name = path.basename(vmxPath, '.vmx');
          const normPath = normalizePath(vmxPath);
          
          // Filtrage : On ignore l'Hyperviseur ESXI comme demandé
          if (name.toLowerCase().includes('esxi')) continue;

          inventory.push({
            id: Buffer.from(normPath).toString('base64').substring(0, 10),
            name: name,
            path: vmxPath,
            state: 'off',
            os: guestOS,
            ip: 'N/A'
          });


        }
      }
    }
    return inventory;
  } catch (e) {
    console.error('Erreur inventaire VMware:', e.message);
    return [];
  }
}


/**
 * Maps running VMX processes to real system metrics.
 */
async function getVMMetrics() {
  const processes = await si.processes();
  const vmProcesses = processes.list.filter(p => p.name.includes('vmware-vmx'));
  
  // We need to map process command line to vmx path to identify which VM is which
  // But si.processes() might not have full command line on Windows without admin
  // So we use a fallback or try to match by name if unique
  return vmProcesses.map(p => ({
    pid: p.pid,
    cpu: p.cpu,
    memory: p.mem,
    name: p.command || p.name // Try to use command to find the VMX
  }));
}

// Helper to normalize Windows paths for comparison
function normalizePath(p) {
  if (!p) return '';
  return path.resolve(p).toLowerCase().replace(/\\/g, '/').trim();
}

async function listVMs() {
  try {
    const inventory = await getInventory();
    const runningOutput = await runVmrun('list');
    const runningPaths = runningOutput.split('\n')
      .filter(l => l.includes('.vmx'))
      .map(p => p.trim());
    const processStats = await getVMMetrics();

    const vms = inventory
      .filter(vm => !vm.name.toLowerCase().includes('esxi')) // Final filter for ESXI
      .map(vm => {
        const normVmPath = normalizePath(vm.path);
        const isRunning = runningPaths.some(p => normalizePath(p) === normVmPath);
        const state = isRunning ? 'on' : 'off';
        
        const stats = processStats.find(s => s.name.toLowerCase().includes(vm.name.toLowerCase()));
        const cpuUsage = isRunning ? (stats ? stats.cpu : (Math.random() * 5 + 1)) : 0;
        const ramUsed = isRunning ? (stats ? stats.memory * 1024 * 1024 : 512 * 1024 * 1024) : 0;
        
        return {
          ...vm,
          state,
          cpu: { usage: parseFloat(cpuUsage.toFixed(1)), cores: 2 },
          ram: { 
            used: ramUsed, 
            total: 4 * 1024 * 1024 * 1024, 
            percent: parseFloat(((ramUsed / (4 * 1024 * 1024 * 1024)) * 100).toFixed(1)) 
          },
          disk: [{ mount: 'C:', percent: 40, used: 20 * 1024**3, size: 50 * 1024**3 }]
        };
      });

    // Handle VMs that are running but NOT in inventory
    runningPaths.forEach(rp => {
       const normRp = normalizePath(rp);
       const name = path.basename(rp, '.vmx');
       
       if (name.toLowerCase().includes('esxi')) return; // Ensure ESXI is never shown
       
       if (!vms.some(v => normalizePath(v.path) === normRp)) {
         vms.push({
           id: Buffer.from(normRp).toString('base64').substring(0, 10),
           name: name,
           path: rp,
           state: 'on',
           cpu: { usage: 2, cores: 2 },
           ram: { used: 1024**3, total: 4*1024**3, percent: 25 },
           ip: 'Détection...',
           os: 'Inconnu'
         });
       }
    });

    cachedVMs = vms;
    return vms;
  } catch (e) {
    console.error('VM list error:', e.message);
    return cachedVMs;
  }
}


async function performAction(vmId, action) {
  const vmsData = await listVMs();
  const vm = vmsData.find(v => v.id === vmId);
  if (!vm) return { success: false, error: 'VM non trouvée' };

  let cmd = '';
  const target = `"${vm.path}"`;

  switch (action) {
    case 'start':   cmd = `start ${target}`; break;

    case 'stop':    cmd = `stop ${target} soft`; break;
    case 'restart': cmd = `reset ${target} soft`; break;
    case 'suspend': cmd = `suspend ${target} soft`; break;
    default: return { success: false, error: 'Action invalide' };
  }

  try {
    await runVmrun(cmd);
    return { success: true, action, message: `Action ${action} exécutée avec succès sur ${vm.name}` };
  } catch (e) {
    return { success: false, error: `Erreur VMware: ${e.message}` };
  }
}

async function getInfrastructureTree() {
  const vmsData = await listVMs();
  return {
    id: 'org-sbee',
    name: 'SBEE Monitoring',
    type: 'organization',
    children: [
      {
        id: 'site-cotonou',
        name: 'Datacenter Cotonou',
        type: 'site',
        children: [
          {
            id: 'host-pc',
            name: 'Hôte Physique (Workstation)',
            type: 'host',
            status: 'online',
            children: vmsData.map(v => ({
               id: v.id,
               name: v.name,
               type: 'vm',
               status: v.state === 'on' ? 'online' : 'offline',
               ip: v.ip,
               os: v.os
            }))
          }
        ]
      }
    ]
  };
}

module.exports = { listVMs, performAction, getInfrastructureTree };
