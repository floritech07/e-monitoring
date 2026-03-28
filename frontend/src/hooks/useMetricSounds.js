import { useEffect, useRef, useState } from 'react';

/**
 * Hook to play a continuous alarm sound and manage global alert state
 * @param {Object} metrics - Current metrics from useSocket
 * @param {Array} vms - Current VMs from useSocket
 * @param {Array} alerts - Current alerts from useSocket
 * @returns {Object} Alert state { active, message, type }
 */
export function useMetricSounds(metrics, vms = [], alerts = []) {
  const [alertState, setAlertState] = useState({ active: false, message: '', type: null });
  const activeOscillator = useRef(null);
  const audioContext = useRef(null);
  const sweepInterval = useRef(null);

  const startContinuousTone = (freq = 880, volume = 0.25) => {
    try {
      if (activeOscillator.current) {
        // Just update frequency if already playing
        activeOscillator.current.oscillator.frequency.setTargetAtTime(freq, audioContext.current.currentTime, 0.1);
        return;
      }

      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioContext.current;
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      activeOscillator.current = { oscillator, gainNode, ctx };

      // Add a "siren" sweep effect
      let up = true;
      sweepInterval.current = setInterval(() => {
        const currentFreq = oscillator.frequency.value;
        if (up) {
          oscillator.frequency.setTargetAtTime(freq * 1.2, ctx.currentTime, 0.1);
          if (currentFreq >= freq * 1.15) up = false;
        } else {
          oscillator.frequency.setTargetAtTime(freq * 0.8, ctx.currentTime, 0.1);
          if (currentFreq <= freq * 0.85) up = true;
        }
      }, 200);

    } catch (e) {
      console.warn('Failed to start tone:', e);
    }
  };

  const stopContinuousTone = () => {
    if (sweepInterval.current) {
      clearInterval(sweepInterval.current);
      sweepInterval.current = null;
    }
    
    if (activeOscillator.current) {
      const { oscillator, gainNode, ctx } = activeOscillator.current;
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
        setTimeout(() => {
          try {
            oscillator.stop();
            oscillator.disconnect();
          } catch (e) {}
        }, 150);
      } catch (e) {}
      activeOscillator.current = null;
    }
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('sbee_alert_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
      cpu: { threshold: 85, enabled: true, frequency: 880 },
      ram: { threshold: 90, enabled: true, frequency: 1046.5 },
      disk: { threshold: 90, enabled: true, frequency: 659.25 },
      tx: { threshold: 10, enabled: true, frequency: 987.77 },
      soundEnabled: true
    };

    const paymentSettings = JSON.parse(localStorage.getItem('sbee_payment_alerts') || '{"soundEnabled":true,"operatorFrequencies":{}}');

    let isCritical = false;
    let freq = 880;
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
        freq = settings.tx.frequency || 987.77;
        message = `ALERTE CRITIQUE: Transactions hors-seuil sur ${lowTxVm.name} (${lowTxVm.transactions} tx/min)`;
        type = 'critical';
      }
    }

    // 2. Payment Flow Alerts (Higher Priority)
    if (!isCritical && alerts && Array.isArray(alerts)) {
      const paymentAlert = alerts.find(a => a.category === 'payment' && !a.resolved);
      if (paymentAlert && paymentSettings.soundEnabled) {
        isCritical = true;
        // Extract operator from source (e.g., PREPAID_MOOV)
        const parts = paymentAlert.source.split('_');
        const operator = parts[parts.length - 1];
        freq = paymentSettings.operatorFrequencies[operator] || 523.25; // Default C5
        message = `ALERTE FLUX: ${paymentAlert.message}`;
        type = 'critical';
      }
    }

    // 3. Metrics check
    if (!isCritical && metrics) {
      const { cpu, ram, disk } = metrics;
      if (cpu?.usage > settings.cpu.threshold && settings.cpu.enabled) {
        isCritical = true;
        freq = settings.cpu.frequency || 880;
        message = `ALERTE SYSTÈME: Utilisation CPU élevée (${cpu.usage.toFixed(1)}%)`;
        type = 'warning';
      } else if (ram?.percent > settings.ram.threshold && settings.ram.enabled) {
        isCritical = true;
        freq = settings.ram.frequency || 1046.5;
        message = `ALERTE MÉMOIRE: RAM saturée (${ram.percent.toFixed(1)}%)`;
        type = 'warning';
      } else if (disk?.some(d => d.percent > settings.disk.threshold) && settings.disk.enabled) {
        const fullDisk = disk.find(d => d.percent > settings.disk.threshold);
        isCritical = true;
        freq = settings.disk.frequency || 659.25;
        message = `ALERTE DISQUE: Espace critique sur ${fullDisk.mount} (${fullDisk.percent.toFixed(1)}%)`;
        type = 'warning';
      }
    }

    if (isCritical) {
      setAlertState({ active: true, message, type });
      if (settings.soundEnabled) {
        startContinuousTone(freq, 0.3);
      } else {
        stopContinuousTone();
      }
    } else {
      setAlertState({ active: false, message: '', type: null });
      stopContinuousTone();
    }

    // Cleanup on unmount
    return () => {
      stopContinuousTone();
    };
  }, [metrics, vms, alerts]);

  return alertState;
}
