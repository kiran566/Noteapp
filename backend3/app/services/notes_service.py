
from datetime import datetime, timezone

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.errors import PyMongoError

from app.database.connection import notes_collection


STOP_WORDS = {
    "this", "that", "with", "from", "your", "have", "more", "will", "about",
    "into", "some", "been", "when", "what", "where", "which", "their", "there",
    "they", "them", "then", "than", "were", "would", "could", "should", "other",
    "note", "notes", "summary", "ideas", "title", "content", "created", "goal",
    "action", "needed", "free", "like", "know", "just", "very", "also", "most",
    "only", "make", "made", "each", "both", "such", "these", "those", "after",
    "before", "being", "here", "over", "down", "same", "many", "much", "must",
    "please", "help", "sure", "feel", "edit", "section", "plans", "firm", "fine"
}


def generate_tags(title: str, content: str) -> list[str]:
    import re

    words = re.findall(r"\b[a-z]{4,}\b", f"{title} {content}".lower())
    filtered = [w for w in dict.fromkeys(words) if w not in STOP_WORDS]
    return filtered[:6]


def serialize_note(note: dict) -> dict:
    return {
        "id": str(note["_id"]),
        "title": note["title"],
        "content": note["content"],
        "tags": note.get("tags", []),
        "isPinned": note.get("isPinned", False),
        "createdAt": note["createdAt"],
        "updatedAt": note.get("updatedAt"),
    }


def create_note(user_id: str, title: str, content: str) -> dict:
    now = datetime.now(timezone.utc)

    note = {
        "title": title.strip(),
        "content": content.strip(),
        "tags": generate_tags(title, content),
        "isPinned": False,
        "user": ObjectId(user_id),
        "createdAt": now,
        "updatedAt": now,
    }

    result = notes_collection.insert_one(note)
    note["_id"] = result.inserted_id

    return serialize_note(note)


def get_notes(user_id: str) -> list[dict]:
    notes = notes_collection.find(
        {"user": ObjectId(user_id)}
    ).sort([
        ("isPinned", DESCENDING),
        ("createdAt", DESCENDING),
    ])

    return [serialize_note(note) for note in notes]


def update_note(
    user_id: str,
    note_id: str,
    title: str,
    content: str,
) -> dict | None:
    if not ObjectId.is_valid(note_id):
        return None

    now = datetime.now(timezone.utc)

    updated = notes_collection.find_one_and_update(
        {
            "_id": ObjectId(note_id),
            "user": ObjectId(user_id),
        },
        {
            "$set": {
                "title": title.strip(),
                "content": content.strip(),
                "tags": generate_tags(title, content),
                "updatedAt": now,
            }
        },
        return_document=True,
    )

    if updated is None:
        return None

    return serialize_note(updated)


def delete_note(user_id: str, note_id: str) -> bool:
    if not ObjectId.is_valid(note_id):
        return False

    result = notes_collection.delete_one({
        "_id": ObjectId(note_id),
        "user": ObjectId(user_id),
    })

    return result.deleted_count == 1


def toggle_pin(user_id: str, note_id: str) -> dict | None:
    if not ObjectId.is_valid(note_id):
        return None

    note = notes_collection.find_one({
        "_id": ObjectId(note_id),
        "user": ObjectId(user_id),
    })

    if note is None:
        return None

    updated = notes_collection.find_one_and_update(
        {
            "_id": ObjectId(note_id),
            "user": ObjectId(user_id),
        },
        {
            "$set": {
                "isPinned": not note.get("isPinned", False),
                "updatedAt": datetime.now(timezone.utc),
            }
        },
        return_document=True,
    )

    if updated is None:
        return None

    return serialize_note(updated)
