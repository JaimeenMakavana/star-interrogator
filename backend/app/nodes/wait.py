from __future__ import annotations

from typing import Callable

from langchain_core.messages import HumanMessage

from ..state import GraphState


def build_wait_node() -> Callable[[GraphState], GraphState]:
    def wait_for_user(state: GraphState) -> GraphState:
        answer = state.get("user_response", "").strip()
        chat_history = list(state.get("chat_history", []))
        if answer:
            chat_history.append(HumanMessage(content=answer))
        return {"chat_history": chat_history}

    return wait_for_user


__all__ = ["build_wait_node"]
