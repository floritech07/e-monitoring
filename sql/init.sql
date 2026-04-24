-- NexusMonitor v2 — Schema PostgreSQL initial
-- SBEE DSITD · Avril 2026
-- Exécuté automatiquement par docker-entrypoint-initdb.d

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────────────────────────────────────────
-- CMDB — Configuration Management Database
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cmdb_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50) NOT NULL,         -- server, switch, ups, vm, cluster, site, crac, pdu
    subtype     VARCHAR(100),                  -- esxi_host, vcenter, hyperv_host, linux_vm, ...
    status      VARCHAR(20) DEFAULT 'active', -- active, maintenance, decommissioned
    ip_address  INET,
    mac_address MACADDR,
    hostname    VARCHAR(255),
    location    VARCHAR(255),                  -- ex: "Rack A, U12"
    rack_id     VARCHAR(50),
    rack_unit   INTEGER,
    rack_height INTEGER DEFAULT 1,
    -- Hardware
    manufacturer VARCHAR(100),
    model        VARCHAR(200),
    serial_number VARCHAR(100),
    firmware_ver  VARCHAR(100),
    -- Lifecycle
    purchase_date  DATE,
    warranty_end   DATE,
    eol_date       DATE,
    eosl_date      DATE,
    -- Relations
    parent_id    UUID REFERENCES cmdb_items(id) ON DELETE SET NULL,
    cluster_id   VARCHAR(50),
    -- Métadonnées
    tags         JSONB DEFAULT '[]',
    custom_attrs JSONB DEFAULT '{}',
    -- Contrat
    contract_ref  VARCHAR(100),
    supplier      VARCHAR(100),
    support_level VARCHAR(50),   -- bronze, silver, gold, platinum
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cmdb_type ON cmdb_items(type);
CREATE INDEX idx_cmdb_status ON cmdb_items(status);
CREATE INDEX idx_cmdb_parent ON cmdb_items(parent_id);
CREATE INDEX idx_cmdb_name_trgm ON cmdb_items USING GIN (name gin_trgm_ops);
CREATE INDEX idx_cmdb_ip ON cmdb_items(ip_address);

-- ─────────────────────────────────────────────────────────────────────────────
-- ITIL Incidents
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itil_incidents (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_ref   VARCHAR(20) UNIQUE NOT NULL,  -- INC-20260001
    title        TEXT NOT NULL,
    description  TEXT,
    severity     VARCHAR(20) NOT NULL,          -- INFO, WARNING, CRITICAL, DISASTER
    status       VARCHAR(20) DEFAULT 'open',    -- open, in_progress, resolved, closed
    category     VARCHAR(50),                   -- hardware, software, network, storage, backup, environmental
    -- Impact
    affected_cis  JSONB DEFAULT '[]',           -- tableau d'IDs CMDB
    affected_vms  JSONB DEFAULT '[]',
    -- Assignation
    assigned_to   VARCHAR(100),
    team          VARCHAR(100) DEFAULT 'DSITD',
    -- Alertes liées
    alert_ids     JSONB DEFAULT '[]',
    alert_source  VARCHAR(50),                  -- snmp, redfish, vcenter, veeam, manual
    -- Escalade
    n1_notified_at  TIMESTAMPTZ,
    n2_notified_at  TIMESTAMPTZ,
    n3_notified_at  TIMESTAMPTZ,
    escalation_level INTEGER DEFAULT 0,
    -- Résolution
    root_cause    TEXT,
    resolution    TEXT,
    workaround    TEXT,
    resolved_at   TIMESTAMPTZ,
    closed_at     TIMESTAMPTZ,
    -- SLA
    sla_response_target  INTERVAL,             -- selon criticité : CRITICAL=1h, DISASTER=15min
    sla_resolution_target INTERVAL,
    sla_response_met     BOOLEAN,
    sla_resolution_met   BOOLEAN,
    -- Timestamps
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS incident_seq START 1;
CREATE INDEX idx_incidents_status ON itil_incidents(status);
CREATE INDEX idx_incidents_severity ON itil_incidents(severity);
CREATE INDEX idx_incidents_created ON itil_incidents(created_at DESC);

-- Auto-génération ticket_ref
CREATE OR REPLACE FUNCTION generate_ticket_ref() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_ref IS NULL OR NEW.ticket_ref = '' THEN
        NEW.ticket_ref := 'INC-' || TO_CHAR(NOW(), 'YYYY') || LPAD(nextval('incident_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_incident_ref
    BEFORE INSERT ON itil_incidents
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_ref();

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit Trail — ISO 27001 compliant
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    timestamp   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id     VARCHAR(100),
    username    VARCHAR(100),
    ip_address  INET,
    action      VARCHAR(50) NOT NULL,   -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, ACTION
    resource    VARCHAR(100) NOT NULL,  -- cmdb_item, incident, vm, alert, user
    resource_id VARCHAR(100),
    details     JSONB DEFAULT '{}',
    result      VARCHAR(20) DEFAULT 'success',  -- success, denied, error
    session_id  VARCHAR(100)
) PARTITION BY RANGE (timestamp);

-- Partitions par mois (à étendre au besoin)
CREATE TABLE IF NOT EXISTS audit_log_2026_04 PARTITION OF audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_05 PARTITION OF audit_log
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_06 PARTITION OF audit_log
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_07 PARTITION OF audit_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_08 PARTITION OF audit_log
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_09 PARTITION OF audit_log
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_10 PARTITION OF audit_log
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_11 PARTITION OF audit_log
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_12 PARTITION OF audit_log
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_resource ON audit_log(resource, resource_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Alert Rules — Règles d'alerte configurables
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_rules (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(255) NOT NULL,
    enabled      BOOLEAN DEFAULT TRUE,
    severity     VARCHAR(20) NOT NULL,   -- INFO, WARNING, CRITICAL, DISASTER
    source       VARCHAR(50) NOT NULL,   -- snmp, redfish, esxi, veeam, ping, port
    metric       VARCHAR(200) NOT NULL,  -- ex: ups.battery.remaining_pct
    condition    VARCHAR(20) NOT NULL,   -- gt, lt, gte, lte, eq, neq, contains
    threshold    NUMERIC,
    threshold_str VARCHAR(255),
    duration_s   INTEGER DEFAULT 0,     -- doit être vrai pendant N secondes
    ci_filter    JSONB DEFAULT '{}',    -- filtre sur type/id CMDB
    notify_channels JSONB DEFAULT '["email"]',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Données initiales CMDB — Inventaire SBEE connu
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO cmdb_items (name, type, subtype, status, ip_address, location, manufacturer, model, rack_id, rack_unit, rack_height)
VALUES
    ('SBEE-PROD-DATACENTER', 'site', 'datacenter', 'active', NULL, 'Cotonou, Bénin', 'SBEE', 'Salle Serveur Principale', NULL, NULL, NULL),
    ('ESXi-01-SBEE', 'server', 'esxi_host', 'active', '192.168.10.11', 'Rack A, U1-2', 'HPE', 'ProLiant DL380 Gen10', 'rack-a', 1, 2),
    ('ESXi-02-SBEE', 'server', 'esxi_host', 'active', '192.168.10.12', 'Rack A, U3-4', 'HPE', 'ProLiant DL380 Gen10', 'rack-a', 3, 2),
    ('ESXi-03-SBEE', 'server', 'esxi_host', 'active', '192.168.10.13', 'Rack B, U1-2', 'HPE', 'ProLiant DL360 Gen10', 'rack-b', 1, 2),
    ('SW-CORE-01', 'switch', 'core_switch', 'active', '192.168.10.1', 'Rack A, U10', 'HPE', 'Aruba 2930F 48G', 'rack-a', 10, 1),
    ('SW-ACCESS-01', 'switch', 'access_switch', 'active', '192.168.10.2', 'Rack A, U11', 'HPE', 'Aruba 2530-24G', 'rack-a', 11, 1),
    ('UPS-SUKAM-01', 'ups', 'online_ups', 'active', '192.168.10.50', 'Rack A, U14', 'Su-Kam', 'Falcon+ 10KVA', 'rack-a', 14, 2),
    ('UPS-SUKAM-02', 'ups', 'online_ups', 'active', '192.168.10.51', 'Rack B, U14', 'Su-Kam', 'Falcon+ 6KVA', 'rack-b', 14, 2),
    ('NAS-SYNOLOGY-01', 'storage', 'nas', 'active', '192.168.10.60', 'Rack B, U5', 'Synology', 'RS3621xs+', 'rack-b', 5, 2),
    ('SAN-HPE-MSA-01', 'storage', 'san', 'active', '192.168.10.61', 'Rack B, U7', 'HPE', 'MSA 2060 SAS', 'rack-b', 7, 2),
    ('VCENTER-SBEE', 'server', 'vcenter', 'active', '192.168.10.20', 'Virtual (ESXi-01)', 'VMware', 'vCenter Server 8.0', NULL, NULL, NULL),
    ('MAIL-ICEWARP-01', 'server', 'mail_server', 'active', '192.168.10.30', 'Virtual (ESXi-02)', 'IceWarp', 'IceWarp Mail Server 13.x', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Règles d'alerte initiales
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO alert_rules (name, enabled, severity, source, metric, condition, threshold, duration_s)
VALUES
    -- UPS
    ('UPS Batterie critique', TRUE, 'CRITICAL', 'snmp', 'ups.battery.remaining_pct', 'lt', 20, 60),
    ('UPS Batterie faible', TRUE, 'WARNING', 'snmp', 'ups.battery.remaining_pct', 'lt', 40, 120),
    ('UPS Sur batterie', TRUE, 'CRITICAL', 'snmp', 'ups.input.status', 'eq', 0, 10),
    ('UPS Charge élevée', TRUE, 'WARNING', 'snmp', 'ups.output.load_pct', 'gt', 80, 120),
    ('UPS Température batterie', TRUE, 'WARNING', 'snmp', 'ups.battery.temperature', 'gt', 35, 60),
    -- Switches
    ('Switch interface DOWN', TRUE, 'CRITICAL', 'snmp', 'if.oper_status', 'eq', 2, 30),
    ('Switch CPU élevé', TRUE, 'WARNING', 'snmp', 'sys.cpu_pct', 'gt', 80, 300),
    ('Switch Trafic saturé (>90%)', TRUE, 'WARNING', 'snmp', 'if.utilization_pct', 'gt', 90, 60),
    -- Serveurs (Redfish)
    ('Serveur température CPU critique', TRUE, 'DISASTER', 'redfish', 'thermal.cpu_temp', 'gt', 85, 30),
    ('Serveur température CPU élevée', TRUE, 'WARNING', 'redfish', 'thermal.cpu_temp', 'gt', 75, 60),
    ('Serveur ventilateur arrêté', TRUE, 'CRITICAL', 'redfish', 'thermal.fan_rpm', 'lt', 500, 30),
    ('Serveur alimentation défaillante', TRUE, 'DISASTER', 'redfish', 'power.psu_status', 'eq', 0, 10),
    -- ESXi
    ('ESXi CPU saturé', TRUE, 'WARNING', 'esxi', 'host.cpu_pct', 'gt', 85, 300),
    ('ESXi RAM saturée', TRUE, 'CRITICAL', 'esxi', 'host.ram_pct', 'gt', 90, 300),
    -- Veeam
    ('Backup job échoué', TRUE, 'CRITICAL', 'veeam', 'job.last_result', 'eq', 0, 0),
    ('SLA RPO dépassé', TRUE, 'WARNING', 'veeam', 'sla.rpo_compliant_pct', 'lt', 95, 0)
ON CONFLICT DO NOTHING;
