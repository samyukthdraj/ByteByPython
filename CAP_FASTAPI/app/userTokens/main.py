from fastapi import FastAPI
from app.userTokens.route import token_router


app = FastAPI()

# Include routers

app.include_router(token_router, prefix="/userToken")
