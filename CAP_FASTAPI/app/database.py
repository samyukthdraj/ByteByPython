# app/database.py
from pymongo import MongoClient
from .config import settings

client = MongoClient("mongodb://localhost:27017/")  # Replace with your connection string
db = client["test"]

# Example collections
user_collection = db["user"]
token_collection = db["token"]
