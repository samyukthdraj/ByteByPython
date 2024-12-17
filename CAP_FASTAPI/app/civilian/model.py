from pydantic import BaseModel, Field
from typing import Optional

class Civilian(BaseModel):
    id: str = Field(..., alias="_id") 
    name: str
    mobileNumber: str
    username: str
    password: str

class GetCivilianDetailsById(BaseModel):
    name: str
    mobileNumber: str

