// En dev: utilise VITE_API_URL si défini, sinon détecte l'hôte automatiquement.
// En prod (build): pointe toujours vers le backend sur le même hôte, port 3001.
const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Host
  getHostMetrics:   ()              => req('/metrics/host'),
  hostAction:       (action)        => req('/host/action', { method: 'POST', body: JSON.stringify({ action }) }),

  // VMs
  listVMs:          ()              => req('/vms'),
  vmAction:         (id, action)    => req(`/vms/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Infrastructure tree
  getInfrastructure: ()             => req('/infrastructure'),

  // Alerts
  getAlerts:        ()              => req('/alerts'),
  getAllAlerts:      (limit = 200)  => req(`/alerts/all?limit=${limit}`),
  getAlertHistory:  (limit = 100)  => req(`/alerts/history?limit=${limit}`),
  clearAlerts:      ()              => req('/alerts/clear', { method: 'POST' }),
  acknowledgeAlert: (id, user, comment) =>
    req(`/alerts/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ user, comment }) }),

  // Alert Rules
  getRules:         ()              => req('/rules'),
  createRule:       (rule)          => req('/rules', { method: 'POST', body: JSON.stringify(rule) }),
  updateRule:       (id, rule)      => req(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }),
  deleteRule:       (id)            => req(`/rules/${id}`, { method: 'DELETE' }),

  // Silences
  getSilences:      ()              => req('/silences'),
  createSilence:    (s)             => req('/silences', { method: 'POST', body: JSON.stringify(s) }),
  deleteSilence:    (id)            => req(`/silences/${id}`, { method: 'DELETE' }),

  // Activity
  getActivity:      ()              => req('/activity'),

  // Veeam
  getVeeam:         (refresh)       => req(`/veeam${refresh ? '?refresh=true' : ''}`),
  getVeeamConfig:   ()              => req('/veeam/config'),
  saveVeeamConfig:  (cfg)           => req('/veeam/config', { method: 'PUT', body: JSON.stringify(cfg) }),
  veeamJobAction:   (jobId, action) =>
    req(`/veeam/jobs/${jobId}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Network / Assets
  getNetworkAssets: ()              => req('/network/assets'),
  createAsset:      (a)             => req('/network/assets', { method: 'POST', body: JSON.stringify(a) }),
  updateAsset:      (id, a)         => req(`/network/assets/${id}`, { method: 'PUT', body: JSON.stringify(a) }),
  deleteAsset:      (id)            => req(`/network/assets/${id}`, { method: 'DELETE' }),
  probeAsset:       (id)            => req(`/network/assets/${id}/probe`, { method: 'POST' }),
  getAssetHistory:  (id)            => req(`/network/assets/${id}/history`),

  // Topology
  getTopology:      ()              => req('/network/topology'),

  // Reports
  getAvailability:  (period)        => req(`/reports/availability?period=${period || '24h'}`),
  getBackupReport:  ()              => req('/reports/backup'),

  // Terminal
  terminalExec:     (command)       => req('/terminal/exec', { method: 'POST', body: JSON.stringify({ command }) }),

  // System Scan & Detection
  getSystemScan:    ()              => req('/system/scan'),
  getHypervisors:   ()              => req('/system/hypervisors'),

  // Datacenter 3D (topologie physique : salles / racks / équipements)
  getDatacenter:       ()                     => req('/datacenter'),
  getDeviceTypes:      ()                     => req('/datacenter/device-types'),
  updateDatacenter:    (body)                 => req('/datacenter', { method: 'PUT', body: JSON.stringify(body) }),
  updateRoom:          (roomId, body)         => req(`/datacenter/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(body) }),
  addRack:             (roomId, body)         => req(`/datacenter/rooms/${roomId}/racks`, { method: 'POST', body: JSON.stringify(body) }),
  updateRack:          (rackId, body)         => req(`/datacenter/racks/${rackId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRack:          (rackId)               => req(`/datacenter/racks/${rackId}`, { method: 'DELETE' }),
  addDevice:           (rackId, body)         => req(`/datacenter/racks/${rackId}/devices`, { method: 'POST', body: JSON.stringify(body) }),
  updateDevice:        (deviceId, body)       => req(`/datacenter/devices/${deviceId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDevice:        (deviceId)             => req(`/datacenter/devices/${deviceId}`, { method: 'DELETE' }),

  // ESXi / Virtualisation
  getClusters:         ()               => req('/esxi/clusters'),
  getEsxiHosts:        ()               => req('/esxi/hosts'),
  getEsxiHost:         (id)             => req(`/esxi/hosts/${id}`),
  getHostVMs:          (id)             => req(`/esxi/hosts/${id}/vms`),
  getHostStorage:      (id)             => req(`/esxi/hosts/${id}/storage`),
  getHostNetwork:      (id)             => req(`/esxi/hosts/${id}/network`),
  getHostPerfHistory:  (id)             => req(`/esxi/hosts/${id}/perf`),
  getEsxiVSan:         (id)             => req(`/esxi/clusters/${id}/vsan`),
  getEsxiMultipathing: (id)             => req(`/esxi/hosts/${id}/multipathing`),
  getEsxiNsx:          ()               => req(`/esxi/nsx`),
  getEsxiVMotion:      ()               => req(`/esxi/vmotion`),
  getEsxiDrsHa:        ()               => req(`/esxi/drs-ha`),
  esxiVmAction:        (vmId, action)   => req(`/esxi/vms/${vmId}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Services Map
  getServicesMap:      ()               => req('/services-map'),
  createService:       (svc)            => req('/services-map', { method: 'POST', body: JSON.stringify(svc) }),
  updateService:       (id, svc)        => req(`/services-map/${id}`, { method: 'PUT', body: JSON.stringify(svc) }),
  deleteService:       (id)             => req(`/services-map/${id}`, { method: 'DELETE' }),

  // Stockage
  getStorageTopology:  ()               => req('/storage/topology'),
  getStorageStats:     ()               => req('/storage/stats'),

  // Environnement physique (capteurs, CRAC, heatmap)
  getRoomSensors:      ()               => req('/environment/sensors'),
  getEnvSummary:       ()               => req('/environment/summary'),
  getEnvHeatmap:       ()               => req('/environment/heatmap'),
  getCracStatus:       ()               => req('/environment/crac'),

  // Logs Syslog
  getLogs:             (params = {})    => req(`/logs?${new URLSearchParams(params).toString()}`),
  getLogStats:         ()               => req('/logs/stats'),
  getGeoIp:            (ip)             => req(`/logs/geoip?ip=${encodeURIComponent(ip)}`),

  // Alert Engine v2
  getActiveAlerts:     ()               => req('/alerts/active'),
  getAlertEngineStats: ()               => req('/alerts/engine/stats'),
  getAlertHistory:     ()               => req('/alerts/engine/history'),
  ackAlertEngine:      (key, user)      => req(`/alerts/engine/${encodeURIComponent(key)}/ack`, { method: 'POST', body: JSON.stringify({ user }) }),

  // Environnement étendu (PDU, groupe élec, ATS, qualité air, pression, portes)
  getEnvPDU:           ()               => req('/environment/pdu'),
  getEnvGenset:        ()               => req('/environment/genset'),
  getEnvATS:           ()               => req('/environment/ats'),
  getEnvAirQuality:    ()               => req('/environment/air-quality'),
  getEnvPressure:      ()               => req('/environment/pressure'),
  getEnvDoors:         ()               => req('/environment/doors'),
  getEnvDoorEvents:    (limit = 50)     => req(`/environment/doors/events?limit=${limit}`),
  getEnvPowerQuality:  ()               => req('/environment/power-quality'),

  // Redfish étendu (SMART, RAID/BBU, SEL)
  getServerSMART:      (id)             => req(`/redfish/servers/${id}/smart`),
  getServerRAID:       (id)             => req(`/redfish/servers/${id}/raid`),
  getServerSEL:        (id)             => req(`/redfish/servers/${id}/sel`),

  // Syslog serveur réel
  getSyslogLogs:       (params = {})    => req(`/syslog/logs?${new URLSearchParams(params).toString()}`),
  getSyslogStats:      ()               => req('/syslog/stats'),
  getSyslogRules:      ()               => req('/syslog/rules'),

  // Astreinte + Incidents ITIL
  getOnCallCurrent:    ()               => req('/oncall/current'),
  getIncidents:        (p = {})         => req(`/oncall/incidents?${new URLSearchParams(p).toString()}`),
  getIncidentStats:    ()               => req('/oncall/incidents/stats'),
  getIncident:         (id)             => req(`/oncall/incidents/${id}`),
  updateIncident:      (id, data)       => req(`/oncall/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addIncidentNote:     (id, note)       => req(`/oncall/incidents/${id}/note`, { method: 'POST', body: JSON.stringify(note) }),
  escalateIncident:    (id, toLevel)    => req(`/oncall/incidents/${id}/escalate`, { method: 'POST', body: JSON.stringify({ toLevel }) }),
  getSchedules:        ()               => req('/oncall/schedules'),
  updateSchedule:      (id, data)       => req(`/oncall/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getOverrides:        ()               => req('/oncall/overrides'),
  addOverride:         (o)              => req('/oncall/overrides', { method: 'POST', body: JSON.stringify(o) }),
  deleteOverride:      (id)             => req(`/oncall/overrides/${id}`, { method: 'DELETE' }),

  // Vérifications de services
  getServiceChecks:    ()               => req('/service-checks'),
  getServiceChecksAll: ()               => req('/service-checks/all-status'),
  getServiceCheck:     (id)             => req(`/service-checks/${id}`),
  triggerServiceCheck: (id)             => req(`/service-checks/${id}/check`, { method: 'POST' }),
  getMaintenanceWindows:()              => req('/service-checks/maintenance/list'),
  addMaintenanceWindow:(w)              => req('/service-checks/maintenance', { method: 'POST', body: JSON.stringify(w) }),
  deleteMaintenanceWindow:(id)          => req(`/service-checks/maintenance/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifChannels:    ()               => req('/notifications/channels'),
  getNotifHistory:     (limit = 100)    => req(`/notifications/history?limit=${limit}`),
  testNotifChannel:    (channel, target)=> req('/notifications/test', { method: 'POST', body: JSON.stringify({ channel, target }) }),

  // Payment Trends
  getPrepaidTrend:  (range)         => req(`/payments/trends/prepaid?range=${range || '24h'}`),
  getPostpaidTrend: (range)         => req(`/payments/trends/postpaid?range=${range || '24h'}`),
  getPaymentStats:  ()              => req('/payments/stats'),
  getPaymentRules:  ()              => req('/payments/rules'),
  createPaymentRule:(rule)          => req('/payments/rules', { method: 'POST', body: JSON.stringify(rule) }),
  updatePaymentRule:(id, rule)      => req(`/payments/rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }),
  deletePaymentRule:(id)            => req(`/payments/rules/${id}`, { method: 'DELETE' }),

  // Audit Trail
  getAuditTrail:      (p = {})     => req(`/audit?${new URLSearchParams(p).toString()}`),

  // Veeam GFS + Immutabilité
  getVeeamGFS:        ()           => req('/veeam/gfs'),
  getVeeamSureBackup: ()           => req('/veeam/surebackup'),
  getVeeamReplication:()           => req('/veeam/replication'),
  getVeeamUnprotected:()           => req('/veeam/unprotected-vms'),
  getVeeamObjectStorage:()         => req('/veeam/object-storage'),

  // Room Map layout (éditeur admin)
  getRoomLayout:      ()           => req('/room/layout'),
  saveRoomLayout:     (data)       => req('/room/layout', { method: 'PUT', body: JSON.stringify(data) }),

  // Capacity Planning
  getCapacityHistory: ()           => req('/capacity/history'),
  getCapacityReport:  ()           => req('/capacity/report'),

  // Console VM
  getVMConsoleTicket: (vmId)       => req(`/vms/${vmId}/console-ticket`),

  // Syslog rétention configurable
  getSyslogRetention: ()           => req('/syslog/retention'),
  setSyslogRetention: (days)       => req('/syslog/retention', { method: 'PUT', body: JSON.stringify({ days }) }),

  // RBAC info
  getRbacInfo:        ()           => req('/rbac/info'),

  // Environnement étendu — TGBT, BMS, WUE, CRAC détail
  getEnvTGBT:         ()           => req('/environment/tgbt'),
  getEnvBMSBatteries: ()           => req('/environment/bms/batteries'),
  getEnvWUE:          ()           => req('/environment/wue'),
  getEnvCRACDetail:   ()           => req('/environment/crac/detail'),

  // SNMP additionnel
  getSnmpDiscovery:    ()           => req('/snmp/discovery'),
  getSnmpVpn:          ()           => req('/snmp/vpn'),
  getSnmpWan:          ()           => req('/snmp/wan'),
  getSnmpData:         ()           => req('/snmp/collect'),
};
