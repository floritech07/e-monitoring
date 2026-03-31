/**
 * install-service.js
 * SBEE Monitoring — Windows Service Installer
 *
 * Usage (doit être lancé en tant qu'Administrateur):
 *   node install-service.js install   → Installe le service
 *   node install-service.js uninstall → Désinstalle le service
 *   node install-service.js status    → Vérification de l'état
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVICE_NAME = 'SBEEMonitoring';
const SERVICE_DISPLAY = 'SBEE Infrastructure Monitoring';
const SERVICE_DESC = 'Service de monitoring d\'infrastructure SBEE. Surveille les métriques hôte, VMs, réseau et paiements en temps réel.';
const SERVER_SCRIPT = path.join(__dirname, 'server.js');
const LOG_DIR = path.join(__dirname, 'data', 'logs');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

function isAdmin() {
  return new Promise((resolve) => {
    exec('net session', (err) => resolve(!err));
  });
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    console.log(`[Setup] 📁 Dossier de logs créé: ${LOG_DIR}`);
  }
}

// ─── Node.js Path Detection ───────────────────────────────────────────────────

function getNodePath() {
  return new Promise((resolve, reject) => {
    exec('where node', (err, stdout) => {
      if (err) return reject(new Error('Impossible de trouver node.exe dans le PATH.'));
      // First line is the actual exe path
      const nodePath = stdout.split('\n')[0].trim();
      resolve(nodePath);
    });
  });
}

// ─── Install Service ─────────────────────────────────────────────────────────

async function installService() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   SBEE Monitoring — Service Installer    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1) Check admin rights
  const admin = await isAdmin();
  if (!admin) {
    console.error('❌ ERREUR: Ce script doit être exécuté en tant qu\'Administrateur.');
    console.error('   → Clic droit sur le terminal → "Exécuter en tant qu\'administrateur"');
    process.exit(1);
  }

  console.log('✅ Droits Administrateur confirmés.\n');

  // 2) Ensure log dir
  ensureLogDir();

  // 3) Find node.exe
  let nodePath;
  try {
    nodePath = await getNodePath();
    console.log(`✅ Node.js trouvé: ${nodePath}`);
  } catch (e) {
    console.error('❌ Node.js non trouvé dans le PATH. Installez Node.js d\'abord.');
    process.exit(1);
  }

  // 4) Check if service already exists
  try {
    const existing = await run(`sc query "${SERVICE_NAME}"`);
    if (existing.includes('SERVICE_NAME')) {
      console.log(`⚠️  Le service "${SERVICE_NAME}" existe déjà. Suppression de l'ancien...`);
      await run(`sc stop "${SERVICE_NAME}"`).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
      await run(`sc delete "${SERVICE_NAME}"`);
      await new Promise(r => setTimeout(r, 1000));
      console.log('   ✅ Ancien service supprimé.\n');
    }
  } catch {
    // Service doesn't exist yet, that's fine
  }

  // 5) Set PowerShell Execution Policy (once)
  console.log('🔧 Configuration de la politique PowerShell...');
  try {
    await run('powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force"');
    console.log('   ✅ Politique d\'exécution : RemoteSigned (LocalMachine)\n');
  } catch (e) {
    console.warn(`   ⚠️  Impossible de configurer ExecutionPolicy: ${e.message}\n`);
  }

  // 6) Configure Firewall rules (idempotent)
  const port = process.env.PORT || 3001;
  console.log('🌐 Configuration du pare-feu Windows...');
  try {
    await run(`powershell -Command "if (!(Get-NetFirewallRule -DisplayName 'SBEE-Monitor-API' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'SBEE-Monitor-API' -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port} -Profile Any }"`);
    await run(`powershell -Command "if (!(Get-NetFirewallRule -DisplayName 'SBEE-Monitor-UI' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'SBEE-Monitor-UI' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -Profile Any }"`);
    console.log(`   ✅ Port ${port} (API) ouvert dans le pare-feu.`);
    console.log(`   ✅ Port 5173 (Frontend) ouvert dans le pare-feu.\n`);
  } catch (e) {
    console.warn(`   ⚠️  Erreur pare-feu (non critique): ${e.message}\n`);
  }

  // 7) Create the Windows Service with sc.exe
  // We use a wrapper approach: the service runs node.exe directly with the script
  const logFile = path.join(LOG_DIR, 'service.log');
  const binPath = `"${nodePath}" "${SERVER_SCRIPT}"`;
  
  console.log('⚙️  Création du Service Windows...');
  try {
    await run(`sc create "${SERVICE_NAME}" binPath= "cmd /c \\"${nodePath}\\" \\"${SERVER_SCRIPT}\\" >> \\"${logFile}\\" 2>&1" DisplayName= "${SERVICE_DISPLAY}" start= auto obj= LocalSystem`);
    console.log('   ✅ Service créé.');
  } catch (e) {
    console.error(`   ❌ Erreur lors de la création du service: ${e.message}`);
    // Fallback: use nssm if available
    console.log('\n💡 Tentative avec NSSM (Non-Sucking Service Manager)...');
    await installWithNSSM(nodePath, logFile);
    return;
  }

  // 8) Add service description
  try {
    await run(`sc description "${SERVICE_NAME}" "${SERVICE_DESC}"`);
  } catch {}

  // 9) Configure recovery (restart on failure)
  console.log('🔄 Configuration du redémarrage automatique en cas d\'erreur...');
  try {
    await run(`sc failure "${SERVICE_NAME}" reset= 60 actions= restart/5000/restart/10000/restart/20000`);
    console.log('   ✅ Redémarrage automatique configuré (5s, 10s, 20s).\n');
  } catch (e) {
    console.warn(`   ⚠️  Impossible de configurer la récupération: ${e.message}\n`);
  }

  // 10) Start the service
  console.log('🚀 Démarrage du service...');
  try {
    await run(`sc start "${SERVICE_NAME}"`);
    await new Promise(r => setTimeout(r, 2000));
    const status = await run(`sc query "${SERVICE_NAME}"`);
    if (status.includes('RUNNING')) {
      console.log(`\n✅ Service "${SERVICE_DISPLAY}" démarré avec succès!`);
    } else {
      console.log(`\n⚠️  Service créé mais statut inconnu. Vérifiez avec: sc query "${SERVICE_NAME}"`);
    }
  } catch (e) {
    console.error(`\n⚠️  Erreur au démarrage: ${e.message}`);
    console.log(`    Essayez manuellement: sc start "${SERVICE_NAME}"`);
  }

  printSummary(port, logFile);
}

// ─── NSSM Fallback ───────────────────────────────────────────────────────────

async function installWithNSSM(nodePath, logFile) {
  try {
    await run('nssm --version');
  } catch {
    console.log('  ⚠️  NSSM non trouvé. Installation recommandée: https://nssm.cc/download');
    console.log('\n  Alternative: Utilisez PM2 pour Windows:');
    console.log('  1. npm install -g pm2');
    console.log('  2. pm2 start server.js --name SBEEMonitoring');
    console.log('  3. pm2 startup');
    console.log('  4. pm2 save\n');
    process.exit(1);
  }

  await run(`nssm install "${SERVICE_NAME}" "${nodePath}" "${SERVER_SCRIPT}"`);
  await run(`nssm set "${SERVICE_NAME}" DisplayName "${SERVICE_DISPLAY}"`);
  await run(`nssm set "${SERVICE_NAME}" Description "${SERVICE_DESC}"`);
  await run(`nssm set "${SERVICE_NAME}" Start SERVICE_AUTO_START`);
  await run(`nssm set "${SERVICE_NAME}" ObjectName LocalSystem`);
  await run(`nssm set "${SERVICE_NAME}" AppStdout "${logFile}"`);
  await run(`nssm set "${SERVICE_NAME}" AppStderr "${logFile}"`);
  await run(`nssm start "${SERVICE_NAME}"`);
  console.log('✅ Service installé via NSSM!');
}

// ─── Uninstall Service ────────────────────────────────────────────────────────

async function uninstallService() {
  console.log('\n🗑️  Désinstallation du service SBEE Monitoring...\n');

  const admin = await isAdmin();
  if (!admin) {
    console.error('❌ Droits Administrateur requis.');
    process.exit(1);
  }

  try {
    await run(`sc stop "${SERVICE_NAME}"`);
    console.log('✅ Service arrêté.');
    await new Promise(r => setTimeout(r, 2000));
  } catch {
    console.log('ℹ️  Service déjà arrêté ou non running.');
  }

  try {
    await run(`sc delete "${SERVICE_NAME}"`);
    console.log('✅ Service supprimé du registre Windows.');
  } catch (e) {
    console.error(`❌ Erreur: ${e.message}`);
  }

  // Optionally remove firewall rules
  try {
    await run(`powershell -Command "Remove-NetFirewallRule -DisplayName 'SBEE-Monitor-API' -ErrorAction SilentlyContinue"`);
    await run(`powershell -Command "Remove-NetFirewallRule -DisplayName 'SBEE-Monitor-UI' -ErrorAction SilentlyContinue"`);
    console.log('✅ Règles pare-feu supprimées.');
  } catch {}

  console.log('\n✔ Désinstallation terminée.\n');
}

// ─── Status ───────────────────────────────────────────────────────────────────

async function checkStatus() {
  console.log('\n📊 Statut du Service SBEE Monitoring:\n');
  try {
    const status = await run(`sc query "${SERVICE_NAME}"`);
    const isRunning = status.includes('RUNNING');
    const isStopped = status.includes('STOPPED');
    console.log(isRunning ? '🟢 En cours d\'exécution (RUNNING)' : isStopped ? '🔴 Arrêté (STOPPED)' : status);
    
    // Also show port if running
    if (isRunning) {
      const port = process.env.PORT || 3001;
      console.log(`\n   API Backend: http://localhost:${port}`);
      console.log(`   Dashboard:  http://localhost:5173`);
    }
  } catch {
    console.log('⚪ Service non installé.');
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function printSummary(port, logFile) {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║          SBEE Monitoring Service — Résumé           ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  🚀 Service: ${SERVICE_NAME.padEnd(38)}║`);
  console.log(`║  🌐 API:     http://localhost:${String(port).padEnd(25)}║`);
  console.log(`║  📺 UI:      http://localhost:5173${' '.repeat(19)}║`);
  console.log(`║  📄 Logs:    ${logFile.substring(0, 38).padEnd(38)}║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Commandes utiles :                                  ║');
  console.log(`║  sc start "${SERVICE_NAME}"   (démarrer)       ║`);
  console.log(`║  sc stop  "${SERVICE_NAME}"   (arrêter)        ║`);
  console.log('║  node install-service.js status  (vérifier)         ║');
  console.log('║  node install-service.js uninstall (supprimer)      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

const action = process.argv[2] || 'install';

(async () => {
  try {
    if (action === 'install') {
      await installService();
    } else if (action === 'uninstall') {
      await uninstallService();
    } else if (action === 'status') {
      await checkStatus();
    } else {
      console.log('Usage: node install-service.js [install|uninstall|status]');
    }
  } catch (e) {
    console.error('Erreur fatale:', e.message);
    process.exit(1);
  }
})();
