from pymongo import MongoClient
from models import CrimeReport
from config import settings

class Database:
    def __init__(self):
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client[settings.MONGO_DB_NAME]
        self.reports_collection = self.db.crime_reports
    
    def insert_report(self, report: CrimeReport):
        """
        Insert a new crime report into the database
        """
        result = self.reports_collection.insert_one(report.dict(by_alias=True))
        return str(result.inserted_id)
    
    def get_reports_by_pincode(self, pincode):
        """
        Retrieve reports by pincode
        """
        return list(self.reports_collection.find({"pincode": pincode}))