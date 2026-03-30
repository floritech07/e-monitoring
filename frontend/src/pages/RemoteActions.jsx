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

  async function executeAction(actionOverride = null) {
    const actionData = actionOverride || pendingAction;
    if (!actionData) return;
    const { action, label } = actionData;
    
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
    const actionData = { action, label };
    if (action === 'stop' || action === 'restart') {
      setPendingAction(actionData);
      setModalOpen(true);
    } else {
      setPendingAction(actionData);
      executeAction(actionData);
    }
  }

  const isOn = vm.state === 'on';
  const isSuspended = vm.state === 'suspended';

  return (
    <div className={`card vm-action-card glass-panel ${isOn ? 'online' : isSuspended ? 'suspended' : 'offline'}`} style={{ minHeight: 'auto', padding: 24 }}>
      <div className="vm-card-main" style={{ marginBottom: 16 }}>
        <div className="vm-icon-status" style={{ gap: 20 }}>
          <div className="vm-avatar-wrapper" style={{ width: 64, height: 64, position: 'relative' }}>
            <div className="vm-avatar" style={{ width: 64, height: 64, position: 'relative', zIndex: 2 }}>
               <Monitor size={24} className={isOn ? 'text-success' : 'text-muted'} />
            </div>
            <div className="vm-status-ring" style={{ inset: -6, position: 'absolute', zIndex: 1, pointerEvents: 'none' }} />
          </div>
          <div className="vm-info-texts">
             <div className="vm-name-title" style={{ fontSize: 16 }}>{vm.name}</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
               <span className={`status-badge-premium ${isOn ? 'online' : isSuspended ? 'suspended' : 'offline'}`} style={{ padding: '2px 8px' }}>
                 <div className="dot" />
                 {isOn ? 'ACTIF' : isSuspended ? 'SUSPENDU' : 'ARRÊTÉ'}
               </span>
               <span className="vm-meta mono" style={{ fontSize: '10px' }}>{vm.ip || 'DHCP'}</span>
             </div>
          </div>
        </div>

        <div className="vm-badges">
          {isOn && (
            <div className="vm-mini-stats" style={{ gap: 12 }}>
              <div className="vms-stat" style={{ fontSize: 11 }}>
                <Cpu size={10} color="var(--accent)" />
                <span>{vm.cpu?.usage}%</span>
              </div>
              <div className="vms-stat" style={{ fontSize: 11 }}>
                <Activity size={10} color="var(--warning)" />
                <span>{vm.ram?.percent}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
         <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            OS: <strong style={{ color: 'var(--text-secondary)' }}>{vm.os}</strong>
         </div>
         <div className="action-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flex: 1, maxWidth: 320, marginLeft: 24 }}>
            <button className="btn-action start" disabled={isOn || !!loading} onClick={() => requestAction('start', 'Démarrer')} style={{ padding: '12px 6px' }}>
              {loading === 'start' ? <Loader size={12} className="rotate-animation" /> : <Play size={12} fill="currentColor" />}
            </button>
            <button className="btn-action stop" disabled={vm.state === 'off' || !!loading} onClick={() => requestAction('stop', 'Arrêter')} style={{ padding: '12px 6px' }}>
              {(loading === 'stop' || loading === 'stop_hard') ? <Loader size={12} className="rotate-animation" /> : <Square size={12} fill="currentColor" />}
            </button>
            <button className="btn-action restart" disabled={!isOn || !!loading} onClick={() => requestAction('restart', 'Redémarrer')} style={{ padding: '12px 6px' }}>
              {loading === 'restart' ? <Loader size={12} className="rotate-animation" /> : <RefreshCw size={12} />}
            </button>
            <button className="btn-action suspend" disabled={!isOn || !!loading} onClick={() => requestAction('suspend', 'Suspendre')} style={{ padding: '12px 6px' }}>
              {loading === 'suspend' ? <Loader size={12} className="rotate-animation" /> : <PauseCircle size={12} />}
            </button>
         </div>
      </div>

      {result && <ActionResult result={result} />}

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onConfirm={() => executeAction({ ...pendingAction, action: pendingAction?.action === 'stop' ? 'stop_hard' : pendingAction?.action })}
        title="Confirmation Requise"
        message={`Force l'arrêt immédiat de la machine virtuelle "${vm.name}".\n\n[Action: ${pendingAction?.label}]`}
        confirmLabel="Confirmer"
        type="warning"
      />
    </div>
  );
}

function InteractiveTerminal() {
  const [history, setHistory] = useState([
    { type: 'info', text: 'SBEE Monitor Terminal [v1.0.4]' },
    { type: 'info', text: 'Prêt pour l\'exécution de commandes système.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function runCommand(cmd) {
    if (!cmd) return;
    setLoading(true);
    setHistory(prev => [...prev, { type: 'cmd', text: `sbee@monitor:~$ ${cmd}` }]);
    try {
      const res = await api.terminalExec(cmd);
      setHistory(prev => [...prev, { type: res.success ? 'output' : 'error', text: res.output }]);
    } catch (e) {
      setHistory(prev => [...prev, { type: 'error', text: `Erreur d'exécution: ${e.message}` }]);
    } finally {
      setLoading(false);
      setInput('');
      // Scroll to bottom (handled by useEffect)
    }
  }

  const quickTools = [
    { label: 'IP Config', cmd: 'ipconfig' },
    { label: 'VM List', cmd: '"C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe" list' },
    { label: 'Netstat', cmd: 'netstat -an | findstr LISTENING' },
    { label: 'Services', cmd: 'sc query type= service state= all | findstr SERVICE_NAME' },
    { label: 'Uptime', cmd: 'powershell (Get-Date) - (Get-Process -Id $PID).StartTime' },
    { label: 'Ping Loop', cmd: 'ping 8.8.8.8 -n 4' }
  ];

  return (
    <div className="terminal-interactive">
      <div className="term-top-bar">
         <span>TERMINAL HÔTE PHYSIQUE</span>
         <span style={{ color: loading ? 'var(--accent)' : 'var(--success)' }}>
            {loading ? 'EXÉCUTION...' : 'CONNECTÉ'}
         </span>
      </div>
      
      <div className="term-body">
        {history.map((h, i) => (
          <div key={i} className={`term-line ${h.type}`}>
            {h.type === 'cmd' ? h.text : h.text}
          </div>
        ))}
        {loading && <div className="term-line"><span className="term-cursor" /></div>}
        <div id="term-bottom" />
      </div>

      <div className="quick-tools-grid">
         {quickTools.map(t => (
           <button key={t.label} className="btn-tool" onClick={() => runCommand(t.cmd)}>
              <Zap size={10} /> {t.label}
           </button>
         ))}
      </div>

      <form className="term-input-line" onSubmit={(e) => { e.preventDefault(); runCommand(input); }}>
         <span className="term-prompt">sbee@monitor:~$</span>
         <input 
           type="text" 
           className="term-input-field" 
           value={input}
           onChange={e => setInput(e.target.value)}
           placeholder="Tapez une commande..."
           disabled={loading}
         />
      </form>
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
        <div className="ph-left" style={{ gap: 24 }}>
          <div className="ph-icon-back">
            <Zap size={24} className="text-warning" />
          </div>
          <div>
            <h1 className="page-title-premium" style={{ color: 'var(--text-primary)' }}>Actions à distance</h1>
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
              <span>Actions affectant le noyau physique. Confirmation requise.</span>
            </div>

            <div className="host-btns">
              <button className="btn-host restart" onClick={() => handleHostBtn('restart', 'Redémarrage')} disabled={!!hostActionLoading}>
                <RefreshCw size={16} color="var(--warning)" className={hostActionLoading === 'restart' ? 'rotate-animation' : ''} />
                <div><div style={{ fontWeight: 700, fontSize: 13 }}>Redémarrer l'hôte</div></div>
              </button>
              <button className="btn-host shutdown" onClick={() => handleHostBtn('shutdown', 'Arrêt')} disabled={!!hostActionLoading}>
                <Power size={16} color="var(--danger)" className={hostActionLoading === 'shutdown' ? 'rotate-animation' : ''} />
                <div><div style={{ fontWeight: 700, fontSize: 13 }}>Éteindre l'hôte</div></div>
              </button>
            </div>
          </div>

          <div className="section-title-premium mt-4">
            <Terminal size={16} />
            Console Interactive
          </div>
          
          <InteractiveTerminal />
        </div>
      </div>

      <Modal 
        isOpen={hostModal.open}
        onClose={() => setHostModal({ open: false, action: null, label: '' })}
        onConfirm={executeHostAction}
        title="DANGER: Action Système"
        message={`Confirmez-vous le "${hostModal.label}" de la machine hôte ?`}
        confirmLabel="Confirmer"
        type="warning"
      />
    </div>
  );
}
