from __future__ import annotations

from typing import Callable

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from ..state import GraphState, ResumeTarget


INTERVIEWER_PROMPT = """You are preparing candidates for behavioral interviews.
Given the weak bullet below, ask ONE precise question that helps capture the missing detail.
Focus on impact, metrics, scope, or actions.
Bullet: "{text}"
Missing: {missing}
"""


def build_interviewer_node(llm: BaseChatModel) -> Callable[[GraphState], GraphState]:
    def interviewer(state: GraphState) -> GraphState:
        target = state.get("current_target")
        if not target:
            raise ValueError("Interviewer cannot run without current_target")

        messages = [
            SystemMessage(content="You help extract STAR details."),
            HumanMessage(content=INTERVIEWER_PROMPT.format(text=target.text, missing=target.missing)),
        ]
        response = llm.invoke(messages)
        question = response.content.strip()
        chat_history = list(state.get("chat_history", []))
        chat_history.append(AIMessage(content=question))
        return {
            "pending_question": question,
            "chat_history": chat_history,
            "status": "interviewing",
        }

    return interviewer


__all__ = ["build_interviewer_node"]
