
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "NotesApp API"
    APP_VERSION: str = "1.0.0"

    MONGODB_URI: str = os.getenv("MONGODB_URI", "")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7


settings = Settings()
