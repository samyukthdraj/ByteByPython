from typing import List, Optional
from bson.objectid import ObjectId
from .model import Incident
from ..database import incident_collection
from ..database import user_collection

from datetime import datetime

def post_incident(new_incident: Incident) -> Incident:
    incident_data = new_incident.dict()
    # incident_data["startDate"] = datetime.utcnow()  # Set the startDate field
    # incident_data["status"] = "1"  # Set the status field
    
    result = incident_collection.insert_one(incident_data)
    if result.acknowledged:
        incident_data["id"] = str(result.inserted_id)  # Add the inserted ID to the response
        return Incident(**incident_data)
    
    raise Exception("Failed to add new incident")

def get_incidents_by_username(username: str) -> List[Incident]:
    incidents = incident_collection.find({"username": username})
    return [Incident(**{**incident, "id": str(incident["_id"])}) for incident in incidents]

def get_all_incidents() -> List[dict]:
    # Aggregate incidents with user details
    pipeline = [
        {
            '$lookup': {
                'from': 'user',  # Collection to join with
                'localField': 'username',  # Field in the incidents collection
                'foreignField': 'username',  # Field in the users collection
                'as': 'userDetails'  # Name of the new field for the joined documents
            }
        },
        {
            '$unwind': {
                'path': '$userDetails',  # Flatten the array of joined documents
                'preserveNullAndEmptyArrays': True  # Include null when no user details match
            }
        },
        {
            '$project': {
                '_id': 1,  # Include the _id field
                'image': 1,
                'audio': 1,
                'pincode': 1,
                'crimeType': 1,
                'description': 1,
                'policeStationId': 1,
                'username': 1,
                'startDate': 1,
                'status': 1,
                'userDetails.username': 1,
                'userDetails.name': 1,
                'userDetails.mobileNumber': 1
            }
        }
    ]

    # Execute the aggregation pipeline
    incidents = list(incident_collection.aggregate(pipeline))
    
    return [Incident(**{**incident, "id": str(incident["_id"])}) for incident in incidents]