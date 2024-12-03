
# Prerequisites and Setup

- Using these instead of Google Cloud; 
    AssemblyAI (for speech-to-text): Offers a free tier for speech-to-text.
    DeepL (for translation): Provides a free version with some limitations. {considering alternatives}
- Using HuggingFace instead of OpenAI API keys
- Install Python 3.8+
- Install dependencies: pip install -r requirements.txt
- python -m pip install -r requirements.txt if the above doesnt work, 
- Set up MongoDB locally or use a cloud service
<!-- - Obtain OpenAI API key for image analysis -->
<!-- - Set up Google Cloud credentials for speech-to-text and translation -->

# Key Features Implemented

- FastAPI backend
- MongoDB integration for storing reports
- OpenAI Vision API for crime type detection from images
- Google Cloud Speech-to-Text for voice note transcription
- Google Cloud Translation for converting transcribed text to English

# Workflow

- User uploads an image (optional)

- If no crime type is specified, AI attempts to detect from the image


- User uploads a voice note (optional)

- AI transcribes and translates the voice note


- User can manually edit crime type and description
- Report is saved to MongoDB

# Additional Configuration Needed

- Replace placeholders in config.py and .env with your actual credentials
- Install Google Cloud SDK and set up authentication
- Install MongoDB and configure connection string

# Deployment Recommendations

- Use Docker for containerization
- Deploy on cloud platforms like AWS, Google Cloud, or Azure
- Use Nginx as a reverse proxy
- Set up SSL for secure communication

  ![image](https://github.com/user-attachments/assets/b2525697-4356-49dc-b4fa-3677d5fa513b)


# Security Notes

- Implement proper authentication and authorization
- Add input validation
- Sanitize and validate all user inputs
- Implement rate limiting
- Secure file uploads

# Setup Instructions:

Install dependencies: pip install -r requirements.txt
Set up MongoDB (local or cloud)
Replace API keys in config.py
Run the application: uvicorn main:app --reload
