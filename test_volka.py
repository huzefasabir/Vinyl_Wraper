from gradio_client import Client

SPACE_ID = "Volkopat/SegmentAnythingxGroundingDINO"

print("Connecting to Hugging Face Space...")

client = Client(SPACE_ID)

print("Connected successfully.")

client.view_api()
