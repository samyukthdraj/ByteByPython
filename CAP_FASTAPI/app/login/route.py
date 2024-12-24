from fastapi import APIRouter, HTTPException, status
from .model import Login, LoginResponse
from .service import post_login  # Importing post_login function

login_router = APIRouter()

@login_router.post("/login", response_model=LoginResponse)
def post_login_route(loginUserDetail: Login):
    user = post_login(loginUserDetail)  # Call the post_login function
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return user  # Return user details along with access token
