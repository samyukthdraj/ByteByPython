import os
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from models import CrimeReport
from database import Database
from crime_detection import CrimeDetector
from speech_processing import SpeechProcessor
from config import settings

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()
crime_detector = CrimeDetector(settings)
speech_processor = SpeechProcessor(settings)

@app.post("/submit-report/")
async def submit_report(
    pincode: str = Form(...),
    police_station: str = Form(...),
    phone_number: str = Form(...),
    crime_type: str = Form(None),
    description: str = Form(None),
    image: UploadFile = File(None),
    voice_note: UploadFile = File(None)
):
    # Save uploaded files
    image_path = None
    voice_path = None
    
    if image:
        image_path = f"uploads/image_{image.filename}"
        os.makedirs("uploads", exist_ok=True)
        with open(image_path, "wb") as buffer:
            buffer.write(await image.read())
        
        # If no crime type provided, detect from image
        if not crime_type:
            crime_type = crime_detector.detect_crime_type(image_path)
    
    if voice_note:
        voice_path = f"uploads/audio_{voice_note.filename}"
        os.makedirs("uploads", exist_ok=True)
        with open(voice_path, "wb") as buffer:
            buffer.write(await voice_note.read())
        
        # Transcribe and translate voice note
        if not description:
            transcribed_text = speech_processor.transcribe_audio(voice_path)
            description = speech_processor.translate_text(transcribed_text)
    
    # Create report
    report = CrimeReport(
        pincode=pincode,
        police_station=police_station,
        phone_number=phone_number,
        crime_type=crime_type or "Unspecified",
        description=description or "",
        image_url=image_path,
        audio_url=voice_path
    )
    
    # Insert report to database
    report_id = db.insert_report(report)
    
    return {"status": "success", "report_id": report_id}

@app.get("/reports/{pincode}")
async def get_reports(pincode: str):
    reports = db.get_reports_by_pincode(pincode)
    return {"reports": reports}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)