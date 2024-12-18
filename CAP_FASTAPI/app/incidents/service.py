import base64
from typing import List, Optional
from bson.objectid import ObjectId
from .model import Incident, DescriptionResponse, GetIncident
from datetime import datetime
from ..database import incident_collection, civilian_collection, police_collection
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, status, Depends
from pymongo.errors import DuplicateKeyError, PyMongoError
from PIL import Image
from io import BytesIO
import uuid
from uuid import uuid4 

import os
async def post_getImageDescription(base64_image: str) -> str:
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

def post_incident(new_incident: Incident) -> None:
    # Generate a new UUID v4 for the _id field
    _id = str(uuid4())
    new_incident._id = _id  # Ensure _id is explicitly set to the UUID

    # Convert the Pydantic model to a dictionary
    incident_data = new_incident.model_dump(exclude={"id"})
    incident_data["_id"] = _id  # Explicitly set the UUID as _id

    try:
        # Insert the incident into the database
        result = incident_collection.insert_one(incident_data)
        if result.acknowledged:
            # Send a success response message
            raise HTTPException(
                status_code=status.HTTP_201_CREATED,
                detail="Incident created successfully."
            )
        else:
            # Handle the case where insert_one is not acknowledged
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create incident; database operation not acknowledged."
            )
    except PyMongoError as e:  # Catch specific pymongo errors
        # Log the error for debugging
        print(f"MongoDB error during incident creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected database error occurred. Please try again later."
        )

def get_allIncident() -> List[GetIncident]:
    # Aggregate incidents with user and police station details
    pipeline = [
        {
            '$lookup': {
                'from': 'civilian',  # Join with the user collection
                'localField': 'userId',  # Field in the incident collection
                'foreignField': '_id',  # Field in the user collection
                'as': 'userDetails'  # Name of the new field for the joined documents
            }
        },
        {
            '$unwind': {
                'path': '$userDetails',  # Flatten the array of joined user documents
                'preserveNullAndEmptyArrays': True  # Include null when no user details match
            }
        },
        {
            '$lookup': {
                'from': 'police',  # Join with the police collection
                'localField': 'policeStationId',  # Field in the incident collection
                'foreignField': '_id',  # Field in the police collection
                'as': 'policeDetails'  # Name of the new field for the joined documents
            }
        },
        {
            '$unwind': {
                'path': '$policeDetails',  # Flatten the array of joined police documents
                'preserveNullAndEmptyArrays': True  # Include null when no police details match
            }
        },
        {
            '$project': {
                '_id': 1,  # Incident ID
                'image': 1,
                'audio': 1,
                'pincode': 1,
                'crimeType': 1,
                'imageDescription': 1,
                'audioDescription': 1,
                'userDescription': 1,
                'startDate': 1,
                'status': 1,
                'userDetails.name': 1,
                'userDetails.mobileNumber': 1,
                'policeDetails.stationName': 1,
                'policeDetails.mobileNumber': 1,
                'policeDetails.location': 1,
                'policeDetails.pincode': 1,
                'policeDetails.latitude': 1,
                'policeDetails.longitude': 1
            }
        }
    ]

    # Execute the aggregation pipeline
    incidents = list(incident_collection.aggregate(pipeline))
    #print(incidents)
    # Map the result to the GetIncident model
    return [
        GetIncident(
            id=str(incident["_id"]),
            image=incident.get("image"),
            audio=incident.get("audio"),
            pincode=incident.get("pincode"),
            crimeType=incident.get("crimeType"),
            imageDescription=incident.get("imageDescription"),
            audioDescription=incident.get("audioDescription"),
            userDescription=incident.get("userDescription"),
            policeStationId=incident.get("policeStationId"),
            startDate=incident.get("startDate"),
            status=incident.get("status"),
            userName=incident.get("userDetails", {}).get("name"),
            userMobileNumber=incident.get("userDetails", {}).get("mobileNumber"),
            policeStationName=incident.get("policeDetails", {}).get("stationName"),
            policeMobileNumber=incident.get("policeDetails", {}).get("mobileNumber"),
            policeStationLocation=incident.get("policeDetails", {}).get("location"),
            policeStationPincode=incident.get("policeDetails", {}).get("pincode"),
            policeStaionlatitude=incident.get("policeDetails", {}).get("latitude"),
            policeStationlongitude=incident.get("policeDetails", {}).get("longitude"),
        )
        for incident in incidents
    ]

def get_incidentByUserId(_id: str) -> List[GetIncident]:
    """Fetches incident details for a given user ID."""
    pipeline = [
    {
        '$match': {  # Add a matching stage to filter by userId
            'userId': _id
        }
    },
    {
        '$lookup': {
        'from': 'civilian',
        'localField': 'userId',
        'foreignField': '_id',
        'as': 'userDetails'
        }
    },
    {
        '$unwind': {
        'path': '$userDetails',
        'preserveNullAndEmptyArrays': True
        }
    },
    {
        '$lookup': {
        'from': 'police',
        'localField': 'policeStationId',
        'foreignField': '_id',
        'as': 'policeDetails'
        }
    },
    {
        '$unwind': {
        'path': '$policeDetails',
        'preserveNullAndEmptyArrays': True
        }
    },
    {
        '$project': {
        '_id': 1,
        'image': 1,
        'audio': 1,
        'pincode': 1,
        'crimeType': 1,
        'imageDescription': 1,
        'audioDescription': 1,
        'userDescription': 1,
        'startDate': 1,
        'status': 1,
        'userDetails.name': 1,
        'userDetails.mobileNumber': 1,
        'policeDetails.stationName': 1,
        'policeDetails.mobileNumber': 1,
        'policeDetails.location': 1,
        'policeDetails.pincode': 1,
        'policeDetails.latitude': 1,
        'policeDetails.longitude': 1
        }
    }
    ]

    incidents = list(incident_collection.aggregate(pipeline))

    #Corrected return statement, after list comprehension
    return [
        GetIncident(
            id=str(incident["_id"]),
            image=incident.get("image"),
            audio=incident.get("audio"),
            pincode=incident.get("pincode"),
            crimeType=incident.get("crimeType"),
            imageDescription=incident.get("imageDescription"),
            audioDescription=incident.get("audioDescription"),
            userDescription=incident.get("userDescription"),
            policeStationId=incident.get("policeStationId"),
            startDate=incident.get("startDate"),
            status=incident.get("status"),
            userName=incident.get("userDetails", {}).get("name"),
            userMobileNumber=incident.get("userDetails", {}).get("mobileNumber"),
            policeStationName=incident.get("policeDetails", {}).get("stationName"),
            policeMobileNumber=incident.get("policeDetails", {}).get("mobileNumber"),
            policeStationLocation=incident.get("policeDetails", {}).get("location"),
            policeStationPincode=incident.get("policeDetails", {}).get("pincode"),
            policeStaionlatitude=incident.get("policeDetails", {}).get("latitude"),
            policeStationlongitude=incident.get("policeDetails", {}).get("longitude"),
        )
        for incident in incidents
    ]