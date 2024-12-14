from pydantic import BaseModel, Field, EmailStr, constr
from typing import Optional, List
from bson import ObjectId
from datetime import datetime
import random

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    password: Optional[str] = None  # For signup
    hashed_password: Optional[str] = None  # Stored in database
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class Ticket(BaseModel):
    ticket_number: str = Field(default_factory=lambda: f"TICKET{random.randint(100000, 999999)}")
    user_id: str
    pincode: str
    phone_number: str
    crime_type: str
    description: Optional[str] = None
    police_station: Optional[str] = None
    status: str = "New"  # Default status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class PoliceStation(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    address: str
    username: str  # For login
    hashed_password: str
    contact_number: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class CrimeReport(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    pincode: str
    police_station: str
    phone_number: str
    crime_type: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }