# app/config.py
import os

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DEBUG = os.getenv("DEBUG", "True")

settings = Settings()
