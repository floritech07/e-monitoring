let alerts = [];
let alertId = 1;

const THRESHOLDS = {
  cpu: 85,      // %
  ram: 90,      // %
  disk: 90,     // %
};

function addAlert(level, category, message, source) {
  // Avoid duplicate active alerts for same category+source
  const existing = alerts.find(a => a.category === category && a.source === source && !a.resolved);
  if (!existing) {
    alerts.push({
      id: alertId++,
      level,      // 'critical' | 'warning' | 'info'
      category,   // 'cpu' | 'ram' | 'disk' | 'vm' | 'network'
      message,
      source,
      timestamp: Date.now(),
      resolved: false
    });
  }
}

function resolveAlert(category, source) {
  alerts
    .filter(a => a.category === category && a.source === source && !a.resolved)
    .forEach(a => a.resolved = true);
}

function evaluate(metrics, vms) {
  // CPU check
  if (metrics.cpu.usage > THRESHOLDS.cpu) {
    addAlert('critical', 'cpu', `CPU usage critical: ${metrics.cpu.usage}%`, metrics.host.hostname);
  } else {
    resolveAlert('cpu', metrics.host.hostname);
  }

  // RAM check
  if (metrics.ram.percent > THRESHOLDS.ram) {
    addAlert('critical', 'ram', `RAM usage critical: ${metrics.ram.percent}%`, metrics.host.hostname);
  } else {
    resolveAlert('ram', metrics.host.hostname);
  }

  // Disk check
  if (metrics.disk) {
    metrics.disk.forEach(d => {
      if (d.percent > THRESHOLDS.disk) {
        addAlert('warning', 'disk', `Low disk space on ${d.mount}: ${d.percent}% used`, metrics.host.hostname);
      } else {
        resolveAlert('disk', metrics.host.hostname);
      }
    });
  }

  // VM state checks
  if (vms) {
    vms.forEach(vm => {
      if (vm.state === 'off') {
        addAlert('info', 'vm', `VM "${vm.name}" is powered off`, vm.id);
      } else {
        resolveAlert('vm', vm.id);
      }
    });
  }

  return getAlerts();
}

function getAlerts() {
  // Return active alerts, most recent first
  return alerts.filter(a => !a.resolved).sort((a, b) => b.timestamp - a.timestamp);
}

function clearAlerts() {
  alerts.forEach(a => a.resolved = true);
}

function updateThresholds(newThresholds) {
  Object.assign(THRESHOLDS, newThresholds);
}

module.exports = { evaluate, getAlerts, clearAlerts, addAlert, updateThresholds, THRESHOLDS };
