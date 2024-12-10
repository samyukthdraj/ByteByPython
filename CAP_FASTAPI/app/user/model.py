from pydantic import BaseModel

class User(BaseModel):
    name: str
    mobileNumber: str
    userName: str
    password: str
    type: bool
    
