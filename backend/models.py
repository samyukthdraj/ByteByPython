from pydantic import BaseModel, Field, EmailStr, validator, constr
from typing import Optional, List
from bson import ObjectId
from datetime import datetime
import random
import re

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
    phone_number: str = None

    @validator('phone_number', pre=True, always=False, allow_reuse=True)
    def validate_phone_number(cls, v):
        if v and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format')
        return v

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "phone_number": "1234567890"
            }
        }

class Ticket(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    ticket_number: str = Field(default_factory=lambda: f"{random.randint(100000, 999999)}")
    user_id: str
    user_name: Optional[str] = None
    pincode: str
    phone_number: str
    crime_type: str
    description: Optional[str] = None
    police_station: Optional[str] = None
    police_station_id: Optional[str] = None
    status: str = "New"  # Default status
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None

    @validator('pincode')
    def validate_pincode(cls, v):
        if not re.match(r'^\d{6}$', str(v)):
            raise ValueError('Pincode must be a 6-digit number')
        return v

    @validator('crime_type')
    def validate_crime_type(cls, v):
        valid_types = ['theft', 'vandalism', 'assault', 'fraud', 'others']
        if v.lower() not in valid_types:
            raise ValueError(f'Invalid crime type. Must be one of {valid_types}')
        return v

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {
            "example": {
                "ticket_number": "123456",
                "user_id": "user_objectid",
                "pincode": "560001",
                "phone_number": "1234567890",
                "crime_type": "theft",
                "status": "New"
            }
        }

class PoliceStation(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=3, max_length=100)
    address: str = Field(..., min_length=10, max_length=200)
    username: str = Field(..., min_length=3, max_length=50)
    hashed_password: str
    contact_number: Optional[str] = None

    @validator('contact_number', pre=True, always=False, allow_reuse=True)
    def validate_contact_number(cls, v):
        if v and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid contact number format')
        return v

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {
            "example": {
                "name": "Central Police Station",
                "address": "123 Main Street, Anytown",
                "username": "central_ps",
                "contact_number": "1234567890"
            }
        }

class CrimeReport(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    pincode: str
    police_station: str
    phone_number: str
    crime_type: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('pincode')
    def validate_pincode(cls, v):
        if not re.match(r'^\d{6}$', str(v)):
            raise ValueError('Pincode must be a 6-digit number')
        return v

    @validator('crime_type')
    def validate_crime_type(cls, v):
        valid_types = ['theft', 'vandalism', 'assault', 'fraud', 'others']
        if v.lower() not in valid_types:
            raise ValueError(f'Invalid crime type. Must be one of {valid_types}')
        return v

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {
            "example": {
                "user_id": "user_objectid",
                "pincode": "560001",
                "police_station": "Central Station",
                "phone_number": "1234567890",
                "crime_type": "theft"
            }
        }