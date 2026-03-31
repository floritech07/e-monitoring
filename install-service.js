const Service = require('node-windows').Service;
const path = require('path');

// Crée un nouvel objet service
const svc = new Service({
  name: 'SBEEMonitor',
  description: 'Le serveur backend de monitoring de l\'infrastructure SBEE. Exécute la collecte matérielle, alerte et web-socket.',
  script: path.join(__dirname, 'server.js'),
  env: [{
    name: "NODE_ENV",
    value: "production"
  }]
});

// Écoute l'événement 'install', qui indique que le processus d'installation est terminé
svc.on('install', () => {
  console.log('✅ Service "SBEEMonitor" installé avec succès !');
  console.log('🔄 Démarrage du service en arrière-plan...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️ Le service "SBEEMonitor" est déjà installé.');
});

svc.on('start', () => {
  console.log('🚀 Service démarré. Le serveur tourne de façon invisible (Compte NT AUTHORITY\\SYSTEM).');
});

// Lance l'installation
console.log('⏳ Installation du service Windows en cours...');
svc.install();
