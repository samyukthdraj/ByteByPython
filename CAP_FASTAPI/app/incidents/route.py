from typing import List
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.exceptions import HTTPException #Corrected import
from .model import Incident, DescriptionResponse, ImageRequest, GetIncident
from pydantic import BaseModel 
from .service import post_incident, get_allIncident, post_getImageDescription, get_incidentByUserId
from datetime import datetime
from pathlib import Path
import base64

incident_router = APIRouter()

@incident_router.post("/post/getImageDescription", response_model=DescriptionResponse)
async def post_getImageDescription_route(request:ImageRequest):  # Changed to accept base64 directly
    try:
        description = await post_getImageDescription(request.image)
        return {"description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@incident_router.post("/post/incident", response_model=Incident)
def post_incident_route(incident: Incident):
    try:
        return post_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@incident_router.get("/get/AllIncident", response_model=List[GetIncident])
def get_allIncidents_route():
    try:
        return get_allIncident()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@incident_router.get("/get/incidentByUserId/{id}", response_model=List[GetIncident])
def get_incidentByUserId_route(id: str):
    incident = get_incidentByUserId(id) 
    if incident is None:
        raise HTTPException(status_code=404, detail="No Incidents") # Use HTTPException for consistency
    return incident