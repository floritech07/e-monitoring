# SBEE Monitoring System

Système de supervision de bout-en-bout (Infrastructure, VMs, Réseau, et Paiements) pour la SBEE.

## Prérequis pour l'installation sur un autre PC

1. **Node.js** (v18+)
2. **VMware Workstation** (ou utiliser les variables d'environnement pour personnaliser le chemin vers `vmrun.exe`)
3. Pour la partie pings et réseau, une connexion internet et les droits d'exécution de commandes système.

## Configuration (.env)

Créez / Modifiez le fichier `.env` à la racine :

```env
# Chemins VMware (Windows)
VMRUN_PATH="C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"

# Configuration Backend
PORT=3001
```

## Démarrage rapide

1. **Ouvrir un terminal à la racine** et exécuter le serveur backend :
   ```bash
   npm install
   node server.js
   ```

2. **Ouvrir un second terminal dans le dossier `frontend`** et démarrer l'interface utilisateur :
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

*L'application est configurée pour être accessible sur votre réseau local (ex: depuis votre téléphone ou un autre PC connecté au même Wi-Fi) en utilisant l'adresse IP locale de la machine hôte : `http://<VOTRE_IP_LOCALE>:5173/`.*
