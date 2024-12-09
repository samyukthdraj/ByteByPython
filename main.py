import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from crime_detection import analyze_image, analyze_image_detailed
from speech_processing import process_speech_to_text
from database import Database
from models import CrimeReport
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import requests

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
        """
        Find nearby police stations using OpenStreetMap Nominatim API
        """
        location = self.get_location_from_pincode(pincode)
        if not location:
            return []

        try:
            # Use Nominatim to search for police stations near the location
            stations_data = self._fetch_nearby_police_stations(location[0], location[1], max_distance)
            
            # Calculate distances and prepare station list
            station_distances = []
            for station in stations_data:
                distance = geodesic(location, (float(station['lat']), float(station['lon']))).kilometers
                if distance <= max_distance:
                    station_distances.append({
                        "name": self._extract_station_name(station.get('display_name', 'Police Station')),
                        "address": station.get('display_name', 'Unknown Address'),
                        "distance": round(distance, 2)
                    })

            # Sort by distance and return top stations
            sorted_stations = sorted(station_distances, key=lambda x: x['distance'])[:max_stations]
            
            # If no stations found, use mock data
            return sorted_stations if sorted_stations else self._get_mock_stations(location)
        
        except Exception as e:
            print(f"Error finding police stations: {e}")
            # Fallback to mock data if real data retrieval fails
            return self._get_mock_stations(location)

    def _fetch_nearby_police_stations(self, latitude, longitude, radius=10):
        """
        Fetch nearby police stations using Nominatim API
        """
        base_url = "https://nominatim.openstreetmap.org/search"
        params = {
            'format': 'json',
            'lat': latitude,
            'lon': longitude,
            'type': 'police',
            'limit': 10,
            'addressdetails': 1,
            'radius': radius * 1000  # Convert km to meters
        }

        response = requests.get(base_url, params=params, headers={'User-Agent': 'crime_reporting_app'})
        stations = response.json()

        # Filter and process stations
        police_stations = []
        for station in stations:
            if 'police' in str(station.get('type', '')).lower() or 'police' in str(station.get('display_name', '')).lower():
                police_stations.append(station)

        return police_stations

    def _extract_station_name(self, display_name):
        """
        Extract a clean station name from the full display name
        """
        # Split the display name and try to extract a meaningful station name
        parts = display_name.split(',')
        for part in parts:
            if 'police' in part.lower():
                return part.strip()
        return 'Local Police Station'

    def _get_mock_stations(self, location):
        """
        Fallback mock stations if real data retrieval fails
        """
        mock_stations = [
            {"name": "Local Police Station", "address": "Nearest Police Station", "distance": 2.5},
            {"name": "Community Police Center", "address": "City Police Headquarters", "distance": 5.0},
            {"name": "District Police Station", "address": "Regional Police Office", "distance": 7.5}
        ]
        return mock_stations

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