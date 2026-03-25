from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from packages.db.session import get_session
from apps.api.auth.service import AuthService
from apps.api.auth.dependencies import get_current_user
from apps.api.auth.schemas import Token, UserResponse, LoginRequest, APIKeyCreate, APIKeyResponse
from packages.db.models.user import User
from apps.api.auth.api_keys import APIKey, generate_api_key
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)
):
    """OAuth2 password flow. Use standard form."""
    try:
        user = await AuthService.authenticate_user(session, form_data.username, form_data.password)
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        return AuthService.create_tokens(user)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/login/json", response_model=Token)
async def login_json(
    req: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """JSON API login supporting MFA."""
    try:
        user = await AuthService.authenticate_user(session, req.email, req.password, req.mfa_code)
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        return AuthService.create_tokens(user)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user

@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    req: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Generate a service API key."""
    raw_key, prefix, key_hash = generate_api_key()
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)
    
    # Store api key record
    db_key = APIKey(
        key_hash=key_hash,
        prefix=prefix,
        name=req.name,
        scopes=req.scopes,
        expires_at=expires_at,
        user_id=current_user.id
    )
    session.add(db_key)
    await session.commit()
    
    return {
        "key_id": db_key.id,
        "name": db_key.name,
        "api_key": raw_key, # Returned ONLY ONCE
        "expires_at": expires_at.isoformat()
    }
