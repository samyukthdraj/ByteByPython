from fastapi import FastAPI
from .route import user_router

app = FastAPI()

app.include_router(user_router, prefix="/users")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
