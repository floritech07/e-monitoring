'use strict';
/**
 * RBAC léger — rôles admin / operator / viewer
 * Utilise un bearer token statique par rôle (évolutif vers JWT/Keycloak)
 * Env vars: ADMIN_TOKEN, OPERATOR_TOKEN, VIEWER_TOKEN
 * Si aucun token configuré → mode développement permissif (viewer pour tous)
 */

const ROLES = {
  admin:    { label: 'Administrateur', level: 3 },
  operator: { label: 'Opérateur',      level: 2 },
  viewer:   { label: 'Lecteur',        level: 1 },
};

// Tokens statiques configurables via env
const TOKEN_MAP = {};
if (process.env.ADMIN_TOKEN)    TOKEN_MAP[process.env.ADMIN_TOKEN]    = 'admin';
if (process.env.OPERATOR_TOKEN) TOKEN_MAP[process.env.OPERATOR_TOKEN] = 'operator';
if (process.env.VIEWER_TOKEN)   TOKEN_MAP[process.env.VIEWER_TOKEN]   = 'viewer';

const DEV_MODE = Object.keys(TOKEN_MAP).length === 0;
if (DEV_MODE) {
  console.warn('[RBAC] ⚠ Aucun token configuré — mode développement (tout autorisé en lecture).');
  console.warn('[RBAC]   Définir ADMIN_TOKEN, OPERATOR_TOKEN, VIEWER_TOKEN dans .env pour activer le contrôle.');
}

/**
 * Résoudre le rôle depuis les headers Authorization ou x-api-key.
 */
function resolveRole(req) {
  if (DEV_MODE) return 'admin';  // dev permissif

  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    const tok = auth.slice(7).trim();
    return TOKEN_MAP[tok] || null;
  }
  const apiKey = req.headers['x-api-key'];
  if (apiKey) return TOKEN_MAP[apiKey] || null;
  return null;
}

/**
 * Middleware — requireRole('operator') bloque les roles < operator.
 */
function requireRole(minRole) {
  const minLevel = ROLES[minRole]?.level ?? 1;
  return (req, res, next) => {
    if (DEV_MODE) {
      req.userRole = 'admin';
      return next();
    }
    const role = resolveRole(req);
    if (!role) {
      return res.status(401).json({ error: 'Authentification requise', hint: 'Fournir Authorization: Bearer <token>' });
    }
    if ((ROLES[role]?.level ?? 0) < minLevel) {
      return res.status(403).json({ error: 'Droits insuffisants', required: minRole, current: role });
    }
    req.userRole = role;
    next();
  };
}

/**
 * Middleware audit — injecte userRole dans req pour les logs.
 */
function injectRole(req, _res, next) {
  req.userRole = DEV_MODE ? 'admin' : (resolveRole(req) || 'anonymous');
  next();
}

module.exports = { requireRole, injectRole, ROLES, DEV_MODE };
