import secrets
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        
        # Generate CSP nonce for this request
        nonce = secrets.token_hex(16)
        request.state.csp_nonce = nonce
        
        response = await call_next(request)
        
        # Strict security headers per OWASP guidelines
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content-Security-Policy with strict dynamic
        # Note: APIs don't usually serve HTML so CSP is mostly protective against direct browser navigation
        csp = f"default-src 'self'; script-src 'nonce-{nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none';"
        response.headers["Content-Security-Policy"] = csp
        
        return response
