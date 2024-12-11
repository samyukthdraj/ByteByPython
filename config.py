from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Existing settings
    MONGO_URI: str
    MONGO_DB_NAME: str = "cap_database"
    ASSEMBLYAI_API_KEY: Optional[str] = None
    
    # Authentication settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Email settings for OTP
    SENDER_EMAIL: Optional[str] = None
    SENDER_PASSWORD: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

settings = Settings()