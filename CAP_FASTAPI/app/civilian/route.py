from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from .model import Civilian, GetCivilianDetailsById
from .service import post_civilian, get_civilianDetailsById

civilian_router = APIRouter()

@civilian_router.post("/post/civilian", response_model=Civilian, status_code=status.HTTP_201_CREATED)
def post_civilian_route(civilian: Civilian):
    return post_civilian(civilian)

@civilian_router.get("/get/civilianDetailsById/{id}", response_model=GetCivilianDetailsById)
def get_civilianDetailsById_route(id: str):
    user = get_civilianDetailsById(id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found") # Use HTTPException for consistency
    return user
