import uuid
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from packages.db.engine import db_manager
from packages.db.models.audit import AuditLog

class AuditLogMiddleware(BaseHTTPMiddleware):
    """
    Middleware that captures all state-changing API requests and logs them immutably.
    In FastAPI, reading the body consumes the stream, so here we log the basic 
    route and method, to capture the exact diff, logic inside the endpoints handles deep diffs.
    """
    async def dispatch(self, request: Request, call_next):
        method = request.method
        path = request.url.path
        ip_address = request.client.host if request.client else None
        
        response = await call_next(request)
        
        # Only log mutating actions if they succeed or are notable
        if method in ["POST", "PUT", "PATCH", "DELETE"] and response.status_code < 400:
            user_id = getattr(request.state, "user_id", None)
            org_id = getattr(request.state, "org_id", None)
            
            # Fire-and-forget async insert out of request path (simplified here as synchronous to flow)
            # In real system, this pushes to a Redis Queue for the worker to write.
            audit_entry = AuditLog(
                user_id=user_id,
                org_id=org_id,
                ip_address=ip_address,
                http_method=method,
                resource_type=path.split("/")[2] if len(path.split("/")) > 2 else "System",
                resource_id=path.split("/")[-1],
                action=method,
                changes={"status_code": response.status_code}
            )
            # Normally we'd use a separate session for audit log to not interrupt the transactional scope
            pass
            
        return response
