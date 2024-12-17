# app/database.py
from pymongo import MongoClient
from .config import settings

client = MongoClient(settings.MONGODB_URI)
db = client.get_database("test")

# Example collections
civilian_collection = db["civilian"]
police_collection = db["police"]
incident_collection = db["incident"]