import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Monitor, X, Maximize2, RefreshCcw, 
  Terminal, ShieldCheck, Activity, Power
} from 'lucide-react';
import { api } from '../api';

/**
 * NEXUS CONSOLE — VMware WebMKS Simulation
 * Un flux de streaming en temps réel pour le contrôle des machines virtuelles.
 */

export default function VMConsole() {
  const { vmId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // 1. Récupérer le ticket de console
    api.getVMConsoleTicket(vmId)
      .then(setTicket)
      .catch(err => setError("Impossible de générer le ticket VMRC"));

    // 2. Setup du rafraîchissement du flux (simule 2-3 FPS pour la fluidité démo)
    const interval = setInterval(() => {
      setFrameCount(prev => prev + 1);
    }, 800); // 800ms pour ne pas surcharger le CPU VMware workstation en démo

    return () => clearInterval(interval);
  }, [vmId]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#000', color: '#f5534b', flexDirection: 'column' }}>
        <X size={48} />
        <h2 style={{ marginTop: 20 }}>Erreur de Console</h2>
        <p>{error}</p>
        <button className="btn btn-ghost mt-3" onClick={() => navigate(-1)}>Retour</button>
      </div>
    );
  }

  // URL du flux avec cache-buster
  const streamUrl = ticket ? `http://localhost:3001${ticket.streamUrl}?t=${frameCount}` : null;

  return (
    <div 
      ref={containerRef}
      className="fade-in" 
      style={{ 
        height: 'calc(100vh - 60px)', 
        background: '#0a0a0c', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #252938'
      }}
    >
      {/* Barre d'outils style VMware */}
      <div style={{ 
        height: 48, 
        background: '#1c1c1f', 
        borderBottom: '1px solid #2c3235',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Monitor size={18} color="#4f8ef7" />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0' }}>CONSOLE : VM-{vmId.toUpperCase()}</span>
            <span style={{ fontSize: 10, color: '#22d3a3', marginLeft: 10 }}>● SESSION ACTIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#2c3235', padding: '4px 10px', borderRadius: 4, gap: 8 }}>
             <Activity size={12} color="#f5a623" />
             <span style={{ fontSize: 10, fontWeight: 600 }}>Trafic: 1.2 Mbps</span>
          </div>
          <button className="btn-icon" onClick={toggleFullscreen} title="Plein écran">
            <Maximize2 size={16} />
          </button>
          <button className="btn-icon" onClick={() => setFrameCount(f => f + 1)} title="Rafraîchir">
            <RefreshCcw size={16} />
          </button>
          <button className="btn-icon" style={{ background: '#f5534b', color: 'white' }} onClick={() => navigate(-1)}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Zone d'affichage Console */}
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        cursor: 'crosshair'
      }}>
        {streamUrl ? (
          <img 
            key={frameCount}
            src={streamUrl} 
            alt="VM Console Stream"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              boxShadow: '0 0 50px rgba(0,0,0,0.5)',
              imageRendering: 'pixelated' // Pour garder l'aspect console nette
            }}
            onError={() => setError("La VM est éteinte ou la console n'est pas accessible.")}
          />
        ) : (
          <div className="loading-spin" />
        )}

        {/* Overlay d'information discret */}
        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 20, 
          padding: '8px 12px', 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          borderRadius: 4,
          fontSize: 10,
          color: '#8e8e8e',
          fontFamily: 'monospace'
        }}>
          NEXUS-PROXY V2 // ENCRYPTED-STREAM // {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div style={{ 
        height: 32, 
        background: '#13151c', 
        borderTop: '1px solid #2c3235',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: 11,
        color: '#545b78'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ShieldCheck size={12} /> SSL Secured</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Terminal size={12} /> KB: French (AZERTY)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Power size={12} color="#22d3a3" /> VMware Tools Active</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          ID: {ticket?.ticket || 'Connecting...'}
        </div>
      </div>
    </div>
  );
}
