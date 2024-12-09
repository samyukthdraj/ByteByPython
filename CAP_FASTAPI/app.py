from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import uuid
from bson.objectid import ObjectId
from typing import List

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust origins as per your requirement
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Setup
client = MongoClient('mongodb://localhost:27017/')
db = client['test']
collection = db['user']

# Helper function to convert MongoDB documents to JSON
def mongo_to_json(data):
    if isinstance(data, list):
        return [{**doc, "_id": str(doc["_id"])} for doc in data]
    elif data:
        data["_id"] = str(data["_id"])
        return data
    return None

@app.get("/data", response_model=List[dict])
async def get_data():
    """
    Get all documents from the collection.
    """
    try:
        data = list(collection.find())
        return mongo_to_json(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/data", response_model=dict, status_code=201)
async def add_data(content: dict):
    """
    Add a new document to the collection.
    """
    try:
        content["_id"] = str(uuid.uuid4())
        collection.insert_one(content)
        return {"message": "Data added successfully", "id": content["_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/{data_id}", response_model=dict)
async def get_data_by_id(data_id: str):
    """
    Get a document by its _id.
    """
    try:
        data = collection.find_one({"_id": data_id})
        if not data:
            raise HTTPException(status_code=404, detail="Data not found")
        return mongo_to_json(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
