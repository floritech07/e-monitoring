import { useEffect, useState } from 'react';

export function useMetricSounds(metrics, vms = [], alerts = []) {
  const [alertState, setAlertState] = useState({ active: false, message: '', type: null });

  useEffect(() => {
    const savedSettings = localStorage.getItem('sbee_alert_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
      cpu: { threshold: 85, enabled: true },
      ram: { threshold: 90, enabled: true },
      disk: { threshold: 90, enabled: true },
      tx: { threshold: 10, enabled: true },
    };

    const paymentSettings = JSON.parse(localStorage.getItem('sbee_payment_alerts') || '{"soundEnabled":true,"operatorFrequencies":{}}');

    let isCritical = false;
    let message = '';
    let type = null;

    // 1. Transaction check (Highest Priority)
    if (vms && Array.isArray(vms)) {
      const lowTxVm = vms.find(vm =>
        vm.state === 'on' &&
        vm.transactions !== undefined &&
        vm.transactions !== null &&
        vm.transactions < (settings.tx?.threshold || 10)
      );
      if (lowTxVm && settings.tx?.enabled) {
        isCritical = true;
        message = `ALERTE CRITIQUE: Transactions hors-seuil sur ${lowTxVm.name} (${lowTxVm.transactions} tx/min)`;
        type = 'critical';
      }
    }

    // 2. Payment Flow Alerts
    if (!isCritical && alerts && Array.isArray(alerts)) {
      const paymentAlert = alerts.find(a => a.category === 'payment' && !a.resolved);
      if (paymentAlert && paymentSettings.soundEnabled) {
        isCritical = true;
        message = `ALERTE FLUX: ${paymentAlert.message}`;
        type = 'critical';
      }
    }

    // 3. Metrics check
    if (!isCritical && metrics) {
      const { cpu, ram, disk } = metrics;
      if (cpu?.usage > settings.cpu.threshold && settings.cpu.enabled) {
        isCritical = true;
        message = `ALERTE SYSTÈME: Utilisation CPU élevée (${cpu.usage.toFixed(1)}%)`;
        type = 'warning';
      } else if (ram?.percent > settings.ram.threshold && settings.ram.enabled) {
        isCritical = true;
        message = `ALERTE MÉMOIRE: RAM saturée (${ram.percent.toFixed(1)}%)`;
        type = 'warning';
      } else if (disk?.some(d => d.percent > settings.disk.threshold) && settings.disk.enabled) {
        const fullDisk = disk.find(d => d.percent > settings.disk.threshold);
        isCritical = true;
        message = `ALERTE DISQUE: Espace critique sur ${fullDisk.mount} (${fullDisk.percent.toFixed(1)}%)`;
        type = 'warning';
      }
    }

    if (isCritical) {
      setAlertState({ active: true, message, type });
    } else {
      setAlertState({ active: false, message: '', type: null });
    }
  }, [metrics, vms, alerts]);

  return alertState;
}
