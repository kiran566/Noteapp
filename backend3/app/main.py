
from fastapi import FastAPI
from app.core.config import settings
from fastapi import HTTPException
from pymongo.errors import PyMongoError
from app.database.connection import check_database_connection
from app.routers.auth import router as auth_router
from app.routers.notes import router as notes_router
from fastapi.middleware.cors import CORSMiddleware
from app.routers.chat import router as chat_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="NotesApp backend built with FastAPI and MongoDB",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "NotesApp API is running",
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

# dbchrck
@app.get("/health/db")
def database_health_check():
    try:
        check_database_connection()
        return {"status": "connected", "database": "notesapp"}
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        )
        
app.include_router(auth_router)
app.include_router(notes_router)
# for chatting
app.include_router(chat_router)
from fastapi.middleware.cors import CORSMiddleware

