from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from packages.db.session import get_session
from packages.db.models.user import User, Role
from apps.api.auth.jwt import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    result = await session.execute(
        select(User).options(selectinload(User.roles)).options(selectinload(User.organization)).where(User.id == UUID(user_id))
    )
    user = result.scalars().first()
    
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [role.name for role in current_user.roles]
        if "SUPER_ADMIN" in user_roles: # Super admin can do anything
            return current_user
            
        for role in allowed_roles:
            if role in user_roles:
                return current_user
                
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted",
        )
    return role_checker
    
def require_permission(permission_name: str):
    """
    More granular permission check if needed.
    (Usually checks current_user.roles -> permissions)
    """
    async def permission_checker(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> User:
        role_ids = [r.id for r in current_user.roles]
        # In a real app we would cache this or load it with user
        # For this setup, we'll do a simple mock or logic
        if "SUPER_ADMIN" in [r.name for r in current_user.roles]:
            return current_user
            
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing permission: {permission_name}")
        
    return permission_checker
