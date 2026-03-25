from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import os
import uuid
import json
from typing import Dict, Any

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

ALGORITHM = "RS256"
DEFAULT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY", "mock_private_key")
DEFAULT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", "mock_public_key")

# FIX-005: Redis store for JWT blacklists
def _get_redis():
    if not REDIS_AVAILABLE:
        return None
    return aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "type": "access", "jti": str(uuid.uuid4())})
    
    key = DEFAULT_PRIVATE_KEY if "mock" not in DEFAULT_PRIVATE_KEY else "secret"
    alg = ALGORITHM if "mock" not in DEFAULT_PRIVATE_KEY else "HS256"
    return jwt.encode(to_encode, key, algorithm=alg)

def create_refresh_token(data: dict, family_id: str = None) -> str:
    """Creates a 7-day refresh token with chain/family tracking."""
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode = data.copy()
    family = family_id or str(uuid.uuid4())
    to_encode.update({
        "exp": expire, 
        "type": "refresh", 
        "jti": str(uuid.uuid4()),
        "fid": family  # Family ID tracks token chains for rotation
    })
    
    key = DEFAULT_PRIVATE_KEY if "mock" not in DEFAULT_PRIVATE_KEY else "secret"
    alg = ALGORITHM if "mock" not in DEFAULT_PRIVATE_KEY else "HS256"
    return jwt.encode(to_encode, key, algorithm=alg)

async def check_refresh_token(jti: str, fid: str) -> None:
    """Validates token isn't blacklisted; invalidates entire family if reuse detected."""
    r = _get_redis()
    if not r: return
    
    # Check if family is completely invalidated (e.g. reuse detected previously)
    if await r.get(f"jwt:blacklist:family:{fid}"):
        raise ValueError("Token family invalidated. Login required.")

    # Check if this specific token was already used
    if await r.get(f"jwt:blacklist:jti:{jti}"):
        # Prevent future use of this token family (Rotation violation)
        await r.setex(f"jwt:blacklist:family:{fid}", 86400 * 7, "1")
        raise ValueError("Refresh token reuse detected. Family invalidated.")

async def blacklist_refresh_token(jti: str, ttl_days: int = 7) -> None:
    """Marks a processed refresh token as used."""
    r = _get_redis()
    if r:
        await r.setex(f"jwt:blacklist:jti:{jti}", 86400 * ttl_days, "1")

def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token."""
    key = DEFAULT_PUBLIC_KEY if "mock" not in DEFAULT_PUBLIC_KEY else "secret"
    alg = ALGORITHM if "mock" not in DEFAULT_PUBLIC_KEY else "HS256"
    
    try:
        payload = jwt.decode(token, key, algorithms=[alg])
        return payload
    except JWTError as e:
        raise ValueError("Invalid token") from e
