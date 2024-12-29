import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from google.oauth2 import service_account

def authenticate_gmail():
    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    CREDENTIALS_FILE = 'credentials.json'  # Path to your Gmail service account JSON key file
    
    credentials = service_account.Credentials.from_service_account_file(
        CREDENTIALS_FILE, scopes=SCOPES
    )
    service = build('gmail', 'v1', credentials=credentials)
    return service


def send_test_email():
  try:
      service = authenticate_gmail()
      message = MIMEText("This is a test email.")
      message['to'] = 'linuashwin@gmail.com' # Set your test recipient
      message['from'] = "cap-mail@cap-terawe.iam.gserviceaccount.com" # set the from email
      message['subject'] = "Test email with service account."
      raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
      message = {'raw': raw_message}
      service.users().messages().send(userId='me', body=message).execute()

      print("Test email sent succesfully!")

  except Exception as error:
        print(f"An error occurred:{error}")

if __name__ == "__main__":
  send_test_email()