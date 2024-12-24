from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from .model import Police
from .service import post_policeStation, get_policeStationDetails
from ..auth import get_current_user

police_router = APIRouter()

@police_router.post("/post/policeStation", response_model=Police, status_code=status.HTTP_201_CREATED)
def post_police_route(police: Police):
    return post_police(police)

@police_router.get("/get/policeStationDetails", response_model=Police)
def get_policeStationDetails_route(current_user: dict = Depends(get_current_user)):
    police = get_policeStationDetails()
    if police is None:
        raise HTTPException(status_code=404, detail="Details not found") # Use HTTPException for consistency
    return police