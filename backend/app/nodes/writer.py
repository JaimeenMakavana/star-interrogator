from __future__ import annotations

from typing import Callable

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from ..state import GraphState
from ..tools.rag import ResumeRAG


WRITER_PROMPT = """You are rewriting resume bullets into STAR format.
Use the weak bullet, resume context, retrieved evidence, and the candidate's answer to craft a single bullet.
The bullet must:
- Start with an action verb
- Include metrics or clear impact
- Fit within 40 words
Weak bullet: "{text}"
Missing info: {missing}
Resume context:
{resume}
Retrieved notes:
{context}
Candidate answer:
{answer}
"""


def build_writer_node(llm: BaseChatModel, rag: ResumeRAG | None = None) -> Callable[[GraphState], GraphState]:
    def writer(state: GraphState) -> GraphState:
        target = state.get("current_target")
        resume_text = state.get("resume_text", "")
        answer = state.get("user_response", "")
        if not target or not answer:
            raise ValueError("Writer requires target context and a user answer")

        context_chunks = rag.similarity_search(target.text) if rag else []
        context_text = "\n---\n".join(context_chunks) or "(no extra context)"

        messages = [
            SystemMessage(content="You craft concise STAR bullets."),
            HumanMessage(
                content=WRITER_PROMPT.format(
                    text=target.text,
                    missing=target.missing,
                    resume=resume_text,
                    answer=answer,
                    context=context_text,
                )
            ),
        ]
        response = llm.invoke(messages)
        bullet = response.content.strip()
        chat_history = list(state.get("chat_history", []))
        chat_history.append(AIMessage(content=bullet))
        return {
            "final_bullet": bullet,
            "chat_history": chat_history,
            "status": "completed",
            "pending_question": "",
            "user_response": "",
        }

    return writer


__all__ = ["build_writer_node"]
