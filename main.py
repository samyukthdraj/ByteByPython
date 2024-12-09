import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from crime_detection import analyze_image, analyze_image_detailed
from speech_processing import process_speech_to_text
from database import Database
from models import CrimeReport
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

class PoliceStationFinder:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="crime_reporting_app")

    def get_location_from_pincode(self, pincode):
        try:
            location = self.geolocator.geocode(f"{pincode}, India")
            return (location.latitude, location.longitude)
        except Exception as e:
            print(f"Error finding location: {e}")
            return None

    def find_police_stations(self, pincode, max_stations=3, max_distance=10):
        location = self.get_location_from_pincode(pincode)
        if not location:
            return []

        # Mock police station data (replace with real API or database)
        all_stations = [
            {"name": "Central Police Station", "address": "Main Road, City Center", "coordinates": (location[0] + 0.01, location[1] + 0.01)},
            {"name": "North Police Station", "address": "North District", "coordinates": (location[0] + 0.02, location[1] - 0.01)},
            {"name": "South Police Station", "address": "South District", "coordinates": (location[0] - 0.01, location[1] + 0.02)},
            {"name": "East Police Station", "address": "East District", "coordinates": (location[0] - 0.02, location[1] - 0.02)},
            {"name": "West Police Station", "address": "West District", "coordinates": (location[0] + 0.03, location[1] - 0.03)}
        ]

        # Calculate distances and filter stations
        station_distances = []
        for station in all_stations:
            distance = geodesic(location, station['coordinates']).kilometers
            if distance <= max_distance:
                station_distances.append({
                    "name": station['name'],
                    "address": station['address'],
                    "distance": round(distance, 2)
                })

        # Sort by distance and return top stations
        return sorted(station_distances, key=lambda x: x['distance'])[:max_stations]

app = FastAPI()
db = Database()
police_station_finder = PoliceStationFinder()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/police-stations/{pincode}")
async def get_police_stations(pincode: str):
    stations = police_station_finder.find_police_stations(pincode)
    return {"stations": stations}

@app.post("/speech-to-text/")
async def speech_to_text_endpoint(file: UploadFile):
    transcription = process_speech_to_text(file)
    return {"transcription": transcription}

@app.post("/submit-report")
async def submit_report(report: CrimeReport):
    # Generate a unique ticket number
    ticket_number = str(uuid.uuid4())[:8].upper()
    
    # Add ticket number to report
    report_dict = report.model_dump()
    report_dict['ticket_number'] = ticket_number
    
    # Insert report into database
    try:
        db.insert_report(report_dict)
        return {"ticket_number": ticket_number}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))