from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.user.route import user_router
from app.incidents.route import incident_router
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
app.include_router(user_router)
app.include_router(incident_router)

