from fastapi import FastAPI
from .route import police_router

app = FastAPI()

app.include_router(police_router, prefix="/police")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)