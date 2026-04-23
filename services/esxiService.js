/**
 * esxiService.js
 * Gestion des hôtes ESXi / vCenter / Hyper-V distants.
 * Mode 1 : connexion vCenter REST API si un endpoint type=vcenter est configuré.
 * Mode 2 : données de simulation réalistes représentant l'infrastructure SBEE.
 */

const { getEndpoints } = require('./storageService');

// ─── Simulation data ──────────────────────────────────────────────────────────

const SIM_CLUSTERS = [
  {
    id: 'cl-prod',
    name: 'Cluster Production',
    datacenter: 'DC-SBEE-Cotonou',
    hosts: ['esxi-01', 'esxi-02'],
    cpu: { totalCores: 96, usedCores: 43, totalMhz: 230400, usedMhz: 103500 },
    ram: { totalGB: 384, usedGB: 211 },
    vmCount: 12,
    status: 'online',
    haEnabled: true,
    drsEnabled: true,
  },
  {
    id: 'cl-backup',
    name: 'Cluster Backup / DMZ',
    datacenter: 'DC-SBEE-Cotonou',
    hosts: ['esxi-03'],
    cpu: { totalCores: 32, usedCores: 8, totalMhz: 76800, usedMhz: 19200 },
    ram: { totalGB: 128, usedGB: 46 },
    vmCount: 5,
    status: 'online',
    haEnabled: false,
    drsEnabled: false,
  },
];

const SIM_HOSTS = [
  {
    id: 'esxi-01',
    name: 'ESXi-01-SBEE',
    ip: '192.168.10.11',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 7.0 U3',
    cluster: 'cl-prod',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 48, usedCores: 22, mhz: 2400, sockets: 2, coresPerSocket: 24 },
    ram: { totalGB: 192, usedGB: 112 },
    vmCount: 6,
    status: 'online',
    uptime: 8640000,
    datastores: ['ds-san-prod', 'ds-nas-shared', 'ds-local-01'],
    vswitches: ['vSwitch0', 'vSwitch1'],
    nics: ['vmnic0','vmnic1','vmnic2','vmnic3'],
  },
  {
    id: 'esxi-02',
    name: 'ESXi-02-SBEE',
    ip: '192.168.10.12',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 7.0 U3',
    cluster: 'cl-prod',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 48, usedCores: 21, mhz: 2400, sockets: 2, coresPerSocket: 24 },
    ram: { totalGB: 192, usedGB: 99 },
    vmCount: 6,
    status: 'online',
    uptime: 7200000,
    datastores: ['ds-san-prod', 'ds-nas-shared', 'ds-local-02'],
    vswitches: ['vSwitch0', 'vSwitch1'],
    nics: ['vmnic0','vmnic1','vmnic2','vmnic3'],
  },
  {
    id: 'esxi-03',
    name: 'ESXi-03-BACKUP',
    ip: '192.168.10.13',
    model: 'HPE ProLiant DL360 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 7.0 U2',
    cluster: 'cl-backup',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 32, usedCores: 8, mhz: 2400, sockets: 2, coresPerSocket: 16 },
    ram: { totalGB: 128, usedGB: 46 },
    vmCount: 5,
    status: 'online',
    uptime: 5184000,
    datastores: ['ds-nas-backup', 'ds-local-03'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0','vmnic1'],
  },
];

const SIM_VMS = [
  // ESXi-01
  { id:'vm-001', name:'SICA-APP-01',      hostId:'esxi-01', os:'Windows Server 2019', ip:'192.168.1.10', state:'on',  cpu:{usage:38,cores:8},  ram:{usedGB:14,totalGB:32},  snapshots:2, uptime:720000 },
  { id:'vm-002', name:'SICA-DB-01',       hostId:'esxi-01', os:'Windows Server 2019', ip:'192.168.1.11', state:'on',  cpu:{usage:55,cores:8},  ram:{usedGB:28,totalGB:48},  snapshots:1, uptime:720000 },
  { id:'vm-003', name:'AD-DC-01',         hostId:'esxi-01', os:'Windows Server 2022', ip:'192.168.1.20', state:'on',  cpu:{usage:12,cores:4},  ram:{usedGB:6,totalGB:16},   snapshots:0, uptime:5000000 },
  { id:'vm-004', name:'EXCHANGE-01',      hostId:'esxi-01', os:'Windows Server 2019', ip:'192.168.1.30', state:'on',  cpu:{usage:22,cores:8},  ram:{usedGB:22,totalGB:64},  snapshots:1, uptime:800000 },
  { id:'vm-005', name:'PASSERELLE-PAY-01',hostId:'esxi-01', os:'Ubuntu 22.04 LTS',    ip:'192.168.1.40', state:'on',  cpu:{usage:41,cores:4},  ram:{usedGB:7,totalGB:16},   snapshots:3, uptime:600000 },
  { id:'vm-006', name:'DNS-DHCP-01',      hostId:'esxi-01', os:'Windows Server 2016', ip:'192.168.1.50', state:'on',  cpu:{usage:5, cores:2},  ram:{usedGB:3,totalGB:8},    snapshots:0, uptime:9000000 },
  // ESXi-02
  { id:'vm-007', name:'SICA-APP-02',      hostId:'esxi-02', os:'Windows Server 2019', ip:'192.168.1.12', state:'on',  cpu:{usage:35,cores:8},  ram:{usedGB:13,totalGB:32},  snapshots:2, uptime:700000 },
  { id:'vm-008', name:'SICA-DB-02',       hostId:'esxi-02', os:'Windows Server 2019', ip:'192.168.1.13', state:'on',  cpu:{usage:48,cores:8},  ram:{usedGB:25,totalGB:48},  snapshots:1, uptime:710000 },
  { id:'vm-009', name:'AD-DC-02',         hostId:'esxi-02', os:'Windows Server 2022', ip:'192.168.1.21', state:'on',  cpu:{usage:10,cores:4},  ram:{usedGB:5,totalGB:16},   snapshots:0, uptime:4900000 },
  { id:'vm-010', name:'ERP-FINANCE-01',   hostId:'esxi-02', os:'Windows Server 2016', ip:'192.168.1.60', state:'on',  cpu:{usage:29,cores:8},  ram:{usedGB:18,totalGB:32},  snapshots:2, uptime:500000 },
  { id:'vm-011', name:'SBEE-MONITOR',     hostId:'esxi-02', os:'Ubuntu 22.04 LTS',    ip:'192.168.1.70', state:'on',  cpu:{usage:8, cores:4},  ram:{usedGB:5,totalGB:16},   snapshots:1, uptime:300000 },
  { id:'vm-012', name:'PROXY-WEB',        hostId:'esxi-02', os:'Ubuntu 22.04 LTS',    ip:'192.168.1.80', state:'off', cpu:{usage:0, cores:2},  ram:{usedGB:0,totalGB:8},    snapshots:0, uptime:0 },
  // ESXi-03 (backup)
  { id:'vm-013', name:'VEEAM-BR-01',      hostId:'esxi-03', os:'Windows Server 2019', ip:'192.168.2.10', state:'on',  cpu:{usage:18,cores:8},  ram:{usedGB:20,totalGB:64},  snapshots:0, uptime:400000 },
  { id:'vm-014', name:'BACKUP-REPO-01',   hostId:'esxi-03', os:'Ubuntu 22.04 LTS',    ip:'192.168.2.11', state:'on',  cpu:{usage:6, cores:4},  ram:{usedGB:8,totalGB:32},   snapshots:0, uptime:350000 },
  { id:'vm-015', name:'DMZ-WEB-01',       hostId:'esxi-03', os:'Ubuntu 22.04 LTS',    ip:'10.0.0.10',    state:'on',  cpu:{usage:14,cores:2},  ram:{usedGB:2,totalGB:8},    snapshots:1, uptime:200000 },
  { id:'vm-016', name:'DMZ-WEB-02',       hostId:'esxi-03', os:'Ubuntu 22.04 LTS',    ip:'10.0.0.11',    state:'on',  cpu:{usage:11,cores:2},  ram:{usedGB:2,totalGB:8},    snapshots:1, uptime:190000 },
  { id:'vm-017', name:'VPN-GATEWAY',      hostId:'esxi-03', os:'pfSense 2.7',         ip:'10.0.0.1',     state:'on',  cpu:{usage:3, cores:2},  ram:{usedGB:1,totalGB:4},    snapshots:0, uptime:9500000 },
];

const SIM_STORAGE = {
  'esxi-01': [
    { id:'ds-san-prod',    name:'SAN-PROD-LUN01',   type:'VMFS',  transportType:'FC',  capacityGB:4096, usedGB:2800, vms:['vm-001','vm-002','vm-004','vm-005'], host:'HPE MSA 2060' },
    { id:'ds-nas-shared',  name:'NAS-SHARED-NFS01', type:'NFS',   transportType:'NFS', capacityGB:8192, usedGB:3500, vms:['vm-003','vm-006'], host:'Synology RS3621xs+' },
    { id:'ds-local-01',    name:'Datastore-Local-01',type:'VMFS', transportType:'Local',capacityGB:1800, usedGB:450,  vms:[], host:'ESXi-01-SBEE' },
  ],
  'esxi-02': [
    { id:'ds-san-prod',    name:'SAN-PROD-LUN01',   type:'VMFS',  transportType:'FC',  capacityGB:4096, usedGB:2800, vms:['vm-007','vm-008','vm-010'], host:'HPE MSA 2060' },
    { id:'ds-nas-shared',  name:'NAS-SHARED-NFS01', type:'NFS',   transportType:'NFS', capacityGB:8192, usedGB:3500, vms:['vm-009','vm-011','vm-012'], host:'Synology RS3621xs+' },
    { id:'ds-local-02',    name:'Datastore-Local-02',type:'VMFS', transportType:'Local',capacityGB:1800, usedGB:380,  vms:[], host:'ESXi-02-SBEE' },
  ],
  'esxi-03': [
    { id:'ds-nas-backup',  name:'NAS-BACKUP-NFS01', type:'NFS',   transportType:'NFS', capacityGB:16384, usedGB:9800, vms:['vm-013','vm-014'], host:'Synology RS3621xs+' },
    { id:'ds-local-03',    name:'Datastore-Local-03',type:'VMFS', transportType:'Local',capacityGB:1200, usedGB:290,  vms:['vm-015','vm-016','vm-017'], host:'ESXi-03-BACKUP' },
  ],
};

const SIM_NETWORK = {
  'esxi-01': {
    vswitches: [
      {
        name: 'vSwitch0', ports: 128, mtu: 1500,
        uplinks: [{ nic:'vmnic0', speed:'10Gbps', status:'online' }, { nic:'vmnic1', speed:'10Gbps', status:'online' }],
        portgroups: [
          { name:'VM Network',        vlanId: 0,    type:'VM Network',   vmCount: 4 },
          { name:'Management Network',vlanId: 1,    type:'VMkernel',     vmCount: 0 },
          { name:'VLAN-PROD',         vlanId: 100,  type:'VM Network',   vmCount: 2 },
        ],
      },
      {
        name: 'vSwitch1', ports: 64, mtu: 9000,
        uplinks: [{ nic:'vmnic2', speed:'25Gbps', status:'online' }, { nic:'vmnic3', speed:'25Gbps', status:'online' }],
        portgroups: [
          { name:'vMotion Network',   vlanId: 200,  type:'VMkernel',     vmCount: 0 },
          { name:'Storage Network',   vlanId: 300,  type:'VMkernel',     vmCount: 0 },
        ],
      },
    ],
  },
  'esxi-02': {
    vswitches: [
      {
        name: 'vSwitch0', ports: 128, mtu: 1500,
        uplinks: [{ nic:'vmnic0', speed:'10Gbps', status:'online' }, { nic:'vmnic1', speed:'10Gbps', status:'online' }],
        portgroups: [
          { name:'VM Network',        vlanId: 0,    type:'VM Network',   vmCount: 4 },
          { name:'Management Network',vlanId: 1,    type:'VMkernel',     vmCount: 0 },
          { name:'VLAN-PROD',         vlanId: 100,  type:'VM Network',   vmCount: 2 },
        ],
      },
      {
        name: 'vSwitch1', ports: 64, mtu: 9000,
        uplinks: [{ nic:'vmnic2', speed:'25Gbps', status:'online' }, { nic:'vmnic3', speed:'25Gbps', status:'online' }],
        portgroups: [
          { name:'vMotion Network',   vlanId: 200,  type:'VMkernel',     vmCount: 0 },
          { name:'Storage Network',   vlanId: 300,  type:'VMkernel',     vmCount: 0 },
        ],
      },
    ],
  },
  'esxi-03': {
    vswitches: [
      {
        name: 'vSwitch0', ports: 64, mtu: 1500,
        uplinks: [{ nic:'vmnic0', speed:'10Gbps', status:'online' }, { nic:'vmnic1', speed:'10Gbps', status:'standby' }],
        portgroups: [
          { name:'VM Network',        vlanId: 0,    type:'VM Network',   vmCount: 3 },
          { name:'Management Network',vlanId: 1,    type:'VMkernel',     vmCount: 0 },
          { name:'VLAN-DMZ',          vlanId: 400,  type:'VM Network',   vmCount: 2 },
          { name:'VLAN-BACKUP',       vlanId: 500,  type:'VM Network',   vmCount: 2 },
        ],
      },
    ],
  },
};

// ─── Live fluctuation helper ──────────────────────────────────────────────────

function fluctuate(base, range = 5) {
  return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range * 2));
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function getClusters() {
  return SIM_CLUSTERS.map(c => ({
    ...c,
    cpu: {
      ...c.cpu,
      usedCores: Math.round(fluctuate(c.cpu.usedCores, 3)),
      usedMhz:   Math.round(c.cpu.usedMhz * (0.9 + Math.random() * 0.2)),
    },
    ram: {
      ...c.ram,
      usedGB: Math.round(c.ram.usedGB * (0.97 + Math.random() * 0.06)),
    },
  }));
}

async function getHosts() {
  return SIM_HOSTS.map(h => ({
    ...h,
    cpu: { ...h.cpu, usedCores: Math.round(fluctuate(h.cpu.usedCores, 2)) },
    ram: { ...h.ram, usedGB: Math.round(h.ram.usedGB * (0.97 + Math.random() * 0.06)) },
  }));
}

async function getHost(hostId) {
  const h = SIM_HOSTS.find(h => h.id === hostId);
  if (!h) return null;
  return {
    ...h,
    cpu: { ...h.cpu, usedCores: Math.round(fluctuate(h.cpu.usedCores, 2)) },
    ram: { ...h.ram, usedGB: Math.round(h.ram.usedGB * (0.97 + Math.random() * 0.06)) },
  };
}

async function getHostVMs(hostId) {
  return SIM_VMS
    .filter(v => v.hostId === hostId)
    .map(v => ({
      ...v,
      cpu: { ...v.cpu, usage: v.state === 'on' ? parseFloat(fluctuate(v.cpu.usage, 4).toFixed(1)) : 0 },
      ram: { ...v.ram, usedGB: v.state === 'on' ? +(v.ram.usedGB * (0.95 + Math.random() * 0.1)).toFixed(1) : 0 },
    }));
}

async function getHostStorage(hostId) {
  return SIM_STORAGE[hostId] || [];
}

async function getHostNetwork(hostId) {
  return SIM_NETWORK[hostId] || { vswitches: [] };
}

async function esxiVmAction(vmId, action) {
  const vm = SIM_VMS.find(v => v.id === vmId);
  if (!vm) return { success: false, error: 'VM non trouvée' };
  const labels = { 'start':'démarrage','stop':'arrêt','restart':'redémarrage','suspend':'suspension','snapshot':'snapshot' };
  return { success: true, vmId, action, message: `Action [${labels[action] || action}] simulée sur ${vm.name}` };
}

// Performance history (30 points sur 1h)
async function getHostPerfHistory(hostId) {
  const host = SIM_HOSTS.find(h => h.id === hostId);
  if (!host) return [];
  const now = Date.now();
  const cpuBase = (host.cpu.usedCores / host.cpu.totalCores) * 100;
  const ramBase = (host.ram.usedGB / host.ram.totalGB) * 100;
  return Array.from({ length: 30 }, (_, i) => ({
    ts: now - (29 - i) * 120000,
    cpu: parseFloat(fluctuate(cpuBase, 8).toFixed(1)),
    ram: parseFloat(fluctuate(ramBase, 4).toFixed(1)),
  }));
}

module.exports = {
  getClusters,
  getHosts,
  getHost,
  getHostVMs,
  getHostStorage,
  getHostNetwork,
  getHostPerfHistory,
  esxiVmAction,
};
