import pytest
from apps.api.auth.mfa import MFAService

def test_mfa_generation_and_verification():
    # Generate a secret
    secret = MFAService.generate_secret()
    assert len(secret) >= 16
    
    import pyotp
    totp = pyotp.TOTP(secret)
    code = totp.now()
    
    # Verify exact current code
    assert MFAService.verify_code(secret, code) is True
    
    # Verify wrong code
    assert MFAService.verify_code(secret, "000000") is False
    
    # Verify empty handles
    assert MFAService.verify_code(secret, "") is False
    assert MFAService.verify_code("", code) is False

def test_mfa_uri():
    secret = "JBSWY3DPEHPK3PXP"
    uri = MFAService.get_provisioning_uri(secret, "user@example.com")
    assert "otpauth://totp/" in uri
    assert "user%40example.com" in uri
    assert "secret=JBSWY3DPEHPK3PXP" in uri
