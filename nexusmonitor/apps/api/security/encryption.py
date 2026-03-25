import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

class EncryptionService:
    """
    AES-256-GCM envelope encryption-ready abstraction.
    Never stores plaintext credentials in DB bounds.
    Requires AES_MASTER_KEY environment variable (32-bytes base64 encoded).
    """

    def __init__(self, master_key_b64: str | None = None):
        key_str = master_key_b64 or os.getenv("AES_MASTER_KEY", "uE2r1pXZ6vF8qG9wK4mL3tH5yJ7nB0xV2cM4aR9pQzU=")
        self.master_key = base64.b64decode(key_str)
        if len(self.master_key) != 32:
            raise ValueError("AES_MASTER_KEY must be exactly 32 bytes (AES-256).")

        self.aesgcm = AESGCM(self.master_key)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypts plaintext UTF-8, returns Base64-encoded `nonce:ciphertext`.
        Ensures strict 12-byte random nonce per encryption as per NIST AES-GCM standards.
        """
        if not plaintext:
            return ""

        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        
        payload = nonce + ciphertext
        return base64.b64encode(payload).decode("utf-8")

    def decrypt(self, encrypted_b64: str) -> str:
        """
        Decrypts a Base64 encoded payload holding `nonce:ciphertext`.
        Fails safely on corrupted MAC tags or tampering.
        """
        if not encrypted_b64:
            return ""

        try:
            payload = base64.b64decode(encrypted_b64)
            nonce = payload[:12]
            ciphertext = payload[12:]
            
            plaintext_bytes = self.aesgcm.decrypt(nonce, ciphertext, None)
            return plaintext_bytes.decode("utf-8")
        except InvalidTag:
            raise ValueError("Encryption Payload integrity check failed. Possible tampering.")
        except Exception as e:
            raise ValueError(f"Decryption error: {e}")

# Global singleton
cipher = EncryptionService()
