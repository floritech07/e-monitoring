from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from packages.db.models.user import User, Role
from apps.api.auth.jwt import create_access_token, create_refresh_token
from apps.api.auth.mfa import MFAService

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    async def authenticate_user(session: AsyncSession, email: str, password: str, mfa_code: str = None) -> User | None:
        """Authenticate and return user, handling MFA if enabled."""
        result = await session.execute(
            select(User).options(selectinload(User.roles)).where(User.email == email)
        )
        user = result.scalars().first()
        
        if not user:
            return None
        if not AuthService.verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            raise ValueError("User inactive")
            
        if user.mfa_enabled:
            if not mfa_code or not MFAService.verify_code(user.mfa_secret, mfa_code):
                raise ValueError("Invalid MFA code")

        return user

    @staticmethod
    def create_tokens(user: User) -> dict:
        roles = [r.name for r in user.roles]
        
        access_token = create_access_token(
            data={"sub": str(user.id), "roles": roles, "org_id": str(user.organization_id)}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 900
        }
