from pydantic import BaseModel, Field
from typing import Optional
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

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

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
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "pincode": "560001",
                "police_station": "Central Police Station",
                "phone_number": "+911234567890",
                "crime_type": "Theft",
                "description": "Witnessed a theft near the market area",
            }
        }