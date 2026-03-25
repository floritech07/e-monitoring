import pytest
from apps.api.auth.service import AuthService
from packages.db.models.user import User

@pytest.mark.asyncio
async def test_password_hashing():
    pwd = "MySuperSecretPassword123!"
    hashed = AuthService.get_password_hash(pwd)
    
    # Check it actually hashes
    assert hashed != pwd
    assert len(hashed) > 20
    
    # Check verification works
    assert AuthService.verify_password(pwd, hashed) is True
    assert AuthService.verify_password("wrong_password", hashed) is False

@pytest.mark.asyncio
async def test_token_generation():
    # Setup mock user
    user = User(id="123e4567-e89b-12d3-a456-426614174000", email="test@example.com", roles=[])
    
    tokens = AuthService.create_tokens(user)
    
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["access_token"].startswith("eyJ") # JWT standard header
