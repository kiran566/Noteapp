
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from pymongo.errors import DuplicateKeyError

from app.core.config import settings
from app.database.connection import users_collection


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: str, name: str | None = None) -> str:
    if not settings.JWT_SECRET:
        raise RuntimeError("JWT_SECRET is missing from .env")

    now = datetime.now(timezone.utc)

    payload = {
        "id": user_id,
        "name": name,
        "iat": now,
        "exp": now + timedelta(days=settings.JWT_EXPIRE_DAYS),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def signup_user(name: str, email: str, password: str) -> dict:
    email = email.strip().lower()

    existing_user = users_collection.find_one({"email": email})

    if existing_user:
        raise ValueError("An account with this email already exists")

    user = {
        "name": name.strip(),
        "email": email,
        "password": hash_password(password),
        "createdAt": datetime.now(timezone.utc),
    }

    try:
        result = users_collection.insert_one(user)
    except DuplicateKeyError:
        raise ValueError("An account with this email already exists")

    user_id = str(result.inserted_id)
    token = create_access_token(user_id, user["name"])

    return {
        "message": "Signup successful",
        "token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
        },
    }


def login_user(email: str, password: str) -> dict:
    email = email.strip().lower()

    user = users_collection.find_one({"email": email})

    if not user or not verify_password(password, user["password"]):
        raise ValueError("Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["name"])

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
        },
    }
