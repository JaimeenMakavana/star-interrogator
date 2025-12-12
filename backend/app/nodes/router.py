from __future__ import annotations

from typing import Callable

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage

from ..state import GraphState


ROUTER_PROMPT = """Decide if the latest answer has enough detail to draft a STAR bullet.
Answer with one token: DRAFT or FOLLOWUP.
Question: {question}
Answer: {answer}
"""


def build_router_node(llm: BaseChatModel) -> Callable[[GraphState], GraphState]:
    def router(state: GraphState) -> GraphState:
        answer = state.get("user_response", "").strip()
        question = state.get("pending_question", "")
        if not answer:
            decision = "FOLLOWUP"
        else:
            messages = [
                SystemMessage(content="You evaluate if more info is required."),
                HumanMessage(content=ROUTER_PROMPT.format(question=question, answer=answer)),
            ]
            response = llm.invoke(messages)
            text = response.content.strip().upper()
            decision = "DRAFT" if "DRAFT" in text else "FOLLOWUP"

        return {"router_decision": decision}

    return router


def route_from_state(state: GraphState) -> str:
    decision = state.get("router_decision", "FOLLOWUP")
    return "draft" if decision == "DRAFT" else "ask_more"


__all__ = ["build_router_node", "route_from_state"]
