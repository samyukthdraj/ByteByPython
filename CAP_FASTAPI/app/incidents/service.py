import base64
from typing import List, Optional
from bson.objectid import ObjectId
from .model import Incident, DescriptionResponse
from datetime import datetime
from ..database import user_collection
from ..database import incident_collection
from ..database import images_collection
import google.generativeai as genai
from fastapi.exceptions import HTTPException
from PIL import Image
from io import BytesIO
import os
async def get_image_description(base64_image: str) -> str:
    try:
        # Set API key directly
        os.environ["GOOGLE_API_KEY"] = "AIzaSyCxDkmeh9i9av4ZA_qJ42FxyQgm-6X4rOY"  # Replace with your actual API key

        # Configure API with the key
        genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

        # Debug: Verify API key is set
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            print("Error: API key not set. Please set the GOOGLE_API_KEY environment variable.")
            exit(1)
        else:
            print("API key set successfully.")

        # Convert base64 string to image
        image_data = base64.b64decode(base64_image)
        image = Image.open(BytesIO(image_data))

        # Ensure the image was opened correctly
        if image is None:
            print("Error: Unable to open image.")
            return "Error: Unable to open image."

        # Example placeholder method for Generative AI (update based on the actual API docs)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(["Identify if there is any crime depicted in this image. If a crime is present, then create a response like crime:True or False, typeOfCrime: Type of crime, description: Brief description of the crime",image])
        print(response.text)
        # Return the response text
        return response.text

    except Exception as e:
        print(f"An error occurred: {e}")
        return f"An error occurred: {e}"

def post_incident(new_incident: Incident) -> Incident:
    incident_data = new_incident.dict()
    result = incident_collection.insert_one(incident_data)
    if result.acknowledged:
        incident_data["id"] = str(result.inserted_id)
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
