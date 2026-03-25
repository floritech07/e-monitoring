from pydantic import BaseModel, Field
from typing import Optional

class MetricQueryRequest(BaseModel):
    series_id: str
    start_time: int
    end_time: int
    step: str = "5m"
    aggregation: str = "avg"

class MetricQueryResponse(BaseModel):
    status: str
    data: dict
