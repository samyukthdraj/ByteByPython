from pydantic import BaseModel, Field
from typing import Optional

class Police(BaseModel):
    id: str = Field(..., alias="_id") 
    stationName: str
    mobileNumber: str
    location: str
    pincode: str
    latitude: str
    longitude: str
    username: str
    password: str

    model_config = {"extra": "allow"} #allows extra fields