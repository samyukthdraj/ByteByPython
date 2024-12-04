# Civilians As Police (CAP)

## Overview

Civilians As Police (CAP) is an innovative web application designed to simplify crime reporting by leveraging AI technologies. The platform allows users to submit crime reports through multiple input methods, including image uploads, voice notes, and manual text entry.

## Key Features

- **Multi-Modal Report Submission**
  - Image upload with AI-powered crime type detection
  - Voice note transcription
  - Manual text description
  - Automatic police station recommendation based on pincode

- **AI-Powered Analysis**
  - Image classification using HuggingFace's Vision Transformer
  - Speech-to-text conversion with AssemblyAI
  - Automatic keyword extraction and crime type suggestion

- **Robust Backend**
  - FastAPI for efficient API handling
  - MongoDB for secure report storage
  - Comprehensive error handling and input validation

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python, FastAPI
- **AI Services**: 
  - HuggingFace Transformers (Image Classification)
  - AssemblyAI (Speech-to-Text)
- **Database**: MongoDB
- **Deployment**: Uvicorn

## Prerequisites

### System Requirements
- Python 3.8+
- MongoDB
- AssemblyAI Account (Free Tier)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/civilians-as-police.git
cd civilians-as-police
```

2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Configure Environment Variables
- Create a `.env` file in the project root
- Add the following configurations:
```
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=cap_database
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

## Running the Application

### Backend (FastAPI)
```bash
uvicorn main:app --reload
```

### Frontend
- Open `index.html` in a modern web browser
- Ensure backend is running simultaneously

## Features in Detail

### Image Upload
- Automatically analyzes uploaded images
- Suggests potential crime types based on image classification
- Populates description with detected keywords

### Voice Note Transcription
- Converts voice notes to text using AssemblyAI
- Appends transcription to the description field

### Police Station Recommendations
- Dynamically fetches and displays nearby police stations
- Updates based on entered pincode

### Report Submission
- Comprehensive form with multiple input options
- Automatic and manual crime type selection
- User identification through phone number

## Security Considerations

- Input sanitization
- Secure file uploads
- Environment-based configuration management
- CORS middleware for API security

## Future Enhancements

- User authentication
- More sophisticated AI crime detection
- Multi-language support
- Advanced geolocation services

## Contributions

Contributions are welcome! Please read our contribution guidelines before submitting pull requests.

