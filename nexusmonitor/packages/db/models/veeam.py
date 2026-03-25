from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from packages.db.models.base import Base

class VeeamJob(Base):
    __tablename__ = "veeam_jobs"

    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False) # Backup, Replication, etc.
    status = Column(String(50), nullable=False, default="Stopped")
    rpo_hours = Column(Integer, nullable=True) # Threshold

    # Veeam internal ID
    internal_id = Column(String(255), nullable=True, unique=True)
    
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False)

    sessions = relationship("BackupSession", back_populates="job", cascade="all, delete-orphan")


class BackupSession(Base):
    __tablename__ = "backup_sessions"

    internal_session_id = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False) # Success, Warning, Failed, Running
    duration_seconds = Column(Integer, nullable=True)
    transferred_bytes = Column(Integer, nullable=True)
    processed_objects = Column(Integer, nullable=True)
    bottleneck = Column(String(255), nullable=True)
    
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)

    job_id = Column(UUID(as_uuid=True), ForeignKey("veeam_jobs.id", ondelete="CASCADE"), nullable=False)
    
    job = relationship("VeeamJob", back_populates="sessions")
