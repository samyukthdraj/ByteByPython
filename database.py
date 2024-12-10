from pymongo import MongoClient
from config import settings
from bson.objectid import ObjectId
from .models import PoliceStation, CrimeReport

class Database:
    def __init__(self):
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client[settings.MONGO_DB_NAME]
        self.reports_collection = self.db.crime_reports
        self.police_stations_collection = self.db.police_stations

        # Pre-configure police stations
        self.pre_configure_police_stations()

    def pre_configure_police_stations(self):
        police_stations = [
            PoliceStation(
                name="Central Police Station",
                address="123 Main Street, Anytown",
                password="centralps"
            ),
            PoliceStation(
                name="Eastside Police Station",
                address="456 Oak Avenue, Anytown",
                password="eastsideps"
            ),
            PoliceStation(
                name="Westside Police Station",
                address="789 Elm Road, Anytown",
                password="westsideps"
            )
        ]

        for station in police_stations:
            existing = self.police_stations_collection.find_one({"name": station.name})
            if not existing:
                self.insert_police_station(station)

    def insert_report(self, report):
        result = self.reports_collection.insert_one(report.dict())
        return str(result.inserted_id)

    def get_reports_by_police_station(self, police_station_id):
        return list(self.reports_collection.find({"police_station": ObjectId(police_station_id)}))

    def get_police_station_by_id(self, police_station_id):
        return self.police_stations_collection.find_one({"_id": ObjectId(police_station_id)})

    def get_police_stations(self):
        return list(self.police_stations_collection.find())

    def insert_police_station(self, police_station):
        result = self.police_stations_collection.insert_one(police_station.dict())
        return str(result.inserted_id)