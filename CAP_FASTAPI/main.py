from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.civilian.route import civilian_router
from app.incidents.route import incident_router
from app.police.route import police_router
from app.login.route import login_router
app = FastAPI()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include user routes
app.include_router(civilian_router)
app.include_router(incident_router)
app.include_router(police_router)
app.include_router(login_router)

