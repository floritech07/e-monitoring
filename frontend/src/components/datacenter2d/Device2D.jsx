import { useState } from 'react';
import { detectBrand } from './constants';
import ServerPanel      from './panels/ServerPanel';
import SwitchPanel      from './panels/SwitchPanel';
import NASPanel         from './panels/NASPanel';
import UPSPanel         from './panels/UPSPanel';
import HSMPanel         from './panels/HSMPanel';
import PDUPanel         from './panels/PDUPanel';
import ShelfPanel       from './panels/ShelfPanel';
import TapeLibraryPanel from './panels/TapeLibraryPanel';
import GenericPanel     from './panels/GenericPanel';

/**
 * Dispatcher : choisit le bon panneau SVG en fonction du type d'équipement.
 * Injecte brand + dimensions + callbacks click/hover.
 */
export default function Device2D({ device, x, y, width, height, selected, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const brand = detectBrand(device);

  const commonProps = {
    device,
    brand,
    width,
    height,
    selected,
    hovered,
  };

  const Panel = pickPanel(device.type);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect?.(device); }}
    >
      <Panel {...commonProps} />
      {/* Tooltip SVG — survol */}
      {hovered && (
        <g transform={`translate(${width / 2}, -4)`}>
          <rect
            x={-70} y={-18}
            width={140} height={14}
            fill="rgba(10, 12, 15, 0.95)"
            stroke="#2c3235" strokeWidth={0.5}
            rx={2}
          />
          <text
            x={0} y={-8}
            textAnchor="middle"
            fontSize={6}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={600}
            fill="#e8eaf0"
          >
            {device.name}
          </text>
        </g>
      )}
    </g>
  );
}

function pickPanel(type) {
  switch (type) {
    case 'server.physical':
    case 'server.hypervisor':
    case 'server.blade':
    case 'backup.server':
      return ServerPanel;
    case 'network.switch':
      return SwitchPanel;
    case 'network.router':
    case 'network.firewall':
      return GenericPanel;
    case 'storage.nas':
      return NASPanel;
    case 'storage.san':
      return ServerPanel;
    case 'backup.library':
      return TapeLibraryPanel;
    case 'power.ups':
    case 'power.ecoflow':
    case 'power.battery':
      return UPSPanel;
    case 'power.pdu':
      return PDUPanel;
    case 'vending.hsm':
      return HSMPanel;
    case 'infra.shelf':
      return ShelfPanel;
    default:
      return GenericPanel;
  }
}
