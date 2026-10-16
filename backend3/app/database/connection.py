
from pymongo import MongoClient
from app.core.config import settings

if not settings.MONGODB_URI:
    raise ValueError("MONGODB_URI is missing from the .env file")

client = MongoClient(
    settings.MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)

# Select the database using Python
db = client["notesapp"]

# Select collections
users_collection = db["users"]
notes_collection = db["notes"]


def check_database_connection():
    client.admin.command("ping")
    return True
