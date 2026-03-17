import { useState } from 'react';
import { 
  Zap, Play, Square, RefreshCw, PauseCircle, Camera, Power, 
  PowerOff, HardDrive, CheckCircle, XCircle, Loader, 
  Monitor, Cpu, Activity, LayoutGrid, Terminal, ShieldAlert,
  AlertTriangle 
} from 'lucide-react';

import { api } from '../api';
import Modal from '../components/Modal';

function ActionResult({ result }) {
  if (!result) return null;
  return (
    <div className={`fade-in action-res ${result.success ? 'success' : 'error'}`}>
      {result.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
      <span>{result.message}</span>
    </div>
  );
}

function VMActionCard({ vm, onAction }) {
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  async function executeAction() {
    if (!pendingAction) return;
    const { action, label } = pendingAction;
    
    setLoading(action);
    setResult(null);
    try {
      const res = await onAction(vm.id, action);
      if (res.success) {
        setResult({ success: true, message: `Action "${label}" effectuée.` });
      } else {
        setResult({ success: false, message: res.error || 'Erreur inconnue' });
      }
    } catch (e) {
      setResult({ success: false, message: `Erreur : ${e.message}` });
    } finally {
      setLoading(null);
      setPendingAction(null);
      setTimeout(() => setResult(null), 8000);
    }
  }

  function requestAction(action, label) {
    // Critical actions require confirmation
    if (action === 'stop' || action === 'restart') {
      setPendingAction({ action, label });
      setModalOpen(true);
    } else {
      setPendingAction({ action, label });
      executeAction();
    }
  }

  const isOn = vm.state === 'on';
  const isOff = vm.state === 'off';
  const isSuspended = vm.state === 'suspended';

  return (
    <div className="card vm-action-card glass-panel">
      <div className="vm-card-main">
        <div className="vm-icon-status">
          <div className={`vm-avatar ${isOn ? 'pulse-on' : ''}`}>
            <Monitor size={20} className={isOn ? 'text-accent' : 'text-muted'} />
          </div>
          <div className="vm-info-texts">
            <div className="vm-name-title">{vm.name}</div>
            <div className="vm-meta">
              <span className="mono">{vm.ip}</span> • <span>{vm.os}</span>
            </div>
          </div>
        </div>

        <div className="vm-badges">
          {isOn && (
            <div className="vm-mini-stats">
              <div className="vms-stat">
                <Cpu size={10} />
                <span>{vm.cpu?.usage}%</span>
              </div>
              <div className="vms-stat">
                <Activity size={10} />
                <span>{vm.ram?.percent}%</span>
              </div>
            </div>
          )}
          <div className={`status-badge-premium ${isOn ? 'online' : isSuspended ? 'suspended' : 'offline'}`}>
            <div className="dot" />
            {isOn ? 'ACTIF' : isSuspended ? 'SUSPENDU' : 'ARRÊTÉ'}
          </div>
        </div>

      </div>

      <div className="vm-action-controls">
        <div className="action-row">
          <button 
            className="btn-action start" 
            disabled={isOn || !!loading} 
            onClick={() => requestAction('start', 'Démarrer')}
            title="Démarrer la VM"
          >
            {loading === 'start' ? <Loader size={12} className="rotate-animation" /> : <Play size={12} fill="currentColor" />}
            <span>Démarrer</span>
          </button>
          
          <button 
            className="btn-action stop" 
            disabled={isOff || !!loading} 
            onClick={() => requestAction('stop', 'Arrêter')}
            title="Arrêter la VM"
          >
            {loading === 'stop' ? <Loader size={12} className="rotate-animation" /> : <Square size={12} fill="currentColor" />}
            <span>Arrêter</span>
          </button>
          
          <button 
            className="btn-action restart" 
            disabled={!isOn || !!loading} 
            onClick={() => requestAction('restart', 'Redémarrer')}
            title="Redémarrer la VM"
          >
            {loading === 'restart' ? <Loader size={12} className="rotate-animation" /> : <RefreshCw size={12} />}
            <span>Redémarrer</span>
          </button>
          
          <button 
            className="btn-action suspend" 
            disabled={!isOn || !!loading} 
            onClick={() => requestAction('suspend', 'Suspendre')}
            title="Suspendre la VM"
          >
            {loading === 'suspend' ? <Loader size={12} className="rotate-animation" /> : <PauseCircle size={12} />}
            <span>Suspendre</span>
          </button>
        </div>
        
        <ActionResult result={result} />
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onConfirm={executeAction}
        title="Confirmation Critique"
        message={`Vous êtes sur le point d'envoyer la commande [${pendingAction?.label.toUpperCase()}] à la machine "${vm.name}".\n\nCette action peut entraîner une perte de données non sauvegardées sur le système invité.`}
        confirmLabel={pendingAction?.label === 'Arrêter' ? 'Forcer l\'arrêt' : 'Appliquer l\'action'}
        type="warning"
      />

    </div>
  );
}

export default function RemoteActions({ vms }) {
  const [hostActionLoading, setHostActionLoading] = useState(null);
  const [hostModal, setHostModal] = useState({ open: false, action: null, label: '' });

  async function vmAction(id, action) {
    return api.vmAction(id, action);
  }

  async function executeHostAction() {
    const { action, label } = hostModal;
    setHostActionLoading(action);
    try {
      await api.hostAction(label);
      // Simulate confirmation
    } catch (e) {
      console.error(e);
    } finally {
      setHostActionLoading(null);
      setHostModal({ open: false, action: null, label: '' });
    }
  }

  function handleHostBtn(action, label) {
    setHostModal({ open: true, action, label });
  }

  return (
    <div className="remote-actions-page">
      <div className="page-header-premium">
        <div className="ph-left">
          <div className="ph-icon-back">
            <Zap size={24} className="text-warning" />
          </div>
          <div>
            <h1 className="page-title-premium">Actions à distance</h1>
            <p className="page-subtitle-premium">Contrôle direct de l'infrastructure et des machines virtuelles</p>
          </div>
        </div>
      </div>

      <div className="actions-layout">
        <div className="actions-main">
          <div className="section-title-premium">
            <Monitor size={16} />
            Machines Virtuelles VMware ({vms.length})
          </div>

          <div className="vm-actions-grid">
            {vms.length === 0 ? (
              <div className="empty-state-card glass-panel">
                <ShieldAlert size={48} className="text-muted" strokeWidth={1} />
                <p>Aucune machine virtuelle détectée sur l'hôte configuré.</p>
                <button className="btn btn-ghost mt-3">Actualiser la connexion</button>
              </div>
            ) : (
              vms.map(vm => (
                <VMActionCard key={vm.id} vm={vm} onAction={vmAction} />
              ))
            )}
          </div>
        </div>

        <div className="actions-sidebar">
          <div className="section-title-premium">
            <ShieldAlert size={16} />
            Sécurité Hôte
          </div>
          
          <div className="card host-actions-card glass-panel">
            <div className="host-warning">
              <AlertTriangle size={20} className="text-warning" />
              <span>Les actions suivantes affectent la machine physique hébergeant le moniteur.</span>
            </div>

            <div className="host-btns">
              <button 
                className="btn-host restart" 
                onClick={() => handleHostBtn('restart', 'Redémarrage')}
                disabled={!!hostActionLoading}
              >
                <RefreshCw size={14} className={hostActionLoading === 'restart' ? 'rotate-animation' : ''} />
                Redémarrer l'hôte
              </button>
              
              <button 
                className="btn-host shutdown" 
                onClick={() => handleHostBtn('shutdown', 'Arrêt')}
                disabled={!!hostActionLoading}
              >
                <PowerOff size={14} className={hostActionLoading === 'shutdown' ? 'rotate-animation' : ''} />
                Éteindre l'hôte
              </button>
              
              <button 
                className="btn-host maintenance" 
                onClick={() => handleHostBtn('maintenance', 'Vidage du cache')}
                disabled={!!hostActionLoading}
              >
                <HardDrive size={14} className={hostActionLoading === 'maintenance' ? 'rotate-animation' : ''} />
                Nettoyage Système
              </button>
            </div>
          </div>

          <div className="section-title-premium mt-4">
            <Terminal size={16} />
            Terminal de Commandes
          </div>
          <div className="card terminal-preview glass-panel">
            <div className="term-line"><span className="term-prompt">sbee@monitor:~$</span> check status --all</div>
            <div className="term-line text-success">Infrastructure: HEALTHY</div>
            <div className="term-line text-muted">Connectivity: VMware Driver [VMRUN]</div>
            <div className="term-line"><span className="term-prompt">sbee@monitor:~$</span> <span className="term-cursor" /></div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={hostModal.open}
        onClose={() => setHostModal({ open: false, action: null, label: '' })}
        onConfirm={executeHostAction}
        title="DANGER: Action Système"
        message={`Confirmez-vous le "${hostModal.label}" de la machine hôte ? L'application de monitoring sera également déconnectée.`}
        confirmLabel="Exécuter l'action"
        type="warning"
      />
    </div>
  );
}
