/**
 * servicesMapService.js
 * CRUD pour la carte des services métier hébergés sur l'infrastructure SBEE.
 * Persiste dans data/services_map.json.
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'services_map.json');

const SERVICE_ICONS = ['server','database','shield','globe','mail','cpu','layers','zap','activity','box'];

const DEFAULT_SERVICES = [
  {
    id: 'svc-sica',
    name: 'SICA',
    description: 'Système Intégré de Comptabilité et d\'Approvisionnement',
    icon: 'layers',
    category: 'ERP',
    vmId: 'vm-001',
    vmName: 'SICA-APP-01',
    hostId: 'esxi-01',
    hostName: 'ESXi-01-SBEE',
    ip: '192.168.1.10',
    ports: [80, 443, 8080],
    slaTarget: 99.9,
    criticality: 'critical',
    contacts: ['DSI SBEE'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-sica-db',
    name: 'SICA Base de données',
    description: 'Base Oracle de l\'application SICA',
    icon: 'database',
    category: 'Base de données',
    vmId: 'vm-002',
    vmName: 'SICA-DB-01',
    hostId: 'esxi-01',
    hostName: 'ESXi-01-SBEE',
    ip: '192.168.1.11',
    ports: [1521],
    slaTarget: 99.9,
    criticality: 'critical',
    contacts: ['DSI SBEE', 'DBA'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-passerelle',
    name: 'Passerelle Paiement',
    description: 'Passerelle de paiement électronique MTN / MOOV / Celtis',
    icon: 'zap',
    category: 'Paiement',
    vmId: 'vm-005',
    vmName: 'PASSERELLE-PAY-01',
    hostId: 'esxi-01',
    hostName: 'ESXi-01-SBEE',
    ip: '192.168.1.40',
    ports: [443, 8443],
    slaTarget: 99.95,
    criticality: 'critical',
    contacts: ['DSI SBEE', 'DFC'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-ad',
    name: 'Active Directory',
    description: 'Contrôleur de domaine principal SBEE.LOCAL',
    icon: 'shield',
    category: 'Infrastructure',
    vmId: 'vm-003',
    vmName: 'AD-DC-01',
    hostId: 'esxi-01',
    hostName: 'ESXi-01-SBEE',
    ip: '192.168.1.20',
    ports: [53, 88, 389, 445, 636],
    slaTarget: 99.9,
    criticality: 'high',
    contacts: ['Admin Sys'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-exchange',
    name: 'Messagerie Exchange',
    description: 'Serveur Microsoft Exchange 2019 — messagerie interne SBEE',
    icon: 'mail',
    category: 'Communication',
    vmId: 'vm-004',
    vmName: 'EXCHANGE-01',
    hostId: 'esxi-01',
    hostName: 'ESXi-01-SBEE',
    ip: '192.168.1.30',
    ports: [25, 80, 443, 587],
    slaTarget: 99.5,
    criticality: 'high',
    contacts: ['Admin Sys', 'DSI SBEE'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-dns',
    name: 'DNS / DHCP',
    description: 'Résolution de noms et attribution IP réseau SBEE',
    icon: 'globe',
    category: 'Infrastructure',
    vmId: 'vm-006',
    vmName: 'DNS-DHCP-01',
    hostId: 'esxi-01',
    hostName: 'ESXi-01-SBEE',
    ip: '192.168.1.50',
    ports: [53, 67, 68],
    slaTarget: 99.9,
    criticality: 'high',
    contacts: ['Admin Sys'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-erp',
    name: 'ERP Finance',
    description: 'Système de gestion financière et comptable',
    icon: 'cpu',
    category: 'ERP',
    vmId: 'vm-010',
    vmName: 'ERP-FINANCE-01',
    hostId: 'esxi-02',
    hostName: 'ESXi-02-SBEE',
    ip: '192.168.1.60',
    ports: [80, 443, 8080],
    slaTarget: 99.5,
    criticality: 'high',
    contacts: ['DSI SBEE', 'DFC'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-veeam',
    name: 'Veeam Backup & Replication',
    description: 'Sauvegarde et réplication des VMs — serveur Veeam B&R 12',
    icon: 'box',
    category: 'Sauvegarde',
    vmId: 'vm-013',
    vmName: 'VEEAM-BR-01',
    hostId: 'esxi-03',
    hostName: 'ESXi-03-BACKUP',
    ip: '192.168.2.10',
    ports: [9501, 9502, 443],
    slaTarget: 99.0,
    criticality: 'medium',
    contacts: ['Admin Sys'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
  {
    id: 'svc-monitoring',
    name: 'SBEE Monitoring',
    description: 'Plateforme de supervision temps réel de l\'infrastructure SBEE',
    icon: 'activity',
    category: 'Supervision',
    vmId: 'vm-011',
    vmName: 'SBEE-MONITOR',
    hostId: 'esxi-02',
    hostName: 'ESXi-02-SBEE',
    ip: '192.168.1.70',
    ports: [3000, 3001],
    slaTarget: 99.0,
    criticality: 'medium',
    contacts: ['Admin Sys'],
    createdAt: new Date('2023-01-01').toISOString(),
  },
];

function read() {
  try {
    if (!fs.existsSync(DATA_FILE)) return DEFAULT_SERVICES;
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return DEFAULT_SERVICES;
  }
}

function write(services) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(services, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function getServices() {
  return read();
}

function saveService(svc) {
  const services = read();
  const idx = services.findIndex(s => s.id === svc.id);
  if (idx >= 0) {
    services[idx] = { ...services[idx], ...svc };
  } else {
    services.push({ ...svc, id: svc.id || `svc-${Date.now()}`, createdAt: new Date().toISOString() });
  }
  write(services);
  return services.find(s => s.id === svc.id);
}

function deleteService(id) {
  write(read().filter(s => s.id !== id));
}

module.exports = { getServices, saveService, deleteService, SERVICE_ICONS };
