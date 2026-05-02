from __future__ import annotations

import logging
import uuid
from typing import Any

from livekit.agents import APIConnectOptions, llm

from agents.orchestrator import handle_message

logger = logging.getLogger("clustercat-voice-bridge")


class OrchestratorBridge(llm.LLM):
    """
    Wraps the ClusterCat orchestrator so LiveKit VoiceAssistant can call it
    through the LiveKit LLM interface.
    """

    def __init__(self, conversation_id: str, session_state: dict[str, Any] | None = None, phone: str = "+44 7700 900001"):
        super().__init__()
        self.conversation_id = conversation_id
        self.session_state = session_state or {}
        self.phone = phone

    def chat(
        self,
        *,
        chat_ctx: llm.ChatContext,
        conn_options: APIConnectOptions | None = None,
        fnc_ctx=None,
        **kwargs,
    ):
        latest_message = _latest_user_message(chat_ctx)
        return OrchestratorStream(
            bridge=self,
            chat_ctx=chat_ctx,
            latest_message=latest_message,
            fnc_ctx=fnc_ctx,
            conn_options=conn_options or APIConnectOptions(),
        )


class OrchestratorStream(llm.LLMStream):
    """
    LiveKit expects an async stream of ChatChunk objects. The existing
    orchestrator returns one complete response, so this stream emits one chunk.
    """

    def __init__(
        self,
        bridge: OrchestratorBridge,
        chat_ctx: llm.ChatContext,
        latest_message: str,
        fnc_ctx,
        conn_options: APIConnectOptions,
    ):
        self.bridge = bridge
        self.latest_message = latest_message
        super().__init__(
            bridge,
            chat_ctx=chat_ctx,
            fnc_ctx=fnc_ctx,
            conn_options=conn_options,
        )

    async def _run(self):
        try:
            result = await handle_message(self.bridge.phone, self.latest_message, channel="voice")
            self.bridge.session_state = {
                "workflow_id": result.workflow_id,
                "current_step": result.current_step,
                "urgency_level": result.urgency_level,
                "flags": result.flags,
            }
            response_text = result.reply
        except Exception:
            logger.exception("Orchestrator failed during voice turn")
            response_text = (
                "I'm sorry, I'm having a technical issue. "
                "Please call the clinic directly or try again in a moment."
            )

        self._event_ch.send_nowait(
            llm.ChatChunk(
                request_id=str(uuid.uuid4()),
                choices=[
                    llm.Choice(
                        delta=llm.ChoiceDelta(
                            role="assistant",
                            content=response_text,
                        )
                    )
                ],
            )
        )


def _latest_user_message(chat_ctx: llm.ChatContext):
    for msg in reversed(chat_ctx.messages):
        if getattr(msg, "role", None) == "user":
            content = getattr(msg, "content", "")
            if isinstance(content, list):
                return " ".join(str(part) for part in content)
            return str(content)
    return ""
