import os
from dotenv import load_dotenv

load_dotenv()

ENV = {
    "PORT": int(os.getenv("PORT", 5001)),
    "NODE_ENV": os.getenv("NODE_ENV", "development"),

    "MONGO_URI": (
        os.getenv("ATLAS_URI")
        if os.getenv("NODE_ENV") == "production"
        else os.getenv("MONGO_URI")
    )
}