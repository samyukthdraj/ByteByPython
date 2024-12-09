import os
import torch
from PIL import Image
import io
import numpy as np
from transformers import YolosImageProcessor, YolosForObjectDetection

# Suppress HuggingFace symlink warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

class CrimeDetector:
    def __init__(self):
        # Initialize YOLOS object detection model
        self.feature_extractor = YolosImageProcessor.from_pretrained('hustvl/yolos-small')
        self.model = YolosForObjectDetection.from_pretrained('hustvl/yolos-small')
        
        # More specific crime-related keywords mapping
        self.crime_keywords = {
            # Vehicle-related
            'car': 'Vehicle Theft',
            'truck': 'Vehicle Theft',
            'motorcycle': 'Vehicle Theft',
            'bicycle': 'Bicycle Theft',
            
            # Breaking and Entering
            'window': 'Breaking and Entering',
            'door': 'Breaking and Entering',
            'crowbar': 'Burglary',
            
            # Suspicious Activities
            'person': 'Suspicious Activity',
            'backpack': 'Pickpocketing',
            'mask': 'Attempted Robbery',
            'gloves': 'Suspicious Activity',
            'ski mask': 'Attempted Robbery',
            
            # Potential Weapons
            'knife': 'Armed Threat',
            'gun': 'Armed Threat',
            'weapon': 'Armed Threat'
        }

    def detect_crime(self, image_bytes):
        """
        Analyze the uploaded image and extract crime-related keywords and type.
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            
            # Prepare inputs
            inputs = self.feature_extractor(images=image, return_tensors="pt")
            
            # Run object detection
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Process results
            probas = outputs.logits.softmax(-1)[0, :, :-1]
            keep = probas.max(-1).values > 0.7
            
            # Extract detected objects
            detected_objects = [self.model.config.id2label[p.argmax().item()].lower() for p in probas[keep]]
            
            # Generate more comprehensive keywords
            keywords = list(set(detected_objects))
            
            # Map detected objects to crime types
            crime_types = []
            for obj in keywords:
                # Check for exact and partial matches
                matching_crimes = [
                    self.crime_keywords.get(key, 'Suspicious Activity')
                    for key in self.crime_keywords.keys()
                    if key in obj
                ]
                crime_types.extend(matching_crimes)
            
            # Prioritize most serious crime type
            crime_type = max(set(crime_types), key=crime_types.count) if crime_types else 'Unspecified Crime'
            
            return {
                'keywords': keywords,
                'crime_type': crime_type
            }
        
        except Exception as e:
            print(f"Error in crime detection: {e}")
            return {
                'keywords': [],
                'crime_type': 'Unspecified Crime'
            }

def analyze_image(image_bytes):
    """
    Wrapper function for crime detection.
    """
    detector = CrimeDetector()
    result = detector.detect_crime(image_bytes)
    return result['keywords']

# Optional: If you want to return both keywords and crime type
def analyze_image_detailed(image_bytes):
    """
    Detailed crime detection returning both keywords and crime type.
    """
    detector = CrimeDetector()
    return detector.detect_crime(image_bytes)