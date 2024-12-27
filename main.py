import uuid
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from datetime import datetime, timedelta
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from fastapi import Form
from backend.crime_detection import analyze_image_detailed
from backend.speech_processing import process_speech_to_text
from backend.database import Database
from backend.models import CrimeReport, PoliceStation, User, Ticket
from typing import List, Optional, Dict
from backend.config import settings
from fastapi import HTTPException
from fastapi.responses import HTMLResponse
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles
import os
from backend.database import Database
import aiohttp
import asyncio
from googleapiclient.http import MediaIoBaseUpload,MediaIoBaseDownload
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from fastapi.responses import StreamingResponse
import webbrowser
import secrets
import hashlib
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import pytz


app = FastAPI()
db = Database()

# @app.on_event("startup")
# async def startup_event():
#     # Open the login page when the server starts
#     webbrowser.open_new_tab("http://127.0.0.1:5500/login.html")

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to the root!"}


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#putting into uploads.
uploads_path = "uploads"
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Function to convert ObjectId fields to strings
def convert_objectid_to_str(data):
    if isinstance(data, list):
        return [{k: str(v) if isinstance(v, ObjectId) else v for k, v in item.items()} for item in data]
    elif isinstance(data, dict):
        return {k: str(v) if isinstance(v, ObjectId) else v for k, v in data.items()}
    return data

# CORS Middleware - Updated Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",  # FastAPI server
        "http://127.0.0.1:8000",  # Alternative localhost
        "http://localhost:5500",   # Your frontend origin (NEW)
        "http://127.0.0.1:5500", #live server origin
        "null",  # For local file access
        "*"  # Be cautious with this in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# OTP storage
otp_storage: Dict[str, Dict] = {}

# Models for Authentication
class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: str = None

class EmailRequest(BaseModel):
    email: EmailStr

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str



# Authentication Utility Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)
    to_encode = data.copy()
    if expires_delta:
        expire = current_time + expires_delta
    else:
        expire = current_time + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

# Forgot Pass functionalities.
def generate_otp() -> str:
    return ''.join(secrets.choice('0123456789') for _ in range(6))

# Email Configuration - Using environment variables with fallbacks
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USERNAME = os.getenv('EMAIL_USERNAME', '')  # Your Gmail
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', '')  # Your App Password
EMAIL_FROM = os.getenv('EMAIL_FROM', EMAIL_USERNAME)

def send_test_email(to_email: str, otp: str) -> bool:
    """Development version - just logs the OTP"""
    # logger.info(f"Development Mode: OTP {otp} would be sent to {to_email}")
    return True

def send_production_email(to_email: str, otp: str) -> bool:
    """Production version - actually sends the email"""
    try:
        message = MIMEMultipart()
        message["From"] = EMAIL_FROM
        message["To"] = to_email
        message["Subject"] = "Password Reset OTP"

        body = f"""
        <html>
            <body>
                <h2>Password Reset OTP</h2>
                <p>Your OTP for password reset is: <strong>{otp}</strong></p>
                <p>This OTP will expire in 5 minutes.</p>
                <p>If you did not request this password reset, please ignore this email.</p>
            </body>
        </html>
        """
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=30) as server:
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.send_message(message)
        return True
    except smtplib.SMTPAuthenticationError as e:
        return False
    except smtplib.SMTPException as e:
        return False
    except Exception as e:
        return False

# Fix the email sender selection
send_email = send_test_email if os.getenv('DEV_MODE', '').lower() == 'true' else send_production_email

def is_rate_limited(email: str) -> bool:
# Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)
    if email in otp_storage:
        last_attempt = otp_storage[email].get('last_attempt')
        if last_attempt and (current_time - last_attempt) < timedelta(minutes=1):
            return True
    return False

def hash_otp(otp: str, email: str) -> str:
    """Create a salted hash of the OTP."""
    salt = email.encode()
    return hashlib.sha256(otp.encode() + salt).hexdigest()

def send_otp_email(email: str, otp: str) -> bool:
    """Send OTP email with improved security and error handling."""
    try:
        sender_email = os.getenv("SMTP_EMAIL")
        sender_password = os.getenv("SMTP_PASSWORD")
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        msg = MIMEText(
            f'Your OTP for password reset is: {otp}\n'
            f'This OTP will expire in 5 minutes.\n'
            f'If you did not request this reset, please ignore this email.'
        )
        msg['Subject'] = 'Password Reset OTP'
        msg['From'] = sender_email
        msg['To'] = email

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [email], msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Authentication Routes
@app.post("/send-otp")
async def send_otp(request: EmailRequest):
    try:
        # Get current time in IST
        ist = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(ist)
        # Generate OTP
        otp = ''.join(secrets.choice('0123456789') for _ in range(6))
        # Store OTP
        otp_storage[request.email] = {
            'otp': otp,
            'created_at': current_time,
            'attempts': 0
        }

        # Send OTP
        if send_production_email(request.email, otp):
            return {"success": True, "message": "OTP sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Server error: {str(e)}"}
        )

@app.post("/verify-otp")
async def verify_otp(verification: OTPVerification):
    try:
        stored = otp_storage.get(verification.email)
        if not stored:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No OTP request found"}
            )
        # Get current time in IST
        ist = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(ist)

        if (current_time - stored['created_at']) > timedelta(minutes=5):
            del otp_storage[verification.email]
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "OTP expired"}
            )

        if stored['otp'] != verification.otp:
            stored['attempts'] += 1
            if stored['attempts'] >= 3:
                del otp_storage[verification.email]
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "Too many invalid attempts"}
                )
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Invalid OTP"}
            )

        return {"success": True, "message": "OTP verified successfully"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )

@app.post("/reset-password")
async def reset_password(reset_request: PasswordReset):
    try:
        # Verify OTP was validated
        if reset_request.email not in otp_storage:
            raise HTTPException(
                status_code=400, 
                detail="Password reset not authorized. Please verify OTP first."
            )

        # Initialize database connection
        db = Database()
        
        # Update password
        success = db.reset_password(reset_request.email, reset_request.new_password)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="User not found or password update failed"
            )

        # Clean up OTP storage
        del otp_storage[reset_request.email]

        return {"success": True, "message": "Password reset successful"}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/signup")
async def signup(user: UserSignup):
    try:
        existing_username = db.users_collection.find_one({"username": user.username})
        existing_email = db.users_collection.find_one({"email": user.email})
        
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already exists.")
        
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered.")
        
        # Get current time in IST
        ist = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(ist)
        
        hashed_password = hash_password(user.password)
        user_doc = {
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "hashed_password": hashed_password,
            "created_at": current_time,
        }
        
        result = db.users_collection.insert_one(user_doc)
        return {"message": "User created successfully", "user_id": str(result.inserted_id)}
    except Exception as e:
        print(f"Error during signup: {e}")
        raise HTTPException(status_code=500, detail="Signup failed. Please try again.")


@app.options("/signup")
async def options_signup():
    return {"status": "OK"}

@app.post("/login")
async def login(user: dict = Body(...)):
    username = user.get("username")
    password = user.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required.")

    # Find user in the database
    db_user = db.users_collection.find_one({"username": username})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    # Verify the password
    if not verify_password(password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["username"]}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(db_user["_id"]),
        "success": True
    }

# Add this to your existing routes in main.py

@app.post("/police-login")
async def police_login(login_data: dict = Body(...)):
    station_id = login_data.get("stationId")
    station_password = login_data.get("stationPassword")

    if not station_id or not station_password:
        raise HTTPException(status_code=400, detail="Station ID and password are required.")

    # Find police station in the database
    db_station = db.police_stations_collection.find_one({"username": station_id})
    if not db_station:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    # Verify the password
    if not verify_password(station_password, db_station["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    # Generate access token using the station's username
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_station["username"]}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "police_station_id": str(db_station["_id"]),
        "success": True
    }


@app.get("/crime-reports", response_model=List[CrimeReport])
async def get_crime_reports(current_user: dict = Depends(get_current_user)):
    # Fetch crime reports for the current user
    reports = list(db.crime_reports_collection.find({"user_id": current_user['username']}))
    return reports

# Speech to Text Route
async def process_speech_to_text(audio_file: UploadFile):
    ASSEMBLY_API_KEY = os.getenv('ASSEMBLY_API_KEY')
    if not ASSEMBLY_API_KEY:
        raise ValueError("API key not found. Please check your .env file.")
    headers = {
        'authorization': ASSEMBLY_API_KEY
    }
    
    # First, upload the audio file to AssemblyAI
    upload_endpoint = "https://api.assemblyai.com/v2/upload"
    transcript_endpoint = "https://api.assemblyai.com/v2/transcript"
    
    async with aiohttp.ClientSession() as session:
        # Read and upload the file
        audio_data = await audio_file.read()
        
        async with session.post(upload_endpoint,
                              headers=headers,
                              data=audio_data) as upload_response:
            if upload_response.status != 200:
                raise HTTPException(status_code=500, detail="Failed to upload audio file")
            
            upload_url = (await upload_response.json())['upload_url']
            
        # Start transcription
        json = {
            "audio_url": upload_url,
            "language_code": "en"  # You can change this for other languages
        }
        
        async with session.post(transcript_endpoint,
                              json=json,
                              headers=headers) as transcript_response:
            if transcript_response.status != 200:
                raise HTTPException(status_code=500, detail="Failed to start transcription")
            
            transcript_id = (await transcript_response.json())['id']
            
        # Poll for transcription completion
        polling_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        while True:
            await asyncio.sleep(1)
            async with session.get(polling_endpoint, headers=headers) as polling_response:
                polling_result = await polling_response.json()
                
                if polling_result['status'] == 'completed':
                    return polling_result['text']
                elif polling_result['status'] == 'error':
                    raise HTTPException(status_code=500, 
                                     detail="Transcription failed: " + polling_result.get('error', 'Unknown error'))
                    
                # Continue polling if status is 'queued' or 'processing'

@app.post("/process-speech")
async def process_speech(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        transcription = await process_speech_to_text(file)
        return {"transcription": transcription}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Police Station Routes
@app.post("/add-police-station")
async def add_police_station(
    station: PoliceStation, 
    current_user: dict = Depends(get_current_user)
):
    # Insert police station
    result = db.police_stations_collection.insert_one(station.dict())
    
    return {
        "message": "Police station added successfully", 
        "station_id": str(result.inserted_id)
    }

@app.get("/police-stations", response_model=List[PoliceStation])
async def get_police_stations(current_user: dict = Depends(get_current_user)):
    # Fetch all police stations
    stations = list(db.police_stations_collection.find())
    return stations

async def get_current_police_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Check in police stations collection
    police_station = db.police_stations_collection.find_one({"username": username})
    if police_station is None:
        raise credentials_exception
    return police_station


# Ticket Routes
@app.get("/police-tickets")
async def get_police_station_tickets(current_user: dict = Depends(get_current_police_user)):
    # Find the police station associated with the current user
    police_station = current_user.get('name')  # Assuming the name is stored in the user document
    if not police_station:
        raise HTTPException(status_code=403, detail="Not authorized to view tickets")
    try:
        tickets = list(db.tickets_collection.find({"police_station": police_station}))
        # Convert ObjectId to string for JSON serialization
        tickets = convert_objectid_to_str(tickets)
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching police tickets: {str(e)}")


@app.post("/update-ticket/{ticket_number}")
async def update_ticket_status(
    ticket_number: str, 
    status_update: dict = Body(...), 
    current_user: dict = Depends(get_current_police_user)
):
    new_status = status_update.get('status')
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Validate status
    valid_statuses = ["New", "In Progress", "Resolved", "Closed"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    
    try:
        updated = db.update_ticket_status(ticket_number, new_status)
        if not updated:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        return {"message": "Ticket status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating ticket status: {str(e)}")

@app.get("/ticket-details/{ticket_number}")
async def get_ticket_details(
    ticket_number: str,
    current_user: dict = Depends(get_current_police_user)
):
    try:
        # Find the ticket in the database
        ticket = db.tickets_collection.find_one({"ticket_number": ticket_number})
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        # Verify that this ticket belongs to the current police station
        if ticket.get('police_station') != current_user.get('name'):
            raise HTTPException(
                status_code=403, 
                detail="Not authorized to view this ticket"
            )
            
        # Convert ObjectId to string for JSON serialization
        ticket = convert_objectid_to_str(ticket)
        
        # If there are file URLs, construct full URLs
        if ticket.get('image_url'):
            ticket['image_url'] = f"http://localhost:8000/uploads/{ticket['image_url']}"
        if ticket.get('audio_url'):
            ticket['audio_url'] = f"http://localhost:8000/uploads/{ticket['audio_url']}"
            
        return ticket
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # Convert ObjectId to string before returning
    user_data = {
        "id": str(current_user.get('_id')),
        "username": current_user.get('username'),
        "email": current_user.get('email'),
        "full_name": current_user.get('full_name'),
        "phone_number": current_user.get('phone_number'),
        "created_at": current_user.get('created_at')
    }
    return user_data

@app.post("/create-ticket")
async def create_ticket(
    ticket: Ticket, 
    current_user: dict = Depends(get_current_user)
):
    # Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)
    # Add user_id as the ObjectId string to ticket
    ticket_data = ticket.dict()
    ticket_data['user_id'] = str(current_user['_id'])
    ticket_data['timestamp'] = current_time
    
    # Insert ticket
    result = db.tickets_collection.insert_one(ticket_data)
    
    return {
        "message": "Ticket created successfully", 
        "ticket_id": str(result.inserted_id)
    }

@app.get("/tickets", response_model=List[Ticket])
async def get_tickets(current_user: dict = Depends(get_current_user)):
    # Fetch tickets for the current user
    tickets = list(db.tickets_collection.find({"user_id": current_user['username']}))
    return tickets

# --- Appended Functionality Starts Here ---

@app.post("/new-feature")
async def new_feature(param1: str, param2: int):

    """

    Example of appended functionality for demonstration.

    """

    return {"message": f"New feature with {param1} and {param2} added successfully."}

@app.get("/user-tickets")
async def get_user_tickets(current_user: dict = Depends(get_current_user)):
    try:
        # Find tickets by username instead of user_id
        tickets = list(db.tickets_collection.find({"user_name": current_user['username']}))
        tickets = convert_objectid_to_str(tickets)
        return tickets
    except Exception as e:
        print(f"Error fetching tickets: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=f"Error fetching tickets: {str(e)}")
    
@app.options("/user-tickets")
async def options_user_tickets():
    return {"status": "OK"}

# ------------------------------------------------------------------------------------------
# Google Drive folder ID for the `cap` folder
FOLDER_ID = os.getenv('FOLDER_ID')

if not FOLDER_ID:
    raise ValueError("Folder ID not found. Please check your .env file.")

def get_drive_service():
    SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
    SERVICE_ACCOUNT_FILE = 'service_account.json'
    
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    service = build('drive', 'v3', credentials=credentials)
    return service

async def upload_to_drive(file: UploadFile, file_name: str, mime_type: str):
    try:
        drive_service = get_drive_service()
        file_metadata = {
            'name': file_name,
            'parents': [FOLDER_ID]
        }
        
        file_content = io.BytesIO(await file.read())
        media = MediaIoBaseUpload(file_content, mimetype=mime_type, resumable=True)

        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webContentLink',
            supportsAllDrives=True
        ).execute()

        # Set file permissions to be publicly readable
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        drive_service.permissions().create(
            fileId=file['id'],
            body=permission
        ).execute()

        # Generate appropriate URL based on file type
        if mime_type.startswith('image/'):
            return f"https://drive.google.com/uc?export=view&id={file['id']}"
        elif mime_type.startswith('audio/'):
            return f"https://drive.google.com/file/d/{file['id']}/view"
            
        return file.get('webContentLink')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
# Endpoint to handle crime report upload
@app.post("/upload-crime-report")
async def upload_crime_report(
    image_file: UploadFile = File(None),
    voice_file: UploadFile = File(None),
    user_name: str = Form(...),
    pincode: str = Form(...),
    police_station: str = Form(...),
    crime_type: str = Form(...),
    description: str = Form(None),
    current_user: dict = Depends(get_current_user)
):

    # Ensure all required fields are present
    if not all([user_name, pincode, police_station, crime_type]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Generate a unique ticket number
    ticket_number = str(random.randint(100000, 999999))

    image_url = None
    audio_url = None

    # Handle image upload if provided
    if image_file:
        try:
            image_url = await upload_to_drive(image_file, image_file.filename, image_file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    # Handle audio upload if provided
    if voice_file:
        try:
            audio_url = await upload_to_drive(voice_file, voice_file.filename, voice_file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload audio: {str(e)}")

    # Save ticket details to the database
    try:
        ticket = db.create_ticket(
            user_name=current_user['username'],
            pincode=pincode,
            crime_type=crime_type,
            police_station=police_station,
            description=description,
            ticket_number=ticket_number,
            image_url=image_url,
            audio_url=audio_url
        )

        return {
            "message": "Crime report uploaded successfully",
            "ticket_number": ticket_number,
            "image_url": image_url,
            "audio_url": audio_url
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    
@app.get("/proxy-audio/{file_id}")
async def proxy_audio(file_id: str):
    try:
        drive_service = get_drive_service()
        request = drive_service.files().get_media(fileId=file_id)
        
        # Create a BytesIO object to store the file data
        file_buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(file_buffer, request)
        
        done = False
        while not done:
            status, done = downloader.next_chunk()
            
        # Reset buffer position to start
        file_buffer.seek(0)
        
        # Return the audio file as a streaming response
        return StreamingResponse(
            file_buffer,
            media_type="audio/mpeg",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Disposition": f"inline; filename=audio_{file_id}.mp3"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error streaming audio: {str(e)}")