from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import os
from typing import Dict, Any

ALGORITHM = "RS256"
# In a real deployed app, these come from Vault or env vars.
# We mock defaults for immediate runnability per prompts.
DEFAULT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY", "mock_private_key")
DEFAULT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", "mock_public_key")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        
    to_encode.update({"exp": expire, "type": "access"})
    # Using HS256 for local stub config if real RS256 keys aren't provided.
    # In production, keys must be valid PEMs.
    key = DEFAULT_PRIVATE_KEY if "mock" not in DEFAULT_PRIVATE_KEY else "secret"
    alg = ALGORITHM if "mock" not in DEFAULT_PRIVATE_KEY else "HS256"
    
    encoded_jwt = jwt.encode(to_encode, key, algorithm=alg)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Creates a 7-day refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "refresh"})
    
    key = DEFAULT_PRIVATE_KEY if "mock" not in DEFAULT_PRIVATE_KEY else "secret"
    alg = ALGORITHM if "mock" not in DEFAULT_PRIVATE_KEY else "HS256"
    return jwt.encode(to_encode, key, algorithm=alg)

def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token."""
    key = DEFAULT_PUBLIC_KEY if "mock" not in DEFAULT_PUBLIC_KEY else "secret"
    alg = ALGORITHM if "mock" not in DEFAULT_PUBLIC_KEY else "HS256"
    
    try:
        payload = jwt.decode(token, key, algorithms=[alg])
        return payload
    except JWTError as e:
        raise ValueError("Invalid token") from e
