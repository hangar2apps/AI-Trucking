"""Shared helpers for handing files to Claude (native PDF + image reading).

Builds the right content block for a stored file and runs a structured
tool-call extraction (same pattern as inquiry_agent) so capabilities get a
validated dict back instead of free text.
"""

from __future__ import annotations

from typing import Any

import anthropic

from app.agent import storage
from app.config import get_settings


def build_file_block(relative_path: str, media_type: str) -> dict[str, Any]:
    """Return a Claude content block (image or document) for a stored file."""
    data = storage.read_base64(relative_path)
    if storage.is_image(media_type):
        return {
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": data},
        }
    return {
        "type": "document",
        "source": {"type": "base64", "media_type": "application/pdf", "data": data},
    }


def extract_structured(
    *,
    system: str,
    instruction: str,
    file_blocks: list[dict[str, Any]],
    tool_name: str,
    tool_schema: dict[str, Any],
    model: str | None = None,
    max_tokens: int = 1500,
) -> dict[str, Any]:
    """Call Claude with file blocks + a forced tool to get a structured dict."""
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    content: list[dict[str, Any]] = [{"type": "text", "text": instruction}]
    content.extend(file_blocks)

    response = client.messages.create(
        model=model or settings.email_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": content}],
        tools=[
            {
                "name": tool_name,
                "description": f"Return the structured {tool_name} result.",
                "input_schema": tool_schema,
            }
        ],
        tool_choice={"type": "tool", "name": tool_name},
    )
    block = next((b for b in response.content if b.type == "tool_use"), None)
    if block is None:
        return {}
    return dict(block.input)
