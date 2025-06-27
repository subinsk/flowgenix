from sqlalchemy.orm import Session
from app.models.api_keys import UserApiKey
from app.schemas.api_keys import ApiKeyCreate, ApiKeyUpdate, ApiKeyResponse
from app.core.config import settings
from typing import List, Optional
import uuid
from cryptography.fernet import Fernet


class ApiKeyService:
    def __init__(self, db: Session):
        self.db = db
        # Get encryption key from settings
        encryption_key = settings.api_key_encryption_key
        
        if isinstance(encryption_key, str):
            encryption_key = encryption_key.encode()
        
        self.cipher = Fernet(encryption_key)

    def _encrypt_api_key(self, api_key: str) -> str:
        """Encrypt an API key"""
        return self.cipher.encrypt(api_key.encode()).decode()

    def _decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt an API key"""
        return self.cipher.decrypt(encrypted_key.encode()).decode()

    def create_api_key(self, user_id: str, api_key_data: ApiKeyCreate) -> ApiKeyResponse:
        """Create or update an API key for a user"""
        # Check if API key with this name already exists for the user
        existing_key = self.db.query(UserApiKey).filter(
            UserApiKey.user_id == user_id,
            UserApiKey.key_name == api_key_data.key_name
        ).first()

        encrypted_key = self._encrypt_api_key(api_key_data.api_key)

        if existing_key:
            # Update existing key
            existing_key.encrypted_key = encrypted_key
            self.db.commit()
            self.db.refresh(existing_key)
            return ApiKeyResponse(
                id=str(existing_key.id),
                key_name=existing_key.key_name,
                created_at=existing_key.created_at,
                updated_at=existing_key.updated_at
            )
        else:
            # Create new key
            db_api_key = UserApiKey(
                user_id=user_id,
                key_name=api_key_data.key_name,
                encrypted_key=encrypted_key
            )
            self.db.add(db_api_key)
            self.db.commit()
            self.db.refresh(db_api_key)
            return ApiKeyResponse(
                id=str(db_api_key.id),
                key_name=db_api_key.key_name,
                created_at=db_api_key.created_at,
                updated_at=db_api_key.updated_at
            )

    def get_api_keys(self, user_id: str) -> List[ApiKeyResponse]:
        """Get all API keys for a user (without the actual key values)"""
        api_keys = self.db.query(UserApiKey).filter(UserApiKey.user_id == user_id).all()
        return [
            ApiKeyResponse(
                id=str(key.id),
                key_name=key.key_name,
                created_at=key.created_at,
                updated_at=key.updated_at
            )
            for key in api_keys
        ]

    def get_decrypted_api_key(self, user_id: str, key_name: str) -> Optional[str]:
        """Get a decrypted API key by name for a user"""
        api_key = self.db.query(UserApiKey).filter(
            UserApiKey.user_id == user_id,
            UserApiKey.key_name == key_name
        ).first()
        
        if not api_key:
            return None
        
        return self._decrypt_api_key(api_key.encrypted_key)

    def delete_api_key(self, user_id: str, key_name: str) -> bool:
        """Delete an API key"""
        api_key = self.db.query(UserApiKey).filter(
            UserApiKey.user_id == user_id,
            UserApiKey.key_name == key_name
        ).first()
        
        if not api_key:
            return False
        
        self.db.delete(api_key)
        self.db.commit()
        return True

    def update_api_key(self, user_id: str, key_name: str, api_key_data: ApiKeyUpdate) -> Optional[ApiKeyResponse]:
        """Update an existing API key"""
        api_key = self.db.query(UserApiKey).filter(
            UserApiKey.user_id == user_id,
            UserApiKey.key_name == key_name
        ).first()
        
        if not api_key:
            return None
        
        api_key.encrypted_key = self._encrypt_api_key(api_key_data.api_key)
        self.db.commit()
        self.db.refresh(api_key)
        
        return ApiKeyResponse(
            id=str(api_key.id),
            key_name=api_key.key_name,
            created_at=api_key.created_at,
            updated_at=api_key.updated_at
        )
