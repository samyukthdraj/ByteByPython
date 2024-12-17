import uuid
import random
import smtplib
from email.mime.text import MIMEText
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from datetime import datetime, timedelta
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from fastapi import Form
from crime_detection import analyze_image_detailed
from speech_processing import process_speech_to_text
from database import Database
from models import CrimeReport, PoliceStation, User, Ticket
from typing import List, Optional
from config import settings
from fastapi import HTTPException
from fastapi.responses import HTMLResponse
from bson.objectid import ObjectId
import os

app = FastAPI()
db = Database()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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


# Models for Authentication
class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# OTP storage
otp_storage = {}

# Authentication Utility Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def send_otp_email(email: str, otp: str):
    try:
        sender_email = settings.SENDER_EMAIL
        sender_password = settings.SENDER_PASSWORD

        msg = MIMEText(f'Your OTP is: {otp}. It will expire in 10 minutes.')
        msg['Subject'] = 'Password Reset OTP'
        msg['From'] = sender_email
        msg['To'] = email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [email], msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def generate_otp():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

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

# Redirection while clicking http://127.0.0.1:8000/ in uvicorn main:app --reload
@app.get("/", response_class=HTMLResponse)
async def root():
    # Read the login.html file from the same directory
    try:
        with open("login.html", "r") as file:
            return file.read()
    except FileNotFoundError:
        return HTMLResponse(content="Login page not found", status_code=404)

# Authentication Routes
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
        
        hashed_password = hash_password(user.password)
        user_doc = {
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
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

    # Generate access token
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


@app.post("/send-otp")
async def send_otp(request: PasswordResetRequest):
    user = db.users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    otp = generate_otp()
    
    otp_storage[request.email] = {
        "otp": otp,
        "created_at": datetime.utcnow()
    }
    
    if send_otp_email(request.email, otp):
        return {"message": "OTP sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@app.post("/verify-otp")
async def verify_otp(verification: OTPVerification):
    stored_otp = otp_storage.get(verification.email)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="No OTP request found")
    
    time_elapsed = (datetime.utcnow() - stored_otp['created_at']).total_seconds() / 60
    if time_elapsed > 10:
        del otp_storage[verification.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored_otp['otp'] != verification.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    return {"message": "OTP verified successfully"}

@app.post("/reset-password")
async def reset_password(reset_request: PasswordReset):
    await verify_otp(OTPVerification(
        email=reset_request.email, 
        otp=reset_request.otp
    ))
    
    new_hashed_password = hash_password(reset_request.new_password)
    
    result = db.users_collection.update_one(
        {"email": reset_request.email},
        {"$set": {"password": new_hashed_password}}
    )
    
    if reset_request.email in otp_storage:
        del otp_storage[reset_request.email]
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password reset successfully"}

# Crime Report Routes
@app.post("/upload-crime-report")
async def upload_crime_report(
    file: UploadFile = File(None),
    user_name: str = Form(None),
    pincode: str = Form(None),
    police_station: str = Form(None),
    phone_number: str = Form(None),
    crime_type: str = Form(None),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):

    # Ensure uploads directory exists
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)

    if not all([pincode, police_station, phone_number, crime_type]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    # Generate a random 6-digit ticket number
    ticket_number = f"{random.randint(100000, 999999)}"

    # Prepare file handling
    file_path = None
    if file and file.filename:
        # Generate a unique filename for the image
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(uploads_dir, unique_filename)
        
        # Save file 
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Analyze image (optional)
        try:
            analysis_result = await analyze_image_detailed(file.file)
        except Exception as e:
            analysis_result = {"error": str(e)}

    try:
        # Create ticket using database method
        ticket = db.create_ticket(
            user_name=current_user['username'],
            pincode=pincode,
            phone_number=phone_number,
            crime_type=crime_type,
            police_station=police_station,
            description=description,
            ticket_number=ticket_number,
            image_url=file_path
        )

        return {
            "message": "Crime report uploaded successfully",
            "ticket_number": ticket_number
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@app.get("/crime-reports", response_model=List[CrimeReport])
async def get_crime_reports(current_user: dict = Depends(get_current_user)):
    # Fetch crime reports for the current user
    reports = list(db.crime_reports_collection.find({"user_id": current_user['username']}))
    return reports

# Speech to Text Route
@app.post("/process-speech")
async def process_speech(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    # Process speech file
    transcription = await process_speech_to_text(file.file)
    
    return {"transcription": transcription}

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

# Ticket Routes
@app.get("/police-tickets")
async def get_police_station_tickets(current_user: dict = Depends(get_current_user)):
    # Find the police station associated with the current user
    police_station = current_user.get('name')  # Assuming the name is stored in the user document
    if not police_station:
        raise HTTPException(status_code=403, detail="Not authorized to view tickets")
    
    try:
        tickets = list(db.tickets_collection.find({"police_station": police_station}))
        
        # Convert ObjectId to string for JSON serialization
        for ticket in tickets:
            ticket['_id'] = str(ticket['_id'])
        
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching police tickets: {str(e)}")

@app.post("/update-ticket/{ticket_number}")
async def update_ticket_status(
    ticket_number: str, 
    status_update: dict = Body(...), 
    current_user: dict = Depends(get_current_user)
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



@app.post("/create-ticket")
async def create_ticket(
    ticket: Ticket, 
    current_user: dict = Depends(get_current_user)
):
    # Add user_id as the ObjectId string to ticket
    ticket_data = ticket.dict()
    ticket_data['user_id'] = str(current_user['_id'])
    ticket_data['timestamp'] = datetime.utcnow()
    
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

# --- Appended Functionality Ends Here -------------------------------------------------------------
# Add this to your main.py file, under the existing routes

@app.get("/user-tickets")
async def get_user_tickets(current_user: dict = Depends(get_current_user)):
    try:
        # Find tickets by username instead of user_id
        tickets = list(db.tickets_collection.find({"user_name": current_user['username']}))
        
        # Convert ObjectId to string for JSON serialization
        for ticket in tickets:
            ticket['_id'] = str(ticket['_id'])
        
        return tickets
    except Exception as e:
        print(f"Error fetching tickets: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=f"Error fetching tickets: {str(e)}")
    
@app.options("/user-tickets")
async def options_user_tickets():
    return {"status": "OK"}





# ------------------------------------------------------------------------------------------
