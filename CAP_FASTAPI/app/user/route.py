from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from .model import User
from .service import post_user, get_user_by_username, get_all_users, get_userById
 
user_router = APIRouter()
 
@user_router.post("/post/user", response_model=User)
def post_user_route(user: User):
    return post_user(user)
 
@user_router.get("/get/userByUserName/{user_name}", response_model=User)
def get_user_route(user_name: str):
    user = get_user_by_username(user_name)
    if user is None:
        return JSONResponse(status_code=404, content={"detail": "User not found"})
    return user

@user_router.get("/get/users", response_model=List[User])
def get_all_users_route():
    users = get_all_users()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return users

@user_router.get("/get/userById/{id}", response_model=User)
def get_userById_route(id: str):
    user = get_userById(id)
    if user is None:
        return JSONResponse(status_code=404, content={"detail": "User not found"})
    return user