import os
from cryptography.fernet import Fernet
import json
from sqlalchemy.types import TypeDecorator, String

class EncryptionService:
    @staticmethod
    def get_key() -> bytes:
        """Get AES-256-GCM (Fernet) key from env."""
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            # Generate a consistent test key if not provided (DO NOT USE IN PROD)
            key = Fernet.generate_key()
            os.environ["ENCRYPTION_KEY"] = key.decode()
        elif isinstance(key, str):
            key = key.encode()
        return key

    @staticmethod
    def encrypt(data: str) -> str:
        f = Fernet(EncryptionService.get_key())
        return f.encrypt(data.encode()).decode()

    @staticmethod
    def decrypt(token: str) -> str:
        f = Fernet(EncryptionService.get_key())
        return f.decrypt(token.encode()).decode()


class EncryptedJSONCacheType(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that encrypts a dict JSON payload on write,
    and decrypts it to a dict on read.
    """
    impl = String
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        string_val = json.dumps(value)
        return EncryptionService.encrypt(string_val)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        decrypted = EncryptionService.decrypt(value)
        return json.loads(decrypted)
