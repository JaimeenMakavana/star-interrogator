from __future__ import annotations

import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import get_settings
from .graph import build_langgraph
from .state import GraphState, ResumeTarget
from .tools.rag import ResumeRAG

settings = get_settings()
app = FastAPI(title="Star Interrogator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = ResumeRAG(settings)
workflow = build_langgraph(settings, rag)


class UploadResponse(BaseModel):
    thread_id: str
    question: str | None
    current_target: ResumeTarget | None
    status: str


class ChatRequest(BaseModel):
    thread_id: str
    message: str


class ChatResponse(BaseModel):
    question: str | None
    final_bullet: str | None
    status: str


@app.post("/upload", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)) -> UploadResponse:
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    try:
        ingest = rag.ingest_pdf(file_bytes, file.filename or "resume.pdf")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    thread_id = uuid.uuid4().hex
    initial_state: GraphState = {
        "resume_text": ingest.resume_text,
        "vector_doc_ids": ingest.document_ids,
        "status": "idle",
        "chat_history": [],
        "question_count": 0,
    }

    result = workflow.invoke(initial_state, config={"configurable": {"thread_id": thread_id}})
    return UploadResponse(
        thread_id=thread_id,
        question=result.get("pending_question"),
        current_target=result.get("current_target"),
        status=result.get("status", "interviewing"),
    )


@app.post("/chat", response_model=ChatResponse)
async def continue_chat(payload: ChatRequest) -> ChatResponse:
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    config = {"configurable": {"thread_id": payload.thread_id}}
    result = workflow.invoke({"user_response": payload.message}, config=config)
    return ChatResponse(
        question=result.get("pending_question"),
        final_bullet=result.get("final_bullet"),
        status=result.get("status", "interviewing"),
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
