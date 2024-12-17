from pydantic import BaseModel, Field
from typing import Optional

class Login(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    userType: str
    
