import React, { useState } from 'react';
import { useDashboard, WidgetConfig } from '../../hooks/useDashboard';
import Widget from './Widget';
import WidgetConfigModal from './WidgetConfigModal';

const COLS = 12;
const ROW_H = 80;

const GridLayout: React.FC = () => {
  const { widgets, addWidget, removeWidget, updateWidget, resetLayout } = useDashboard();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WidgetConfig | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const maxRow = widgets.reduce((m, w) => Math.max(m, w.gridPos.y + w.gridPos.h), 0);

  return (
    <div style={{ padding: 24, background: '#0A0A12', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#F8FAFC', fontWeight: 700, fontSize: 20 }}>Custom Dashboard</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setEditTarget(null); setModalOpen(true); }} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#6366F1', color: '#fff', fontWeight: 600, fontSize: 13
          }}>+ Add Widget</button>
          <button onClick={resetLayout} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #374151',
            background: 'transparent', color: '#6B7280', cursor: 'pointer', fontSize: 13
          }}>Reset</button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div style={{
        position: 'relative',
        height: (maxRow + 2) * ROW_H,
        background: `repeating-linear-gradient(90deg, transparent, transparent ${(100 / COLS)}%, rgba(255,255,255,0.02) ${(100 / COLS)}%, rgba(255,255,255,0.02) calc(${(100 / COLS)}% + 1px))`,
        borderRadius: 12, border: '1px solid #1E1E2E'
      }}>
        {widgets.map(widget => {
          const leftPct  = (widget.gridPos.x / COLS) * 100;
          const widthPct = (widget.gridPos.w / COLS) * 100;
          const topPx    = widget.gridPos.y * ROW_H;
          const heightPx = widget.gridPos.h * ROW_H;

          return (
            <div key={widget.id} style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: topPx,
              width: `${widthPct}%`,
              height: heightPx,
              padding: 6,
              boxSizing: 'border-box',
              cursor: 'grab',
              transition: 'opacity 0.15s',
              opacity: dragging === widget.id ? 0.6 : 1,
            }}
              onMouseDown={() => setDragging(widget.id)}
              onMouseUp={() => setDragging(null)}
            >
              <Widget
                config={widget}
                onRemove={() => removeWidget(widget.id)}
                onEdit={() => { setEditTarget(widget); setModalOpen(true); }}
              />
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <WidgetConfigModal
          initial={editTarget}
          onSave={(cfg) => {
            if (editTarget) updateWidget(editTarget.id, cfg);
            else addWidget(cfg);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GridLayout;
