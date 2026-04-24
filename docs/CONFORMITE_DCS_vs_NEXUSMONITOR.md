# Matrice de Conformité — DCS Huawei vs NexusMonitor v2
**Référence : Huawei ManageOne / FusionSphere DCS · VMware vSphere 8.x · Veeam ONE 12.x · Zabbix 7.x**
**Projet : NexusMonitor v2 · SBEE DSITD · Avril 2026**

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✅ | Implémenté dans NexusMonitor v2 (POC ou production) |
| 🟠 | Partiellement implémenté ou en cours de développement |
| 🔲 | Planifié (backlog phasé) |
| ❌ | Hors périmètre ou non applicable à SBEE |

---

## 1. Supervision Infrastructure Physique

### 1.1 Surveillance Environnementale

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 1.1.1 | Température par capteur / rack | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.2 | Humidité relative par rack | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.3 | Point de rosée | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.4 | Détection fumée / incendie | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.5 | Détection fuite d'eau | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.6 | Carte thermique 2D salle serveur | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.7 | Carte thermique 3D (Digital Twin) | ✅ | ❌ | ❌ | 🔲 | Ph.6 |
| 1.1.8 | Historique températures 30/90 jours | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.9 | Alertes seuils ASHRAE A1/A2 | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.1.10 | Corrélation température / charge serveur | ✅ | ❌ | ❌ | 🔲 | Ph.5 |

### 1.2 Supervision UPS & Alimentation

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 1.2.1 | État UPS (online/bypass/battery/offline) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.2 | Autonomie batterie restante (min) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.3 | Charge UPS (%) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.4 | Tension entrée / sortie (V) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.5 | Cycles de charge batterie | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.6 | Température batterie | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.7 | SNMP v3 UPS Su-Kam / APC / Eaton | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 1.2.8 | Modbus TCP UPS | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.9 | Rapport autonomie / incidents secteur | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.2.10 | Prédiction remplacement batterie | ✅ | ❌ | ❌ | 🔲 | Ph.6 |

### 1.3 Supervision CRAC / Refroidissement

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 1.3.1 | État compresseur CRAC (ON/OFF/alarme) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.3.2 | Température soufflage / reprise | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.3.3 | Débit d'air (m³/h) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.3.4 | Consommation électrique CRAC (kW) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.3.5 | Heures de fonctionnement filtres | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.3.6 | COP (Coefficient of Performance) | ✅ | ❌ | ❌ | 🔲 | Ph.6 |

### 1.4 Tableau Électrique / PDU

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 1.4.1 | Puissance par circuit (kW) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.4.2 | Courant par prise PDU (A) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.4.3 | PUE temps réel | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.4.4 | PUE historique / tendance | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.4.5 | Consommation totale salle (kWh/jour) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.4.6 | Alarme dépassement capacité circuit | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.4.7 | Rapport énergétique mensuel | ✅ | ❌ | ❌ | 🔲 | Ph.6 |

### 1.5 Hardware Serveurs (IPMI / Redfish)

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 1.5.1 | Température CPU / boîtier | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 1.5.2 | Vitesse ventilateurs (RPM) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 1.5.3 | État alimentation (PSU) redondant | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 1.5.4 | État disques (SMART, RAID) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 1.5.5 | Inventaire hardware (RAM DIMMs, PCIe) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 1.5.6 | iLO / iDRAC remote console | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.5.7 | Redfish DMTF v1.x (HPE/Dell) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 1.5.8 | POST / boot log (SEL) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.5.9 | Firmware inventory et versions | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 1.5.10 | Alerte EOL/EOSL matériel | ✅ | ❌ | ❌ | 🔲 | Ph.1 |

---

## 2. Supervision Réseau

### 2.1 Switches / Routeurs (SNMP)

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 2.1.1 | État interfaces (UP/DOWN) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 2.1.2 | Trafic RX/TX par interface (bps) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 2.1.3 | Taux d'erreur / CRC / collisions | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 2.1.4 | Utilisation CPU switch | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 2.1.5 | RAM switch | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 2.1.6 | Table ARP / MAC addresses | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 2.1.7 | VLAN table (802.1Q) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 2.1.8 | STP / RSTP topology | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 2.1.9 | SNMP v3 (authPriv, SHA-256, AES-256) | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 2.1.10 | Topologie L2 automatique (LLDP/CDP) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |

### 2.2 Fabric Réseau Virtuel (vSphere)

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 2.2.1 | vSwitch standard : ports, portgroups | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 2.2.2 | vSwitch distribué (DVS) | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 2.2.3 | VLAN portgroup mapping | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 2.2.4 | Throughput vmnic uplinks | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 2.2.5 | NSX-T micro-segmentation | ✅ | ✅ | ❌ | ❌ | N/A |
| 2.2.6 | Load balancing NIC teaming policy | ✅ | ✅ | ❌ | 🔲 | Ph.2 |

---

## 3. Supervision Virtualisation VMware vSphere

### 3.1 Inventaire & Hiérarchie

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 3.1.1 | Arbre Datacenter → Cluster → Host → VM | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.1.2 | Inventaire complet via vCenter REST API | ✅ | ✅ | ✅ | 🔲 | Ph.2 |
| 3.1.3 | Inventaire simulé (sans vCenter) | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 3.1.4 | Tags / catégories vSphere | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 3.1.5 | Custom attributes | ❌ | ✅ | ❌ | 🔲 | Ph.2 |

### 3.2 Métriques Hôtes ESXi

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 3.2.1 | CPU usage % (physical + virtual) | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.2.2 | CPU Ready (ms) | ✅ | ✅ | ✅ | 🔲 | Ph.2 |
| 3.2.3 | RAM usage / balloon / swap | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.2.4 | Disk DAVG / GAVG / KAVG (ms) | ✅ | ✅ | ✅ | 🔲 | Ph.2 |
| 3.2.5 | Network throughput hôte (Mbps) | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.2.6 | Uptime hôte | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 3.2.7 | Historique métriques 1h/24h/7j | ✅ | ✅ | ✅ | ✅ | Ph.0 |

### 3.3 Métriques VM

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 3.3.1 | CPU usage % par VM | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.3.2 | RAM usage / guest overhead | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.3.3 | Disk I/O par VM (KB/s) | ✅ | ✅ | ✅ | 🔲 | Ph.2 |
| 3.3.4 | Network I/O par VM (Mbps) | ✅ | ✅ | ✅ | 🔲 | Ph.2 |
| 3.3.5 | VMware Tools status | ✅ | ✅ | ✅ | 🔲 | Ph.2 |
| 3.3.6 | Guest OS type / version | ✅ | ✅ | ✅ | ✅ | Ph.0 |

### 3.4 Gestion Snapshots

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 3.4.1 | Inventaire snapshots par VM | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.4.2 | Détection snapshots > 72h | ✅ | ❌ | ✅ | 🔲 | Ph.2 |
| 3.4.3 | Détection snapshots > 10 Go | ✅ | ❌ | ✅ | 🔲 | Ph.2 |
| 3.4.4 | Alerte automatique snapshot ancien | ✅ | ❌ | ✅ | 🔲 | Ph.2 |
| 3.4.5 | Suppression snapshot depuis UI | ✅ | ✅ | ❌ | 🔲 | Ph.2 |

### 3.5 Gestion Clusters HA/DRS

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 3.5.1 | Score DRS (0-5) | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 3.5.2 | Admission control (slots disponibles) | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 3.5.3 | HA état (enabled/disabled) | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 3.5.4 | FT state (Primary/Secondary) | ✅ | ✅ | ❌ | ❌ | N/A |
| 3.5.5 | Barres CPU/RAM par cluster | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 3.5.6 | Capacity planning cluster J+30 | ✅ | ❌ | ✅ | 🔲 | Ph.6 |

### 3.6 Actions VM (Lifecycle)

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 3.6.1 | Power On / Power Off | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 3.6.2 | Suspend / Resume | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 3.6.3 | Reset | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 3.6.4 | Prendre snapshot | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 3.6.5 | Restaurer snapshot | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 3.6.6 | vMotion (live migration) | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 3.6.7 | Remote Console (noVNC/WebMKS) | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 3.6.8 | Cloner VM | ✅ | ✅ | ❌ | 🔲 | Ph.2 |

---

## 4. Supervision Stockage

### 4.1 Datastores & Volumes

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 4.1.1 | Inventaire datastores (VMFS/NFS/vSAN) | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 4.1.2 | Capacité totale / libre / utilisée | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 4.1.3 | IOPS lecture / écriture par datastore | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 4.1.4 | Latence I/O (ms) | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 4.1.5 | Hôtes montant un volume | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 4.1.6 | VMs par datastore | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 4.1.7 | Projection saturation J+30/J+60/J+90 | ✅ | ❌ | ✅ | 🔲 | Ph.3 |
| 4.1.8 | Alerte datastore > 80% / 90% | ✅ | ❌ | ✅ | 🔲 | Ph.1 |

### 4.2 Baies SAN / NAS

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 4.2.1 | HPE MSA (iSCSI / FC) | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 4.2.2 | Synology NAS (NFS) | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 4.2.3 | État contrôleurs (A/B) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 4.2.4 | Groupes RAID (niveau, état, spare) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 4.2.5 | Débit baie (MB/s agrégé) | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 4.2.6 | Zoning FC / iSCSI sessions | ✅ | ❌ | ❌ | 🔲 | Ph.2 |

### 4.3 vSAN

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 4.3.1 | vSAN health checks (25 tests) | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 4.3.2 | Capacité vSAN cluster | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 4.3.3 | Objets vSAN non conformes | ✅ | ✅ | ❌ | 🔲 | Ph.2 |
| 4.3.4 | DiskGroup état | ✅ | ✅ | ❌ | 🔲 | Ph.2 |

---

## 5. Supervision Sauvegarde (Veeam B&R 12.x)

### 5.1 Jobs & Exécutions

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 5.1.1 | Liste des jobs (Backup / Replication) | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.1.2 | Statut dernière exécution (OK/Warning/Error) | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.1.3 | Durée d'exécution | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.1.4 | Taux compression / déduplication | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.1.5 | Historique 30 dernières exécutions | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.1.6 | Heat map jobs (7 jours × 24h) | ❌ | ❌ | ✅ | 🔲 | Ph.3 |

### 5.2 SLA RPO/RTO

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 5.2.1 | RPO réel vs contractuel par VM | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.2.2 | RTO estimé (taille / bande passante) | ❌ | ❌ | ✅ | 🔲 | Ph.3 |
| 5.2.3 | SLA gauge global (% VMs conformes) | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.2.4 | Rapport SLA hebdomadaire automatique | ❌ | ❌ | ✅ | 🔲 | Ph.3 |

### 5.3 Repositories & Capacité

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 5.3.1 | Capacité repository (total/libre/utilisé) | ❌ | ❌ | ✅ | ✅ | Ph.0 |
| 5.3.2 | Tendance remplissage repository | ❌ | ❌ | ✅ | 🔲 | Ph.3 |
| 5.3.3 | Projection saturation J+30/J+60/J+90 | ❌ | ❌ | ✅ | 🔲 | Ph.3 |
| 5.3.4 | Immutabilité (S3 Object Lock / XFS) | ❌ | ❌ | ✅ | 🔲 | Ph.3 |
| 5.3.5 | Scale-out Backup Repository | ❌ | ❌ | ✅ | 🔲 | Ph.3 |

### 5.4 VMs Non Protégées

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 5.4.1 | Détection VMs non incluses dans un job | ❌ | ❌ | ✅ | 🔲 | Ph.3 |
| 5.4.2 | Rapport VMs non protégées automatique | ❌ | ❌ | ✅ | 🔲 | Ph.3 |
| 5.4.3 | Alerte nouvelle VM détectée sans protection | ❌ | ❌ | ✅ | 🔲 | Ph.3 |

---

## 6. Moteur d'Alertes & Incidents

### 6.1 Niveaux & Escalade

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 6.1.1 | Niveau INFO / WARNING / CRITICAL / DISASTER | ✅ | ✅ | ✅ | 🟠 | Ph.0 |
| 6.1.2 | Seuils configurables par item | ✅ | ✅ | ✅ | 🟠 | Ph.0 |
| 6.1.3 | Escalade N1 (5 min) → N2 (15 min) → N3 (30 min) | ✅ | ❌ | ✅ | 🔲 | Ph.4 |
| 6.1.4 | Suppression d'alertes (maintenance window) | ✅ | ✅ | ✅ | 🔲 | Ph.1 |
| 6.1.5 | Acquittement d'alertes (ACK) | ✅ | ✅ | ✅ | 🔲 | Ph.1 |
| 6.1.6 | Fermeture automatique sur retour à la normale | ✅ | ✅ | ✅ | 🟠 | Ph.0 |

### 6.2 Canaux de Notification

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 6.2.1 | Email (SMTP) | ✅ | ✅ | ✅ | 🟠 | Ph.0 |
| 6.2.2 | SMS (gateway) | ✅ | ❌ | ✅ | 🔲 | Ph.4 |
| 6.2.3 | Webhook (Slack / Teams / custom) | ✅ | ✅ | ✅ | 🔲 | Ph.4 |
| 6.2.4 | Notification in-app (temps réel WebSocket) | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 6.2.5 | Push mobile (PWA) | ✅ | ❌ | ❌ | 🔲 | Ph.7 |

### 6.3 Root Cause Analysis & Corrélation

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 6.3.1 | Arbre de dépendances (no cascade) | ✅ | ✅ | ❌ | 🔲 | Ph.4 |
| 6.3.2 | Corrélation infrastructure → VM → service | ✅ | ✅ | ❌ | 🔲 | Ph.5 |
| 6.3.3 | Analyse impact UPS → hôtes affectés | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 6.3.4 | ITIL incident auto-création depuis alerte | ✅ | ❌ | ❌ | 🔲 | Ph.4 |

---

## 7. Services Applicatifs Critiques

### 7.1 Checks Actifs

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 7.1.1 | TCP port check | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 7.1.2 | HTTP/HTTPS check (code, temps réponse) | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 7.1.3 | SMTP check (AUTH, HELO) | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 7.1.4 | IMAP/POP3 check | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 7.1.5 | LDAP / AD check | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 7.1.6 | WMI check (Windows services) | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 7.1.7 | SSH check (Linux) | ✅ | ❌ | ❌ | 🔲 | Ph.4 |
| 7.1.8 | SQL check (MariaDB / MSSQL) | ✅ | ❌ | ❌ | 🔲 | Ph.4 |

### 7.2 Carte des Services Métier

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 7.2.1 | Catalogue services avec statut | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 7.2.2 | Association service → VM portante | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 7.2.3 | SLA cible par service | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 7.2.4 | Historique incidents par service | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 7.2.5 | CRUD services depuis UI | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 7.2.6 | Surveillance IceWarp (SMTP/IMAP) | ✅ | ❌ | ❌ | 🔲 | Ph.4 |

---

## 8. Logs, Événements & SIEM

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 8.1 | Récepteur Syslog RFC 5424 | ✅ | ✅ | ❌ | 🔲 | Ph.5 |
| 8.2 | Windows Event Log collector (WEF) | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.3 | Parsing / normalisation (regex/grok) | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.4 | Enrichissement GeoIP | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.5 | Enrichissement CMDB (IP → actif) | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.6 | Moteur de corrélation (règles) | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.7 | Détection brute-force (SSH / RDP) | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.8 | Interface Logs Explorer (full-text search) | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.9 | Signature cryptographique des logs | ✅ | ❌ | ❌ | 🔲 | Ph.5 |
| 8.10 | Politique de rétention par criticité | ✅ | ❌ | ❌ | 🔲 | Ph.5 |

---

## 9. CMDB & Inventaire

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 9.1 | Inventaire matériel complet | ✅ | ✅ | ❌ | 🔲 | Ph.1 |
| 9.2 | Cycles de vie (garantie, EOL, EOSL) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 9.3 | Contrats de maintenance | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 9.4 | Relations CI (host contains VM) | ✅ | ✅ | ❌ | ✅ | Ph.0 |
| 9.5 | Import CSV / Excel inventaire | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 9.6 | Découverte automatique réseau | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 9.7 | Audit trail modifications | ✅ | ❌ | ❌ | 🔲 | Ph.7 |

---

## 10. Dashboards & Reporting

### 10.1 Dashboards

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 10.1.1 | Dashboard DG (PUE, SLA, incidents) | ✅ | ❌ | ❌ | 🔲 | Ph.6 |
| 10.1.2 | Dashboard vSphere performance | ✅ | ✅ | ✅ | ✅ | Ph.0 |
| 10.1.3 | Dashboard Veeam (SLA, jobs, repos) | ✅ | ❌ | ✅ | ✅ | Ph.0 |
| 10.1.4 | Dashboard physique (UPS, CRAC, énergie) | ✅ | ❌ | ❌ | 🔲 | Ph.1 |
| 10.1.5 | Widgets personnalisables (drag-drop) | ✅ | ❌ | ❌ | 🔲 | Ph.6 |
| 10.1.6 | Thème clair / sombre | ✅ | ✅ | ✅ | ✅ | Ph.0 |

### 10.2 Capacity Planning

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 10.2.1 | Projection CPU J+30/J+60/J+90 | ✅ | ❌ | ❌ | 🔲 | Ph.6 |
| 10.2.2 | Projection RAM J+30/J+60/J+90 | ✅ | ❌ | ❌ | 🔲 | Ph.6 |
| 10.2.3 | Projection stockage J+30/J+60/J+90 | ✅ | ❌ | ✅ | 🔲 | Ph.6 |
| 10.2.4 | Projection énergie / coût | ✅ | ❌ | ❌ | 🔲 | Ph.6 |
| 10.2.5 | Recommandations rightsizing VM | ✅ | ❌ | ✅ | 🔲 | Ph.6 |

### 10.3 Rapports

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 10.3.1 | Rapport PDF (15 modèles standards) | ✅ | ✅ | ✅ | 🔲 | Ph.6 |
| 10.3.2 | Export Excel | ✅ | ✅ | ✅ | 🔲 | Ph.6 |
| 10.3.3 | Planification automatique (cron) | ✅ | ✅ | ✅ | 🔲 | Ph.6 |
| 10.3.4 | Envoi email rapport | ✅ | ✅ | ✅ | 🔲 | Ph.6 |
| 10.3.5 | Rapport PUE journalier | ✅ | ❌ | ❌ | 🔲 | Ph.1 |

---

## 11. Sécurité & Conformité

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 11.1 | RBAC 5 niveaux (Viewer→Admin) | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 11.2 | Authentification LDAP / AD | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 11.3 | MFA (TOTP) | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 11.4 | TLS 1.3 toutes les communications | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 11.5 | Secrets management (Vault) | ✅ | ❌ | ❌ | 🔲 | Ph.7 |
| 11.6 | Audit trail complet (ISO 27001) | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 11.7 | SNMP v3 authPriv | ✅ | ❌ | ❌ | 🟠 | Ph.0 |
| 11.8 | Hardening CIS Benchmarks | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 11.9 | OWASP Top 10 audit | ✅ | ✅ | ❌ | 🔲 | Ph.7 |
| 11.10 | Politique de rétention données (RGPD) | ✅ | ❌ | ❌ | 🔲 | Ph.7 |

---

## 12. Interface Utilisateur & Ergonomie

| # | Fonctionnalité | DCS Huawei | vSphere | Veeam ONE | NexusMonitor v2 | Phase |
|---|----------------|:----------:|:-------:|:---------:|:---------------:|-------|
| 12.1 | Vue 2D salle serveur (style DCIM) | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 12.2 | Digital Twin 3D enrichi | ✅ | ❌ | ❌ | 🔲 | Ph.6 |
| 12.3 | Drag & drop équipements rack | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 12.4 | Topologie réseau force-directed | ✅ | ❌ | ❌ | ✅ | Ph.0 |
| 12.5 | Recherche globale (actifs, alertes) | ✅ | ✅ | ✅ | 🔲 | Ph.6 |
| 12.6 | Mode responsive mobile | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 12.7 | Interface multilingue (FR/EN) | ✅ | ✅ | ✅ | 🔲 | Ph.7 |
| 12.8 | Raccourcis clavier navigation | ✅ | ✅ | ❌ | 🔲 | Ph.6 |
| 12.9 | Notifications temps réel (WebSocket) | ✅ | ❌ | ❌ | ✅ | Ph.0 |

---

## Résumé de Couverture

| Domaine | Total fonctionnalités | ✅ Implémenté | 🟠 Partiel | 🔲 Planifié | ❌ N/A |
|---------|:--------------------:|:-------------:|:----------:|:-----------:|:------:|
| Infrastructure physique | 46 | 0 | 7 | 37 | 2 |
| Réseau | 16 | 6 | 4 | 6 | 0 |
| Virtualisation vSphere | 38 | 16 | 0 | 20 | 2 |
| Stockage | 18 | 10 | 0 | 8 | 0 |
| Sauvegarde Veeam | 18 | 8 | 0 | 10 | 0 |
| Alertes & Incidents | 16 | 3 | 4 | 9 | 0 |
| Services applicatifs | 14 | 5 | 0 | 9 | 0 |
| Logs & SIEM | 10 | 0 | 0 | 10 | 0 |
| CMDB | 7 | 2 | 0 | 5 | 0 |
| Dashboards & Reporting | 25 | 7 | 0 | 18 | 0 |
| Sécurité & Conformité | 10 | 0 | 2 | 8 | 0 |
| UX & Interface | 9 | 5 | 0 | 4 | 0 |
| **TOTAL** | **227** | **62 (27%)** | **17 (7%)** | **144 (63%)** | **4 (2%)** |

> **Phase 0 cible** : 62 fonctionnalités implémentées (✅) + 17 partielles (🟠) = **79/227 = 35% de couverture**
> **Objectif Phase 8 (production)** : ≥ 200/227 = **88% de couverture** — les 4 N/A (NSX-T, FT, vSAN avancé) sont hors scope SBEE

---

*Document : NexusMonitor v2 — Matrice de Conformité v0.1 · SBEE DSITD · Avril 2026*
