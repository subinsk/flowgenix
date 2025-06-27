"""
Test script to verify API key management functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.api_key_service import ApiKeyService
from app.core.database import get_db
from app.models.user import User
from sqlalchemy.orm import Session

def test_api_key_encryption():
    """Test API key encryption and decryption"""
    try:
        # Use a mock database session for testing
        class MockDB:
            def query(self, model):
                return self
            def filter(self, *args):
                return self
            def first(self):
                return None
            def add(self, obj):
                pass
            def commit(self):
                pass
            def delete(self, obj):
                pass
            def refresh(self, obj):
                pass
            def all(self):
                return []
        
        db = MockDB()
        api_key_service = ApiKeyService(db)
        
        # Test encryption/decryption
        test_key = "sk-test-1234567890abcdef"
        encrypted = api_key_service._encrypt_api_key(test_key)
        decrypted = api_key_service._decrypt_api_key(encrypted)
        
        print(f"Original key: {test_key}")
        print(f"Encrypted: {encrypted}")
        print(f"Decrypted: {decrypted}")
        print(f"Encryption/Decryption successful: {test_key == decrypted}")
        
        return test_key == decrypted
        
    except Exception as e:
        print(f"Error testing API key encryption: {e}")
        return False

if __name__ == "__main__":
    success = test_api_key_encryption()
    print(f"Test {'PASSED' if success else 'FAILED'}")
