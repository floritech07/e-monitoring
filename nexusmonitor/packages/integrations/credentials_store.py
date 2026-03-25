from apps.api.security.encryption import cipher
from typing import Dict, Any

class SecureCredentialsStore:
    """
    Utility wrapper ensuring all external integration credentials
    (API Keys, Passwords, Tokens) are transit-encrypted before 
    storage schemas accept them.
    """

    @staticmethod
    def encrypt_integration_config(config: Dict[str, Any]) -> Dict[str, Any]:
        """Iterates over a configuration dict and encrypts sensitive keys."""
        encrypted = config.copy()
        sensitive_keys = {"password", "secret_key", "client_secret", "token", "passhash"}
        
        for k, v in encrypted.items():
            if k in sensitive_keys and isinstance(v, str):
                encrypted[k] = cipher.encrypt(v)
        
        return encrypted
        
    @staticmethod
    def decrypt_integration_config(encrypted_config: Dict[str, Any]) -> Dict[str, Any]:
        """Transparently decrypts integration configurations for active memory use only."""
        decrypted = encrypted_config.copy()
        sensitive_keys = {"password", "secret_key", "client_secret", "token", "passhash"}
        
        for k, v in decrypted.items():
            if k in sensitive_keys and isinstance(v, str) and v:
                decrypted[k] = cipher.decrypt(v)
                
        return decrypted
