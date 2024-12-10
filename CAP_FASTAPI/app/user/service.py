from typing import List, Optional
from .model import User
from ..database import user_collection

# Function to get all users
def get_all_users() -> List[User]:
    users_cursor = user_collection.find()
    users_list = [User(**user) for user in users_cursor]   
    return users_list

# Function to get a user by username
def get_user_by_username(username: str) -> Optional[User]:
    user_document = user_collection.find_one({"userName": username})
    if user_document:
        return User(**user_document)
    return None

# Function to post (create) a new user
def post_user(new_user: User) -> User:
    user_data = new_user.dict()  # Convert Pydantic model to a dictionary
    result = user_collection.insert_one(user_data)  # Insert into the collection
    if result.acknowledged:
        # Fetch the newly added user to return it
        return get_user_by_username(new_user.userName)  # Fetch user by username
    raise Exception("Failed to add user")

