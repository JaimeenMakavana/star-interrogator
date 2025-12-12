from __future__ import annotations

import sqlite3
from typing import TYPE_CHECKING

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph, END

from .config import Settings
from .state import GraphState
from .nodes import (
    build_interviewer_node,
    build_router_node,
    build_scanner_node,
    build_wait_node,
    build_writer_node,
    route_from_state,
)

if TYPE_CHECKING:
    from .tools.rag import ResumeRAG


def build_langgraph(settings: Settings, rag: "ResumeRAG | None" = None):
    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY must be set before building the graph")

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        temperature=0.3,
        google_api_key=settings.google_api_key,
    )

    workflow = StateGraph(GraphState)
    workflow.add_node("scanner", build_scanner_node(llm))
    workflow.add_node("interviewer", build_interviewer_node(llm))
    workflow.add_node("wait_for_user", build_wait_node())
    workflow.add_node("router", build_router_node(llm))
    workflow.add_node("writer", build_writer_node(llm, rag))

    workflow.set_entry_point("scanner")
    workflow.add_edge("scanner", "interviewer")
    workflow.add_edge("interviewer", "wait_for_user")
    workflow.add_edge("wait_for_user", "router")
    workflow.add_conditional_edges(
        "router",
        route_from_state,
        {
            "ask_more": "interviewer",
            "draft": "writer",
        },
    )
    workflow.add_edge("writer", END)

    conn = sqlite3.connect(
        settings.langgraph_db_path,
        check_same_thread=False,
    )
    checkpointer = SqliteSaver(conn)
    graph = workflow.compile(checkpointer=checkpointer, interrupt_before=["wait_for_user"])
    return graph


__all__ = ["build_langgraph"]
