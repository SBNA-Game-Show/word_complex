import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "5001"))
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

ATLAS_URI = os.getenv("ATLAS_URI")

if not ATLAS_URI:
    raise ValueError("ATLAS_URI is not configured")