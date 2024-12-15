from fastapi import FastAPI
from app.incidents.route import incident_router


app = FastAPI()

# Include routers

app.include_router(incident_router, prefix="/incident")
