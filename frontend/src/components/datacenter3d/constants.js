/**
 * Constantes de dimensionnement pour le viewer 3D de la salle serveur.
 * Toutes les dimensions sont exprimées en mètres, le plancher est à Y=0.
 */

// 1 unité "U" standard = 44,45 mm
export const U_HEIGHT_M = 0.04445;

// Dimensions standard d'un rack 19" (42U par défaut)
export const RACK_WIDTH_M = 0.6;
export const RACK_DEPTH_M = 1.0;
export const RACK_FRAME_THICKNESS = 0.03;

// Largeur/profondeur du compartiment intérieur (où sont montés les équipements)
export const RACK_INNER_WIDTH_M = 0.48;
export const RACK_INNER_DEPTH_M = 0.9;

// Décalage vertical du premier U au-dessus du plancher du rack
export const RACK_BOTTOM_OFFSET_M = 0.1;

// Couleurs de base — synchronisées avec le thème dark de l'app
export const COLORS = {
  floor:       '#0b0d11',
  floorGrid:   '#1a1f26',
  wallGrid:    '#23282f',
  rackFrame:   '#2c3035',
  rackFrameLit:'#3a4048',
  rackInner:   '#111418',
  uSlotLine:   '#21262d',
  label:       '#e8eaf0',
  selection:   '#3274d9',
  hover:       '#5794f2',
  statusOnline:'#22c55e',
  statusOff:   '#64748b',
  statusWarn:  '#f59e0b',
  statusCrit:  '#ef4444',
};

// Mapping statut → couleur de LED (utilisé pour le petit voyant de chaque device)
export function statusColor(status) {
  switch (status) {
    case 'online':   return COLORS.statusOnline;
    case 'offline':  return COLORS.statusOff;
    case 'warning':  return COLORS.statusWarn;
    case 'critical': return COLORS.statusCrit;
    default:         return COLORS.statusOff;
  }
}
