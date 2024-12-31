from fastapi import HTTPException, status
from ..auth import create_access_token  # Import the token generation function
from .model import Login, LoginResponse
import bcrypt
from ..database import civilian_collection, police_collection

# Function to authenticate the user and generate token
def post_login(loginUserDetails: Login):
    # Check if username and password are provided
    if not loginUserDetails.username or not loginUserDetails.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required."
        )
    
    # Check civilian collection
    user = civilian_collection.find_one({"username": loginUserDetails.username})
    if user:
        if bcrypt.checkpw(loginUserDetails.password.encode('utf-8'), user["password"].encode('utf-8')):
            token_data = {"sub": user["username"], "userType": "civilian"}
            access_token = create_access_token(data=token_data)  # Create token
            return LoginResponse(_id=str(user["_id"]), name=str(user["name"]), userType="civilian", access_token=access_token)

    # Check police collection
    user = police_collection.find_one({"username": loginUserDetails.username})
    if user:
        if bcrypt.checkpw(loginUserDetails.password.encode('utf-8'), user["password"].encode('utf-8')):
            token_data = {"sub": user["username"], "userType": "police"}
            access_token = create_access_token(data=token_data)  # Create token
            return LoginResponse(_id=str(user["_id"]), name=str(user["stationName"]), userType="police", access_token=access_token)

    # If no user is found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password."
    )
