from typing import List
from fastapi import APIRouter, HTTPException, Depends
from .model import User
from .service import post_user, get_user_by_username, get_all_users

user_router = APIRouter()

@user_router.post("/users/", response_model=User)
def post_user_route(user: User):
    return post_user(user)

@user_router.get("/users/{user_name}", response_model=User)
def get_user_route(user_name: str):
    user = get_user_by_username(user_name)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user_router.get("/users", response_model=List[User])
def get_all_users_route():
    users = get_all_users()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return users

