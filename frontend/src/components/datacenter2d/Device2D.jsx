import { useState } from 'react';
import { detectBrand, getBrandPalette, getPalette } from './constants';
import ServerPanel      from './panels/ServerPanel';
import SwitchPanel      from './panels/SwitchPanel';
import NASPanel         from './panels/NASPanel';
import UPSPanel         from './panels/UPSPanel';
import HSMPanel         from './panels/HSMPanel';
import PDUPanel         from './panels/PDUPanel';
import ShelfPanel       from './panels/ShelfPanel';
import TapeLibraryPanel from './panels/TapeLibraryPanel';
import GenericPanel     from './panels/GenericPanel';
import ServerBackPanel  from './panels/ServerBackPanel';
import SwitchBackPanel  from './panels/SwitchBackPanel';
import NASBackPanel     from './panels/NASBackPanel';
import UPSBackPanel     from './panels/UPSBackPanel';
import PDUBackPanel     from './panels/PDUBackPanel';
import GenericBackPanel from './panels/GenericBackPanel';

/**
 * Dispatcher : choisit le bon panneau SVG en fonction du type d'équipement
 * ET du côté visible (side='front' | 'back').
 * Injecte brand + palette thématisée + dimensions + callbacks click/hover.
 */
export default function Device2D({ device, x, y, width, height, theme = 'dark', side = 'front', selected, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const brandKey = detectBrand(device);
  const brand    = getBrandPalette(brandKey, theme);
  const P        = getPalette(theme);

  const commonProps = {
    device,
    brandKey,
    brand,
    P,
    theme,
    width,
    height,
    selected,
    hovered,
    side,
  };

  const Panel = side === 'back' ? pickBackPanel(device.type) : pickPanel(device.type);

  return (
    <g
      className="dc2d-device dc2d-device-shadow"
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect?.(device); }}
    >
      <Panel {...commonProps} />
      {/* Tooltip SVG — survol */}
      {hovered && (
        <g transform={`translate(${width / 2}, -4)`} style={{ pointerEvents: 'none' }}>
          <rect
            x={-80} y={-20}
            width={160} height={16}
            fill={theme === 'light' ? 'rgba(255, 255, 255, 0.97)' : 'rgba(10, 12, 15, 0.96)'}
            stroke={P.badgeBorder}
            strokeWidth={0.5}
            rx={4}
          />
          <text
            x={0} y={-9}
            textAnchor="middle"
            fontSize={7}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={600}
            fill={P.labelLight}
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

function pickBackPanel(type) {
  switch (type) {
    case 'server.physical':
    case 'server.hypervisor':
    case 'server.blade':
    case 'backup.server':
    case 'storage.san':
      return ServerBackPanel;
    case 'network.switch':
      return SwitchBackPanel;
    case 'storage.nas':
      return NASBackPanel;
    case 'power.ups':
    case 'power.ecoflow':
    case 'power.battery':
      return UPSBackPanel;
    case 'power.pdu':
      return PDUBackPanel;
    // router, firewall, HSM, tape, shelf → face arrière générique
    default:
      return GenericBackPanel;
  }
}
