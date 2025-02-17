from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # MongoDB settings
    MONGO_URI: str
    MONGO_DB_NAME: str = "cap_database"
    ASSEMBLY_API_KEY: str = Field(..., env="ASSEMBLY_API_KEY")
    GEMINI_API_KEY: str = Field(..., env="GEMINI_API_KEY")
    FOLDER_ID: str = Field(..., env="FOLDER_ID")

    # Authentication settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Email settings for OTP
    SENDER_EMAIL: Optional[str] = None
    SENDER_PASSWORD: Optional[str] = None

    # SMTP settings
    SMTP_EMAIL: str
    SMTP_PASSWORD: str
    SMTP_SERVER: str
    SMTP_PORT: int

    # SMTP settings (Outlook example)
    EMAIL_HOST: str
    EMAIL_PORT: int
    EMAIL_USERNAME: str
    EMAIL_PASSWORD: str
    EMAIL_FROM: str
      # Optional extra settings for development
    DEV_MODE: Optional[bool] = False  # For development mode if needed

    # Configuration for reading the .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )

# Initialize settings
settings = Settings()
