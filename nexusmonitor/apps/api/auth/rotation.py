from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from apps.api.auth.jwt import decode_token, create_access_token, create_refresh_token, check_refresh_token, blacklist_refresh_token
from time import time
import logging

logger = logging.getLogger(__name__)

# Note: this is typically an extension of apps.api.auth.router but added as an explicit rotation router here for modularity.

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=dict)
async def refresh_access_token(req: RefreshRequest):
    """
    Exchanges a valid refresh token for a new access/refresh pair (Rotation).
    Invalidates the old refresh token to prevent replay attacks.
    """
    try:
        payload = decode_token(req.refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        jti = payload.get("jti")
        fid = payload.get("fid")
        
        # Check against Redis blacklist
        await check_refresh_token(jti, fid)
        
        # Rotation: Issue new tokens
        email = payload.get("sub")
        new_access = create_access_token({"sub": email, "role": payload.get("role")})
        new_refresh = create_refresh_token({"sub": email, "role": payload.get("role")}, family_id=fid)
        
        # Blacklist the old token immediately
        await blacklist_refresh_token(jti)
        
        logger.info(f"Successful JWT rotation for family {fid}")
        
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer"
        }
        
    except ValueError as e:
        logger.warning(f"Auth violation: {e}")
        raise HTTPException(status_code=401, detail=str(e))
