from pydantic import BaseModel, Field, field_validator

class UserType:
    POLICE = "police"
    CIVILIAN = "civilian"

class User(BaseModel):
    name: str
    mobileNumber: str
    username: str
    password: str
    type: str

    @field_validator("type")
    def validate_type(cls, v):
        if v not in [UserType.POLICE, UserType.CIVILIAN]:
            raise ValueError('Invalid user type')
        return v
