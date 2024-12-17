from typing import List
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.exceptions import HTTPException #Corrected import
from .model import Incident, DescriptionResponse, ImageRequest, GetIncident
from pydantic import BaseModel 
from .service import post_incident, get_all_incidents, get_incidents_by_username, get_image_description
from datetime import datetime
from pathlib import Path
import base64

incident_router = APIRouter()

@incident_router.post("/post/getImageDescription", response_model=DescriptionResponse)
async def post_image_description(request:ImageRequest):  # Changed to accept base64 directly
    try:
        description = await get_image_description(request.image)
        return {"description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@incident_router.post("/post/incident", response_model=Incident)
def post_incident_route(incident: Incident):
    try:
        return post_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@incident_router.get("/get/AllIncident", response_model=List[Incident])
def get_all_incidents_route():
    try:
        return get_all_incidents()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@incident_router.get("/get/incidentByUserId/{_id}", response_model=List[GetIncident])
def get_incidents_by_username_route(username: str):
    try:
        return get_incidents_by_username(username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))