
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import PyMongoError

from app.dependencies.auth import get_current_user
from app.schemas.notes import NoteCreate, NoteUpdate
from app.services.notes_service import (
    create_note,
    get_notes,
    update_note,
    delete_note,
    toggle_pin,
)

router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_note(
    data: NoteCreate,
    current_user: dict = Depends(get_current_user),
):
    try:
        return create_note(
            user_id=current_user["id"],
            title=data.title,
            content=data.content,
        )
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Unable to save note",
        )


@router.get("/")
def list_notes(
    current_user: dict = Depends(get_current_user),
):
    try:
        return get_notes(user_id=current_user["id"])
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve notes",
        )


@router.put("/{note_id}")
def edit_note(
    note_id: str,
    data: NoteUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        note = update_note(
            user_id=current_user["id"],
            note_id=note_id,
            title=data.title,
            content=data.content,
        )
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Unable to update note",
        )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    return note


@router.delete("/{note_id}")
def remove_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        deleted = delete_note(
            user_id=current_user["id"],
            note_id=note_id,
        )
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Unable to delete note",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    return {"message": "Note deleted successfully"}


@router.patch("/pin/{note_id}")
def pin_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        note = toggle_pin(
            user_id=current_user["id"],
            note_id=note_id,
        )
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Unable to update pin status",
        )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    return note
