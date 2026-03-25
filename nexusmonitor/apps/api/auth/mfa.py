import pyotp

class MFAService:
    """TOTP based MFA service."""

    @staticmethod
    def generate_secret() -> str:
        """Generate a new base32 TOTP secret."""
        return pyotp.random_base32()
        
    @staticmethod
    def get_provisioning_uri(secret: str, email: str, issuer: str = "NexusMonitor") -> str:
        """Generate the URI for QR code generation."""
        return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)
        
    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        """Verify a TOTP token against a secret."""
        # Prevent completely empty codes
        if not secret or not code:
            return False
            
        totp = pyotp.TOTP(secret)
        # Verify code with a slight window for clock drift
        return totp.verify(code, valid_window=1)
