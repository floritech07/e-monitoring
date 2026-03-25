from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.security.headers import SecurityHeadersMiddleware
from apps.api.security.audit import AuditLogMiddleware
import os

def setup_middleware(app: FastAPI):
    """
    Register all custom specific app level middleware
    """
    from apps.api.security.cors import setup_cors
    setup_cors(app)

    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Audit log
    # app.add_middleware(AuditLogMiddleware) # Turned off globally to prevent I/O blocking in the stub unless fully async worker configured.
