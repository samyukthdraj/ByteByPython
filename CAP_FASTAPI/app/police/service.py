from typing import List, Optional
import bcrypt
from uuid import uuid4
from fastapi import FastAPI, HTTPException, status, Depends
from pymongo.errors import DuplicateKeyError, PyMongoError
from .model import Police
from ..database import police_collection

def post_police(new_police: Police) -> None:
    existing_user = police_collection.find_one({"username": new_police.username})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    hashed_password = bcrypt.hashpw(new_police.password.encode('utf-8'), bcrypt.gensalt())
    new_police.password = hashed_password.decode('utf-8')

    _id = str(uuid4())
    new_police._id = _id
    police_data = new_police.model_dump(exclude={"id"})
    police_data["_id"] = _id

    try:
        result = police_collection.insert_one(police_data)
        if result.acknowledged:
            #Success!
            raise HTTPException(status_code=status.HTTP_201_CREATED, detail="User created successfully")
        else:
            raise Exception("Failed to add user; insert_one acknowledged is False") #More specific error message
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    except PyMongoError as e: # Catch specific pymongo errors.
        print(f"MongoDB error: {e}") #Log this error for debugging.  Don't send it to the user.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="A database error occurred.")