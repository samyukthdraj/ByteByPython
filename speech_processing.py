import requests
from config import settings

def process_speech_to_text(file):
    headers = {"authorization": settings.ASSEMBLYAI_API_KEY}

    # Upload file to AssemblyAI
    response = requests.post(
        "https://api.assemblyai.com/v2/upload",
        headers=headers,
        files={"file": file.file},
    )
    upload_url = response.json()["upload_url"]

    # Request transcription
    transcript_request = {"audio_url": upload_url}
    transcript_response = requests.post(
        "https://api.assemblyai.com/v2/transcript",
        json=transcript_request,
        headers=headers,
    )
    transcript_id = transcript_response.json()["id"]

    # Get transcription result
    result = requests.get(
        f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
        headers=headers,
    ).json()
    return result.get("text", "Transcription failed.")
