/**
 * Constantes de rendu pour la vue 2D style DCIM (Netbox/RackTables).
 * Dimensions en pixels CSS pour un rack 42U. Supporte les 2 thèmes.
 */

// 1 U dans la vue 2D = 26 px (un peu plus grand pour laisser respirer les éléments)
export const U_PX = 26;
export const RACK_U = 42;

// Largeur intérieure (zone où se montent les équipements)
export const RACK_INNER_WIDTH_PX = 580;
// Largeur totale du cadre rack (avec montants + labels U)
export const RACK_FRAME_WIDTH_PX = 660;

// Marges / offsets
export const U_LABEL_WIDTH_PX = 30;   // colonne des numéros U à gauche
export const RACK_PADDING_PX = 8;

// Rayons d'arrondis — plus généreux pour un rendu soft
export const RADIUS = {
  rack:    8,       // cadre du rack
  device:  4,       // façade d'équipement
  element: 2,       // petits éléments (ports, boutons)
};

// ─── Palettes thème sombre et clair ─────────────────────────────────────────
// Les FAÇADES des équipements (BRANDS) ne changent pas — un serveur HPE est
// physiquement noir, qu'on regarde la pièce de jour ou de nuit. Seule la
// CHARPENTE (rack, fond, lignes U, labels) s'adapte au thème de l'app.

const PALETTE_DARK = {
  // Rack & intérieur
  rackFrame:      '#1f232a',
  rackFrameLite:  '#2a2f38',
  rackFrameEdge:  '#0c0f13',
  rackInner:      '#0d1014',
  rackEmpty:      '#121519',

  // Lignes de séparation U
  uLineMajor:     '#2f353f',
  uLineMinor:     '#1b1f25',
  uLabelText:     '#8a93a0',
  uLabelMajor:    '#c2c9d3',

  // Fond de page (derrière les racks)
  pageBgTop:      '#11151b',
  pageBgBot:      '#07090c',
  pageGrid:       'rgba(60, 70, 82, 0.20)',

  // Textes
  labelLight:     '#e4e7ec',
  labelMid:       '#b0b6c0',
  labelDim:       '#7a828f',

  // Header badge rack
  badgeBg:        '#1d2129',
  badgeBgActive:  '#1e3a5f',
  badgeBorder:    '#2a2f38',

  // Status LEDs (visibles dans les 2 thèmes)
  ledOnline:      '#22c55e',
  ledOffline:     '#52525b',
  ledWarning:     '#f59e0b',
  ledCritical:    '#ef4444',
  ledIdle:        '#38bdf8',
};

const PALETTE_LIGHT = {
  // Rack gris acier brossé / gris clair
  rackFrame:      '#d5dae2',
  rackFrameLite:  '#e4e8ee',
  rackFrameEdge:  '#9ba4b1',
  rackInner:      '#2a2f38',   // l'intérieur reste sombre — c'est la vraie vie
  rackEmpty:      '#343945',

  // Lignes U — plus claires pour contraster sur intérieur sombre
  uLineMajor:     '#5b6370',
  uLineMinor:     '#3a4049',
  uLabelText:     '#5a6270',
  uLabelMajor:    '#2d333d',

  // Fond de page : blanc cassé avec grille technique bleu acier
  pageBgTop:      '#eef2f8',
  pageBgBot:      '#dde3ec',
  pageGrid:       'rgba(100, 116, 139, 0.15)',

  // Textes
  labelLight:     '#1e293b',
  labelMid:       '#475569',
  labelDim:       '#64748b',

  // Header badge rack
  badgeBg:        '#ffffff',
  badgeBgActive:  '#dbeafe',
  badgeBorder:    '#cbd5e1',

  // Status LEDs — mêmes teintes (elles doivent rester identifiables)
  ledOnline:      '#16a34a',
  ledOffline:     '#94a3b8',
  ledWarning:     '#d97706',
  ledCritical:    '#dc2626',
  ledIdle:        '#0284c7',
};

export function getPalette(theme = 'dark') {
  return theme === 'light' ? PALETTE_LIGHT : PALETTE_DARK;
}

// Export compat : par défaut dark, pour les composants qui n'ont pas encore
// migré vers getPalette(theme). À dégager quand tout sera passé.
export const PALETTE = PALETTE_DARK;

// ─── Palette des marques (façades d'équipements) ────────────────────────────
// Ces couleurs ne dépendent PAS du thème — elles reflètent la couleur
// physique réelle du matériel. On apporte juste une variante "softened"
// pour le mode clair qui lève légèrement les noirs trop profonds.

const BRANDS_CORE = {
  hpe: {
    body:      '#2a2e33',
    bodyLite:  '#333840',
    accent:    '#00b388',
    stripe:    '#1d1f23',
    bezel:     '#3a3f46',
    logoText:  '#ffffff',
  },
  huawei: {
    body:      '#1b1b1e',
    bodyLite:  '#26262a',
    accent:    '#c7000b',
    stripe:    '#24242a',
    bezel:     '#2e2e33',
    logoText:  '#ffffff',
  },
  dell: {
    body:      '#1f1f24',
    bodyLite:  '#2a2a30',
    accent:    '#007db8',
    stripe:    '#2a2a30',
    bezel:     '#3a3a42',
    logoText:  '#dbe3ea',
  },
  ibm: {
    body:      '#1b1b1e',
    bodyLite:  '#262629',
    accent:    '#0f62fe',
    stripe:    '#26262a',
    bezel:     '#34343a',
    logoText:  '#ffffff',
  },
  lenovo: {
    body:      '#1d1d20',
    bodyLite:  '#28282c',
    accent:    '#e2231a',
    stripe:    '#27272b',
    bezel:     '#35353b',
    logoText:  '#ffffff',
  },
  cisco: {
    body:      '#1c2433',
    bodyLite:  '#252e3f',
    accent:    '#00bceb',
    stripe:    '#151c27',
    bezel:     '#2a3548',
    logoText:  '#ffffff',
    portFill:  '#0a0e14',
    portLed:   '#facc15',
  },
  synology: {
    body:      '#1a1a1a',
    bodyLite:  '#242424',
    accent:    '#8fbf23',
    stripe:    '#222222',
    bezel:     '#2c2c2c',
    logoText:  '#d4d4d4',
    driveBay:  '#0d0d0d',
  },
  apc: {
    body:      '#161616',
    bodyLite:  '#222222',
    accent:    '#ff0000',
    lcd:       '#89b15b',
    stripe:    '#1f1f1f',
    bezel:     '#2e2e2e',
    logoText:  '#ffffff',
  },
  eaton: {
    body:      '#1b1b1d',
    bodyLite:  '#25252a',
    accent:    '#ed8b00',
    lcd:       '#1a3a7a',
    stripe:    '#24242a',
    bezel:     '#33333a',
    logoText:  '#ed8b00',
  },
  socomec: {
    body:      '#2b2e33',
    bodyLite:  '#343740',
    accent:    '#009b3a',
    lcd:       '#1d2838',
    stripe:    '#35383d',
    bezel:     '#40444a',
    logoText:  '#d4d4d4',
  },
  prism: {
    body:      '#14171c',
    bodyLite:  '#1e2128',
    accent:    '#a855f7',
    stripe:    '#1d2128',
    bezel:     '#2a2f38',
    logoText:  '#e9d5ff',
  },
  generic: {
    body:      '#222527',
    bodyLite:  '#2c2f33',
    accent:    '#6b7280',
    stripe:    '#2c2f33',
    bezel:     '#3a3e43',
    logoText:  '#d4d4d4',
  },
};

/**
 * Retourne la palette d'une marque, éventuellement adoucie en thème clair.
 * Les noirs trop profonds sont légèrement levés pour rester lisibles sur
 * fond blanc sans dénaturer la couleur d'origine.
 */
export function getBrandPalette(brandKey, theme = 'dark') {
  const core = BRANDS_CORE[brandKey] || BRANDS_CORE.generic;
  if (theme !== 'light') return core;
  return {
    ...core,
    body: core.bodyLite || core.body,
  };
}

// Export compat
export const BRANDS = BRANDS_CORE;

// ─── Status helpers ─────────────────────────────────────────────────────────

export function statusLedColor(status, theme = 'dark') {
  const p = getPalette(theme);
  switch (status) {
    case 'online':   return p.ledOnline;
    case 'offline':  return p.ledOffline;
    case 'warning':  return p.ledWarning;
    case 'critical': return p.ledCritical;
    case 'idle':     return p.ledIdle;
    default:         return p.ledOffline;
  }
}

/** Classe CSS à appliquer sur une LED selon son statut (animation). */
export function ledAnimClass(status) {
  switch (status) {
    case 'online':   return 'dc2d-led-online';
    case 'warning':  return 'dc2d-led-warning';
    case 'critical': return 'dc2d-led-critical';
    default:         return '';
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
