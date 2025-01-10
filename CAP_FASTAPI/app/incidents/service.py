import os
import io
from io import BytesIO
import uuid
from uuid import uuid4
import traceback
import base64
import time
import tempfile
import shutil
from PIL import Image
import assemblyai as aai
from datetime import datetime
from typing import List, Optional
from bson.objectid import ObjectId
from ..database import incident_collection, civilian_collection, police_collection
from .model import Incident, DescriptionResponse,DescriptionRequest, GetIncident, UpdateIncidentStatus
from fastapi import FastAPI, HTTPException, status, Depends, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from pymongo.errors import DuplicateKeyError, PyMongoError
import google.generativeai as genai
from google.cloud import speech
from google.cloud import speech
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload, MediaIoBaseUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError
from cachetools import TTLCache


cache = TTLCache(maxsize=1024, ttl=3600)

async def get_downloadFileFromDrive(file_id: str):
    """Downloads a file from Google Drive, using caching and async operations."""
    if file_id in cache:
        file_data, mime_type, filename = cache[file_id]
        return StreamingResponse(iter(file_data), media_type=mime_type, headers={"Content-Disposition": f"attachment; filename={filename}"})

    try:
        # ... (Your Google Drive API credentials loading remains the same) ...
        credentials_info = {
            "type": os.getenv("TYPE"),
            "project_id": os.getenv("GOOGLE_PROJECT_ID"),
            "private_key_id": os.getenv("GOOGLE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("GOOGLE_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("GOOGLE_CLIENT_EMAIL"),
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "auth_uri": os.getenv("GOOGLE_AUTH_URI"),
            "token_uri": os.getenv("GOOGLE_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.getenv("GOOGLE_AUTH_PROVIDER_CERT_URL"),
            "client_x509_cert_url": os.getenv("GOOGLE_CLIENT_CERT_URL"),
        }

        DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID")
        SCOPES = ["https://www.googleapis.com/auth/drive"]

        credentials = Credentials.from_service_account_info(credentials_info, scopes=SCOPES)

        drive_service = build("drive", "v3", credentials=credentials)

        file_metadata = drive_service.files().get(fileId=file_id, fields='name,mimeType,webViewLink').execute()
        file_name = file_metadata['name']
        mime_type = file_metadata['mimeType']

        request = drive_service.files().get_media(fileId=file_id)
        fh = BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()

        fh.seek(0)
        # **Crucial Change:** Directly yield from the file-like object
        return StreamingResponse(fh, media_type=mime_type, headers={"Content-Disposition": f"attachment; filename={file_name}"})

    except Exception as e:
        if hasattr(e, 'resp') and hasattr(e.resp, 'status'): #More robust error handling
            raise HTTPException(status_code=e.resp.status, detail=f"Google Drive API Error: {e}")
        else:
            print(f"Error: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")

async def post_getAudioDescription(file: UploadFile):
    try:
        # Save the uploaded file to a temporary directory
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(await file.read())
            temp_audio_path = temp_audio.name

        # Initialize AssemblyAI transcriber
        transcriber = aai.Transcriber()

        # Create transcription configuration
        config = aai.TranscriptionConfig(speaker_labels=True)

        # Transcribe the audio file
        transcript = transcriber.transcribe(temp_audio_path, config)

        # Check for transcription errors
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")

        # Prepare the response with speaker-labeled transcription
        transcription_text = transcript.text
        speaker_utterances = [
            {"speaker": utterance.speaker, "text": utterance.text}
            for utterance in transcript.utterances
        ]

        # Combine results into a structured response
        result = {
            "transcription_text": transcription_text,
            "speaker_utterances": speaker_utterances,
        }

        return result

    except Exception as e:
        # Handle specific error and return a clear response
        if 'NoneType' in str(e):
            return {    
                "transcription_text":"Couldn't transcribe text from audio."
            }
        else:
            return {"error": f"Error during transcription: {str(e)}"}

    finally:
        # Clean up the temporary file
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

async def post_uploadFileToDrive(file: UploadFile = File(...)):
    try:
        # Load credentials from environment variables
        credentials_info = {
            "type": os.getenv("TYPE"),
            "project_id": os.getenv("GOOGLE_PROJECT_ID"),
            "private_key_id": os.getenv("GOOGLE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("GOOGLE_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("GOOGLE_CLIENT_EMAIL"),
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "auth_uri": os.getenv("GOOGLE_AUTH_URI"),
            "token_uri": os.getenv("GOOGLE_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.getenv("GOOGLE_AUTH_PROVIDER_CERT_URL"),
            "client_x509_cert_url": os.getenv("GOOGLE_CLIENT_CERT_URL"),
        }

        DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID")
        SCOPES = ["https://www.googleapis.com/auth/drive"]

        # Authenticate with Google Drive API
        credentials = Credentials.from_service_account_info(credentials_info, scopes=SCOPES)
        drive_service = build("drive", "v3", credentials=credentials)

        # Create a temporary file to save the uploaded content
        temp_file_path = tempfile.mkdtemp()
        temp_file_name = os.path.join(temp_file_path, file.filename)

        # Save the uploaded file to the temporary file
        with open(temp_file_name, "wb") as buffer_file:
            shutil.copyfileobj(file.file, buffer_file)

        # Set file metadata
        file_metadata = {"name": file.filename, "parents": [DRIVE_FOLDER_ID]}

        # Upload the file to Google Drive
        with open(temp_file_name, "rb") as f:
            media = MediaIoBaseUpload(f, mimetype=file.content_type, resumable=True)
            request = drive_service.files().create(body=file_metadata, media_body=media, fields="id, webViewLink")

            response = None
            while response is None:
                try:
                    status, response = request.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        print(f"Uploaded {progress}%")
                except Exception as e:
                    if "rateLimitExceeded" in str(e):
                        print("Rate limit exceeded, waiting...")
                        time.sleep(60)
                    else:
                        raise

        # Retrieve file ID
        file_id = response.get("id")
        if not file_id:
            raise Exception("Upload successful, but file ID not found in the response.")

        # Make the file public
        permission = {"type": "anyone", "role": "reader"}
        drive_service.permissions().create(fileId=file_id, body=permission).execute()

        # Get the direct file link
        file_details = drive_service.files().get(fileId=file_id, fields="id, webViewLink, webContentLink").execute()
        web_content_link = file_details.get("webContentLink")
        web_view_link = file_details.get("webViewLink")

        if not web_content_link:
            raise Exception("Failed to get the web content link for the file.")

        # Clean up temporary files
        shutil.rmtree(temp_file_path)

        # Return a success response with the direct link
        return JSONResponse(
            content={
                "message": "File uploaded successfully",
                "file_id": file_id,
                "webViewLink": web_view_link,
                "webContentLink": web_content_link,
            },
            status_code=200,
        )

    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        print(error_message)
        traceback.print_exc()  # Print the full traceback for debugging

        # Handle specific error types
        if "Permission denied" in str(e):
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        else:
            raise HTTPException(status_code=500, detail=error_message)
        
async def delete_removeFileFromDrive(fileId:str):
    try:
        # Load credentials from environment variables
        credentials_info = {
            "type": os.getenv("TYPE"),
            "project_id": os.getenv("GOOGLE_PROJECT_ID"),
            "private_key_id": os.getenv("GOOGLE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("GOOGLE_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("GOOGLE_CLIENT_EMAIL"),
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "auth_uri": os.getenv("GOOGLE_AUTH_URI"),
            "token_uri": os.getenv("GOOGLE_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.getenv("GOOGLE_AUTH_PROVIDER_CERT_URL"),
            "client_x509_cert_url": os.getenv("GOOGLE_CLIENT_CERT_URL"),
        }

        DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID")
        SCOPES = ["https://www.googleapis.com/auth/drive"]

        # Authenticate with Google Drive API
        credentials = Credentials.from_service_account_info(credentials_info, scopes=SCOPES)
        drive_service = build("drive", "v3", credentials=credentials)

        drive_service.files().delete(fileId=fileId).execute()

        return JSONResponse(
            content={"message": "File deleted successfully"}, status_code=200
        )

    except HttpError as e:
        error_message = f"An error occurred: {str(e)}"
        print(error_message)
        traceback.print_exc()

        # Handle specific error types (more specific error handling could be added here)
        if e.resp.status == 404:
            raise HTTPException(status_code=404, detail="File not found.")
        elif e.resp.status == 403:
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        else:
            raise HTTPException(status_code=500, detail=error_message)
    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        print(error_message)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_message)

async def post_getImageDescription(file: UploadFile):
    try:
        # Ensure the API key is set
        api_key = os.getenv("API_KEY")
        if not api_key:
            print("Error: API key not set. Please set the GOOGLE_API_KEY environment variable.")
            return "Error: API key not set."

        # Initialize the genai configuration
        genai.configure(api_key=api_key)

        # Read the uploaded file (ensure the file is an image)
        file_content = await file.read()
        image = Image.open(io.BytesIO(file_content))
        # Assuming 'file_content' is the image to be analyzed
        prompt = f"""Identify if there is any crime depicted in the following image. 
        If a crime is present, respond with 'crime:True, typeOfCrime:<type>, description:<description>'. 
        Otherwise, respond with 'crime:False'."""
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([prompt,image])

        # Log the response from the AI model
        print(response.text)

        return response.text

    except Exception as e:
        print(f"An error occurred in image analysis: {e}")
        return f"An error occurred in image analysis: {e}"
        
def put_updateIncidentStatus(updateIncidentStatus: UpdateIncidentStatus) -> dict:
    try:
        # Perform the update operation
        result = incident_collection.update_one(
            { "_id": updateIncidentStatus.id },  # Match by id
            { "$set": { "status": updateIncidentStatus.status } }  # Update the status
        )

        # Check if the update was successful
        if result.matched_count == 0:
            # No document matched the query
            raise HTTPException(status_code=404, detail="Incident not found.")
        
        if result.modified_count == 0:
            # Document was found, but the status was not updated
            return {
                "success": False,
                "message": "Status update was not applied. It might already have the same value."
            }

        # Successful update
        return {
            "success": True,
            "message": "Incident status updated successfully."
        }

    except Exception as e:
        # Handle any unexpected errors
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


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