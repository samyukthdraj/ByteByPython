from typing import List
from fastapi import APIRouter, HTTPException, Depends
from .model import User
from .service import create_user, get_user, update_user, delete_user, get_all_users

user_router = APIRouter()

@user_router.post("/users/", response_model=User)
def create_user_route(user: User):
    return create_user(user)

@user_router.get("/users/{user_name}", response_model=User)
def get_user_route(user_name: str):
    user = get_user(user_name)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user_router.get("/users", response_model=List[User])
def get_all_users_route():
    users = get_all_users()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return users

@user_router.put("/users/{user_name}", response_model=User)
def update_user_route(user_name: str, updated_user: User):
    if not update_user(user_name, updated_user):
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@user_router.delete("/users/{user_name}", response_model=bool)
def delete_user_route(user_name: str):
    if not delete_user(user_name):
        raise HTTPException(status_code=404, detail="User not found")
    return True
