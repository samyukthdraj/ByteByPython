from pydantic import BaseModel
from typing import Optional,Any
from datetime import datetime


class Token(BaseModel):
    userName: str  # This should match the userName in the User model
    image: Optional[str] = None
    audio: Optional[str] = None
    pincode: str
    policeStationId: str
    crime: str
    description: Optional[str] = None
    startDate: datetime
    status: bool