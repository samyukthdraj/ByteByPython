from pymongo import MongoClient
from config import settings
from bson.objectid import ObjectId
from passlib.context import CryptContext
from datetime import datetime
from models import PoliceStation
import random

class Database:
    def __init__(self):
        # Initialize MongoDB client and collections
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client[settings.MONGO_DB_NAME]
        self.reports_collection = self.db.crime_reports
        self.police_stations_collection = self.db.police_stations
        self.users_collection = self.db.users
        self.tickets_collection = self.db.tickets

        # Password hashing context
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Pre-configure police stations
        self.pre_configure_police_stations()

    def hash_password(self, password):
        """Hash a plain-text password."""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password, hashed_password):
        """Verify a plain-text password against a hashed password."""
        return self.pwd_context.verify(plain_password, hashed_password)

    def pre_configure_police_stations(self):
        """Pre-configure police stations if they don't already exist in the database."""
        police_stations = [
            PoliceStation(
                name="Central Police Station",
                address="123 Main Street, Anytown",
                username="central_ps",
                hashed_password=self.hash_password("centralps"),
                contact_number="1234567890"
            ),
            # Add more stations as needed
        ]

        for station in police_stations:
            existing = self.police_stations_collection.find_one({"username": station.username})
            if not existing:
                self.insert_police_station(station)

    def create_user(self, username, email, password, full_name=None):
        """Create a new user in the database."""
        existing_user = self.users_collection.find_one({
            "$or": [
                {"username": username},
                {"email": email}
            ]
        })
        if existing_user:
            raise ValueError("Username or email already exists")

        hashed_password = self.hash_password(password)

        user_doc = {
            "username": username,
            "email": email,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "is_active": True
        }

        result = self.users_collection.insert_one(user_doc)
        return str(result.inserted_id)

    def authenticate_user(self, username: str, password: str):
        """Authenticate a user by username and password."""
        user = self.users_collection.find_one({"username": username})
        if not user or not self.verify_password(password, user['hashed_password']):
            return None
        return user

    def authenticate_police_station(self, username: str, password: str):
        """Authenticate a police station by username and password."""
        station = self.police_stations_collection.find_one({"username": username})
        if not station or not self.verify_password(password, station['hashed_password']):
            return None
        return station


        result = self.tickets_collection.insert_one(ticket_doc)
        return ticket_number
      
    def get_police_station_tickets(self, police_station):
        """Retrieve tickets for a specific police station."""
        return list(self.tickets_collection.find({"police_station": police_station}))

    def update_ticket_status(self, ticket_number: str, new_status: str):
        """Update the status of a ticket."""
        result = self.tickets_collection.update_one(
            {"ticket_number": ticket_number},
            {
                "$set": {
                    "status": new_status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    def insert_police_station(self, police_station):
        """Insert a new police station into the database."""
        result = self.police_stations_collection.insert_one(police_station.dict(by_alias=True))
        return str(result.inserted_id)

    def reset_password(self, email: str, new_password: str):
        """Reset a user's password."""
        new_hashed_password = self.hash_password(new_password)

        result = self.users_collection.update_one(
            {"email": email},
            {"$set": {"hashed_password": new_hashed_password}}
        )

        return result.modified_count > 0
    


    def create_ticket(self, user_name, pincode, phone_number, crime_type, 
                    police_station=None, description=None, ticket_number=None, 
                    image_url=None, audio_url=None):
        """Create a new ticket in the database."""
        # If no ticket number is provided, generate a random 6-digit number
        if not ticket_number:
            ticket_number = f"{random.randint(100000, 999999)}"

        # Retrieve the user document
        user = self.users_collection.find_one({"username": user_name})
        if not user:
            raise ValueError(f"User {user_name} not found")

        # If police station is provided, retrieve its details
        station = None
        if police_station:
            station = self.police_stations_collection.find_one({"name": police_station})
            if not station:
                raise ValueError(f"Police station {police_station} not found")
        
        # Ensure image_url and audio_url are not None (or set them to empty strings)
        if not image_url:
            image_url = None  # Or you can leave it as None depending on your database schema
        if not audio_url:
            audio_url = None  # Or handle it as needed

        # Now, insert the ticket into the database
        ticket = {
            "ticket_number": ticket_number,
            "user_name": user_name,
            "pincode": pincode,
            "phone_number": phone_number,
            "crime_type": crime_type,
            "police_station": police_station,
            "description": description,
            "image_url": image_url,
            "audio_url": audio_url
        }

        result = self.tickets_collection.insert_one(ticket)
        return result.inserted_id




