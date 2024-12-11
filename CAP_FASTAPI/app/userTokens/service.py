from typing import List, Optional
from datetime import datetime
from bson.objectid import ObjectId
from .token import Token  # Assuming Token is a Pydantic model
from ..database import token_collection

class TokenService:
    def __init__(self, token_collection):
        self.token_collection = token_collection

    # Function to create a new token
    def create_token(self, token_data: Token) -> dict:
        token_data_dict = token_data.dict()  # Convert Pydantic model to dict
        token_data_dict["startDate"] = datetime.now()  # Add startDate if missing
        result = self.token_collection.insert_one(token_data_dict)  # Insert into the collection
        if result.acknowledged:
            return {"id": str(result.inserted_id)}  # Return the inserted token's ID
        raise Exception("Failed to add token")

    # Function to get all tokens
    def get_tokens(self) -> List[Token]:
        tokens_cursor = self.token_collection.find()  # Query all tokens
        tokens_list = [Token(**token) for token in tokens_cursor]  # Convert documents to Token objects
        return tokens_list

    # Function to get a token by its ID
    def get_token_by_id(self, token_id: str) -> Optional[Token]:
        try:
            token_document = self.token_collection.find_one({"_id": ObjectId(token_id)})
            if token_document:
                return Token(**token_document)  # Return the token as a Token object
        except Exception as e:
            print(f"Error fetching token: {e}")
        return None

    # Function to delete a token by its ID
    def delete_token(self, token_id: str) -> dict:
        result = self.token_collection.delete_one({"_id": ObjectId(token_id)})  # Delete token
        if result.deleted_count > 0:
            return {"success": True, "message": "Token deleted"}  # Return success message
        return {"error": "Token not found"}
