import React, { useEffect, useRef, useState } from 'react';

interface TopologyNode {
  id: string;
  label: string;
  type: 'server' | 'switch' | 'router' | 'firewall';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  x?: number;
  y?: number;
}

interface TopologyEdge {
  source: string;
  target: string;
  bandwidth_gbps?: number;
}

const NODE_COLORS = { healthy: '#34D399', warning: '#FCD34D', critical: '#F87171', unknown: '#6B7280' };
const NODE_ICONS = { server: '🖥', switch: '🔀', router: '📡', firewall: '🛡' };

const TopologyMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<TopologyNode[]>([
    { id: 'fw-01', label: 'Core Firewall', type: 'firewall', status: 'healthy', x: 400, y: 80 },
    { id: 'sw-01', label: 'Dist Switch A', type: 'switch', status: 'warning', x: 200, y: 220 },
    { id: 'sw-02', label: 'Dist Switch B', type: 'switch', status: 'healthy', x: 600, y: 220 },
    { id: 'esx-01', label: 'ESXi Host 1', type: 'server', status: 'critical', x: 100, y: 380 },
    { id: 'esx-02', label: 'ESXi Host 2', type: 'server', status: 'healthy', x: 320, y: 380 },
    { id: 'srv-sql', label: 'SQL Server', type: 'server', status: 'healthy', x: 520, y: 380 },
    { id: 'rtr-01', label: 'Core Router', type: 'router', status: 'healthy', x: 740, y: 380 },
  ]);
  const [edges] = useState<TopologyEdge[]>([
    { source: 'fw-01', target: 'sw-01', bandwidth_gbps: 10 },
    { source: 'fw-01', target: 'sw-02', bandwidth_gbps: 10 },
    { source: 'sw-01', target: 'esx-01', bandwidth_gbps: 25 },
    { source: 'sw-01', target: 'esx-02', bandwidth_gbps: 25 },
    { source: 'sw-02', target: 'srv-sql', bandwidth_gbps: 10 },
    { source: 'sw-02', target: 'rtr-01', bandwidth_gbps: 40 },
  ]);
  const [selected, setSelected] = useState<TopologyNode | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const draw = (canvas: HTMLCanvasElement, currentNodes: TopologyNode[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0A0A12';
    ctx.fillRect(0, 0, W, H);

    // Draw edges
    edges.forEach(edge => {
      const s = currentNodes.find(n => n.id === edge.source);
      const t = currentNodes.find(n => n.id === edge.target);
      if (!s || !t) return;
      
      ctx.beginPath();
      ctx.moveTo(s.x!, s.y!);
      ctx.lineTo(t.x!, t.y!);
      ctx.strokeStyle = '#2D3748';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Bandwidth label
      const mx = (s.x! + t.x!) / 2, my = (s.y! + t.y!) / 2;
      ctx.fillStyle = '#4A5568';
      ctx.font = '10px monospace';
      ctx.fillText(`${edge.bandwidth_gbps}G`, mx + 4, my - 4);
    });
    
    // Draw nodes
    currentNodes.forEach(node => {
      const x = node.x!, y = node.y!;
      const color = NODE_COLORS[node.status];
      
      // Glow effect
      ctx.shadowBlur = node.status === 'critical' ? 20 : 8;
      ctx.shadowColor = color;
      
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#1E1E2E';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Icon
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(NODE_ICONS[node.type] || '●', x, y - 2);
      
      // Label
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, x, y + 32);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw(canvas, nodes);
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const hit = nodes.find(n => Math.hypot((n.x || 0) - mx, (n.y || 0) - my) < 30);
    if (hit) { setDragging(hit.id); setSelected(hit); }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n));
  };

  return (
    <div style={{ height: '100vh', background: '#0A0A12', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1E1E2E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20 }}>Network Topology</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {Object.entries(NODE_COLORS).map(([status, color]) => (
            <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {status}
            </span>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ flex: 1, width: '100%', cursor: dragging ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setDragging(null)} />
      {selected && (
        <div style={{
          position: 'absolute', bottom: 24, left: 24, background: '#1E1E2E',
          border: '1px solid #2D3748', borderRadius: 12, padding: 16, color: '#E2E8F0', fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{selected.label}</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Type: {selected.type}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Status: <span style={{ color: NODE_COLORS[selected.status], fontWeight: 600 }}>{selected.status.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopologyMap;
