from typing import List
from fastapi import APIRouter, Request, UploadFile, File, Depends, Security
from fastapi.exceptions import HTTPException #Corrected import
from .model import Incident, DescriptionResponse,DescriptionRequest, GetIncident, UpdateIncidentStatus
from pydantic import BaseModel 
from .service import post_incident, get_allIncident, post_getImageDescription, post_getAudioDescription, get_incidentByUserId, put_updateIncidentStatus, post_uploadFileToDrive, delete_removeFileFromDrive, get_downloadFileFromDrive
from datetime import datetime
from pathlib import Path
import base64
import os
import shutil
from ..auth import get_current_user
from fastapi.security import OAuth2PasswordBearer

incident_router = APIRouter()

@incident_router.post("/uploadFileToDrive", tags=["Incident"])
async def post_uploadFileToDrive_route(file: UploadFile = File(...)):
    try:
        response = await post_uploadFileToDrive(file)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")

@incident_router.delete("/removeFileFromDrive/{id}", tags=["Incident"])
async def delete_removeFileFromDrive_route(id: str):
    try:
        response = await delete_removeFileFromDrive(id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")

@incident_router.get("/downloadFileFromDrive/{id}", tags=["Incident"])
async def get_downloadFileFromDrive_route(id: str):
    try:
        response = await get_downloadFileFromDrive(id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")

@incident_router.post("/post/getAudioDescription", response_model=dict)
async def post_getAudioDescription_route(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        description = await post_getAudioDescription(file)
        return {"description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")
 
@incident_router.post("/post/getImageDescription", response_model=DescriptionResponse)
async def post_getImageDescription_route(file: UploadFile = File(...)):  # Changed to accept base64 directly
    try:
        description = await post_getImageDescription(file)
        return {"description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
 
@incident_router.post("/post/incident", response_model=Incident)
def post_incident_route(incident: Incident, current_user: dict = Depends(get_current_user)):
    try:
        return post_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@incident_router.put("/update/incidentStatus")
def put_updateIncidentStatus_route(updateIncidentStatus: UpdateIncidentStatus, current_user: dict = Depends(get_current_user)):
    try:
        return put_updateIncidentStatus(updateIncidentStatus)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@incident_router.get("/get/AllIncident", response_model=List[GetIncident])
def get_allIncidents_route(current_user: dict = Depends(get_current_user)):
    try:
        return get_allIncident()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@incident_router.get("/get/incidentByUserId/{id}", response_model=List[GetIncident])
def get_incidentByUserId_route(
    id: str,
    current_user: dict = Depends(get_current_user)  # Validate token and retrieve user
):
    # Check the role of the user
    if current_user["userType"] != "civilian":
        raise HTTPException(status_code=403, detail="Access forbidden: Insufficient permissions")
    
    # Fetch incidents for the user
    incident = get_incidentByUserId(id)
    if incident is None:
        raise HTTPException(status_code=404, detail="No incidents found")
    return incident