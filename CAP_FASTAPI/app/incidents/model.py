from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class StatusEnum(str, Enum):
    AwaitingAction = "1"
    Resolved = "2"
    Dismissed = "3"

class DescriptionResponse(BaseModel):
    description: str

class ImageRequest(BaseModel):
    image: str

class Incident(BaseModel):
    id: str = Field(..., alias="_id") 
    image: str
    audio: str
    pincode: str
    crimeType: str
    imageDescription: str
    audioDescription: str
    userDescription: str
    userId: str 
    policeStationId: str
    startDate: datetime
    status: StatusEnum

class GetIncident(BaseModel):
    id: str = Field(..., alias="_id")
    image: str
    audio: str
    pincode: str
    crimeType: str
    imageDescription: str
    audioDescription: str
    userDescription: str
    policeStationId: str
    startDate: datetime
    status: StatusEnum
    userName: Optional[str] = None 
    userMobileNumber: Optional[str] = None
    policeStationName: str
    policeMobileNumber: str
    policeStationLocation: str
    policeStationPincode: str
    policeStaionlatitude: str
    policeStationlongitude: str

    @validator("status", pre=True)
    def validate_status(cls, value: str) -> str:
        # Convert friendly string to numeric equivalent if needed
        mapping = {
            "Awaiting Action": "1",
            "Resolved": "2",
            "Dismissed": "3"
        }
        if value in mapping:
            return mapping[value]
        if value in mapping.values():
            return value  # Already in numeric form
        raise ValueError("Invalid status value. Must be one of: 'completed', 'rejected', 'pending'.")
