from __future__ import annotations

import json
from typing import Callable

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage

from ..state import GraphState, ResumeTarget


PROMPT = """You are an expert resume editor. Analyze the resume text below and return JSON with the single weakest bullet point.
The JSON must match: {{"text": "...", "missing": "..."}}.
Only pick bullets lacking metrics, scope, or impact.
Resume:
{resume}
"""


def build_scanner_node(llm: BaseChatModel) -> Callable[[GraphState], GraphState]:
    def scanner(state: GraphState) -> GraphState:
        resume_text = state.get("resume_text", "")
        if not resume_text:
            raise ValueError("Resume text missing in state")

        messages = [
            SystemMessage(content="You analyze resumes and identify weak bullet points."),
            HumanMessage(content=PROMPT.format(resume=resume_text)),
        ]
        response = llm.invoke(messages)
        data = _parse_json(response.content)
        target = ResumeTarget(**data)
        return {
            "current_target": target,
            "status": "interviewing",
        }

    return scanner


def _parse_json(payload: str) -> dict:
    try:
        start = payload.index("{")
        end = payload.rindex("}") + 1
        return json.loads(payload[start:end])
    except (ValueError, json.JSONDecodeError) as exc:
        raise ValueError(f"Scanner response not JSON: {payload}") from exc


__all__ = ["build_scanner_node"]
