from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, List, Union
from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env from backend directory (where the Docker context runs)
load_dotenv()

class Settings(BaseSettings):
    # Application
    app_name: str = "Flowgenix"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str
    
    # Security
    secret_key: str
    access_token_expire_minutes: int = 1440
    api_key_encryption_key: str
    
    # ChromaDB (Embedded Mode)
    chroma_persist_directory: str = "./chroma_db"
    
    # CORS
    allowed_origins: Union[List[str], str] = "http://localhost:3000,http://localhost:3001"
    
    # File Upload
    upload_dir: str = "uploaded_docs"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: Union[List[str], str] = ".pdf,.txt,.docx"
    
    # Monitoring
    prometheus_enabled: bool = True
    log_level: str = "INFO"

    @field_validator('allowed_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    @field_validator('allowed_file_types', mode='before')
    @classmethod
    def parse_file_types(cls, v):
        if isinstance(v, str):
            return [file_type.strip() for file_type in v.split(',')]
        return v

    class Config:
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env

settings = Settings()
