from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from enum import Enum
from bson import ObjectId

class StatusEnum(str, Enum):
    pending = "1"    
    completed = "2"  
    rejected = "3"  
    
class DescriptionResponse(BaseModel):
    description: str

class ImageRequest(BaseModel):
    image: str

class Incident(BaseModel):
    _id: ObjectId
    image: str
    audio: str
    pincode: str
    crimeType: str
    description: str
    policeStationId: str
    username: str  # This should match the userName in the User model
    startDate: datetime
    status: StatusEnum
    name: Optional[str] = None  # Extra field 1, optional
    mobileNumber: Optional[str] = None  # Extra field 2, optional

    @validator("status", pre=True)
    def validate_status(cls, value: str) -> str:
        # Convert friendly string to numeric equivalent if needed
        mapping = {
            "pending": "1",
            "completed": "2",
            "rejected": "3"
        }
        if value in mapping:
            return mapping[value]
        if value in mapping.values():
            return value  # Already in numeric form
        raise ValueError("Invalid status value. Must be one of: 'completed', 'rejected', 'pending'.")

