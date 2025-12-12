from __future__ import annotations

from typing import Literal, TypedDict

from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field


class ResumeTarget(BaseModel):
    text: str = Field(..., description="Original bullet that needs improvement")
    missing: str = Field(..., description="Key data missing from the bullet")


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class GraphState(TypedDict, total=False):
    resume_text: str
    vector_doc_ids: list[str]
    current_target: ResumeTarget | None
    status: Literal["idle", "interviewing", "drafting", "completed"]
    chat_history: list[BaseMessage]
    pending_question: str | None
    user_response: str
    final_bullet: str
    router_decision: Literal["DRAFT", "FOLLOWUP"]
    question_count: int


__all__ = [
    "ResumeTarget",
    "ChatTurn",
    "GraphState",
]
