import os
from PIL import Image
import io
from transformers import pipeline

# Suppress HuggingFace symlink warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# Use a compatible image classification model
image_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")

def analyze_image(image_bytes):
    """
    Analyze the uploaded image and extract crime-related keywords.
    """
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Run image classification
    predictions = image_classifier(image)
    
    # Extract top 5 labels as keywords
    keywords = [pred["label"] for pred in sorted(predictions, key=lambda x: x["score"], reverse=True)[:5]]
    
    return keywords