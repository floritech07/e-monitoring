# SBEE Infrastructure Monitoring

Plateforme de monitoring d'infrastructure en temps réel — Agentless, Multi-OS, Premium UI.

---

## 🚀 Déploiement Rapide (N'importe quel PC)

### Prérequis
- [Node.js 18+](https://nodejs.org/en/download) (LTS recommandé)
- [Git](https://git-scm.com/downloads)

### Première installation (1 seule fois par PC)

```bash
# 1. Cloner le projet
git clone https://github.com/floritech07/e-monitoring
cd e-monitoring

# 2. Lancer le script d'installation universel
#    (En Admin sur Windows pour configurer le pare-feu automatiquement)
node setup.js
```

Le script `setup.js` fait **tout automatiquement** :
- ✅ Dépendances Backend & Frontend (`npm install`)
- ✅ Fichier `.env` avec valeurs par défaut
- ✅ Règles pare-feu Windows (ports 3001 & 5173)
- ✅ Politique PowerShell (`RemoteSigned`) pour les requêtes WMI
- ✅ Dossiers de données et de logs

---

## 📺 Modes de Démarrage

### Mode Développement (2 terminaux)
```bash
# Terminal 1 — Backend API
node server.js

# Terminal 2 — Frontend Vite (hot-reload)
cd frontend && npm run dev
```
→ Ouvrir [http://localhost:5173](http://localhost:5173)

### Mode Production (1 seule commande, tout-en-un)
```bash
npm run start:prod
```
→ Build le frontend → Lance le backend → Frontend servi sur le port 3001
→ Ouvrir [http://localhost:3001](http://localhost:3001)

### Mode Service Windows (démarrage automatique au boot, RECOMMANDÉ en entreprise)
```bash
# En terminal Administrateur :
npm run service:install

# Vérifier le statut
npm run service:status

# Supprimer le service
npm run service:uninstall
```
Le service tourne invisiblement en arrière-plan avec les droits `LocalSystem`.
Aucune intervention humaine nécessaire après chaque redémarrage.

---

## ⚙️ Variables d'environnement (`.env`)

Copier `.env.example` en `.env` et remplir les valeurs manquantes.

| Variable | Description |
|---|---|
| `PORT` | Port du backend (défaut: 3001) |
| `VMRUN_PATH` | Chemin vers vmrun.exe (VMware) — **auto-détecté** |
| `VBOXMANAGE_PATH` | Chemin vers VBoxManage — **auto-détecté** |
| `DB_PREPAID_*` | Connexion base de données prépayé |
| `DB_POSTPAID_*` | Connexion base de données postpayé |
| `VEEAM_HOST` | Hôte Veeam Backup & Replication |

---

## 🌍 Compatibilité OS

| Système | Statut | Notes |
|---|---|---|
| Windows 10/11 | ✅ Complet | Admin recommandé pour TPM/Hyper-V/SMART |
| Windows Server | ✅ Complet | Configurer comme Service pour démarrage auto |
| Kali Linux / Ubuntu | ✅ Complet | `sudo` pour SMART disques |
| macOS | ✅ Partiel | VMware Fusion détecté automatiquement |
| IBM i / UNIX | 🔜 Prévu | Via SSH/SNMP (version entreprise) |

---

## 📁 Structure du Projet

```
├── server.js                   # Backend Express + WebSocket
├── setup.js                    # Script d'installation universel ✨
├── install-service.js          # Installateur Service Windows ✨
├── .env.example                # Template de configuration ✨
├── services/
│   ├── metricsService.js       # CPU, RAM, Disque, OS (async)
│   ├── virtualizationService.js # VMware / VirtualBox / Hyper-V
│   ├── networkService.js       # Probe LAN
│   └── paymentService.js       # Monitoring transactions
├── frontend/
│   └── src/pages/              # Dashboard, Infra, Alerts, Settings...
└── data/                       # Persistance JSON + logs
```

---

## 📡 Architecture Réseau Entreprise (Plan)

Pour surveiller tous les PC d'un réseau d'entreprise depuis un seul Dashboard :
1. Déployer cette application sur **une VM centrale** ou **un serveur dédié**.
2. Sur chaque PC cible : `git clone`, `node setup.js`, `npm run service:install`.
3. La VM centrale collectera les métriques de chaque poste via leur API locale.
