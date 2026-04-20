/**
 * Constantes de rendu pour la vue 2D style DCIM (Netbox/RackTables).
 * Dimensions en pixels CSS pour un rack 42U.
 */

// 1 U dans la vue 2D = 24 px (compromis lisibilité / compacité)
export const U_PX = 24;
export const RACK_U = 42;

// Largeur intérieure (zone où se montent les équipements)
export const RACK_INNER_WIDTH_PX = 560;
// Largeur totale du cadre rack (avec montants + labels U)
export const RACK_FRAME_WIDTH_PX = 640;

// Marges / offsets
export const U_LABEL_WIDTH_PX = 28;   // colonne des numéros U à gauche
export const RACK_PADDING_PX = 6;

// Palette réaliste — inspirée des vrais équipements
export const PALETTE = {
  // Rack
  rackFrame:      '#1a1d22',
  rackFrameEdge:  '#0a0c0f',
  rackInner:      '#07080a',
  rackEmpty:      '#0e1015',
  uLineMajor:     '#2a2f37',
  uLineMinor:     '#181c22',
  uLabelText:     '#6b7280',

  // Status LED
  ledOnline:      '#22c55e',
  ledOffline:     '#3f3f46',
  ledWarning:     '#f59e0b',
  ledCritical:    '#ef4444',
  ledIdle:        '#38bdf8',

  // Textes
  labelLight:     '#d4d4d8',
  labelMid:       '#a1a1aa',
  labelDim:       '#71717a',
};

// Couleurs de marque (façades) — basées sur vraies observations
export const BRANDS = {
  hpe: {
    body:      '#2a2e33',   // gris charbon mat HPE
    accent:    '#00b388',   // vert HPE
    stripe:    '#1d1f23',
    bezel:     '#3a3f46',
    logoText:  '#ffffff',
  },
  huawei: {
    body:      '#18181b',   // noir profond
    accent:    '#c7000b',   // rouge Huawei
    stripe:    '#232326',
    bezel:     '#2c2c30',
    logoText:  '#ffffff',
  },
  dell: {
    body:      '#1f1f24',   // noir bleuté Dell
    accent:    '#007db8',   // bleu Dell
    stripe:    '#2a2a30',
    bezel:     '#3a3a42',
    logoText:  '#dbe3ea',
  },
  ibm: {
    body:      '#1b1b1e',
    accent:    '#0f62fe',   // bleu IBM
    stripe:    '#26262a',
    bezel:     '#34343a',
    logoText:  '#ffffff',
  },
  lenovo: {
    body:      '#1d1d20',
    accent:    '#e2231a',
    stripe:    '#27272b',
    bezel:     '#35353b',
    logoText:  '#ffffff',
  },
  cisco: {
    body:      '#1c2433',      // bleu navy Cisco
    accent:    '#00bceb',      // cyan Cisco
    stripe:    '#151c27',
    bezel:     '#2a3548',
    logoText:  '#ffffff',
    portFill:  '#0a0e14',
    portLed:   '#facc15',
  },
  synology: {
    body:      '#1a1a1a',      // noir plastique
    accent:    '#8fbf23',      // vert Synology
    stripe:    '#222222',
    bezel:     '#2c2c2c',
    logoText:  '#d4d4d4',
    driveBay:  '#0d0d0d',
  },
  apc: {
    body:      '#161616',      // noir APC
    accent:    '#ff0000',      // rouge APC (Schneider)
    lcd:       '#89b15b',      // LCD vert
    stripe:    '#1f1f1f',
    bezel:     '#2e2e2e',
    logoText:  '#ffffff',
  },
  eaton: {
    body:      '#1b1b1d',
    accent:    '#ed8b00',      // orange Eaton
    lcd:       '#1a3a7a',      // LCD bleu foncé
    stripe:    '#24242a',
    bezel:     '#33333a',
    logoText:  '#ed8b00',
  },
  socomec: {
    body:      '#2b2e33',
    accent:    '#009b3a',      // vert Socomec
    lcd:       '#1d2838',
    stripe:    '#35383d',
    bezel:     '#40444a',
    logoText:  '#d4d4d4',
  },
  prism: {
    body:      '#14171c',
    accent:    '#a855f7',      // violet (notre convention HSM)
    stripe:    '#1d2128',
    bezel:     '#2a2f38',
    logoText:  '#e9d5ff',
  },
  generic: {
    body:      '#222527',
    accent:    '#6b7280',
    stripe:    '#2c2f33',
    bezel:     '#3a3e43',
    logoText:  '#d4d4d4',
  },
};

export function statusLedColor(status) {
  switch (status) {
    case 'online':   return PALETTE.ledOnline;
    case 'offline':  return PALETTE.ledOffline;
    case 'warning':  return PALETTE.ledWarning;
    case 'critical': return PALETTE.ledCritical;
    case 'idle':     return PALETTE.ledIdle;
    default:         return PALETTE.ledOffline;
  }
}

/**
 * Détermine la marque à partir du nom du device ou de son type.
 * Sert à choisir la palette/layout du panneau rendu.
 */
export function detectBrand(device) {
  const name = (device?.name || '').toLowerCase();
  const vendor = (device?.vendor || '').toLowerCase();
  const source = `${name} ${vendor}`;

  if (/\bhpe?\b|proliant|storeever|msl/.test(source)) return 'hpe';
  if (/huawei|fusionserver/.test(source))             return 'huawei';
  if (/\bdell\b|poweredge/.test(source))              return 'dell';
  if (/\bibm\b|system x|xseries|ts3100/.test(source)) return 'ibm';
  if (/lenovo|thinksystem|thinkserver/.test(source))  return 'lenovo';
  if (/cisco|catalyst|nexus|meraki/.test(source))     return 'cisco';
  if (/synology|diskstation|\bds\d/.test(source))     return 'synology';
  if (/\bapc\b|smart-ups|schneider/.test(source))     return 'apc';
  if (/eaton|\b9px\b|\b9sx\b|ellipse/.test(source))   return 'eaton';
  if (/socomec|itys|masterys|netys/.test(source))     return 'socomec';
  if (/prism|\btsm\b/.test(source))                   return 'prism';
  return 'generic';
}
