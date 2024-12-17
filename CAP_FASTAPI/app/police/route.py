from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from .model import Police
from .service import post_police

police_router = APIRouter()

@police_router.post("/post/police", response_model=Police, status_code=status.HTTP_201_CREATED)
def post_police_route(police: Police):
    return post_police(police)