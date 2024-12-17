from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from .model import Login, LoginResponse
from .service import post_login

login_router = APIRouter()

@login_router.post("/login", response_model=LoginResponse)
def post_login_route(form_data: OAuth2PasswordRequestForm = Depends()):
    loginUserDetail = Login(username=form_data.username, password=form_data.password) # Create User object from form data
    user = post_login(loginUserDetail) #call asynchronously
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return user  # Return user details (adjust as needed)