from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse
from datetime import datetime
from typing import Optional
from apps.api.reports.schemas import ReportRequest, ReportListItem
from packages.reports.generator import ReportGenerator
from packages.reports.export_pdf import PDFExporter
from packages.reports.export_csv import CSVExporter
from apps.api.auth.dependencies import require_role
import io

router = APIRouter(prefix="/reports", tags=["reports"])

generator = ReportGenerator()
pdf_exporter = PDFExporter()
csv_exporter = CSVExporter()

@router.post("/availability/generate")
async def generate_availability(
    req: ReportRequest,
    format: str = Query("json", pattern="^(json|pdf|csv)$"),
    user=Depends(require_role("VIEWER"))
):
    """Generates availability SLA report for a given organization and date range."""
    data = await generator.generate_availability_report(
        req.org_id,
        req.start_date,
        req.end_date
    )
    
    if format == "pdf":
        pdf_bytes = pdf_exporter.export("availability.html", data)
        return Response(content=pdf_bytes, media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=availability_report.pdf"})
                        
    elif format == "csv":
        csv_data = csv_exporter.export(data.get("assets", []))
        return StreamingResponse(io.BytesIO(csv_data), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=availability.csv"})
    
    return data

@router.post("/backup-compliance/generate")
async def generate_backup(req: ReportRequest, user=Depends(require_role("VIEWER"))):
    """Generates Veeam backup compliance SLA report."""
    return await generator.generate_backup_compliance_report(req.org_id)
