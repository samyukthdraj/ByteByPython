from typing import List, Optional
from .model import User, UserTypeEnum
from ..database import user_collection
from uuid import uuid4, UUID
import uuid

def get_all_users() -> List[User]:
    # Fetch all user documents from MongoDB
    users_collection_response = user_collection.find()
    
    # Map _id correctly when converting documents to User instances
    users_list = []
    for user in users_collection_response:
        # Ensure _id is a string
        user['_id'] = str(user['_id'])
        print(user)
        # Create User instance using unpacking with ** operator
        users_list.append(User(**user))
    print(users_list)
    return users_list

def get_user_by_username(username: str) -> Optional[User]:
    user_from_db = user_collection.find_one({"username": username})
    if user_from_db:
        # Handle the case where '_id' might not be a string
        if '_id' in user_from_db:
            user_from_db['_id'] = str(user_from_db['_id'])
        return User(**user_from_db)
    return None

def get_userById(_id: str) -> Optional[User]:
    # Ensure the _id is treated as a string when querying
    users_collection_response = user_collection.find_one({"_id": _id})
    if users_collection_response:
        # Convert _id to string to ensure compatibility
        if '_id' in users_collection_response:
            users_collection_response['_id'] = str(users_collection_response['_id'])
        return User(**users_collection_response)
    return None

def post_user(new_user: User) -> User:
    # Generate a new UUID v4 for the _id field
    _id = str(uuid4())
    
    new_user._id = _id  # Ensure _id is explicitly set to the UUID string

    user_data = new_user.dict()  # Convert Pydantic model to a dictionary
    user_data["_id"] = _id
    result = user_collection.insert_one(user_data)  # Insert into the collection
    
    if result.acknowledged:
        # Fetch the newly added user to return it
        return get_user_by_username(new_user.username)
    
    raise Exception("Failed to add user")