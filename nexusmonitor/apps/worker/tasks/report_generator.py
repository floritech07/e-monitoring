from celery import Celery
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

celery_app = Celery('nexusmonitor', broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

@celery_app.task(name='tasks.report_generator.generate_availability')
def generate_availability_report(org_id: str, start_iso: str, end_iso: str, recipient_email: str = None):
    """Celery task generating and optionally emailing an availability PDF report."""
    import asyncio
    from packages.reports.generator import ReportGenerator
    from packages.reports.export_pdf import PDFExporter

    start = datetime.fromisoformat(start_iso)
    end = datetime.fromisoformat(end_iso)

    generator = ReportGenerator()
    exporter = PDFExporter()

    data = asyncio.run(generator.generate_availability_report(org_id, start, end))
    pdf_bytes = exporter.export("availability.html", data)

    logger.info(f"[REPORT] Generated availability PDF — {len(pdf_bytes)} bytes for org {org_id}")

    if recipient_email:
        from packages.notifications.email import EmailNotifier
        notifier = EmailNotifier()
        asyncio.run(notifier.send(
            recipient_email,
            f"[NexusMonitor] Availability Report — {org_id}",
            "<p>Please find your scheduled availability report attached.</p>"
        ))
        logger.info(f"[REPORT] Emailed report to {recipient_email}")

    return {"org_id": org_id, "bytes": len(pdf_bytes), "status": "complete"}


@celery_app.task(name='tasks.report_generator.generate_backup_compliance')
def generate_backup_compliance_report(org_id: str, recipient_email: str = None):
    """Celery task generating and optionally emailing a backup compliance PDF report."""
    import asyncio
    from packages.reports.generator import ReportGenerator
    from packages.reports.export_pdf import PDFExporter

    generator = ReportGenerator()
    exporter = PDFExporter()

    data = asyncio.run(generator.generate_backup_compliance_report(org_id))
    pdf_bytes = exporter.export("backup_compliance.html", data)

    logger.info(f"[REPORT] Backup compliance PDF — {len(pdf_bytes)} bytes for org {org_id}")
    return {"org_id": org_id, "bytes": len(pdf_bytes), "status": "complete"}
