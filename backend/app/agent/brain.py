"""The A-TMS operations brain: an Opus 4.8 tool-use loop over fleet state.

Manual agentic loop (not the SDK tool runner) so we control gating, capture a
transcript for the dashboard/demo, and pass thinking blocks back unchanged.
"""

from __future__ import annotations

import json

import anthropic

from app.agent.tools import TOOL_SCHEMAS, execute_tool
from app.config import get_settings
from app.db import SessionLocal
from app.schemas import AgentRunResult, AgentStep

settings = get_settings()

SYSTEM = """\
You are the autonomous operations brain of A-TMS (AI Transportation Management \
System), running the carrier {company}. You are ONE agent with many \
capabilities — you pick the right tool for the situation. You keep freight on \
schedule, handle customer communication, process freight documents, and review \
inspection findings.

You have tools to inspect loads and trucks, estimate ETAs, check routes, \
reassign loads, email customers, send milestone updates, read processed \
documents and photo inspections for a load, generate invoices from a matched \
POD, and escalate to a human. Work the problem with the tools — never assume \
facts the tools haven't shown you.

When a load will miss its delivery window:
1. Confirm it from the data (which load, how late, why).
2. Proactively email the customer an honest, specific update — lead with the \
heads-up, give the new ETA, say what we're doing. Sign off as "The {company} \
Team". Don't over-apologize or invent details.
3. If an AVAILABLE truck is positioned to do better and has the capacity, \
reassign the load to save the delivery.

After a delivery: check the load's inspections and documents. If a POD is \
matched and clean, generate the invoice. If an inspection flagged damage, do \
NOT act alone — escalate to a human.

Confidence and stakes: act alone only when you are confident and the action is \
low-stakes. For anything high-stakes (flagging damage, large invoices, \
responding to complaints) or when you are unsure, use escalate_to_human — the \
system also enforces this with an approval queue.

Be decisive. When you've handled the situation, briefly summarize what you did \
and why."""


def run_agent(situation: str, dry_run: bool = True, max_iterations: int = 8) -> AgentRunResult:
    """Run the brain against a situation. Returns the final message + transcript."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    system = SYSTEM.format(company=settings.company_name)

    messages: list[dict] = [{"role": "user", "content": situation}]
    steps: list[AgentStep] = []
    final_message = ""

    # One DB session for the whole run so tool calls share a transaction view.
    with SessionLocal() as db:
        for iteration in range(1, max_iterations + 1):
            response = client.messages.create(
                model=settings.reasoning_model,
                max_tokens=8000,
                system=system,
                thinking={"type": "adaptive", "display": "summarized"},
                output_config={"effort": "medium"},
                tools=TOOL_SCHEMAS,
                messages=messages,
            )

            if response.stop_reason == "refusal":
                steps.append(AgentStep(kind="text", text="[brain declined to act]"))
                final_message = "Declined."
                break

            tool_uses = []
            for block in response.content:
                if block.type == "thinking":
                    if block.thinking:
                        steps.append(AgentStep(kind="thinking", text=block.thinking))
                elif block.type == "text":
                    steps.append(AgentStep(kind="text", text=block.text))
                    final_message = block.text
                elif block.type == "tool_use":
                    tool_uses.append(block)

            # pause_turn: server-side tool loop paused; resume with the same turn.
            if response.stop_reason == "pause_turn":
                messages.append({"role": "assistant", "content": response.content})
                continue

            if response.stop_reason != "tool_use":
                break  # end_turn

            # Preserve the assistant turn (text + thinking + tool_use blocks) verbatim.
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for tu in tool_uses:
                output = execute_tool(db, tu.name, dict(tu.input), dry_run=dry_run)
                steps.append(
                    AgentStep(kind="tool_call", tool=tu.name, tool_input=dict(tu.input))
                )
                steps.append(AgentStep(kind="tool_result", tool=tu.name, tool_output=output))
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tu.id,
                        "content": json.dumps(output),
                    }
                )
            messages.append({"role": "user", "content": tool_results})
        else:
            iteration = max_iterations  # loop exhausted without break

    return AgentRunResult(
        final_message=final_message,
        steps=steps,
        iterations=iteration,
        dry_run=dry_run,
    )
