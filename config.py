from pydantic import BaseSettings

class Settings(BaseSettings):
    # MongoDB configuration
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "cap_database"

    # AssemblyAI Configuration (for speech-to-text)
    ASSEMBLYAI_API_KEY: str = "your_assemblyai_api_key"

    # DeepL Configuration (for translation)
    DEEPL_API_KEY: str = "your_deepl_api_key"

    class Config:
        env_file = ".env"

settings = Settings()