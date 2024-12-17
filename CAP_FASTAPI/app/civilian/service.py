from typing import List, Optional
import bcrypt
from uuid import uuid4
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.errors import DuplicateKeyError, PyMongoError
from .model import Civilian, GetCivilianDetailsById
from ..database import civilian_collection

def post_civilian(new_civilian: Civilian) -> None:
    existing_user = civilian_collection.find_one({"username": new_civilian.username})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    hashed_password = bcrypt.hashpw(new_civilian.password.encode('utf-8'), bcrypt.gensalt())
    new_civilian.password = hashed_password.decode('utf-8')

    _id = str(uuid4())
    new_civilian._id = _id
    civilian_data = new_civilian.model_dump(exclude={"id"})
    civilian_data["_id"] = _id

    try:
        result = civilian_collection.insert_one(civilian_data)
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



def get_civilianDetailsById(_id: str) -> Optional[GetCivilianDetailsById]:
    # Ensure the _id is treated as a string when querying
    civilian_collection_response = civilian_collection.find_one({"_id": _id},{"name": 1, "mobileNumber": 1})
    if civilian_collection_response:
        # Convert _id to string to ensure compatibility
        if '_id' in civilian_collection_response:
            return GetCivilianDetailsById(**civilian_collection_response)
    return None