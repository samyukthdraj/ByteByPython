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

        # Enhanced and more specific crime-related keywords mapping
        self.crime_keywords = {
            # Pickpocketing Specific Detection
            'wallet': 'Pickpocketing',
            'backpack': 'Pickpocketing',
            'purse': 'Pickpocketing',
            'hand near pocket': 'Pickpocketing',
            'crowded area': 'Pickpocketing',
            
            # Shoplifting Specific Detection
            'clothing': 'Shoplifting',
            'merchandise': 'Shoplifting',
            'bag': 'Shoplifting',
            'shelf': 'Shoplifting',
            'store interior': 'Shoplifting',
            
            # Breaking and Entering Specific Detection
            'window': 'Breaking and Entering',
            'door': 'Breaking and Entering',
            'crowbar': 'Breaking and Entering',
            'glass break': 'Breaking and Entering',
            'ladder': 'Breaking and Entering',
            
            # Vehicle-related
            'car': 'Vehicle Theft',
            'truck': 'Vehicle Theft',
            'motorcycle': 'Vehicle Theft',
            'bicycle': 'Bicycle Theft',

            # Suspicious Activities
            'person': 'Suspicious Activity',
            'mask': 'Attempted Robbery',
            'gloves': 'Suspicious Activity',
            'ski mask': 'Attempted Robbery',

            # Potential Weapons
            'knife': 'Armed Threat',
            'gun': 'Armed Threat',
            'weapon': 'Armed Threat'
        }

        # Additional context-based crime detection rules
        self.crime_context_rules = {
            'Pickpocketing': {
                'keywords': ['crowded', 'wallet', 'hand near pocket'],
                'confidence_threshold': 0.6
            },
            'Shoplifting': {
                'keywords': ['store', 'merchandise', 'concealing'],
                'confidence_threshold': 0.7
            },
            'Breaking and Entering': {
                'keywords': ['window', 'door', 'broken glass'],
                'confidence_threshold': 0.65
            }
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

            # Context-based crime type detection
            context_crime_type = self._detect_crime_by_context(keywords)

            # Prioritize most serious crime type
            if context_crime_type:
                crime_type = context_crime_type
            else:
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

    def _detect_crime_by_context(self, detected_keywords):
        """
        Detect crime type based on context and keyword combinations
        """
        for crime_type, rules in self.crime_context_rules.items():
            context_keywords = rules['keywords']
            
            # Check if sufficient context keywords are present
            matching_keywords = [kw for kw in context_keywords if 
                                 any(kw in keyword for keyword in detected_keywords)]
            
            # If enough context keywords match, return the crime type
            if len(matching_keywords) >= len(context_keywords) * rules['confidence_threshold']:
                return crime_type
        
        return None

def analyze_image(image_bytes):
    """
    Wrapper function for crime detection.
    """
    detector = CrimeDetector()
    result = detector.detect_crime(image_bytes)
    return result['keywords']

def analyze_image_detailed(image_bytes):
    """
    Detailed crime detection returning both keywords and crime type.
    """
    detector = CrimeDetector()
    return detector.detect_crime(image_bytes)