from typing import List
from .model import User
from ..database import user_collection
# Sample in-memory storage to simulate a database
users_db = []

def create_user(user: User) -> User:
    users_db.append(user)
    return user

def get_user(user_name: str) -> User:
    for user in users_db:
        if user.userName == user_name:
            return user
    return None

def get_all_users() -> List[User]:
    # Query the user collection to get all users
    users_cursor = user_collection.find()
    users_list = [User(**user) for user in users_cursor]
    
    return users_list


def update_user(user_name: str, updated_user: User) -> bool:
    for i, user in enumerate(users_db):
        if user.userName == user_name:
            users_db[i] = updated_user
            return True
    return False

def delete_user(user_name: str) -> bool:
    global users_db
    users_db = [user for user in users_db if user.userName != user_name]
    return True
