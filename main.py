import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from crime_detection import analyze_image_detailed
from speech_processing import process_speech_to_text
from database import Database
from models import CrimeReport, PoliceStation
from typing import List
from fastapi.security import HTTPBasic, HTTPBasicCredentials

app = FastAPI()
db = Database()
security = HTTPBasic()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_police_station(credentials: HTTPBasicCredentials = Depends(security)):
    police_station = db.get_police_station_by_id(credentials.username)
    if not police_station or police_station["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return police_station

@app.post("/analyze-image/")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        content = await file.read()
        
        # Use the detailed analysis to get both keywords and crime type
        result = analyze_image_detailed(content)
        
        return {
            "keywords": result['keywords'],
            "crime_type": result['crime_type']
        }
    except Exception as e:
        # If there's an error, return a more informative error response
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.get("/police-stations/")
async def get_police_stations():
    stations = db.get_police_stations()
    return {"stations": stations}

@app.get("/reports/", dependencies=[Depends(get_current_police_station)])
async def get_reports_for_police_station(police_station: dict = Depends(get_current_police_station)):
    reports = db.get_reports_by_police_station(str(police_station["_id"]))
    return {"reports": reports}

@app.post("/speech-to-text/")
async def speech_to_text_endpoint(file: UploadFile):
    transcription = process_speech_to_text(file)
    return {"transcription": transcription}

@app.post("/submit-report")
async def submit_report(report: CrimeReport):
    # Generate a unique ticket number
    ticket_number = str(uuid.uuid4())[:8].upper()
    
    # Add ticket number and police station to report
    report_dict = report.model_dump()
    report_dict['ticket_number'] = ticket_number
    
    # Insert report into database
    try:
        db.insert_report(report)
        return {"ticket_number": ticket_number}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))