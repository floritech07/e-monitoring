import React from 'react';
import ReactDOM from 'react-dom';
import { 
  AlertTriangle, X, Info, CheckCircle, 
  Power, RotateCcw, ShieldAlert, XCircle,
  Cpu, Terminal, Activity
} from 'lucide-react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirmer', 
  cancelLabel = 'Annuler',
  type = 'warning' 
}) => {
  if (!isOpen) return null;

  const getActionIcon = () => {
    const label = confirmLabel.toLowerCase();
    if (label.includes('arrê') || label.includes('shutdown') || label.includes('éteindre')) return <Power size={18} />;
    if (label.includes('redé') || label.includes('restart')) return <RotateCcw size={18} />;
    return <CheckCircle size={18} />;
  };

  const lines = message.split('\n');

  const modalContent = (
    <div className="md-mask" onClick={onClose}>
      <div className={`md-wrap ${type}`} onClick={e => e.stopPropagation()}>
        <div className="md-head">
          <div className="md-badge-icon">
            {type === 'warning' && <ShieldAlert size={28} />}
            {type === 'info' && <Info size={28} />}
            {type === 'success' && <CheckCircle size={28} />}
          </div>
          <div className="md-head-content">
            <h2 className="md-title-p">{title}</h2>
            <div className="md-subtitle">SYSTÈME DE SURVEILLANCE SBEE</div>
          </div>
          <button className="md-close-x" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        
        <div className="md-inner">
          <div className="md-main-text">
            {lines.map((line, i) => (
              <p key={i} className={line === '' ? 'gap' : 'line'}>
                {line.split(/(\[.*?\])/).map((part, j) => 
                  part.startsWith('[') ? (
                    <span key={j} className="md-code-token">
                      <Terminal size={10} style={{ marginRight: 4 }} />
                      {part.slice(1, -1)}
                    </span>
                  ) : part
                )}
              </p>
            ))}
          </div>

          {type === 'warning' && (
            <div className="md-warning-card">
              <div className="md-warning-strip" />
              <div className="md-warning-body">
                <AlertTriangle size={14} />
                <span>Cette opération est irréversible et affectera la continuité du service.</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="md-foot">
          <button className="md-btn-p md-btn-p-sec" onClick={onClose}>
            <XCircle size={18} />
            {cancelLabel}
          </button>
          <button 
            className={`md-btn-p md-btn-p-main ${type}`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {getActionIcon()}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
