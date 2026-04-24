# NexusMonitor v2 — Document d'Architecture Technique (DAT) v0.1
**SBEE — Société Béninoise d'Énergie Électrique**
**Direction des Systèmes d'Information, des Télécommunications et de la Documentation (DSITD)**

| Métadonnée | Valeur |
|-----------|--------|
| Version | 0.1 — Phase 0 Cadrage |
| Date | 24 Avril 2026 |
| Auteur | Architecture DSITD / NexusMonitor v2 Team |
| Statut | **DRAFT — En revue** |
| Classification | Confidentiel SBEE |
| Référence | NXM-DAT-2026-001 |

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Périmètre et délimitations](#2-périmètre-et-délimitations)
3. [Contraintes et exigences non fonctionnelles](#3-contraintes-et-exigences-non-fonctionnelles)
4. [Architecture conceptuelle (C4 Model — Niveau 1 & 2)](#4-architecture-conceptuelle)
5. [Architecture technique détaillée](#5-architecture-technique-détaillée)
6. [Modèle de données — CMDB & Time Series](#6-modèle-de-données)
7. [Architecture de collecte — Protocoles](#7-architecture-de-collecte)
8. [Moteur d'alertes — Philosophie et implémentation](#8-moteur-dalertes)
9. [Architecture de sécurité](#9-architecture-de-sécurité)
10. [Architecture de haute disponibilité](#10-architecture-de-haute-disponibilité)
11. [Plan de migration depuis l'existant](#11-plan-de-migration)
12. [Architecture Decision Records (ADR)](#12-architecture-decision-records)
13. [Glossaire](#13-glossaire)
14. [Annexes](#14-annexes)

---

## 1. Contexte et objectifs

### 1.1 Contexte opérationnel

La SBEE est l'opérateur national d'électricité au Bénin, classifiable comme **Opérateur d'Importance Vitale (OIV)** au sens de la directive NIS2. Sa salle serveur héberge les systèmes critiques assurant la gestion de la production et de la distribution d'énergie sur l'ensemble du territoire béninois.

**Incidents récents ayant motivé NexusMonitor v2 :**

| Date | Incident | Impact | Cause Racine |
|------|----------|--------|-------------|
| Avril 2026 | Corruption NAS + InnoDB IceWarp | Service mail indisponible ~4h | Bascule UPS Su-Kam sur fluctuation secteur sans détection préalable |
| En cours | Déploiement Veeam ONE 12.3 partiel | Couverture sauvegarde < 100% | Absence de supervision centralisée |
| Récurrent | Alertes réactives uniquement | MTTR élevé (>45min avg) | Pas de corrélation d'événements |

**Constat :** La SBEE ne dispose pas d'une plateforme de supervision **unifiée, proactive et orientée salle serveur**. Les outils existants (Veeam ONE partiel, scripts ponctuels `monitor_webmail.py`, supervision locale du PC admin) ne couvrent ni l'environnemental, ni l'énergie, ni la santé matérielle, ni la corrélation d'événements.

### 1.2 Objectifs de NexusMonitor v2

| # | Objectif | Mesure |
|---|----------|--------|
| O1 | Zéro angle mort sur la salle serveur | Couverture 100% équipements inventoriés en CMDB |
| O2 | Détection proactive avant incident | MTTD < 2 min sur anomalie matérielle/réseau |
| O3 | Corrélation root-cause | Réduction alertes parasites de 80% via arbre de dépendances |
| O4 | Conformité réglementaire | ISO 27001 A.12.4 (logs), ITIL v4 Incident Management |
| O5 | Autonomie DSITD | Équipe de 3-4 personnes peut opérer sans prestataire externe |
| O6 | ROI démontrable | Réduction MTTR de 45 min à < 10 min sur incidents P1 |

### 1.3 Ce qui est DANS le périmètre (v2)

✅ Salle serveur physique (racks, PDU, capteurs environnementaux)
✅ Énergie (UPS, groupes électrogènes, TGBT, PDU intelligents, PUE)
✅ Refroidissement (CRAC/CRAH, chillers)
✅ Matériel serveurs (via IPMI/Redfish/iLO/iDRAC/iBMC)
✅ Virtualisation VMware vSphere (hôtes ESXi, VMs, datastores, clusters)
✅ Stockage (SAN/NAS, volumes, multipathing, vSAN)
✅ Sauvegarde (Veeam B&R, jobs, SLA RPO/RTO, repositories)
✅ Réseau salle serveur (switches, routeurs, firewalls, VPN)
✅ Services applicatifs critiques (par serveur, avec dépendances)
✅ Logs/événements (syslog, Windows Event, corrélation)

### 1.4 Ce qui est HORS périmètre (v2)

❌ **Supervision du PC administrateur** (CPU/RAM/disques locaux — SUPPRIMÉ de v1)
❌ Réseaux bureau / LAN utilisateurs SBEE
❌ Supervision des équipements industriels SCADA (phase ultérieure v3)
❌ Cloud public (si hébergement futur)

---

## 2. Périmètre et délimitations

### 2.1 Inventaire cible initial (salle serveur SBEE)

**Hôtes ESXi** :
- ESXi-01-SBEE (192.168.10.11) — HPE ProLiant DL380 Gen10 — Cluster Production
- ESXi-02-SBEE (192.168.10.12) — HPE ProLiant DL380 Gen10 — Cluster Production
- ESXi-03-BACKUP (192.168.10.13) — HPE ProLiant DL360 Gen10 — Cluster Backup/DMZ

**VMs critiques** :
- SICA-APP-01/02, SICA-DB-01/02 (ERP interne)
- AD-DC-01/02 (Active Directory)
- EXCHANGE-01 (IceWarp mail)
- PASSERELLE-PAY-01 (paiement MTN/MOOV)
- VEEAM-BR-01, VEEAM-ONE-SRV (supervision/sauvegarde)
- SQL-SVR (10.1.1.13)

**Stockage** :
- HPE MSA 2060 SAN (FC, 24 To)
- Synology RS3621xs+ NAS (NFS/SMB, 36 To)

**Énergie** :
- UPS Su-Kam (3× sur racks critiques) — **surveillance renforcée post-incident avril 2026**
- Groupe électrogène (1200 kVA estimé)

**Environnemental** :
- CRAC Precision Air Conditioning (N+1)
- Capteurs température/HR par rack (estimation 12 sondes)

---

## 3. Contraintes et exigences non fonctionnelles

### 3.1 Performance

| Métrique | Exigence |
|---------|----------|
| Collecte métriques | ≤ 10 secondes cycle de rafraîchissement affiché |
| Rétention métriques court terme | 30 jours à 15s de résolution |
| Rétention métriques long terme | 2 ans à 5min de résolution (downsampling) |
| Débit ingestion | ≥ 5000 métriques/seconde (objectif Phase 7) |
| Charge UI | Temps de chargement dashboard principal < 2s |

### 3.2 Disponibilité

| Composant | Disponibilité cible |
|-----------|-------------------|
| Collecte (ne pas perdre de métriques) | 99.9% (≤ 8.7h/an) |
| Interface utilisateur | 99.5% |
| Notifications d'alertes | 99.9% — canal SMS de secours |

### 3.3 Sécurité (ISO 27001:2022)

- Authentification : MFA obligatoire pour tous les comptes (TOTP/U2F)
- Autorisation : RBAC à 4 niveaux (Viewer / Operator / Analyst / Admin)
- Chiffrement transit : TLS 1.3 minimum (TLS 1.0/1.1 désactivés)
- Chiffrement repos : AES-256 pour secrets, chiffrement DB pour données sensibles
- Audit trail : traçabilité complète de toutes les actions (ISO 27001 A.12.4.1)
- Sessions : timeout 30 min inactivité, révocation centralisée
- SNMP : v3 uniquement en production (authPriv, SHA-256, AES-256)

### 3.4 Conformité réglementaire

| Référentiel | Exigence |
|------------|----------|
| ISO 27001:2022 | A.12.4 (logging), A.12.6 (vulnérabilités), A.9 (contrôle d'accès) |
| Loi 2017-20 Code Numérique Bénin | Localisation des données, obligations notification |
| ITIL v4 | Incident, Problem, Change Management intégrés |
| TIA-942 Tier III | Redondance N+1 minimum pour supervision |

---

## 4. Architecture conceptuelle

### 4.1 Diagramme C4 — Niveau 1 : Contexte système

```
┌────────────────────────────────────────────────────────────────────┐
│                        SALLE SERVEUR SBEE                          │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  ESXi    │  │   UPS    │  │   CRAC   │  │  Switches/FW     │  │
│  │  Cluster │  │ Su-Kam   │  │ Précision│  │  Réseau          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘  │
│       │              │              │                 │             │
└───────┼──────────────┼──────────────┼─────────────────┼────────────┘
        │ vSphere API  │ SNMP v3      │ SNMP/Modbus    │ SNMP v3
        │ /Redfish     │              │                 │
        ▼              ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXUSMONITOR v2 PLATFORM                         │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐               │
│  │  Collecte   │  │  Traitement │  │  Présentation│               │
│  │  (Pollers)  │→ │  (Engine)   │→ │  (Frontend)  │               │
│  └─────────────┘  └─────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────┐     ┌─────────────────────────────────────┐
│  ÉQUIPE DSITD SBEE   │     │   NOTIFICATIONS                     │
│  - Operateurs        │     │   Email (SMTP) · SMS (MTN/Moov)     │
│  - Analystes         │     │   Telegram · Appel vocal (TTS)      │
│  - DSI               │     └─────────────────────────────────────┘
└──────────────────────┘
```

### 4.2 Diagramme C4 — Niveau 2 : Conteneurs

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXUSMONITOR v2                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  COUCHE COLLECTE                                                 │    │
│  │                                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │ snmpService  │  │redfishService│  │  vSphereService      │   │    │
│  │  │ (SNMP v2c/v3)│  │(iLO/iDRAC)  │  │  (vCenter REST API)  │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │    │
│  │  │veeamService  │  │ checkService │  │  syslogReceiver      │   │    │
│  │  │(B&R REST API)│  │(TCP/HTTP/WMI)│  │  (RFC 5424)          │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ↓ métriques, événements                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  COUCHE TRAITEMENT                                               │    │
│  │                                                                  │    │
│  │  ┌──────────────────┐  ┌───────────────┐  ┌─────────────────┐   │    │
│  │  │ alertEngineService│  │correlationSvc │  │ capacityService │   │    │
│  │  │ (4 niveaux ITIL) │  │ (root cause)  │  │ (prédictions)   │   │    │
│  │  └──────────────────┘  └───────────────┘  └─────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  COUCHE PERSISTANCE                                              │    │
│  │                                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │    │
│  │  │ VictoriaMetrics│  │ PostgreSQL 16│  │     Redis          │    │    │
│  │  │ (time series) │  │ (CMDB, audit)│  │  (cache, sessions) │    │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  COUCHE PRÉSENTATION (React 19 + Vite)                           │    │
│  │  Express 5 API · Socket.IO temps réel                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Architecture technique détaillée

### 5.1 Stack technique retenue

| Composant | Technologie | Version | Justification |
|-----------|------------|---------|---------------|
| Runtime backend | Node.js | 20 LTS | Existant, performances I/O async, riche en libs réseau |
| Framework API | Express | 5.x | Existant |
| Frontend | React + Vite | 19 / 8.x | Existant |
| Time Series DB | VictoriaMetrics | 1.x | Prometheus-compatible, 10× plus performant qu'InfluxDB, moins de RAM |
| Base relationnelle | PostgreSQL | 16 | CMDB, audit trail, configuration, utilisateurs |
| Cache / Sessions | Redis | 7.x | Sessions authentifiées, queues notifications |
| Temps réel | Socket.IO | 4.x | Existant — push métriques live |
| SNMP | net-snmp (npm) | 3.x | Seule lib Node.js SNMP v3 mature, AES-256 + SHA-256 |
| Notifications | nodemailer + axios | latest | Email SMTP + SMS via API opérateur |
| Auth | JWT + TOTP | - | MFA, pas de dépendance externe Keycloak en Phase 0 |

### 5.2 Décision architecture — Pas de microservices en Phase 0

Pour la Phase 0, la plateforme reste un **monolithe modulaire** (modules Node.js bien séparés dans `/services/`). La migration vers microservices est prévue en Phase 7 si le test de charge l'exige.

**Raison** : équipe DSITD restreinte, infrastructure lab limitée, complexité opérationnelle injustifiée avant validation fonctionnelle. Cette décision est révisable (ADR-001).

### 5.3 Ports et flux réseau

```
Internet/LAN SBEE
       │
       │ HTTPS 443 (TLS 1.3)
       ▼
┌──────────────────┐
│  Nginx (reverse  │
│  proxy + TLS)    │
│  :443 → :3001    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐    :5432  ┌─────────────────┐
│  Backend Express │ ────────► │  PostgreSQL 16   │
│  :3001           │    :6379  │  :5432           │
│  + Socket.IO     │ ────────► ├─────────────────┤
└──────────────────┘    :8428  │  Redis :6379     │
         │         ────────►  ├─────────────────┤
         │                    │  VictoriaMetrics  │
         │                    │  :8428 (write)    │
         │                    │  :8481 (query)    │
         │                    └─────────────────┘
         │
   Protocoles collecte (VLAN OOB Management) :
   ├── SNMP v3  udp/161   (switches, UPS, CRAC)
   ├── Redfish  tcp/443   (iLO/iDRAC serveurs)
   ├── IPMI     udp/623   (BMC serveurs)
   ├── vSphere  tcp/443   (vCenter REST API)
   ├── Veeam    tcp/9419  (B&R REST API v7)
   └── Syslog   udp+tcp/514 (récepteur centralisé)
```

---

## 6. Modèle de données

### 6.1 CMDB — Tables PostgreSQL (schéma simplifié Phase 0)

```sql
-- Équipements (CI — Configuration Items)
CREATE TABLE cmdb_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(200) NOT NULL,
  type         VARCHAR(50)  NOT NULL,  -- server, switch, ups, crac, vm, ...
  vendor       VARCHAR(100),
  model        VARCHAR(200),
  serial       VARCHAR(100),
  ip_management INET,
  mac_address  MACADDR,
  location     VARCHAR(200),  -- 'Rack-A1 U6'
  cluster_id   UUID REFERENCES cmdb_items(id),
  status       VARCHAR(20) DEFAULT 'active',  -- active, maintenance, decommissioned
  -- Cycle de vie
  purchase_date    DATE,
  warranty_expires DATE,
  eosl_date        DATE,
  support_contract VARCHAR(200),
  -- Protocoles de supervision
  snmp_version     VARCHAR(5),   -- v2c, v3
  snmp_community   VARCHAR(100),
  snmp_user        VARCHAR(100),
  redfish_enabled  BOOLEAN DEFAULT false,
  ipmi_enabled     BOOLEAN DEFAULT false,
  -- Métadonnées
  tags         JSONB DEFAULT '{}',
  custom_attrs JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents ITIL
CREATE TABLE itil_incidents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number       SERIAL UNIQUE,  -- INC-00001
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  severity     VARCHAR(20) NOT NULL,  -- info, warning, critical, disaster
  status       VARCHAR(20) DEFAULT 'open',  -- open, acknowledged, in_progress, resolved, closed
  category     VARCHAR(100),
  source_alert_id VARCHAR(200),
  ci_id        UUID REFERENCES cmdb_items(id),
  assigned_to  VARCHAR(100),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at  TIMESTAMPTZ,
  closed_at    TIMESTAMPTZ,
  resolution   TEXT,
  sla_breach   BOOLEAN DEFAULT false
);

-- Audit trail (ISO 27001 A.12.4)
CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  ts         TIMESTAMPTZ DEFAULT NOW(),
  user_id    VARCHAR(100),
  action     VARCHAR(200),
  resource   VARCHAR(200),
  resource_id VARCHAR(200),
  details    JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100)
);
```

### 6.2 Métriques — VictoriaMetrics (format Prometheus)

Chaque métrique suit la convention de nommage : `nexusmonitor_{domaine}_{nom}_{unité}`

```
# Environnemental
nexusmonitor_env_temperature_celsius{rack="A1",sensor="top"}     22.4
nexusmonitor_env_humidity_percent{rack="A1"}                     45.2
nexusmonitor_env_dewpoint_celsius{rack="A1"}                     10.1

# UPS
nexusmonitor_ups_load_percent{device="ups-su-kam-01",phase="A"}  42.0
nexusmonitor_ups_battery_runtime_minutes{device="ups-su-kam-01"} 25.0
nexusmonitor_ups_battery_soh_percent{device="ups-su-kam-01"}     87.0
nexusmonitor_ups_input_voltage_volts{device="ups-su-kam-01"}     228.0

# ESXi Host
nexusmonitor_esxi_cpu_usage_percent{host="ESXi-01-SBEE"}         43.2
nexusmonitor_esxi_ram_used_bytes{host="ESXi-01-SBEE"}            120586420224
nexusmonitor_esxi_cpu_ready_percent{host="ESXi-01-SBEE"}         1.2

# VM
nexusmonitor_vm_cpu_usage_percent{vm="SICA-APP-01",host="ESXi-01"}  38.0
nexusmonitor_vm_ram_balloon_bytes{vm="SICA-APP-01"}                  0

# Datastore
nexusmonitor_ds_capacity_bytes{ds="SAN-PROD-LUN01"}              4398046511104
nexusmonitor_ds_used_bytes{ds="SAN-PROD-LUN01"}                  3006477107200
nexusmonitor_ds_latency_ms{ds="SAN-PROD-LUN01",type="read"}      1.2

# PUE
nexusmonitor_pue_value                                           1.52
nexusmonitor_power_it_kw                                         45.0
nexusmonitor_power_total_facility_kw                             68.4
```

---

## 7. Architecture de collecte — Protocoles

### 7.1 SNMP v3 (UPS, switches, CRAC, PDU)

```
Poller (toutes les 30s) ──SNMP GetBulk──► Équipement
                         UDP/161
                         Auth: SHA-256
                         Priv: AES-256

OIDs prioritaires UPS Su-Kam :
  .1.3.6.1.2.1.33.1.2.3.0  — upsEstimatedMinutesRemaining
  .1.3.6.1.2.1.33.1.2.4.0  — upsEstimatedChargeRemaining
  .1.3.6.1.2.1.33.1.3.3.1  — upsInputVoltage
  .1.3.6.1.2.1.33.1.4.4.1  — upsOutputVoltage
  .1.3.6.1.2.1.33.1.4.4.4  — upsOutputLoad
  .1.3.6.1.4.1.318          — APC MIB (si APC)
  .1.3.6.1.4.1.2254         — Socomec MIB (si Socomec)
  .1.3.6.1.4.1.15039        — Su-Kam MIB

OIDs prioritaires switch HP/Cisco :
  IF-MIB (.1.3.6.1.2.1.2)
  IF-MIB-64 (.1.3.6.1.2.1.31)
  ENTITY-MIB (.1.3.6.1.2.1.47)
  CISCO-MEMORY-POOL-MIB (si Cisco)
```

### 7.2 Redfish DMTF (serveurs HPE ProLiant via iLO 5/6)

```
Poller (toutes les 60s) ──HTTPS GET──► iLO :443/redfish/v1/
                          TLS 1.3

Endpoints Redfish prioritaires :
  /redfish/v1/Systems/{id}                    — CPU, RAM, état général
  /redfish/v1/Systems/{id}/Processors         — détail par processeur
  /redfish/v1/Systems/{id}/Memory             — modules DIMM
  /redfish/v1/Systems/{id}/Storage            — disques, RAID, SMART
  /redfish/v1/Chassis/{id}/Thermal            — températures, ventilateurs
  /redfish/v1/Chassis/{id}/Power              — PSU, consommation
  /redfish/v1/Managers/{id}/LogServices/IEL   — event log (SEL)
```

### 7.3 VMware vSphere REST API v8

```
Session token refresh toutes les 24h
GET /api/vcenter/vm                           — inventaire VMs
GET /api/vcenter/host                         — inventaire hôtes
GET /api/vcenter/datastore                    — datastores
GET /api/vcenter/cluster                      — clusters
POST /api/vcenter/vm/{vm}/guest/power/action  — actions VM
```

### 7.4 Veeam B&R REST API v7

```
POST /api/oauth2/token                        — authentification
GET /api/v1/jobs                              — tous les jobs
GET /api/v1/jobs/{id}/states                  — état dernier job
GET /api/v1/restorePoints                     — points de restauration
GET /api/v1/repositories                      — repositories + capacité
```

---

## 8. Moteur d'alertes

### 8.1 Niveaux d'alerte (alignés Zabbix + ITIL)

| Niveau | Couleur | ITIL Priority | Réponse max | Escalade automatique |
|--------|---------|---------------|-------------|---------------------|
| **DISASTER** | 🔴 Rouge vif | P1 Critique | 15 min | Immédiat : SMS + appel vocal + popup |
| **CRITICAL** | 🔴 Rouge | P2 Élevé | 30 min | 5 min : email + SMS |
| **WARNING** | 🟠 Orange | P3 Moyen | 4h | 15 min : email |
| **INFO** | 🔵 Bleu | P4 Bas | 24h | Aucune |

### 8.2 Cycle de vie d'une alerte

```
Métrique collectée
       │
       ▼
Évaluation règle alertEngineService
       │
       ├── Seuil non franchi → OK (résolution si alerte existante)
       │
       └── Seuil franchi
                │
                ▼
         Vérification dépendances (arbre CI)
                │
                ├── CI parent en panne → Suppression (alerte corrélée, pas dupliquée)
                │
                └── CI sain → Création alerte + Incident ITIL
                                       │
                                       ▼
                                Notification canal 1 (email)
                                       │
                               t+5min non acquittée ?
                                       │
                                       └── OUI → Canal 2 (SMS)
                                                  │
                                          t+15min non acquittée ?
                                                  │
                                                  └── OUI → Canal 3 (SMS astreinte N3)
                                                             │
                                                    t+30min → Direction
```

### 8.3 Templates d'alertes Phase 0 (20 premiers)

| # | Template | Condition | Niveau |
|---|---------|-----------|--------|
| 1 | ESXi hôte inaccessible | ping KO > 2 min | DISASTER |
| 2 | ESXi CPU > 90% | cpu_usage > 90% pendant 10 min | CRITICAL |
| 3 | ESXi RAM > 95% (balloning) | ram_balloon > 5% | CRITICAL |
| 4 | Datastore > 85% | ds_used/ds_total > 85% | WARNING |
| 5 | Datastore > 95% | ds_used/ds_total > 95% | CRITICAL |
| 6 | Datastore latence > 30ms | ds_latency_ms > 30 | WARNING |
| 7 | UPS en mode batterie | ups_mode = battery | CRITICAL |
| 8 | UPS autonomie < 20 min | ups_runtime_min < 20 | CRITICAL |
| 9 | UPS autonomie < 5 min | ups_runtime_min < 5 | DISASTER |
| 10 | UPS charge > 80% | ups_load_pct > 80 | WARNING |
| 11 | Température salle > 27°C | temp_celsius > 27 | WARNING |
| 12 | Température salle > 30°C | temp_celsius > 30 | CRITICAL |
| 13 | Humidité < 40% ou > 60% | humidity < 40 OR > 60 | WARNING |
| 14 | VM snapshot > 72h | snapshot_age_h > 72 | WARNING |
| 15 | VM snapshot > 168h (7 jours) | snapshot_age_h > 168 | CRITICAL |
| 16 | Job Veeam échoué | job_result = failed | CRITICAL |
| 17 | VM sans sauvegarde > 7 jours | last_backup_days > 7 | WARNING |
| 18 | Disque SMART pending sectors > 0 | smart_pending > 0 | WARNING |
| 19 | Port SMTP 25 non répondant (IceWarp) | tcp_check port 25 = FAILED | CRITICAL |
| 20 | Port IMAP 993 non répondant (IceWarp) | tcp_check port 993 = FAILED | CRITICAL |

---

## 9. Architecture de sécurité

### 9.1 Principes de sécurité by design

1. **Defense in depth** : authentification + chiffrement + segmentation réseau + audit
2. **Least privilege** : chaque service n'accède qu'à ce dont il a besoin
3. **Zero trust** : aucune connexion implicitement de confiance, même interne
4. **Fail secure** : en cas de panne du système d'auth, accès bloqué (pas en clair)

### 9.2 RBAC — Rôles utilisateurs (aligné ITIL v4)

| Rôle | Périmètre | Droits |
|------|-----------|--------|
| **Viewer** | Lecture seule | Dashboards publics, alertes lecture |
| **Operator** | Opérations courantes | Acquitter alertes, redémarrer services, consulter logs |
| **Analyst** | Analyse approfondie | Tous les dashboards, logs complets, rapports |
| **Manager** | Vue dirigeant | Dashboard exécutif, rapports, pas de config |
| **Admin** | Administration complète | Configuration, CMDB, règles alertes, utilisateurs |

### 9.3 Gestion des secrets

- `.env` pour Phase 0 (dev uniquement) — JAMAIS commité
- Variables d'environnement Docker pour Phase 1+
- Objectif Phase 7 : HashiCorp Vault pour la production

---

## 10. Architecture de haute disponibilité

### 10.1 Topologie cible (Phase 7)

```
Load Balancer (keepalived/VRRP)
        │
   ┌────┴─────┐
   ▼           ▼
Nœud 1      Nœud 2
(Actif)     (Passif → bascule < 60s)

PostgreSQL : streaming replication (Patroni) + auto-failover
VictoriaMetrics : 2 réplicas avec vmagent
Redis : Sentinel (3 nœuds)
```

### 10.2 Phase 0 (POC)

Mono-nœud acceptable. Résilience minimale :
- Restart automatique des services Docker (restart: unless-stopped)
- Sauvegarde PostgreSQL quotidienne vers NAS
- Health checks Docker intégrés

---

## 11. Plan de migration depuis l'existant

### 11.1 Ce qui existe (NexusMonitor v1 / SBEE Monitoring)

| Fonctionnalité existante | Action v2 |
|--------------------------|-----------|
| Supervision PC admin (CPU/RAM/disques locaux) | **SUPPRIMÉ** |
| VMs VMware simulées | → Remplacer par vraies données vSphere |
| ESXiHostDetail (4 onglets) | ✅ Conserver, enrichir avec vSphere API réelle |
| ClusterView | ✅ Conserver, brancher sur vCenter |
| ServiceMap | ✅ Conserver |
| StorageTopology | ✅ Conserver, enrichir |
| NetworkFabric | ✅ Conserver, enrichir |
| Veeam page existante | ✅ Enrichir avec SLA RPO/RTO |
| Alertes existantes (CPU/RAM host local) | **Recentrer sur salle serveur** |

### 11.2 Stratégie de cohabitation

```
Semaines 1-2  : Développement NexusMonitor v2 en parallèle
Semaine 3     : Bascule progressive (anciens dashboards masqués)
Semaines 4+   : Suppression du code v1 superviseur PC
```

---

## 12. Architecture Decision Records (ADR)

### ADR-001 : Monolithe modulaire vs Microservices

**Contexte** : Architecture cible complexe, équipe restreinte.
**Décision** : Monolithe modulaire en Phase 0-6, évaluation microservices en Phase 7.
**Raison** : Réduction de la complexité opérationnelle, déploiement docker-compose vs Kubernetes.
**Conséquences** : Scalabilité limitée à ~500 hôtes sur 1 nœud. Acceptable pour SBEE.

### ADR-002 : VictoriaMetrics vs InfluxDB vs Prometheus

**Contexte** : Besoin de time series haute performance, PromQL compatible.
**Décision** : VictoriaMetrics single-node pour Phase 0-6.
**Raison** : 5-10× moins de RAM que InfluxDB, compatible Prometheus, queries PromQL natives.
**Conséquences** : Pas de Flux query language. Acceptable.

### ADR-003 : SNMP v3 obligatoire en production

**Contexte** : SNMP v1/v2c en clair sur le réseau = violation ISO 27001.
**Décision** : SNMP v3 authPriv (SHA-256 / AES-256) pour tous les équipements nouveaux. v2c toléré temporairement sur équipements anciens ne supportant pas v3.
**Raison** : Conformité ISO 27001 A.13.1 (sécurité des réseaux).

### ADR-004 : Suppression supervision PC administrateur

**Contexte** : v1 supervisait le PC local (CPU/RAM/disques) via systeminformation.
**Décision** : SUPPRIMÉ en v2. Le PC admin n'est pas un équipement critique de la salle serveur.
**Raison** : Clarté du périmètre, éviter la confusion opérationnelle, focus sur l'infrastructure.

---

## 13. Glossaire

| Terme | Définition |
|-------|-----------|
| CMDB | Configuration Management Database — référentiel ITIL de tous les CI |
| CI | Configuration Item — tout équipement ou logiciel inventorié |
| IPMI | Intelligent Platform Management Interface — accès OOB serveurs |
| Redfish | API REST DMTF pour la gestion des serveurs (remplace IPMI sur les serveurs récents) |
| iLO | Integrated Lights-Out — BMC HPE ProLiant |
| iDRAC | Integrated Dell Remote Access Controller — BMC Dell |
| iBMC | Intelligent Baseboard Management Controller — BMC Huawei FusionServer |
| BMC | Baseboard Management Controller — processeur de gestion serveur OOB |
| OOB | Out-of-Band — réseau de management séparé du réseau de production |
| SEL | System Event Log — journal événements matériels IPMI |
| SMART | Self-Monitoring, Analysis and Reporting Technology — santé disques |
| PUE | Power Usage Effectiveness = Puissance totale data center / Puissance IT |
| ASHRAE | American Society of Heating, Refrigerating and Air-Conditioning Engineers — norme températures salle serveur |
| TIA-942 | Telecommunication Industry Association standard pour data centers |
| RPO | Recovery Point Objective — perte de données maximale tolérée |
| RTO | Recovery Time Objective — temps de restauration maximal toléré |
| MTTD | Mean Time To Detect — délai moyen de détection d'un incident |
| MTTR | Mean Time To Repair — délai moyen de résolution d'un incident |
| DRS | Distributed Resource Scheduler — équilibrage automatique VMware |
| HA | High Availability — haute disponibilité VMware |
| FT | Fault Tolerance — tolérance aux pannes VMware |

---

## 14. Annexes

### Annexe A — Équipements salle serveur SBEE (inventaire initial)

*Voir CMDB initiale dans data/cmdb_seed.json après Phase 0.*

### Annexe B — Topologie réseau salle serveur

*Diagramme Visio/draw.io à produire en Phase 1 après découverte LLDP.*

### Annexe C — Contacts équipe astreinte DSITD

*Configurables dans l'interface Admin > Notifications > Équipes d'astreinte.*

---

*Document : NexusMonitor v2 DAT v0.1 · SBEE DSITD · 24 Avril 2026 · CONFIDENTIEL*
*Prochaine révision : DAT v0.2 après démo Phase 0 (16 Mai 2026)*
