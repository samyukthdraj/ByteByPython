from pydantic import BaseModel, Field
from typing import Optional
import bcrypt
from fastapi import HTTPException, status
from .model import Login, LoginResponse
from ..database import civilian_collection, police_collection

def post_login(loginUserDetails: Login):
    user = civilian_collection.find_one({"username": loginUserDetails.username})
    if user:
        if bcrypt.checkpw(loginUserDetails.password.encode('utf-8'), user["password"].encode('utf-8')):
            return LoginResponse(_id=str(user["_id"]),name=str(user["name"]), userType="civilian")  # More descriptive userType
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password for civilian.",
            )

    user = police_collection.find_one({"username": loginUserDetails.username})
    if user:
        if bcrypt.checkpw(loginUserDetails.password.encode('utf-8'), user["password"].encode('utf-8')):
            return LoginResponse(_id=str(user["_id"]),name=str(user["stationName"]), userType="police")  # More descriptive userType
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password for police.",
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password.",
    )