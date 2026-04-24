# NexusMonitor v2 — Plan de phasage détaillé
**Projet : Supervision Data Center Salle Serveur SBEE**
**Référentiels : Huawei DCS · VMware vSphere 8.x · Veeam ONE 12.x · Zabbix 7.x**
**Fuseau : Africa/Porto-Novo (UTC+1) · Langue : Français**

---

## Gantt textuel — 8 phases sur 6 mois (Avril → Octobre 2026)

```
PHASE          MAI 2026          JUIN 2026         JUILLET 2026      AOÛT 2026         SEPT 2026         OCT 2026
               S1 S2 S3 S4   S1 S2 S3 S4   S1 S2 S3 S4   S1 S2 S3 S4   S1 S2 S3 S4   S1 S2

Phase 0 POC    ████████
Phase 1 Phys               ████████████
Phase 2 vSphere                          ████████████
Phase 3 Backup                                        ████████
Phase 4 Svcs                                                   ████████
Phase 5 Logs                                                            ████████
Phase 6 Dash                                                                     ████████
Phase 7 Sécu                                                                             ████
Phase 8 Prod                                                                              ████
```

---

## Détail par phase

### Phase 0 — Cadrage & POC (Semaines 1-3 : 26 Avril → 16 Mai 2026)

**Objectif** : Valider la faisabilité technique, poser les fondations, livrer un premier collecteur opérationnel sur 5 équipements pilotes.

| Semaine | Tâches | Responsable | Statut |
|---------|--------|-------------|--------|
| S1 | DAT v0.1, Matrice conformité initiale, choix stack technique | Lead Arch | ✅ En cours |
| S1 | docker-compose : PostgreSQL 16, Redis, VictoriaMetrics, backend | DevOps | ✅ En cours |
| S2 | Collecteur SNMP v2c/v3 opérationnel (1 switch, 1 UPS) | Dev Backend | ✅ En cours |
| S2 | Collecteur Redfish/iLO (1 serveur HPE ProLiant) | Dev Backend | ✅ En cours |
| S2 | Moteur d'alertes 4 niveaux (Info/Warning/Critical/Disaster) | Dev Backend | ✅ En cours |
| S3 | CMDB minimale (inventaire équipements, cycle de vie) | Dev Backend | 🔲 Planifié |
| S3 | Démo Phase 0 interne (équipe DSITD) | Lead Arch | 🔲 Planifié |
| S3 | Go/No-Go Phase 1 | DSI SBEE | 🔲 Planifié |

**Critères d'acceptation Phase 0** :
- [ ] 5 équipements collectés sans erreur pendant 24h
- [ ] Première alerte envoyée par email sur seuil franchi
- [ ] CMDB avec ≥ 10 équipements inventoriés
- [ ] docker-compose up → plateforme fonctionnelle en < 5 min

---

### Phase 1 — Infrastructure Physique & Hardware (Semaines 4-8 : 17 Mai → 27 Juin 2026)

**Objectif** : Supervision complète de la couche physique — environnemental, énergie, refroidissement, santé matérielle serveurs.

| Semaine | Tâches |
|---------|--------|
| S4-S5 | Sondes environnementales : température/HR par rack, rosée, fumée, eau |
| S4-S5 | Supervision UPS (SNMP + Modbus TCP) : modes, autonomie, batterie, cycles |
| S5-S6 | Supervision CRAC/CRAH : état, températures soufflage/reprise, consommation |
| S5-S6 | Tableau électrique / PDU rack : puissance par prise, PUE temps réel |
| S6-S7 | Hardware serveurs (IPMI 2.0 + Redfish) : CPU/RAM/disques/SMART/PSU/fans |
| S6-S7 | CMDB v1 complète : tous équipements, garanties, contrats, EOL/EOSL |
| S7-S8 | Vue 2D enrichie : cartes thermiques superposées sur plan salle |
| S8 | Démo Phase 1 · Point d'arrêt décisionnel |

**Livrables Phase 1** :
- Dashboard "Infrastructure Physique" complet (≥ 15 widgets)
- 20 templates d'alertes environnement/énergie actifs
- Rapport automatique journalier PUE + état UPS
- Documentation API couche collecte

---

### Phase 2 — Virtualisation VMware vSphere (Semaines 9-12 : 28 Juin → 25 Juillet 2026)

**Objectif** : Réplication des capacités vCenter Server + ESXi Host Client dans NexusMonitor. Couverture ≥ 90% des fonctionnalités vSphere Client HTML5.

| Semaine | Tâches |
|---------|--------|
| S9 | Intégration vCenter REST API v8 (govmomi-like en Node.js) |
| S9 | Inventaire hiérarchique complet : Datacenter→Cluster→Host→VM→Datastore |
| S10 | Métriques temps réel vSphere : CPU Ready, Memory Balloon, Disk GAVG/DAVG |
| S10 | Gestion snapshots : détection >72h, >10Go, alertes automatiques |
| S11 | Remote Console VM (noVNC ou WebMKS relay intégré) |
| S11 | vSAN health checks, multipathing, Storage DRS |
| S12 | DRS/HA monitoring : score DRS, admission control, FT state |
| S12 | Démo Phase 2 · Point d'arrêt décisionnel |

**Livrables Phase 2** :
- Vue inventaire type vCenter (arbre complet navigable)
- Remote Console VM fonctionnelle (1 VM minimum)
- Dashboard vSphere Performance avec tous les counters VMware
- 20 templates alertes vSphere

---

### Phase 3 — Sauvegarde & PRA (Semaines 13-15 : 26 Juillet → 15 Août 2026)

**Objectif** : Supervision Veeam B&R 12.x niveau Veeam ONE 12.x — jobs, SLA RPO/RTO, repositories, immuabilité.

| Semaine | Tâches |
|---------|--------|
| S13 | Intégration Veeam B&R REST API v7 |
| S13 | Jobs : statuts, durées, compression/dédup, erreurs, historique |
| S14 | SLA RPO/RTO : calcul réel vs contractuel par VM |
| S14 | Repositories : capacité, tendance, projection saturation J+30/J+60/J+90 |
| S15 | Unprotected VMs : détection automatique, alertes, rapport |
| S15 | Démo Phase 3 · Point d'arrêt décisionnel |

**Livrables Phase 3** :
- Dashboard sauvegarde style Veeam ONE (SLA gauge, jobs heat map)
- Rapport "VMs non protégées" automatique hebdomadaire
- 10 templates alertes sauvegarde

---

### Phase 4 — Services Applicatifs Critiques (Semaines 16-18 : 16 → 31 Août 2026)

**Objectif** : Surveillance granulaire des services Windows/Linux par serveur, avec dépendances et escalade.

| Semaine | Tâches |
|---------|--------|
| S16 | Moteur de checks actifs (TCP, HTTP, SMTP, IMAP, LDAP, WMI, SSH, PowerShell) |
| S16 | Tableau de configuration services par serveur (UI CRUD) |
| S17 | Arbre de dépendances (root cause analysis — ne pas générer alertes en cascade) |
| S17 | Escalade automatique : N1 (5 min) → N2 (15 min) → N3/Astreinte (30 min) |
| S18 | Surveillance IceWarp (SMTP/IMAP/ports/MariaDB) — remédiation incident avril 2026 |
| S18 | Démo Phase 4 · Point d'arrêt décisionnel |

---

### Phase 5 — Logs, Événements & Corrélation (Semaines 19-21 : 1 → 21 Sept 2026)

**Objectif** : Centralisation syslog, Windows Event Log, parsing, corrélation SIEM-like, rétention.

| Semaine | Tâches |
|---------|--------|
| S19 | Récepteur syslog RFC 5424, WEF collector |
| S19 | Pipeline parsing/normalisation/enrichissement (GeoIP, enrichissement CMDB) |
| S20 | Moteur de corrélation : règles, brute-force detection, anomalies |
| S20 | Interface Logs Explorer (search full-text, filtres, pivot) |
| S21 | Signature cryptographique des logs, politique de rétention par criticité |
| S21 | Démo Phase 5 · Point d'arrêt décisionnel |

---

### Phase 6 — Dashboards Exécutifs, Rapports & Digital Twin 3D (Semaines 22-24 : 22 Sept → 11 Oct 2026)

| Semaine | Tâches |
|---------|--------|
| S22 | Dashboard DG/DSI : PUE, SLA global, incidents, santé graphique |
| S22 | Capacity planning J+30/J+60/J+90 (CPU, RAM, stockage, énergie) |
| S23 | Rapports programmables PDF/Excel (15 modèles standards) |
| S23 | Digital Twin 3D enrichi : cartes thermiques superposées, temps réel |
| S24 | Démo Phase 6 · Point d'arrêt décisionnel |

---

### Phase 7 — Sécurité, Durcissement & Documentation (Semaines 25-26 : 12 → 25 Oct 2026)

| Tâches |
|--------|
| Tests de charge : 500 hôtes simulés, 5000 VM, 10000 métriques/s |
| Tests de résilience : perte nœud → bascule < 60s |
| Hardening CIS Benchmarks sur tous composants |
| Audit sécurité (OWASP Top 10, TLS 1.3, secrets management) |
| Documentation finale : DAT v1.0, guides admin/utilisateur/troubleshooting |
| Formation équipe DSITD (2 jours) |

---

### Phase 8 — Mise en production progressive (Semaine 27+ : 26 Oct → Nov 2026)

| Étape | Périmètre |
|-------|-----------|
| Pilote | 3 hôtes ESXi + 1 UPS + environnemental rack principal |
| 50% | Tous les hôtes ESXi + tous les UPS + refroidissement |
| 100% | Périmètre complet + SIEM + Rapports automatiques |

---

## Dépendances critiques

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3
                │
                └──────────────► Phase 4 ──► Phase 5 ──► Phase 6 ──► Phase 7 ──► Phase 8
```

- Phase 2 (vSphere) dépend de Phase 1 (collecte SNMP/IPMI en place)
- Phase 4 (services) peut démarrer dès fin Phase 1
- Phase 6 (dashboards exécutifs) dépend de toutes les couches de données

---

## Ressources estimées

| Rôle | Phase 0 | Phases 1-5 | Phases 6-8 |
|------|---------|-----------|-----------|
| Lead Architect / Backend | 80% | 70% | 40% |
| Dev Frontend | 20% | 50% | 80% |
| DevOps / Infrastructure | 60% | 30% | 20% |
| Équipe DSITD SBEE (validation) | 20% | 10% | 30% |

---

## Budget estimatif (F CFA)

| Poste | Estimation |
|-------|-----------|
| Développement (6 mois) | 12 000 000 XOF |
| Infrastructure serveurs POC | 1 500 000 XOF |
| Licences logicielles (optionnel) | 500 000 XOF |
| Formation équipe | 800 000 XOF |
| **TOTAL** | **~14 800 000 XOF** |

*Note : estimation basée sur hypothèse de développement interne DSITD + prestataire local. Économie significative vs solution propriétaire (Huawei DCS ≈ 80M XOF, Veeam Enterprise ≈ 15M XOF/an).*

---

*Document : NexusMonitor v2 — Plan de phasage v0.1 · SBEE DSITD · Avril 2026*
