from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # MongoDB configuration
    MONGO_URI: str
    MONGO_DB_NAME: str = "cap_database"

    # AssemblyAI Configuration
    ASSEMBLYAI_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

settings = Settings()
