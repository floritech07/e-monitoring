from pydantic import BaseModel, EmailStr, Field, ConfigDict
from enum import Enum
from typing import Optional, List
from uuid import UUID

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    user_id: str
    roles: List[str] = []
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: Optional[str] = None
    
class MFASetupResponse(BaseModel):
    secret: str
    qr_code_uri: str
    
class MFAVerifyRequest(BaseModel):
    code: str

class APIKeyCreate(BaseModel):
    name: str = Field(..., max_length=100)
    scopes: List[str] = ["read"]
    expires_in_days: int = 365
    
class APIKeyResponse(BaseModel):
    key_id: UUID
    name: str
    api_key: str  # Only returned once on creation
    expires_at: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    name: str
    is_active: bool
    roles: List[str]
    organization_id: Optional[UUID]
