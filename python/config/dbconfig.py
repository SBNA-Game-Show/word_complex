from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config.envconfig import ENV

client = None
db = None

def connect_db():
    global client
    global db

    try:
        client = MongoClient(ENV["MONGO_URI"])

        # verify connection
        client.admin.command("ping")

        db = client.get_database()

        print("✅ MongoDB Connected")

        return db

    except ConnectionFailure as error:
        print("❌ MongoDB Connection Failed")
        print(error)

        raise error