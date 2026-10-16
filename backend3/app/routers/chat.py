import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import litellm

from app.dependencies.auth import get_current_user
from app.services.notes_service import get_notes

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

@router.post("/stream")
def stream_chat(
    req: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    # 1. RETRIEVAL: Fetch user's current notes from MongoDB
    user_notes = get_notes(user_id=current_user["id"])
    
    # Format notes into structured context
    notes_context = "\n---\n".join([
        f"Note ID: {n['id']}\nTitle: {n['title']}\nTags: {', '.join(n.get('tags', []))}\nContent: {n['content']}"
        for n in user_notes
    ]) if user_notes else "The user has no notes yet."

    # 2. PROMPT INJECTION: Instruct model for both Q&A and Note Generation
    system_prompt = (
        "You are an intelligent AI Notes Assistant for NotesApp.\n"
        "Your capabilities:\n"
        "1. RETRIEVAL & Q&A: Answer questions accurately based ONLY on the user's notes provided below. "
        "When referencing notes, mention their titles.\n"
        "2. NOTE DRAFTING & MANAGEMENT: If the user asks to create, brainstorm, summarize, or draft a note, "
        "output clear, beautifully formatted notes (use headings and bullet points).\n\n"
        f"### USER'S CURRENT NOTES:\n{notes_context}\n"
    )

    messages = [{"role": "system", "content": system_prompt}]
    
    # Append conversation history
    for item in req.history[-6:]:  # Keep last 6 exchanges for context
        messages.append({"role": item["role"], "content": item["content"]})
    
    messages.append({"role": "user", "content": req.message})

    # 3. GATEWAY CALL WITH AUTOMATIC FALLBACK
    primary_model = os.getenv("DEFAULT_AI_MODEL", "groq/openai/gpt-oss-120b")
    fallback_model = os.getenv("FALLBACK_AI_MODEL", "gemini/gemini-3.5-flash-lite")

    def generate_stream():
        try:
            # 1. Try Primary model (Groq)
            response = litellm.completion(
                model=primary_model,
                messages=messages,
                stream=True,
            )
            for chunk in response:
                content = chunk.choices[0].delta.content or ""
                if content:
                    yield content
        except Exception as e:
            print(f"[AI Chat] Primary model ({primary_model}) error: {e}. Trying fallback ({fallback_model})...")
            try:
                # 2. Try Fallback model (Gemini)
                fallback_resp = litellm.completion(
                    model=fallback_model,
                    messages=messages,
                    stream=True,
                )
                for chunk in fallback_resp:
                    content = chunk.choices[0].delta.content or ""
                    if content:
                        yield content
            except Exception as fallback_err:
                print(f"[AI Chat] Fallback model ({fallback_model}) also failed: {fallback_err}")
                yield f"\n\n[AI Error: Both primary and fallback models failed. Details: {str(fallback_err)}]"

    return StreamingResponse(generate_stream(), media_type="text/plain")