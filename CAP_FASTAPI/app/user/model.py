from pydantic import BaseModel, validator, Field
from enum import Enum

class UserTypeEnum(str, Enum):
    police = "1"  # 1 represents "police"
    civilan = "2"  # 2 represents "civilian"


class User(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    mobileNumber: str
    username: str
    password: str
    userType: UserTypeEnum

    @validator("userType", pre=True)
    def validate_userType(cls, value: str) -> str:
        mapping ={
            "police" : "1",
            "civilian" : "2"
        }
        if value in mapping:
            return mapping[value]
        if value in mapping.values():
            return value
        raise ValueError("Invalid type value. Must be one of: 'police' or 'civilian'")
