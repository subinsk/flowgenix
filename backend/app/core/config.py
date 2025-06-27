from pydantic_settings import BaseSettings
from typing import Optional, List
from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env from project root
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=ROOT_DIR / '.env')

class Settings(BaseSettings):
    # Application
    app_name: str = os.getenv("APP_NAME", "Flowgenix")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://flowgenix:flowgenix@localhost:5432/flowgenix")
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "supersecret-change-in-production")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    api_key_encryption_key: str = os.getenv("API_KEY_ENCRYPTION_KEY", "ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv2oasOM1Pg=")
    
    # ChromaDB
    chroma_host: str = os.getenv("CHROMA_HOST", "localhost")
    chroma_port: int = int(os.getenv("CHROMA_PORT", 8001))
    
    # CORS
    allowed_origins: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
    
    # File Upload
    upload_dir: str = os.getenv("UPLOAD_DIR", "uploaded_docs")
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10MB
    allowed_file_types: List[str] = os.getenv("ALLOWED_FILE_TYPES", ".pdf,.txt,.docx").split(",")
    
    # Monitoring
    prometheus_enabled: bool = os.getenv("PROMETHEUS_ENABLED", "True").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    class Config:
        env_file = str(ROOT_DIR / ".env")
        case_sensitive = False

settings = Settings()
