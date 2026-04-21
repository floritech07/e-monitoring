/**
 * Détecte si deux équipements se chevauchent physiquement dans un rack.
 * Réplique côté client la logique de services/datacenterService.js devicesConflict().
 */
export function devicesConflict(a, b) {
  const aStart = a.uStart || 1;
  const aSize  = a.uSize  || 1;
  const bStart = b.uStart || 1;
  const bSize  = b.uSize  || 1;
  const aEnd = aStart + aSize - 1;
  const bEnd = bStart + bSize - 1;
  if (aEnd < bStart || aStart > bEnd) return false;

  const aSlot  = a.slot  || 'full';
  const bSlot  = b.slot  || 'full';
  const aDepth = a.depth || 'full';
  const bDepth = b.depth || 'full';
  const aMount = a.mounting || 'rail';
  const bMount = b.mounting || 'rail';

  if ((aSlot === 'left' && bSlot === 'right') || (aSlot === 'right' && bSlot === 'left')) return false;
  if ((aDepth === 'front' && bDepth === 'back') || (aDepth === 'back' && bDepth === 'front')) return false;
  if ((aMount === 'shelf' && bMount === 'loose') || (aMount === 'loose' && bMount === 'shelf')) return false;
  if (aMount === 'loose' && bMount === 'loose') return false;
  return true;
}

/**
 * Vérifie si un équipement "proposé" (device + nouvelle position uStart)
 * rentrerait sans conflit dans le rack. Ignore bien sûr l'équipement lui-même.
 */
export function canPlaceAt(device, newUStart, rackDevices, rackU = 42) {
  const proposed = { ...device, uStart: newUStart };
  if (newUStart < 1 || newUStart + (device.uSize || 1) - 1 > rackU) return false;
  for (const other of rackDevices) {
    if (other.id === device.id) continue;
    if (devicesConflict(proposed, other)) return false;
  }
  return true;
}
