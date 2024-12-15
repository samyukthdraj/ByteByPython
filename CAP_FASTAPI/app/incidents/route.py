from typing import List
from fastapi import APIRouter, HTTPException
from .model import Incident
from .service import post_incident, get_all_incidents, get_incidents_by_username

incident_router = APIRouter()

@incident_router.post("/post/incident", response_model=Incident)
def post_incident_route(incident: Incident):
    try:
        return post_incident(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@incident_router.get("/getAll/incidents", response_model=List[Incident])
def get_all_incidents_route():
    try:
        return get_all_incidents()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@incident_router.get("/get/incidentsByUsername/{username}", response_model=List[Incident])
def get_incidents_by_username_route(username: str):
    try:
        return get_incidents_by_username(username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
