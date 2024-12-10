from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class PoliceStation(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    address: str
    password: str

class CrimeReport(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    pincode: str
    police_station: PyObjectId
    phone_number: str
    crime_type: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    ticket_number: Optional[str] = None
    user_name: Optional[str] = None