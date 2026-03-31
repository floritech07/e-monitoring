const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'SBEEMonitor',
  description: 'Le serveur backend de monitoring de l\'infrastructure SBEE. Exécute la collecte matérielle, alerte et web-socket.',
  script: path.join(__dirname, 'server.js')
});

svc.on('uninstall', () => {
  console.log('✅ Désinstallation terminée : Le service "SBEEMonitor" a été retiré de votre système.');
  console.log('🛑 Le processus a bien été tué en arrière-plan.');
});

console.log('⏳ Arrêt du service...');
svc.uninstall();
