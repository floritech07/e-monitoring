#!/usr/bin/env python3
"""
NexusMonitor Prompt Execution Auditor
======================================
Ce script vérifie qu'un prompt JSON a bien été exécuté à la lettre par Claude Code.
Il analyse le répertoire de sortie et produit un rapport d'audit détaillé.
"""

import argparse
import ast
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Any

# ── ANSI colours ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):    return f"{GREEN}✓{RESET}  {msg}"
def fail(msg):  return f"{RED}✗{RESET}  {msg}"
def warn(msg):  return f"{YELLOW}⚠{RESET}  {msg}"
def info(msg):  return f"{BLUE}ℹ{RESET}  {msg}"
def hdr(msg):   return f"\n{BOLD}{BLUE}{'─'*60}{RESET}\n{BOLD}{msg}{RESET}\n{'─'*60}"


# ── Data structures ──────────────────────────────────────────────────────────
@dataclass
class CheckResult:
    label: str
    passed: bool
    detail: str = ""
    severity: str = "error"   # error | warning | info

@dataclass
class ModuleAudit:
    module_id: str
    module_name: str
    total_files_expected: int
    files_present: int
    files_missing: list[str] = field(default_factory=list)
    checks: list[CheckResult] = field(default_factory=list)

    @property
    def score(self) -> float:
        if self.total_files_expected == 0:
            return 1.0
        return self.files_present / self.total_files_expected

    @property
    def passed(self) -> bool:
        return len(self.files_missing) == 0 and all(
            c.passed for c in self.checks if c.severity == "error"
        )

@dataclass
class AuditReport:
    timestamp: str
    root_dir: str
    total_modules: int
    modules_passed: int
    modules_failed: int
    total_files_expected: int
    total_files_found: int
    global_checks: list[CheckResult] = field(default_factory=list)
    module_audits: list[ModuleAudit] = field(default_factory=list)
    quality_gate_results: list[CheckResult] = field(default_factory=list)

    @property
    def completion_pct(self) -> float:
        if self.total_files_expected == 0:
            return 0.0
        return (self.total_files_found / self.total_files_expected) * 100

MODULES: list[dict[str, Any]] = [
    {
        "id": "MOD-001", "name": "Database layer & multi-SGBD abstraction",
        "files": [
            "packages/db/__init__.py", "packages/db/engine.py",
            "packages/db/models/__init__.py", "packages/db/models/organization.py",
            "packages/db/models/site.py", "packages/db/models/asset.py",
            "packages/db/models/metric.py", "packages/db/models/alert.py",
            "packages/db/models/dashboard.py", "packages/db/models/user.py",
            "packages/db/models/integration.py", "packages/db/models/veeam.py",
            "packages/db/models/action.py", "packages/db/models/audit.py",
            "packages/db/session.py", "packages/db/dialect_manager.py",
            "packages/db/migrations/env.py",
            "packages/db/migrations/versions/0001_initial_schema.py",
            "packages/db/seeds/dev_fixtures.py",
            "packages/db/tests/conftest.py", "packages/db/tests/test_models.py",
            "packages/db/tests/test_dialect_manager.py",
        ],
    },
    {
        "id": "MOD-002", "name": "Authentication & RBAC system",
        "files": [
            "apps/api/auth/router.py", "apps/api/auth/service.py",
            "apps/api/auth/jwt.py", "apps/api/auth/saml.py",
            "apps/api/auth/ldap.py", "apps/api/auth/mfa.py",
            "apps/api/auth/api_keys.py", "apps/api/auth/dependencies.py",
            "apps/api/auth/schemas.py", "apps/api/auth/tests/test_auth.py",
            "apps/api/auth/tests/test_rbac.py", "apps/api/auth/tests/test_mfa.py",
        ],
    },
    {
        "id": "MOD-003", "name": "Metric ingestion pipeline",
        "files": [
            "apps/collector/main.py", "apps/collector/ingest_router.py",
            "apps/collector/kafka_producer.py", "apps/collector/otlp_parser.py",
            "apps/collector/prom_remote_write_parser.py",
            "apps/worker/tasks/metric_processor.py",
            "apps/worker/tasks/retention.py",
            "apps/api/metrics/router.py", "apps/api/metrics/service.py",
            "apps/api/metrics/query_builder.py", "apps/api/metrics/schemas.py",
            "apps/collector/tests/test_ingest.py",
            "apps/worker/tests/test_metric_processor.py",
            "apps/api/metrics/tests/test_query.py",
        ],
    },
    {
        "id": "MOD-004", "name": "Veeam Backup & Replication integration",
        "files": [
            "packages/integrations/veeam/__init__.py",
            "packages/integrations/veeam/client.py",
            "packages/integrations/veeam/auth.py",
            "packages/integrations/veeam/discovery.py",
            "packages/integrations/veeam/mappers.py",
            "packages/integrations/veeam/poller.py",
            "packages/integrations/veeam/metrics_emitter.py",
            "apps/api/integrations/veeam/router.py",
            "apps/api/integrations/veeam/schemas.py",
            "packages/integrations/veeam/tests/test_client.py",
            "packages/integrations/veeam/tests/test_poller.py",
            "packages/integrations/veeam/tests/test_mappers.py",
        ],
    },
    {
        "id": "MOD-005", "name": "VMware vCenter / vSphere integration",
        "files": [
            "packages/integrations/vcenter/__init__.py",
            "packages/integrations/vcenter/client.py",
            "packages/integrations/vcenter/rest_client.py",
            "packages/integrations/vcenter/inventory.py",
            "packages/integrations/vcenter/performance.py",
            "packages/integrations/vcenter/events.py",
            "packages/integrations/vcenter/actions.py",
            "packages/integrations/vcenter/mappers.py",
            "packages/integrations/vcenter/poller.py",
            "apps/api/integrations/vcenter/router.py",
            "apps/api/integrations/vcenter/schemas.py",
            "packages/integrations/vcenter/tests/test_inventory.py",
            "packages/integrations/vcenter/tests/test_performance.py",
            "packages/integrations/vcenter/tests/test_actions.py",
        ],
    },
    {
        "id": "MOD-006", "name": "SNMP & network monitoring",
        "files": [
            "packages/integrations/snmp/__init__.py",
            "packages/integrations/snmp/collector.py",
            "packages/integrations/snmp/trap_receiver.py",
            "packages/integrations/snmp/mib_browser.py",
            "apps/collector/netflow/collector.py",
            "apps/collector/netflow/parser.py",
            "apps/collector/probes/icmp.py",
            "apps/collector/probes/tcp.py",
            "apps/collector/probes/bandwidth.py",
            "packages/integrations/network/topology_discovery.py",
            "apps/api/network/router.py", "apps/api/network/schemas.py",
            "packages/integrations/snmp/tests/test_collector.py",
            "packages/integrations/snmp/tests/test_trap_receiver.py",
            "apps/api/network/tests/test_topology.py",
        ],
    },
    {
        "id": "MOD-007", "name": "Alert engine & notification dispatcher",
        "files": [
            "packages/alerting/__init__.py",
            "packages/alerting/rule_engine.py",
            "packages/alerting/expression_evaluator.py",
            "packages/alerting/state_machine.py",
            "packages/alerting/deduplication.py",
            "packages/alerting/correlation.py",
            "packages/alerting/silence.py",
            "packages/alerting/escalation.py",
            "packages/alerting/dispatcher.py",
            "packages/alerting/channels/email.py",
            "packages/alerting/channels/slack.py",
            "packages/alerting/channels/teams.py",
            "packages/alerting/channels/pagerduty.py",
            "packages/alerting/channels/webhook.py",
            "packages/alerting/channels/sms.py",
            "packages/alerting/channels/push.py",
            "packages/alerting/templates/email_alert.html",
            "apps/api/alerts/router.py",
            "apps/api/alerts/websocket.py",
            "apps/api/alerts/schemas.py",
            "packages/alerting/tests/test_rule_engine.py",
            "packages/alerting/tests/test_state_machine.py",
            "packages/alerting/tests/test_correlation.py",
            "packages/alerting/tests/test_dispatcher.py",
        ],
    },
    {
        "id": "MOD-008", "name": "Remote actions & automation engine",
        "files": [
            "packages/actions/__init__.py", "packages/actions/executor.py",
            "packages/actions/sandbox.py",
            "packages/actions/implementations/ipmi.py",
            "packages/actions/implementations/vsphere.py",
            "packages/actions/implementations/ssh.py",
            "packages/actions/implementations/wmi.py",
            "packages/actions/implementations/veeam.py",
            "packages/actions/runbook_engine.py",
            "packages/actions/auto_remediation.py",
            "apps/api/actions/router.py", "apps/api/actions/schemas.py",
            "packages/actions/tests/test_executor.py",
            "packages/actions/tests/test_runbook_engine.py",
            "packages/actions/tests/test_auto_remediation.py",
        ],
    },
    {
        "id": "MOD-009", "name": "Legacy monitoring integrations",
        "files": [
            "packages/integrations/zabbix/__init__.py",
            "packages/integrations/zabbix/client.py",
            "packages/integrations/zabbix/connector.py",
            "packages/integrations/zabbix/mappers.py",
            "packages/integrations/nagios/__init__.py",
            "packages/integrations/nagios/connector.py",
            "packages/integrations/nagios/status_parser.py",
            "packages/integrations/icinga/__init__.py",
            "packages/integrations/icinga/connector.py",
            "packages/integrations/prtg/__init__.py",
            "packages/integrations/prtg/client.py",
            "packages/integrations/prtg/connector.py",
            "packages/integrations/solarwinds/__init__.py",
            "packages/integrations/solarwinds/swis_client.py",
            "packages/integrations/solarwinds/connector.py",
            "packages/integrations/base.py",
            "apps/api/integrations/legacy/router.py",
            "packages/integrations/zabbix/tests/test_connector.py",
            "packages/integrations/prtg/tests/test_connector.py",
        ],
    },
    {
        "id": "MOD-010", "name": "Cloud provider integrations (AWS, Azure, GCP)",
        "files": [
            "packages/integrations/aws/__init__.py",
            "packages/integrations/aws/connector.py",
            "packages/integrations/aws/cloudwatch.py",
            "packages/integrations/aws/cost.py",
            "packages/integrations/azure/__init__.py",
            "packages/integrations/azure/connector.py",
            "packages/integrations/azure/monitor.py",
            "packages/integrations/azure/cost.py",
            "packages/integrations/gcp/__init__.py",
            "packages/integrations/gcp/connector.py",
            "packages/integrations/gcp/monitoring.py",
            "packages/integrations/cloud/cost_monitor.py",
            "apps/api/integrations/cloud/router.py",
            "apps/api/integrations/cloud/schemas.py",
        ],
    },
    {
        "id": "MOD-011", "name": "WebSocket real-time layer",
        "files": [
            "apps/api/websocket/hub.py", "apps/api/websocket/router.py",
            "apps/api/websocket/events.py", "apps/api/websocket/auth.py",
            "apps/worker/tasks/event_publisher.py",
            "apps/web/src/hooks/useWebSocket.ts",
            "apps/web/src/hooks/useAlertStream.ts",
            "apps/web/src/hooks/useMetricStream.ts",
            "apps/web/src/lib/websocket/client.ts",
            "apps/web/src/lib/websocket/schemas.ts",
            "apps/api/websocket/tests/test_hub.py",
            "apps/web/src/hooks/__tests__/useWebSocket.test.ts",
        ],
    },
    {
        "id": "MOD-012", "name": "Frontend — core layout & navigation",
        "files": [
            "apps/web/src/main.tsx", "apps/web/src/App.tsx",
            "apps/web/src/router.tsx",
            "apps/web/src/components/layout/AppShell.tsx",
            "apps/web/src/components/layout/Sidebar.tsx",
            "apps/web/src/components/layout/TopBar.tsx",
            "apps/web/src/components/layout/GlobalSearch.tsx",
            "apps/web/src/components/layout/NotificationBell.tsx",
            "apps/web/src/store/appStore.ts",
            "apps/web/src/store/alertStore.ts",
            "apps/web/src/lib/api/client.ts",
            "apps/web/src/lib/api/hooks/useAlerts.ts",
            "apps/web/src/lib/api/hooks/useAssets.ts",
            "apps/web/src/lib/api/hooks/useMetrics.ts",
            "apps/web/src/lib/api/hooks/useIntegrations.ts",
            "apps/web/tailwind.config.ts",
            "apps/web/src/styles/globals.css",
            "apps/web/src/components/layout/__tests__/AppShell.test.tsx",
        ],
    },
    {
        "id": "MOD-013", "name": "Frontend — Problem Console screen",
        "files": [
            "apps/web/src/pages/ProblemConsole.tsx",
            "apps/web/src/pages/ProblemConsole.test.tsx",
            "apps/web/src/components/problems/AlertTable.tsx",
            "apps/web/src/components/problems/AlertDetailDrawer.tsx",
            "apps/web/src/components/problems/SeverityBadge.tsx",
            "apps/web/src/components/problems/SeverityPulse.tsx",
            "apps/web/src/components/problems/FilterToolbar.tsx",
            "apps/web/src/components/problems/BulkActionBar.tsx",
            "apps/web/src/components/problems/SoundAlertController.tsx",
            "apps/web/src/components/problems/AlertSparkline.tsx",
            "apps/web/src/hooks/useSoundAlerts.ts",
            "apps/web/src/components/problems/__tests__/AlertTable.test.tsx",
        ],
    },
    {
        "id": "MOD-014", "name": "Frontend — Network Topology Map",
        "files": [
            "apps/web/src/pages/TopologyMap.tsx",
            "apps/web/src/components/topology/TopologyCanvas.tsx",
            "apps/web/src/components/topology/TopologyRenderer.ts",
            "apps/web/src/components/topology/NodeRenderer.ts",
            "apps/web/src/components/topology/EdgeRenderer.ts",
            "apps/web/src/components/topology/TopologyControls.tsx",
            "apps/web/src/components/topology/AssetMiniCard.tsx",
            "apps/web/src/hooks/useTopology.ts",
            "apps/web/src/lib/topology/forceLayout.ts",
            "apps/web/src/lib/topology/icons.ts",
            "apps/web/src/components/topology/__tests__/TopologyRenderer.test.ts",
        ],
    },
    {
        "id": "MOD-015", "name": "Frontend — Customisable Dashboards",
        "files": [
            "apps/web/src/pages/Dashboard.tsx",
            "apps/web/src/pages/DashboardList.tsx",
            "apps/web/src/components/dashboard/DashboardGrid.tsx",
            "apps/web/src/components/dashboard/WidgetWrapper.tsx",
            "apps/web/src/components/dashboard/WidgetEditor.tsx",
            "apps/web/src/components/dashboard/widgets/StatCard.tsx",
            "apps/web/src/components/dashboard/widgets/LineChartWidget.tsx",
            "apps/web/src/components/dashboard/widgets/GaugeWidget.tsx",
            "apps/web/src/components/dashboard/widgets/HeatmapWidget.tsx",
            "apps/web/src/components/dashboard/widgets/AlertListWidget.tsx",
            "apps/web/src/components/dashboard/widgets/TopNWidget.tsx",
            "apps/web/src/components/dashboard/widgets/BackupSLAWidget.tsx",
            "apps/web/src/components/dashboard/widgets/UptimeTimeline.tsx",
            "apps/web/src/components/dashboard/DashboardToolbar.tsx",
            "apps/web/src/components/dashboard/MetricPicker.tsx",
            "apps/web/src/hooks/useDashboard.ts",
            "apps/web/src/types/dashboard.ts",
        ],
    },
    {
        "id": "MOD-016", "name": "Frontend — Asset Detail page",
        "files": [
            "apps/web/src/pages/AssetDetail.tsx",
            "apps/web/src/components/asset/AssetHeader.tsx",
            "apps/web/src/components/asset/tabs/OverviewTab.tsx",
            "apps/web/src/components/asset/tabs/MetricsTab.tsx",
            "apps/web/src/components/asset/tabs/AlertsTab.tsx",
            "apps/web/src/components/asset/tabs/ActionsTab.tsx",
            "apps/web/src/components/asset/tabs/BackupTab.tsx",
            "apps/web/src/components/asset/tabs/ConfigTab.tsx",
            "apps/web/src/components/asset/MetricExplorer.tsx",
            "apps/web/src/components/asset/ActionConfirmDialog.tsx",
            "apps/web/src/components/asset/KeyMetricGauges.tsx",
            "apps/web/src/hooks/useAssetDetail.ts",
        ],
    },
    {
        "id": "MOD-017", "name": "ML anomaly detection & capacity planning",
        "files": [
            "packages/ml/__init__.py", "packages/ml/anomaly_detector.py",
            "packages/ml/capacity_forecaster.py",
            "packages/ml/baseline_builder.py",
            "packages/ml/model_store.py",
            "packages/ml/training_pipeline.py",
            "packages/ml/feature_engineering.py",
            "apps/api/ml/router.py", "apps/api/ml/schemas.py",
            "apps/worker/tasks/ml_training.py",
            "packages/ml/tests/test_anomaly_detector.py",
            "packages/ml/tests/test_capacity_forecaster.py",
        ],
    },
    {
        "id": "MOD-018", "name": "Report engine",
        "files": [
            "apps/api/reports/router.py", "apps/api/reports/schemas.py",
            "apps/api/reports/service.py",
            "apps/worker/tasks/report_generator.py",
            "apps/worker/tasks/report_types/availability.py",
            "apps/worker/tasks/report_types/backup_compliance.py",
            "apps/worker/tasks/report_types/capacity.py",
            "apps/worker/tasks/report_types/alert_summary.py",
            "apps/worker/templates/reports/base.html",
            "apps/worker/templates/reports/availability.html",
            "apps/worker/templates/reports/backup_compliance.html",
            "apps/web/src/pages/Reports.tsx",
            "apps/web/src/components/reports/ReportBuilder.tsx",
            "apps/api/reports/tests/test_report_generator.py",
        ],
    },
    {
        "id": "MOD-019", "name": "Security hardening & audit",
        "files": [
            "apps/api/security/encryption.py",
            "apps/api/security/middleware.py",
            "apps/api/security/rate_limiting.py",
            "apps/api/security/audit.py",
            "apps/api/security/cors.py",
            "apps/api/security/headers.py",
            "apps/api/security/tests/test_encryption.py",
            "apps/api/security/tests/test_audit.py",
            ".pre-commit-config.yaml",
            ".github/workflows/security-scan.yml",
        ],
    },
    {
        "id": "MOD-020", "name": "Infrastructure — Docker, Kubernetes, CI/CD",
        "files": [
            "apps/api/Dockerfile", "apps/worker/Dockerfile",
            "apps/collector/Dockerfile", "apps/scheduler/Dockerfile",
            "apps/web/Dockerfile",
            "docker-compose.yml", "docker-compose.test.yml", ".env.example",
            "infra/k8s/api/deployment.yaml", "infra/k8s/api/service.yaml",
            "infra/k8s/api/hpa.yaml",
            "infra/k8s/worker/deployment.yaml",
            "infra/k8s/collector/deployment.yaml",
            "infra/k8s/web/deployment.yaml",
            "infra/k8s/web/ingress.yaml",
            "infra/k8s/shared/configmap.yaml",
            "infra/k8s/shared/namespace.yaml",
            "infra/helm/Chart.yaml", "infra/helm/values.yaml",
            "infra/helm/templates/api-deployment.yaml",
            "infra/monitoring/prometheus-servicemonitor.yaml",
            ".github/workflows/ci.yml",
            ".github/workflows/deploy-staging.yml",
            ".github/workflows/deploy-prod.yml",
        ],
    },
]

EXPECTED_ENV_VARS = [
    "DATABASE_URL", "DB_ENGINE", "REDIS_URL", "KAFKA_BROKERS",
    "JWT_PRIVATE_KEY", "JWT_PUBLIC_KEY", "ENCRYPTION_KEY",
    "MINIO_ENDPOINT", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY",
    "ELASTICSEARCH_URL", "SMTP_HOST", "SMTP_PORT", "SMTP_USER",
    "SMTP_PASSWORD", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER", "FCM_SERVER_KEY",
]

CONTENT_CHECKS: list[tuple[str, str, str]] = [
    ("*.py", r"# TODO|# FIXME|# implement later|raise NotImplementedError|pass\s*#\s*stub", "No stub/TODO code in Python files"),
    ("*.ts", r"// TODO|// FIXME|// implement|any\s*;", "No TODO or untyped 'any' in TypeScript"),
    ("*.tsx", r"// TODO|// FIXME|// implement", "No TODO in TSX files"),
    ("*.*", r"password\s*=\s*[\"'][^\"']{4,}[\"']|secret\s*=\s*[\"'][^\"']{4,}[\"']|api_key\s*=\s*[\"'][^\"']{4,}[\"']", "No hardcoded secrets"),
    ("*.py", r"\.\.\.\s*$|# \.\.\.|rest of|truncated", "No truncation markers in Python"),
    ("*.ts", r"\.\.\.\s*$|// \.\.\.|rest of|truncated", "No truncation markers in TypeScript"),
]

PYTHON_MODEL_CHECKS = {
    "packages/db/models/asset.py": ["class Asset", "id", "created_at", "updated_at", "__repr__", "to_dict"],
    "packages/db/dialect_manager.py": ["class DialectManager", "DB_ENGINE", "asyncpg", "cx_oracle", "pyodbc", "aiomysql"],
    "packages/db/migrations/env.py": ["run_async_migrations", "target_metadata"],
    "apps/api/auth/jwt.py": ["RS256", "access_token", "refresh_token"],
    "apps/api/security/encryption.py": ["AES", "GCM", "EncryptedColumn"],
    "packages/alerting/state_machine.py": ["PENDING", "FIRING", "RESOLVED", "SILENCED"],
    "packages/actions/executor.py": ["class ActionExecutor", "execute", "ActionResult"],
}

TYPESCRIPT_CONTENT_CHECKS = {
    "apps/web/src/hooks/useWebSocket.ts": ["exponential", "reconnect", "WebSocket"],
    "apps/web/src/pages/ProblemConsole.tsx": ["useAlertStream", "Web Audio", "virtualScrolling|TanStack|useVirtualizer"],
    "apps/web/src/components/topology/TopologyRenderer.ts": ["pixi|PIXI|d3", "force"],
}

REQUIRED_ROOT_FILES = [
    "docker-compose.yml",
    ".env.example",
    ".github/workflows/ci.yml",
    ".pre-commit-config.yaml",
]

def count_lines(path: Path) -> int:
    try:
        return len(path.read_text(encoding="utf-8", errors="replace").splitlines())
    except Exception:
        return 0

def grep_pattern(path: Path, pattern: str) -> list[int]:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
        hits = []
        for i, line in enumerate(text.splitlines(), 1):
            if re.search(pattern, line, re.IGNORECASE):
                hits.append(i)
        return hits
    except Exception:
        return []

def file_contains_all(path: Path, needles: list[str]) -> tuple[bool, list[str]]:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
        missing = [n for n in needles if not re.search(n, text)]
        return len(missing) == 0, missing
    except Exception:
        return False, needles

def check_python_syntax(path: Path) -> tuple[bool, str]:
    try:
        ast.parse(path.read_text(encoding="utf-8", errors="replace"))
        return True, ""
    except SyntaxError as e:
        return False, f"Line {e.lineno}: {e.msg}"

def run_command(cmd: list[str], cwd: Path) -> tuple[int, str, str]:
    try:
        result = subprocess.run(
            cmd, cwd=str(cwd), capture_output=True, text=True, shell=True
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)

def audit_module(module: dict, root: Path) -> ModuleAudit:
    result = ModuleAudit(
        module_id=module["id"],
        module_name=module["name"],
        total_files_expected=len(module["files"]),
        files_present=0,
    )

    for rel_path in module["files"]:
        full_path = root / rel_path
        if full_path.exists() and full_path.is_file():
            result.files_present += 1

            loc = count_lines(full_path)
            if loc < 10:
                result.checks.append(CheckResult(
                    label=f"{rel_path} — suspiciously short ({loc} lines)",
                    passed=False,
                    detail="File may be a stub. Minimum expected: 10 lines.",
                    severity="warning",
                ))

            if rel_path.endswith(".py"):
                ok_syntax, err = check_python_syntax(full_path)
                result.checks.append(CheckResult(
                    label=f"{rel_path} — valid Python syntax",
                    passed=ok_syntax,
                    detail=err,
                    severity="error",
                ))

                hits = grep_pattern(full_path, r"#\s*(TODO|FIXME|implement later|stub)|raise NotImplementedError")
                if hits:
                    result.checks.append(CheckResult(
                        label=f"{rel_path} — no stubs/TODOs", passed=False,
                        detail=f"Found at lines: {hits[:5]}", severity="error"
                    ))

                secret_hits = grep_pattern(full_path, r"(?i)(password|secret|api_key|apikey)\s*=\s*[\"'][^\"'\s]{4,}[\"']")
                if secret_hits:
                    result.checks.append(CheckResult(
                        label=f"{rel_path} — no hardcoded secrets", passed=False,
                        detail=f"Possible secret at lines: {secret_hits[:3]}", severity="error"
                    ))

        else:
            result.files_missing.append(rel_path)

    return result

def audit_global_checks(root: Path) -> list[CheckResult]:
    checks: list[CheckResult] = []

    for f in REQUIRED_ROOT_FILES:
        p = root / f
        checks.append(CheckResult(label=f"Root file exists: {f}", passed=p.exists(), severity="error"))

    env_example = root / ".env.example"
    if env_example.exists():
        text = env_example.read_text(errors="replace")
        for var in EXPECTED_ENV_VARS:
            checks.append(CheckResult(label=f".env.example contains {var}", passed=var in text, severity="warning"))
    else:
        checks.append(CheckResult(label=".env.example exists", passed=False, detail="File not found", severity="error"))

    readme = root / "README.md"
    checks.append(CheckResult(label="README.md exists", passed=readme.exists(), severity="warning"))
    
    total_loc = sum(count_lines(f) for f in list(root.rglob("*.py")) + list(root.rglob("*.ts")) + list(root.rglob("*.tsx")))
    checks.append(CheckResult(
        label=f"Total codebase LOC ≥ 50 000 (found {total_loc:,})",
        passed=total_loc >= 50_000,
        detail=f"Prompt target: 150 000+ LOC. Current: {total_loc:,}",
        severity="warning",
    ))

    return checks

def audit_quality_gates(root: Path) -> list[CheckResult]:
    return []

def print_report(report: AuditReport) -> None:
    print(hdr("NEXUSMONITOR PROMPT EXECUTION AUDIT"))
    print(f"  Date     : {report.timestamp}")
    print(f"  Root dir : {report.root_dir}")
    print()

    print(hdr("GLOBAL CHECKS"))
    for c in report.global_checks:
        icon = ok if c.passed else (warn if c.severity != "error" else fail)
        print(icon(c.label) + (f"\n     → {c.detail}" if c.detail else ""))

    print(hdr("MODULE AUDIT"))
    for ma in report.module_audits:
        pct = int(ma.score * 100)
        bar_filled = int(pct / 5)
        bar = "█" * bar_filled + "░" * (20 - bar_filled)
        status = GREEN + "PASS" + RESET if ma.passed else RED + "FAIL" + RESET
        print(
            f"\n  {BOLD}{ma.module_id}{RESET} {ma.module_name}\n"
            f"  [{bar}] {pct}% — {ma.files_present}/{ma.total_files_expected} files — {status}"
        )
        for f in ma.files_missing[:5]:
            print(f"     {fail(f'MISSING: {f}')}")
        if len(ma.files_missing) > 5:
            print(f"     … and {len(ma.files_missing) - 5} more missing files")
        errors = [c for c in ma.checks if not c.passed and c.severity == "error"]
        warnings = [c for c in ma.checks if not c.passed and c.severity == "warning"]
        for c in errors[:3]:
            print(f"     {fail(c.label)}" + (f"\n       → {c.detail}" if c.detail else ""))
        for c in warnings[:2]:
            print(f"     {warn(c.label)}" + (f"\n       → {c.detail}" if c.detail else ""))

    print(hdr("AUDIT SUMMARY"))
    completion = report.completion_pct
    print(f"  Completion : {completion:.1f}%")

def main():
    root = Path("./nexusmonitor").resolve()
    module_audits = [audit_module(m, root) for m in MODULES]
    global_checks = audit_global_checks(root)
    total_expected = sum(len(m["files"]) for m in MODULES)
    total_found = sum(ma.files_present for ma in module_audits)

    report = AuditReport(
        timestamp=datetime.now().isoformat(),
        root_dir=str(root),
        total_modules=len(module_audits),
        modules_passed=sum(1 for ma in module_audits if ma.passed),
        modules_failed=sum(1 for ma in module_audits if not ma.passed),
        total_files_expected=total_expected,
        total_files_found=total_found,
        global_checks=global_checks,
        module_audits=module_audits,
    )

    output_path = Path("audit_report.json")
    output_path.write_text(json.dumps(asdict(report), indent=2, default=str), encoding="utf-8")
    print_report(report)

if __name__ == "__main__":
    main()
