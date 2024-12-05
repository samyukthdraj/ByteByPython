import assemblyai
import deepl

class SpeechProcessor:
    def __init__(self, settings):
        # New: Initialize AssemblyAI client for transcription
        self.transcribe_client = assemblyai.TranscriptionClient(
            api_key=settings.ASSEMBLYAI_API_KEY
        )
        
        # New: Initialize DeepL translator
        self.translate_client = deepl.Translator(settings.DEEPL_API_KEY)
        
    def transcribe_audio(self, audio_path):
        """
        # New: Use AssemblyAI to convert audio to text
        """
        try:
            # Upload and transcribe audio file
            transcript = self.transcribe_client.transcribe(audio_path)
            
            # Wait for transcription to complete
            while transcript.status != 'completed':
                transcript.refresh()
            
            return transcript.text
        except Exception as e:
            print(f"Transcription error: {e}")
            return ""
    
    def translate_text(self, text, target_language='EN-US'):
        """
        # New: Use DeepL for text translation
        """
        try:
            # Translate text to English
            result = self.translate_client.translate_text(
                text, 
                target_lang=target_language
            )
            return result.text
        except Exception as e:
            print(f"Translation error: {e}")
            return text