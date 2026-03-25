from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReportRequest(BaseModel):
    org_id: str
    start_date: datetime
    end_date: datetime
    report_type: Optional[str] = "availability"

class ReportListItem(BaseModel):
    id: str
    name: str
    type: str
    generated_at: datetime
    download_url: str
