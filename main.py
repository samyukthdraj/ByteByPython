from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from crime_detection import analyze_image
from speech_processing import process_speech_to_text
from database import Database

app = FastAPI()
db = Database()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/analyze-image/")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    content = await file.read()
    keywords = analyze_image(content)
    return {"keywords": keywords}

@app.post("/speech-to-text/")
async def speech_to_text_endpoint(file: UploadFile):
    transcription = process_speech_to_text(file)
    return {"transcription": transcription}

@app.get("/police-stations/{pincode}")
async def get_police_stations(pincode: str):
    stations = db.get_reports_by_pincode(pincode)
    if not stations:
        stations = [{"name": f"Station {i}", "distance": f"{i * 1.5} km"} for i in range(1, 4)]
    return {"stations": stations}