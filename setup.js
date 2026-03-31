/**
 * setup.js — SBEE Monitoring Universal Setup Script
 * 
 * Lance ce script une seule fois sur chaque nouveau PC:
 *   node setup.js
 * 
 * Sur Windows en Admin (pour configuration pare-feu):
 *   node setup.js --admin
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';

// ─── Utility ─────────────────────────────────────────────────────────────────

function run(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, { maxBuffer: 1024 * 1024 * 5, timeout: 60000, ...options }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve((stdout || '').trim());
    });
    proc.stdout?.pipe(process.stdout);
  });
}

function runSilent(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout) => resolve(stdout?.trim() || ''));
  });
}

function log(msg, icon = 'ℹ️ ') { console.log(`${icon} ${msg}`); }
function ok(msg) { console.log(`✅ ${msg}`); }
function warn(msg) { console.warn(`⚠️  ${msg}`); }
function err(msg) { console.error(`❌ ${msg}`); }
function section(title) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(50)}`);
}

// ─── Environment ─────────────────────────────────────────────────────────────

function setupEnv() {
  section('⚙️  Configuration de l\'environnement (.env)');
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      ok('.env créé depuis .env.example');
    } else {
      // Create a minimal .env
      const defaultEnv = [
        `# SBEE Monitoring - Configuration automatique`,
        `# Générée le ${new Date().toLocaleString('fr-FR')} sur ${os.hostname()}`,
        ``,
        `PORT=3001`,
        ``,
        `# VMware (rempli automatiquement si VMware est détecté)`,
        `VMRUN_PATH=`,
        ``,
        `# Base de données (optionnel)`,
        `DB_PREPAID_HOST=`,
        `DB_PREPAID_USER=`,
        `DB_PREPAID_PASS=`,
        `DB_PREPAID_NAME=`,
        ``,
        `# Veeam Backup (optionnel)`,
        `VEEAM_HOST=`,
        `VEEAM_PORT=9419`,
        `VEEAM_USER=`,
        `VEEAM_PASS=`,
      ].join('\n');
      
      fs.writeFileSync(envPath, defaultEnv);
      ok('.env créé avec valeurs par défaut');
    }
  } else {
    ok('.env déjà présent');
  }
}

// ─── Dependencies ─────────────────────────────────────────────────────────────

async function installDependencies() {
  section('📦 Installation des dépendances');

  log('Installation des dépendances Backend...', '⏳');
  try {
    await run('npm install', { cwd: __dirname });
    ok('Dépendances Backend installées');
  } catch (e) {
    err(`Erreur Backend npm install: ${e.message}`);
    process.exit(1);
  }

  log('Installation des dépendances Frontend...', '⏳');
  const frontendDir = path.join(__dirname, 'frontend');
  try {
    await run('npm install', { cwd: frontendDir });
    ok('Dépendances Frontend installées');
  } catch (e) {
    err(`Erreur Frontend npm install: ${e.message}`);
  }
}

// ─── OS Level Checks ─────────────────────────────────────────────────────────

async function checkSystemRequirements() {
  section('🖥️  Vérification du système');

  // Node version
  const nodeVer = process.version;
  const majorVer = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  if (majorVer < 18) {
    warn(`Node.js ${nodeVer} détecté — v18 ou supérieure recommandée.`);
  } else {
    ok(`Node.js ${nodeVer}`);
  }

  // OS info
  log(`Système d'exploitation: ${os.type()} ${os.release()} (${process.platform}/${process.arch})`);
  log(`Hôte: ${os.hostname()}`);
  log(`RAM Total: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
  log(`CPUs: ${os.cpus().length}x ${os.cpus()[0]?.model || 'Inconnu'}`);

  // Port availability
  const port = process.env.PORT || 3001;
  const portInUse = await runSilent(
    isWindows ? `netstat -ano | findstr :${port}` : `lsof -i :${port}`
  );
  if (portInUse && portInUse.length > 2) {
    warn(`Port ${port} potentiellement occupé. Si le serveur ne démarre pas, changez PORT dans .env`);
  } else {
    ok(`Port ${port} disponible`);
  }
}

// ─── Windows Specific ─────────────────────────────────────────────────────────

async function setupWindows() {
  section('🛡️  Configuration Windows');

  // Check admin
  const adminCheck = await runSilent('net session');
  const isAdmin = adminCheck.length > 0 || !adminCheck.includes('error');

  if (!isAdmin && !process.argv.includes('--admin')) {
    warn('Non-Admin: certaines optimisations seront ignorées.');
    warn('Pour une configuration complète, relancez: node setup.js --admin');
    return;
  }

  // Set Execution Policy
  log('Configuration de la politique PowerShell...');
  try {
    await runSilent('powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force"');
    ok('ExecutionPolicy: RemoteSigned (LocalMachine)');
  } catch {}

  // Firewall
  const port = process.env.PORT || 3001;
  log('Configuration du pare-feu...');
  try {
    await runSilent(`powershell -Command "if (!(Get-NetFirewallRule -DisplayName 'SBEE-Monitor-API' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'SBEE-Monitor-API' -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port} -Profile Any }"`);
    await runSilent(`powershell -Command "if (!(Get-NetFirewallRule -DisplayName 'SBEE-Monitor-UI' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'SBEE-Monitor-UI' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -Profile Any }"`);
    ok(`Règles pare-feu créées (ports ${port} et 5173)`);
  } catch (e) {
    warn(`Pare-feu: ${e.message}`);
  }
}

// ─── Linux Specific ──────────────────────────────────────────────────────────

async function setupLinux() {
  section('🐧 Configuration Linux');

  // Check if running as root
  if (process.getuid && process.getuid() !== 0) {
    warn('Non-Root: certaines optimisations (réseau bas niveau, SMART) nécessitent sudo.');
    warn('Pour accès matériel complet: sudo node setup.js');
  } else {
    ok('Droits root détectés.');
  }

  // Check if ufw is installed and configure it
  const ufwCheck = await runSilent('which ufw');
  if (ufwCheck) {
    const port = process.env.PORT || 3001;
    try {
      await runSilent(`ufw allow ${port}/tcp`);
      await runSilent('ufw allow 5173/tcp');
      ok(`UFW: ports ${port} et 5173 autorisés`);
    } catch {}
  }

  // Install smartmontools if missing (for SMART disk info)
  const smartCheck = await runSilent('which smartctl');
  if (!smartCheck) {
    warn('smartmontools manquant — SMART disk data ne sera pas disponible.');
    warn('Pour installer: sudo apt install smartmontools / sudo yum install smartmontools');
  } else {
    ok('smartmontools disponible (SMART disk health activé)');
  }
}

// ─── Data Directory ────────────────────────────────────────────────────────────

function setupDataDirectory() {
  section('📁 Initialisation des dossiers de données');
  
  const dirs = [
    path.join(__dirname, 'data'),
    path.join(__dirname, 'data', 'logs'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      ok(`Dossier créé: ${dir}`);
    } else {
      ok(`Dossier OK: ${dir}`);
    }
  });
}

// ─── Print Final Summary ──────────────────────────────────────────────────────

function printSummary() {
  const port = process.env.PORT || 3001;
  const localIP = Object.values(os.networkInterfaces())
    .flat()
    .find(n => n?.family === 'IPv4' && !n.internal)?.address || 'localhost';

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     SBEE Monitoring — Installation Terminée !   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║                                                  ║');
  console.log('║  Modes de démarrage:                             ║');
  console.log('║                                                  ║');
  console.log('║  [Développement - 2 terminaux]                   ║');
  console.log('║   Terminal 1: node server.js                     ║');
  console.log('║   Terminal 2: cd frontend && npm run dev         ║');
  console.log('║                                                  ║');
  console.log('║  [Production - 1 seule commande]                 ║');
  console.log('║   npm run start:prod                             ║');
  console.log('║                                                  ║');
  console.log('║  [Service Windows (permanent)]                   ║');
  console.log('║   npm run service:install  (en Admin)            ║');
  console.log('║                                                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  API Backend: http://localhost:${port}${' '.repeat(18 - String(port).length)}║`);
  console.log(`║  Dashboard:   http://localhost:5173              ║`);
  console.log(`║  Sur réseau:  http://${localIP}:${port}${' '.repeat(26 - localIP.length - String(port).length)}║`);
  console.log('╚══════════════════════════════════════════════════╝\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   SBEE Monitoring — Installation Setup   ║');
  console.log(`║   Plateforme: ${process.platform.padEnd(27)}║`);
  console.log('╚═══════════════════════════════════════════╝');

  await checkSystemRequirements();
  setupEnv();
  setupDataDirectory();
  await installDependencies();

  if (isWindows) await setupWindows();
  if (isLinux) await setupLinux();

  printSummary();
})();
