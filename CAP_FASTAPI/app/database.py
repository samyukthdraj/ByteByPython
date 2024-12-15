# app/database.py
from pymongo import MongoClient
from .config import settings

client = MongoClient(settings.MONGODB_URI)
db = client.get_database("test")

# Example collections
user_collection = db["user"]
incident_collection = db["incident"]
