from transformers import pipeline
import torch
from PIL import Image

class CrimeDetector:
    def __init__(self):
        # New: Use Hugging Face vision model for image classification
        self.image_classifier = pipeline(
            "image-classification", 
            model="google/vit-base-patch16-224"
        )
    
    def detect_crime_type(self, image_path):
        """
        # New: Detect potential crime indicators from an image using Hugging Face
        """
        try:
            # Classify the image
            predictions = self.image_classifier(image_path, top_k=3)
            
            # New: Custom mapping of classifications to crime types
            crime_keywords = {
                'violence': 'Assault',
                'theft': 'Theft',
                'vandalism': 'Vandalism',
                'weapon': 'Weapon Possession',
                'accident': 'Property Damage'
            }
            
            # New: Check predictions against crime keywords
            for pred in predictions:
                for keyword, crime_type in crime_keywords.items():
                    if keyword in pred['label'].lower():
                        return crime_type
            
            return "Unidentified"
        
        except Exception as e:
            print(f"Error in crime detection: {e}")
            return "Unidentified"