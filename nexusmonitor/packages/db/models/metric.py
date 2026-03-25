from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON, DateTime, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from sqlalchemy import Enum as SQLEnum

from packages.db.models.base import Base, generate_uuid, utc_now

class AggregationType(str, enum.Enum):
    AVG = "avg"
    MAX = "max"
    MIN = "min"
    SUM = "sum"
    LAST = "last"

class MetricSeries(Base):
    """Metadata about a specific measured metric for an asset."""
    __tablename__ = "metric_series"

    name = Column(String(255), nullable=False)  # e.g. "cpu.usage"
    unit = Column(String(50), nullable=True)    # e.g. "%"
    category = Column(String(100), nullable=True, default="other") # compute, memory, disk, network
    retention_days = Column(Integer, nullable=False, default=90)
    aggregation = Column(SQLEnum(AggregationType), nullable=False, default=AggregationType.AVG)
    
    anomaly_detection_enabled = Column(Integer, default=0) # SQLite/Bool compat

    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint('name', 'asset_id', name='uix_metric_series_name_asset'),
    )

    asset = relationship("Asset", back_populates="metric_series")

class MetricPoint(Base):
    """
    Time series data point.
    In PostgreSQL, this table should be converted to a TimescaleDB hypertable
    partitioned on the 'ts' column.
    """
    __tablename__ = "metric_points"
    
    # We override id for Time-Series optimization (TimescaleDB relies primarily on time)
    # But Alembic will generate a primary key properly
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    
    series_id = Column(UUID(as_uuid=True), ForeignKey("metric_series.id", ondelete="CASCADE"), nullable=False)
    ts = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    value = Column(Float, nullable=False)
    labels = Column(JSON, nullable=True) # Extra dimensions

    __table_args__ = (
        Index('idx_metric_points_ts', 'ts'),
        Index('idx_metric_points_series_id_ts', 'series_id', 'ts', postgresql_using='btree'),
    )
