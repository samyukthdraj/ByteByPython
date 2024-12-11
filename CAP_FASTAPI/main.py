
from fastapi import FastAPI
from app.user.route import user_router
from app.userTokens.route import token_router
app = FastAPI()

# Include user routes
app.include_router(user_router)
app.include_router(token_router)

# Define root endpoint

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application"}
