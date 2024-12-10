from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    name: str
    mobileNumber: str
    userName: str
    password: str
    type: bool