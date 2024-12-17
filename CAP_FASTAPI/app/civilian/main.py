from fastapi import FastAPI
from .route import civilian_router

app = FastAPI()

app.include_router(civilian_router, prefix="/civilian")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
