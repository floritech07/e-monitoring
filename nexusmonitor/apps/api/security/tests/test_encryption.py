import pytest
import os
from apps.api.security.encryption import EncryptionService, EncryptedJSONCacheType

def test_fern_encryption_decryption(monkeypatch):
    monkeypatch.setenv("ENCRYPTION_KEY", "") # force generate
    
    plaintext = "super_secret_credentials"
    encrypted = EncryptionService.encrypt(plaintext)
    
    assert encrypted != plaintext
    assert "gAAAAA" in encrypted # Common Fernet header
    
    decrypted = EncryptionService.decrypt(encrypted)
    assert decrypted == plaintext
