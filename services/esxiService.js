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
    id: 'cl-sbeedg',
    name: 'SBEEDG',
    datacenter: 'DC-SBEE-Cotonou',
    hosts: ['esxi01','esxi02','esxi03','esxi04','esxi05','esxi06','esxi07','esxi08','esxi09','esxi10','esxi11','esxi12','esxi13'],
    cpu: { totalCores: 312, usedCores: 22, totalMhz: 359630, usedMhz: 22470 }, 
    ram: { totalGB: 2426.88, usedGB: 1117.56 }, 
    vmCount: 198,
    status: 'online',
    haEnabled: true,
    drsEnabled: true,
    vmsOn: 73,
    vmsOff: 125,
  },
  {
    id: 'cl-sbeedr',
    name: 'SBEEDR',
    datacenter: 'DC-SBEE-DR',
    hosts: ['drmcesxi','drbaesxi'],
    cpu: { totalCores: 44, usedCores: 2, totalMhz: 52400, usedMhz: 2930 },
    ram: { totalGB: 448, usedGB: 77 },
    vmCount: 23,
    status: 'online',
    haEnabled: true,
    drsEnabled: false,
  },
];

const SIM_HOSTS = [
  // ── Cluster SBEEDG (Production) ─────────────────────────────────────────────
  {
    id: 'esxi01',
    name: 'ESXi-01-SBEE',
    ip: '192.168.10.11',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 2, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 3800 },
    ram: { totalGB: 256, usedGB: 180 },
    vmCount: 23,
    vmsOn: 12,
    vmsOff: 11,
    status: 'online',
    uptime: 8640000,
    datastores: ['ds-san-prod', 'ds-nas-shared', 'ds-local-01'],
    vswitches: ['vSwitch0', 'vSwitch1'],
    nics: ['vmnic0','vmnic1','vmnic2','vmnic3'],
  },
  {
    id: 'esxi02',
    name: 'ESXi-02-SBEE',
    ip: '192.168.10.12',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 3500 },
    ram: { totalGB: 256, usedGB: 172 },
    vmCount: 20,
    vmsOn: 8,
    vmsOff: 12,
    status: 'online',
    uptime: 7200000,
    datastores: ['ds-san-prod', 'ds-nas-shared', 'ds-local-02'],
    vswitches: ['vSwitch0', 'vSwitch1'],
    nics: ['vmnic0','vmnic1','vmnic2','vmnic3'],
  },
  {
    id: 'esxi03',
    name: 'ESXi-03-BACKUP',
    ip: '192.168.10.13',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 2, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 4200 },
    ram: { totalGB: 256, usedGB: 210 },
    vmCount: 25,
    vmsOn: 10,
    vmsOff: 15,
    status: 'online',
    uptime: 5184000,
    datastores: ['ds-san-prod', 'ds-nas-shared', 'ds-local-03'],
    vswitches: ['vSwitch0', 'vSwitch1'],
    nics: ['vmnic0','vmnic1','vmnic2','vmnic3'],
  },
  {
    id: 'esxi04',
    name: 'ESXi-04-SBEE',
    ip: '192.168.10.14',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 3100 },
    ram: { totalGB: 256, usedGB: 195 },
    vmCount: 22,
    vmsOn: 9,
    vmsOff: 13,
    status: 'online',
    uptime: 9720000,
    datastores: ['ds-san-prod', 'ds-nas-shared', 'ds-local-04'],
    vswitches: ['vSwitch0', 'vSwitch1'],
    nics: ['vmnic0','vmnic1','vmnic2','vmnic3'],
  },
  {
    id: 'esxi05',
    name: 'ESXi-05-SBEE',
    ip: '192.168.10.15',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 2800 },
    ram: { totalGB: 256, usedGB: 150 },
    vmCount: 18,
    vmsOn: 7,
    vmsOff: 11,
    status: 'online',
    uptime: 4320000,
    datastores: ['ds-san-prod', 'ds-nas-shared'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0','vmnic1'],
  },
  {
    id: 'esxi06',
    name: 'ESXi-06-SBEE',
    ip: '192.168.10.16',
    model: 'HPE ProLiant DL380 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 2500 },
    ram: { totalGB: 256, usedGB: 140 },
    vmCount: 15,
    vmsOn: 6,
    vmsOff: 9,
    status: 'online',
    uptime: 4320000,
    datastores: ['ds-san-prod', 'ds-nas-shared'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0','vmnic1'],
  },
  {
    id: 'esxi07',
    name: 'ESXi-07-SBEE',
    ip: '192.168.10.17',
    model: 'HPE ProLiant DL360 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 3000 },
    ram: { totalGB: 256, usedGB: 128 },
    vmCount: 7,
    vmsOn: 3,
    vmsOff: 4,
    status: 'online',
    uptime: 3600000,
    datastores: ['esxi07-datastore', 'esxi07-store', 'NFSDatastore'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0','vmnic1'],
  },
  {
    id: 'esxi08',
    name: 'ESXi-08-SBEE',
    ip: '192.168.10.18',
    model: 'HPE ProLiant DL360 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 2200 },
    ram: { totalGB: 256, usedGB: 83 },
    vmCount: 15,
    vmsOn: 5,
    vmsOff: 10,
    status: 'online',
    uptime: 12960000,
    datastores: ['ds-san-prod', 'ds-nas-shared', 'ds-local-08'],
    vswitches: ['vSwitch0', 'vSwitch1'],
    nics: ['vmnic0','vmnic1','vmnic2','vmnic3'],
  },
  {
    id: 'esxi09',
    name: 'ESXi-09-SBEE',
    ip: '192.168.10.19',
    model: 'HPE ProLiant DL360 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 2200 },
    ram: { totalGB: 256, usedGB: 83 },
    vmCount: 12,
    vmsOn: 2,
    vmsOff: 10,
    status: 'online',
    uptime: 12960000,
    datastores: ['ds-san-prod', 'ds-nas-shared'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0','vmnic1'],
  },
  {
    id: 'esxi10',
    name: 'ESXi-10-SBEE',
    ip: '192.168.10.20',
    model: 'HPE ProLiant DL360 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 0, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 0 },
    ram: { totalGB: 256, usedGB: 0 },
    vmCount: 5,
    vmsOn: 0,
    vmsOff: 5,
    status: 'disconnected',
    uptime: 0,
    datastores: [],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0'],
  },
  {
    id: 'esxi11',
    name: 'ESXi-11-SBEE',
    ip: '192.168.10.21',
    model: 'HPE ProLiant DL360 Gen10',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedg',
    datacenter: 'DC-SBEE-Cotonou',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 57600, usedMhz: 1800 },
    ram: { totalGB: 256, usedGB: 45 },
    vmCount: 13,
    vmsOn: 4,
    vmsOff: 9,
    status: 'online',
    uptime: 1296000,
    datastores: ['ds-san-prod'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0'],
  },
  // ── Cluster SBEEDR (Disaster Recovery) ──────────────────────────────────────
  {
    id: 'drmcesxi',
    name: 'DRMC-ESXi',
    ip: '10.10.10.11',
    model: 'HPE ProLiant DL380 Gen9',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedr',
    datacenter: 'DC-SBEE-DR',
    cpu: { totalCores: 24, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 12, totalMhz: 28800, usedMhz: 1800 },
    ram: { totalGB: 224, usedGB: 42 },
    vmCount: 12,
    vmsOn: 4,
    vmsOff: 8,
    status: 'online',
    uptime: 18000000,
    datastores: ['ds-dr-san', 'ds-dr-local-mc'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0','vmnic1'],
  },
  {
    id: 'drbaesxi',
    name: 'DRBA-ESXi',
    ip: '10.10.10.12',
    model: 'HPE ProLiant DL380 Gen9',
    vendor: 'HPE',
    version: 'VMware ESXi 6.7.0',
    cluster: 'cl-sbeedr',
    datacenter: 'DC-SBEE-DR',
    cpu: { totalCores: 20, usedCores: 1, mhz: 2400, sockets: 2, coresPerSocket: 10, totalMhz: 23600, usedMhz: 1130 },
    ram: { totalGB: 224, usedGB: 35 },
    vmCount: 11,
    vmsOn: 3,
    vmsOff: 8,
    status: 'online',
    uptime: 17280000,
    datastores: ['ds-dr-san', 'ds-dr-local-ba'],
    vswitches: ['vSwitch0'],
    nics: ['vmnic0','vmnic1'],
  },
];

const SIM_VMS = [
  // ESXi-01
  { id:'vm-001', name:'SICA-APP-01',      hostId:'esxi01', os:'Windows Server 2019', ip:'192.168.1.10', state:'on',  cpu:{usage:38,cores:8},  ram:{usedGB:14,totalGB:32},  snapshots:2, uptime:720000 },
  { id:'vm-002', name:'SICA-DB-01',       hostId:'esxi01', os:'Windows Server 2019', ip:'192.168.1.11', state:'on',  cpu:{usage:55,cores:8},  ram:{usedGB:28,totalGB:48},  snapshots:1, uptime:720000 },
  { id:'vm-003', name:'AD-DC-01',         hostId:'esxi01', os:'Windows Server 2022', ip:'192.168.1.20', state:'on',  cpu:{usage:12,cores:4},  ram:{usedGB:6,totalGB:16},   snapshots:0, uptime:5000000 },
  { id:'vm-004', name:'EXCHANGE-01',      hostId:'esxi01', os:'Windows Server 2019', ip:'192.168.1.30', state:'on',  cpu:{usage:22,cores:8},  ram:{usedGB:22,totalGB:64},  snapshots:1, uptime:800000 },
  { id:'vm-005', name:'PASSERELLE-PAY-01',hostId:'esxi01', os:'Ubuntu 22.04 LTS',    ip:'192.168.1.40', state:'on',  cpu:{usage:41,cores:4},  ram:{usedGB:7,totalGB:16},   snapshots:3, uptime:600000 },
  { id:'vm-006', name:'DNS-DHCP-01',      hostId:'esxi01', os:'Windows Server 2016', ip:'192.168.1.50', state:'on',  cpu:{usage:5, cores:2},  ram:{usedGB:3,totalGB:8},    snapshots:0, uptime:9000000 },
  // ESXi-02
  { id:'vm-007', name:'SICA-APP-02',      hostId:'esxi02', os:'Windows Server 2019', ip:'192.168.1.12', state:'on',  cpu:{usage:35,cores:8},  ram:{usedGB:13,totalGB:32},  snapshots:2, uptime:700000 },
  { id:'vm-008', name:'SICA-DB-02',       hostId:'esxi02', os:'Windows Server 2019', ip:'192.168.1.13', state:'on',  cpu:{usage:48,cores:8},  ram:{usedGB:25,totalGB:48},  snapshots:1, uptime:710000 },
  { id:'vm-009', name:'AD-DC-02',         hostId:'esxi02', os:'Windows Server 2022', ip:'192.168.1.21', state:'on',  cpu:{usage:10,cores:4},  ram:{usedGB:5,totalGB:16},   snapshots:0, uptime:4900000 },
  { id:'vm-010', name:'ERP-FINANCE-01',   hostId:'esxi02', os:'Windows Server 2016', ip:'192.168.1.60', state:'on',  cpu:{usage:29,cores:8},  ram:{usedGB:18,totalGB:32},  snapshots:2, uptime:500000 },
  { id:'vm-011', name:'SBEE-MONITOR',     hostId:'esxi02', os:'Ubuntu 22.04 LTS',    ip:'192.168.1.70', state:'on',  cpu:{usage:8, cores:4},  ram:{usedGB:5,totalGB:16},   snapshots:1, uptime:300000 },
  { id:'vm-012', name:'PROXY-WEB',        hostId:'esxi02', os:'Ubuntu 22.04 LTS',    ip:'192.168.1.80', state:'off', cpu:{usage:0, cores:2},  ram:{usedGB:0,totalGB:8},    snapshots:0, uptime:0 },
  // ESXi-03 (backup)
  { id:'vm-013', name:'VEEAM-BR-01',      hostId:'esxi03', os:'Windows Server 2019', ip:'192.168.2.10', state:'on',  cpu:{usage:18,cores:8},  ram:{usedGB:20,totalGB:64},  snapshots:0, uptime:400000 },
  { id:'vm-014', name:'BACKUP-REPO-01',   hostId:'esxi03', os:'Ubuntu 22.04 LTS',    ip:'192.168.2.11', state:'on',  cpu:{usage:6, cores:4},  ram:{usedGB:8,totalGB:32},   snapshots:0, uptime:350000 },
  { id:'vm-015', name:'DMZ-WEB-01',       hostId:'esxi03', os:'Ubuntu 22.04 LTS',    ip:'10.0.0.10',    state:'on',  cpu:{usage:14,cores:2},  ram:{usedGB:2,totalGB:8},    snapshots:1, uptime:200000 },
  { id:'vm-016', name:'DMZ-WEB-02',       hostId:'esxi03', os:'Ubuntu 22.04 LTS',    ip:'10.0.0.11',    state:'on',  cpu:{usage:11,cores:2},  ram:{usedGB:2,totalGB:8},    snapshots:1, uptime:190000 },
  { id:'vm-017', name:'VPN-GATEWAY',      hostId:'esxi03', os:'pfSense 2.7',         ip:'10.0.0.1',     state:'on',  cpu:{usage:3, cores:2},  ram:{usedGB:1,totalGB:4},    snapshots:0, uptime:9500000 },
  // ESXi07 — VM avec alerte disk latency (confirmé VeeamONE 25/04/2026)
  { id:'vm-018', name:'VMDGMAIL',         hostId:'esxi07', os:'Windows Server 2019', ip:'192.168.1.90', state:'on',  cpu:{usage:22,cores:4},  ram:{usedGB:12,totalGB:32},  snapshots:1, uptime:1200000, diskLatencyAlert:true },
  { id:'vm-019', name:'SBEE-MAIL-01',     hostId:'esxi07', os:'Windows Server 2019', ip:'192.168.1.91', state:'on',  cpu:{usage:8, cores:4},  ram:{usedGB:18,totalGB:32},  snapshots:0, uptime:2100000 },
  { id:'vm-020', name:'SBEE-INTRANET',    hostId:'esxi07', os:'Ubuntu 22.04 LTS',    ip:'192.168.1.95', state:'on',  cpu:{usage:5, cores:2},  ram:{usedGB:6,totalGB:16},   snapshots:1, uptime:3600000 },
  { id:'vm-021', name:'SBEEDR-REP-01',    hostId:'drmcesxi', os:'Windows Server 2019', ip:'10.10.10.20', state:'on',  cpu:{usage:4, cores:4},  ram:{usedGB:8,totalGB:32},   snapshots:0, uptime:8640000 },
  { id:'vm-022', name:'SBEEDR-REP-02',    hostId:'drbaesxi', os:'Ubuntu 22.04 LTS',    ip:'10.10.10.21', state:'on',  cpu:{usage:2, cores:2},  ram:{usedGB:4,totalGB:16},   snapshots:0, uptime:8640000 },
];

const SIM_STORAGE = {
  'esxi01': [
    { id:'ds-san-prod',    name:'SAN-PROD-LUN01',   type:'VMFS',  transportType:'FC',  capacityGB:4096, usedGB:2800, vms:['vm-001','vm-002','vm-004','vm-005'], host:'HPE MSA 2060' },
    { id:'ds-nas-shared',  name:'NAS-SHARED-NFS01', type:'NFS',   transportType:'NFS', capacityGB:8192, usedGB:3500, vms:['vm-003','vm-006'], host:'Synology RS3621xs+' },
    { id:'ds-local-01',    name:'Datastore-Local-01',type:'VMFS', transportType:'Local',capacityGB:1800, usedGB:450,  vms:[], host:'ESXi-01-SBEE' },
  ],
  'esxi02': [
    { id:'ds-san-prod',    name:'SAN-PROD-LUN01',   type:'VMFS',  transportType:'FC',  capacityGB:4096, usedGB:2800, vms:['vm-007','vm-008','vm-010'], host:'HPE MSA 2060' },
    { id:'ds-nas-shared',  name:'NAS-SHARED-NFS01', type:'NFS',   transportType:'NFS', capacityGB:8192, usedGB:3500, vms:['vm-009','vm-011','vm-012'], host:'Synology RS3621xs+' },
    { id:'ds-local-02',    name:'Datastore-Local-02',type:'VMFS', transportType:'Local',capacityGB:1800, usedGB:380,  vms:[], host:'ESXi-02-SBEE' },
  ],
  'esxi03': [
    { id:'ds-nas-backup',  name:'NAS-BACKUP-NFS01', type:'NFS',   transportType:'NFS', capacityGB:16384, usedGB:9800, vms:['vm-013','vm-014'], host:'Synology RS3621xs+' },
    { id:'ds-local-03',    name:'Datastore-Local-03',type:'VMFS', transportType:'Local',capacityGB:1200, usedGB:290,  vms:['vm-015','vm-016','vm-017'], host:'ESXi-03-BACKUP' },
  ],
};

const SIM_NETWORK = {
  'esxi01': {
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
  'esxi02': {
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
  'esxi03': {
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

// ─── New Simulation Data ──────────────────────────────────────────────────────

const SIM_VSAN = {
  'cl-prod': {
    health: 'OK', capacityGB: 20480, usedGB: 12500, dedupRatio: '1.4x',
    components: 342, resyncGB: 0, 
    hosts: [
      { id: 'esxi-01', status: 'Connected', capacityGB: 10240, usedGB: 6200, cacheGB: 800, iops: 14500, latency: 1.2 },
      { id: 'esxi-02', status: 'Connected', capacityGB: 10240, usedGB: 6300, cacheGB: 800, iops: 15200, latency: 1.1 }
    ]
  }
};

const SIM_MULTIPATHING = {
  'esxi01': [
    { target: 'iqn.1992-04.com.hp:storage.msa2060', status: 'Active (I/O)', paths: 4, activePaths: 2, policy: 'Round Robin' },
    { target: 'iqn.2000-01.com.synology:rs3621xs', status: 'Active', paths: 2, activePaths: 1, policy: 'Fixed' }
  ],
  'esxi02': [
    { target: 'iqn.1992-04.com.hp:storage.msa2060', status: 'Active (I/O)', paths: 4, activePaths: 2, policy: 'Round Robin' },
    { target: 'iqn.2000-01.com.synology:rs3621xs', status: 'Active', paths: 2, activePaths: 1, policy: 'Fixed' }
  ],
  'esxi03': []
};

const SIM_NSX = {
  edges: [
    { id: 'edge-01', status: 'Up', tunnels: 12, fwRules: 450, throughputMbps: 1250 },
    { id: 'edge-02', status: 'Up', tunnels: 12, fwRules: 450, throughputMbps: 1100 }
  ],
  logicalSwitches: 24,
  distributedRouters: 3
};

const SIM_VMOTION = [
  { id:1, vm:'VM-AD-01',       src:'esxi-01-sbee', dst:'esxi-02-sbee', durationSec:12, reason:'DRS balance',     status:'success', ts:'2026-04-24 08:14' },
  { id:2, vm:'VM-SGBD-PROD',   src:'esxi-02-sbee', dst:'esxi-01-sbee', durationSec:45, reason:'Maintenance hôte',status:'success', ts:'2026-04-23 22:30' },
  { id:3, vm:'VM-EXCHANGE',    src:'esxi-01-sbee', dst:'esxi-02-sbee', durationSec:38, reason:'DRS balance',     status:'success', ts:'2026-04-23 18:05' }
];

const SIM_DRS_HA = {
  drs: {
    enabled: true, mode: 'Automatique', target: 'Conservateur (niveau 2)', lastRun: new Date().toISOString(), score: 32,
    recommendations: [
      { vm: 'VM-EXCHANGE',   from: 'esxi-01', to: 'esxi-02', priority: 3, reason: 'Équilibrage CPU' }
    ]
  },
  ha: {
    enabled: true, admissionControl: 'Politique : pourcentage de cluster', failoverCapacityCPU: 25, failoverCapacityRAM: 25,
    vmsProtected: 12, vmsUnprotected: 0, heartbeatDatastores: ['ds-san-prod'], isolation: 'Laisser les VMs actives'
  }
};

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
      cpu: { ...v.cpu, usage: v.state === 'on' ? parseFloat(fluctuate(v.cpu.usage, 4).toFixed(1)) : 0, readyPct: parseFloat(fluctuate(2, 1).toFixed(1)) },
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

async function getVSanInfo(clusterId) {
  return SIM_VSAN[clusterId] || null;
}

async function getMultipathing(hostId) {
  return SIM_MULTIPATHING[hostId] || [];
}

async function getNSXInfo() {
  return SIM_NSX;
}

async function getVMotionHistory() {
  return SIM_VMOTION;
}

async function getDrsHaInfo() {
  return SIM_DRS_HA;
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
  getVSanInfo,
  getMultipathing,
  getNSXInfo,
  getVMotionHistory,
  getDrsHaInfo
};
