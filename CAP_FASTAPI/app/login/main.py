from fastapi import FastAPI
from .route import login_router

app = FastAPI()

app.include_router(login_router, prefix="/login")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
