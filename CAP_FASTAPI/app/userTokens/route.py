from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.database import token_collection
from .token import Token
from .service import TokenService

token_router = APIRouter()
token_service = TokenService(token_collection)


@token_router.post("/post/token", response_model=dict)
def create_token(token: Token):
    result = token_service.create_token(token.dict())
    return {"success": True, "data": result}

@token_router.get("/getAll/tokens", response_model=list)
def get_all_tokens():
    return token_service.get_tokens()

@token_router.get("/getTokenByUserName/token/{token_id}", response_model=dict)
def get_token(token_id: str):
    token = token_service.get_token_by_id(token_id)
    if "error" in token:
        raise HTTPException(status_code=404, detail=token["error"])
    return token

@token_router.delete("/token/{token_id}", response_model=dict)
def delete_token(token_id: str):
    result = token_service.delete_token(token_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
