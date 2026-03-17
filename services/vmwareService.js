require('dotenv').config();
const http = require('http');
const { exec } = require('child_process');
const path = require('path');

// Configuration from .env
const VMWARE_API_URL = process.env.VMWARE_API_URL || 'http://127.0.0.1:8697/api';
const VMWARE_AUTH = 'Basic ' + Buffer.from(`${process.env.VMWARE_API_USER || 'admin'}:${process.env.VMWARE_API_PASS || 'admin'}`).toString('base64');
const VMRUN_PATH = `"${process.env.VMRUN_PATH || 'C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe'}"`;

// Internal state
let driver = 'mock'; // 'api' | 'vmrun' | 'mock'
let useNogui = true; // Use nogui mode for vmrun

// Mock VM data (mapping to potential real paths if found)
let vms = [
  {
    id: 'vm-001',
    name: 'SRV-DC01',
    path: '', // Path to .vmx
    state: 'off',
    os: 'Windows Server 2019',
    cpu: { usage: 0, cores: 4 },
    ram: { used: 0, total: 8 * 1024 * 1024 * 1024, percent: 0 },
    disk: [{ mount: 'C:', percent: 45, used: 45 * 1024**3, size: 100 * 1024**3 }],
    ip: '192.168.1.10',
    type: 'server'
  },
  {
    id: 'vm-002',
    name: 'SRV-FILE01',
    path: '',
    state: 'off',
    os: 'Windows Server 2016',
    cpu: { usage: 0, cores: 4 },
    ram: { used: 0, total: 16 * 1024 * 1024 * 1024, percent: 0 },
    disk: [
      { mount: 'C:', percent: 55, used: 55 * 1024**3, size: 100 * 1024**3 },
      { mount: 'D:', percent: 72, used: 720 * 1024**3, size: 1000 * 1024**3 }
    ],
    ip: '192.168.1.11',
    type: 'server'
  },
  {
    id: 'vm-003',
    name: 'SRV-WEB01',
    path: '',
    state: 'off',
    os: 'Ubuntu Server 22.04',
    cpu: { usage: 0, cores: 2 },
    ram: { used: 0, total: 4 * 1024 * 1024 * 1024, percent: 0 },
    disk: [{ mount: '/', percent: 38, used: 38 * 1024**3, size: 100 * 1024**3 }],
    ip: '192.168.1.12',
    type: 'server'
  }
];

function simulateMetrics(vm) {
  if (vm.state === 'on') {
    vm.cpu.usage = parseFloat((Math.random() * 40 + 5).toFixed(1));
    const ramUsedBytes = vm.ram.total * (Math.random() * 0.3 + 0.1);
    vm.ram.used = Math.round(ramUsedBytes);
    vm.ram.percent = parseFloat(((ramUsedBytes / vm.ram.total) * 100).toFixed(1));
  } else {
    vm.cpu.usage = 0;
    vm.ram.used = 0;
    vm.ram.percent = 0;
  }
}

function runVmrun(command) {
  return new Promise((resolve, reject) => {
    // Escape path for powershell/cmd
    const cmd = `${VMRUN_PATH} -T ws ${command}`;
    exec(cmd, (error, stdout, stderr) => {
      // vmrun might return error code 1 for 'list' if it's working but empty
      if (error && !command.includes('list')) {
        console.error(`vmrun error: ${stderr}`);
        return reject(error);
      }
      resolve(stdout.trim());
    });
  });
}

async function checkConnectivity() {
  if (process.env.VMWARE_DRIVER && process.env.VMWARE_DRIVER !== 'auto') {
    driver = process.env.VMWARE_DRIVER;
    return driver;
  }

  // 1. Try REST API
  try {
    const options = {
      method: 'GET',
      headers: { 'Authorization': VMWARE_AUTH },
      timeout: 1000
    };
    
    await new Promise((resolve, reject) => {
      const req = http.get(`${VMWARE_API_URL}/vms`, options, (res) => {
        if (res.statusCode === 200) resolve(); else reject();
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
    driver = 'api';
    return driver;
  } catch (e) {}

  // 2. Try VMRUN
  try {
    await runVmrun('list');
    driver = 'vmrun';
    return driver;
  } catch (e) {}

  driver = 'mock';
  return driver;
}

async function listVMs() {
  const currentDriver = await checkConnectivity();

  if (currentDriver === 'vmrun' || currentDriver === 'api') {
    let runningVMs = [];
    try {
      if (currentDriver === 'vmrun') {
        const output = await runVmrun('list');
        // Example output: Total running VMs: 1 \n C:\path\to\vm.vmx
        runningVMs = output.split('\n').filter(l => l.includes('.vmx'));
      }
      
      // Update our list based on found paths or names
      vms.forEach(vm => {
        // Simple name-based matching for now
        const isRunning = runningVMs.some(path => path.toLowerCase().includes(vm.name.toLowerCase()));
        vm.state = isRunning ? 'on' : 'off';
        simulateMetrics(vm);
      });
    } catch (e) {
      console.error('Real-world VM list error:', e.message);
    }
  } else {
    vms.forEach(vm => simulateMetrics(vm));
  }

  return vms;
}

async function performAction(vmId, action) {
  const currentDriver = await checkConnectivity();
  const vm = vms.find(v => v.id === vmId);
  if (!vm) return { success: false, error: 'VM not found' };

  if (currentDriver === 'vmrun') {
    let vmrunCmd = '';
    // Use vm.path if available, otherwise fallback to filename in current dir (or assume vm.name is filename)
    const target = vm.path || `${vm.name}.vmx`;
    
    switch (action) {
      case 'start':   vmrunCmd = `start "${target}" ${useNogui ? 'nogui' : ''}`; break;
      case 'stop':    vmrunCmd = `stop "${target}" soft`; break;
      case 'restart': vmrunCmd = `reset "${target}" soft`; break;
      case 'suspend': vmrunCmd = `suspend "${target}" soft`; break;
    }
    
    if (vmrunCmd) {
      try {
        await runVmrun(vmrunCmd);
        vm.state = (action === 'start' || action === 'restart') ? 'on' : (action === 'stop' ? 'off' : 'suspended');
        return { success: true, action, vm };
      } catch (e) {
        return { success: false, error: `Erreur vmrun: ${e.message}` };
      }
    }
  }

  // API mode would go here...

  // Mock
  switch (action) {
    case 'start':   vm.state = 'on'; break;
    case 'stop':    vm.state = 'off'; break;
    case 'restart': vm.state = 'on'; break;
    case 'suspend': vm.state = 'suspended'; break;
  }
  return { success: true, action, vm };
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
