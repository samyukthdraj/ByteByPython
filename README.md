# Civilians As Police (CAP)

## Overview

Civilians As Police (CAP) is a comprehensive web application designed to simplify and enhance crime reporting and management. Featuring user authentication, AI-powered analysis, and robust security measures, CAP enables users to report crimes using text, images, and audio, while facilitating efficient handling by police stations.

## 🚀 Features

### Existing Features
- **User Authentication & Management**
  - Signup and Login functionality
  - Password reset with OTP verification
  - JWT-based authentication
  - User profile management

- **Police Station Portal**
  - Dedicated police station login
  - Ticket management system
  - Status updates for crime reports
  - Access to assigned case details

- **Crime Reporting**
  - Multi-format report submission (text, image, audio)
  - Real-time speech-to-text processing
  - Automated ticket generation
  - File upload to Google Drive
  - Status tracking

- **Security Features**
  - Password hashing with bcrypt
  - JWT token-based authentication
  - Rate limiting for OTP requests
  - Secure email communication

### New Features (From Code Analysis)
- **Voice Recording**
  - Real-time audio recording with MediaRecorder API
  - Automatic transcription of voice notes
  - Voice note removal functionality
  - Timestamped audio file naming

- **Image Analysis**
  - Integration with Google Gemini API for image analysis
  - Automated crime type detection
  - Keyword extraction from images
  - Smart description generation

- **Police Station Mapping**
  - CSV-based police station database
  - Pincode-based station matching
  - Automatic nearest station selection
  - Distance calculation using Haversine formula

- **Dynamic Form Features**
  - Custom crime type input
  - Auto-populated user information
  - Real-time form validation
  - Multi-part form data handling

## 🛠️ Technologies Used

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database for data storage
- **PyJWT** - JSON Web Token implementation
- **Passlib** - Password hashing library
- **Python-Jose** - JavaScript Object Signing and Encryption implementation
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server implementation
- **Python-Multipart** - Multipart form data parsing
- **Aiohttp** - Async HTTP client/server framework

### Frontend
- **HTML5**
  - Semantic markup
  - Form validation
  - File input handling
  - Audio recording capabilities

- **JavaScript**
  - MediaRecorder API for audio recording
  - Fetch API for API communications
  - FormData handling
  - Dynamic DOM manipulation

- **CSS**
  - Responsive design
  - Custom form styling
  - Modal popups
  - Loading animations

### External APIs
- **Google Gemini API** - AI-powered image analysis
- **Assembly AI** - Speech-to-text processing
- **Google Maps** (Optional) - Geolocation services

## 🗋 Prerequisites

- Python 3.7+
- MongoDB
- Google Cloud Platform account with Drive API enabled
- AssemblyAI API key
- SMTP server access (for email functionality)
- Google Gemini API key (for image analysis)
- Modern web browser with MediaRecorder API support

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MONGODB_URL=your_mongodb_url
ASSEMBLY_API_KEY=your_assemblyai_api_key
FOLDER_ID=your_google_drive_folder_id
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_sender_email
GEMINI_API_KEY=your_gemini_api_key
```

## 🗂️ Project Structure

```
project/
├── backend/
│   ├── app.js         # Main application logic
|   ├── config.py 
|   ├── crime_detection.py 
|   ├── database.py 
|   ├── forgotpass.js 
|   ├── loginapp.js
|   ├── models.py 
|   ├── signup.js
|   ├── speech_processing.py   
├── frontend/
│   ├── forgotpass.html     # Main report submission page
|   ├── hero.html 
|   ├── index.html 
|   ├── login.html 
|   ├── police_dashboard.html
|   ├── signup.html 
|   ├── user_dashboard.html  
│   └── css/
│       └── hero.css # Styling
│       └── styles.css 
│       └── stylesfpass.css 
│       └── styleslogin.css 
│       └── stylespdash.css
│       └── stylessignup.css
│       └── stylesudash.css  
│   └── logo/ 
│       └── caplogocropped.png
│       └── caplogonobg.png 
│       └── caplogoreddotedited.png 
│   └── pictures/    
├── police_stations/
│   └── policestations.csv # Police station database
├── .env
├── .gitignore
├── main.py
├── requirements.txt
├── service_account.json
└── README.md

```

## 🛠️ Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/samyukthdraj/ByteByPython.git
```

2. Create and activate virtual environment:
```bash
python -m venv venv_name
.\venv_name\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables in a .env file as mentioned above 

5. Prepare the police stations CSV file with the following columns:
   - slNo
   - cityName
   - name
   - address
   - longitude
   - latitude
   - pincode

6. Run the application:
```bash
uvicorn main:app --reload
```

## 🌟 Key Features Implementation

### Voice Recording
```javascript
// Start recording
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
mediaRecorder = new MediaRecorder(stream);

// Process recording
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
```

### Image Analysis
```javascript
// Analyze image using Gemini API
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`);
```

### Police Station Mapping
```javascript
// Calculate distance between points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    // Haversine formula implementation
}
```

## 👥 Contributors

- Samyukth Dharmarajan
- Ashwin Linu
- Surya D

## 🙏 Acknowledgments

- AssemblyAI for speech-to-text processing
- Google Cloud Platform for file storage
- MongoDB for database services
- Google Gemini for image analysis
- Contributors to the MediaRecorder API

## 📸 Screenshots
![image](https://github.com/user-attachments/assets/93242d4d-64bf-4863-91ab-92622b2edadb)



