'use strict';
/**
 * RBAC léger — rôles admin / operator / viewer
 * Utilise un bearer token statique par rôle (évolutif vers JWT/Keycloak)
 * Env vars: ADMIN_TOKEN, OPERATOR_TOKEN, VIEWER_TOKEN
 * Production : KEYCLOAK_URL, KEYCLOAK_REALM
 * Si aucun token configuré → mode développement permissif (viewer pour tous)
 */
const { Issuer } = require('openid-client');

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

const DEV_MODE = Object.keys(TOKEN_MAP).length === 0 && !process.env.KEYCLOAK_URL;

let client;
if (process.env.KEYCLOAK_URL) {
  Issuer.discover(`${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`)
    .then(issuer => {
      client = new issuer.Client({ client_id: process.env.KEYCLOAK_CLIENT_ID || 'nexus-api' });
      console.log('[RBAC] 🔐 Keycloak OIDC découvert avec succès.');
    }).catch(e => console.error('[RBAC] ❌ Erreur découverte Keycloak:', e.message));
}

if (DEV_MODE) {
  console.warn('[RBAC] ⚠ Aucun token ni Keycloak configuré — mode développement (tout autorisé en lecture).');
}

/**
 * Résoudre le rôle depuis les headers Authorization ou x-api-key.
 */
async function resolveRole(req) {
  if (DEV_MODE) return 'admin';

  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  const tok = auth.slice(7).trim();

  // 1. Check local static tokens
  if (TOKEN_MAP[tok]) return TOKEN_MAP[tok];

  // 2. Check Keycloak JWT
  if (client) {
    try {
      const userinfo = await client.userinfo(tok);
      // Mapping simplifié : si l'utilisateur a le rôle "admin" dans Keycloak
      if (userinfo.roles?.includes('admin')) return 'admin';
      if (userinfo.roles?.includes('operator')) return 'operator';
      return 'viewer';
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Middleware — requireRole('operator') bloque les roles < operator.
 */
function requireRole(minRole) {
  const minLevel = ROLES[minRole]?.level ?? 1;
  return async (req, res, next) => {
    if (DEV_MODE) {
      req.userRole = 'admin';
      return next();
    }
    const role = await resolveRole(req);
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
