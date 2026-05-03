from __future__ import annotations

import asyncio
import logging
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

API_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = API_DIR.parent
for path in (API_DIR, PROJECT_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm
from livekit.agents.stt import StreamAdapter
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero

from tools.voice_transcript_tools import close_voice_conversation, create_voice_conversation, save_transcript_turn
from voice.local_piper import LocalPiperTTS, load_piper_voice
from voice.local_whisper import LocalWhisperSTT, load_whisper_model
from voice.orchestrator_bridge import OrchestratorBridge

load_dotenv(API_DIR / ".env")
load_dotenv(PROJECT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("clustercat-voice-agent")


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

    if os.getenv("VOICE_STT_PROVIDER", "whisper").lower() == "whisper":
        model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
        logger.info("Loading local Whisper model: %s", model_size)
        proc.userdata["whisper_model"] = load_whisper_model(model_size)

    if os.getenv("VOICE_TTS_PROVIDER", "piper").lower() == "piper":
        model_path = os.getenv("PIPER_MODEL_PATH")
        if model_path:
            logger.info("Loading local Piper voice: %s", model_path)
            proc.userdata["piper_voice"] = load_piper_voice(
                model_path,
                os.getenv("PIPER_CONFIG_PATH") or None,
            )


async def entrypoint(ctx: JobContext):
    logger.info("New call received - room: %s", ctx.room.name)
    _validate_environment()

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    conversation_id = str(uuid.uuid4())
    try:
        await create_voice_conversation(conversation_id, ctx.room.name)
        logger.info("Created voice conversation %s for room %s in MongoDB", conversation_id, ctx.room.name)
    except Exception as exc:
        logger.error("FAILED to create voice conversation in MongoDB: %s", exc)

    orchestrator = OrchestratorBridge(
        conversation_id=conversation_id,
        session_state={},
        phone=os.getenv("VOICE_DEMO_PHONE", "+44 7700 900001"),
    )

    vad = ctx.proc.userdata["vad"]

    assistant = VoiceAssistant(
        vad=vad,
        stt=_build_stt(ctx, vad),
        llm=orchestrator,
        tts=_build_tts(ctx),
        allow_interruptions=True,
        interrupt_speech_duration=0.5,
        interrupt_min_words=2,
    )

    setup_event_handlers(assistant, ctx, conversation_id)
    assistant.start(ctx.room)

    await asyncio.sleep(0.5)
    await assistant.say(
        "Thank you for calling Islington Animal Hospital. "
        "I am the virtual receptionist. How can I help you today?",
        allow_interruptions=False,
    )

    logger.info("Conversation %s started", conversation_id)


async def _save_turn(conversation_id: str, role: str, content: str):
    try:
        await save_transcript_turn(conversation_id, role, content)
        logger.info("[%s] Saved %s turn to MongoDB (%d chars)", conversation_id, role, len(content))
    except Exception as exc:
        logger.error("[%s] FAILED to save %s turn to MongoDB: %s", conversation_id, role, exc)


async def _close_conversation(conversation_id: str):
    try:
        await close_voice_conversation(conversation_id)
        logger.info("[%s] Conversation closed and saved to MongoDB", conversation_id)
    except Exception as exc:
        logger.error("[%s] FAILED to close conversation in MongoDB: %s", conversation_id, exc)


def setup_event_handlers(assistant: VoiceAssistant, ctx: JobContext, conversation_id: str):
    @assistant.on("user_speech_committed")
    def on_user_spoke(msg: llm.ChatMessage):
        text = str(msg.content).strip()
        if not text:
            return
        logger.info("[%s] Caller: %s", conversation_id, text)
        asyncio.ensure_future(_save_turn(conversation_id, "user", text))

    @assistant.on("agent_speech_committed")
    def on_agent_spoke(msg: llm.ChatMessage):
        text = str(msg.content).strip()
        if not text:
            return
        logger.info("[%s] Agent: %s", conversation_id, text)
        asyncio.ensure_future(_save_turn(conversation_id, "agent", text))

    @assistant.on("user_started_speaking")
    def on_user_started():
        logger.info("[%s] Caller started speaking", conversation_id)

    @assistant.on("user_stopped_speaking")
    def on_user_stopped():
        logger.info("[%s] Caller stopped speaking", conversation_id)

    @assistant.on("agent_started_speaking")
    def on_agent_started():
        logger.info("[%s] Agent started speaking", conversation_id)

    @assistant.on("agent_stopped_speaking")
    def on_agent_stopped():
        logger.info("[%s] Agent stopped speaking", conversation_id)

    @ctx.room.on("participant_disconnected")
    def on_participant_left(participant):
        logger.info("[%s] Participant disconnected: %s", conversation_id, getattr(participant, "identity", "unknown"))
        asyncio.ensure_future(_close_conversation(conversation_id))


def _validate_environment():
    required = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]
    if os.getenv("VOICE_STT_PROVIDER", "whisper").lower() == "deepgram":
        required.append("DEEPGRAM_API_KEY")
    if os.getenv("VOICE_TTS_PROVIDER", "piper").lower() == "openai":
        required.append("OPENAI_API_KEY")
    if os.getenv("VOICE_TTS_PROVIDER", "piper").lower() == "piper":
        required.append("PIPER_MODEL_PATH")
    if os.getenv("LLM_PROVIDER", "").lower() == "fireworks":
        required.append("FIREWORKS_API_KEY")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(f"Missing required voice environment variables: {', '.join(missing)}")


def _build_stt(ctx: JobContext, vad):
    provider = os.getenv("VOICE_STT_PROVIDER", "whisper").lower()
    if provider == "deepgram":
        return deepgram.STT(
            model="nova-2",
            language="en-GB",
            smart_format=True,
            endpointing=700,
        )
    if provider == "whisper":
        model = ctx.proc.userdata.get("whisper_model")
        if model is None:
            model = load_whisper_model(os.getenv("WHISPER_MODEL_SIZE", "base"))
        return StreamAdapter(
            stt=LocalWhisperSTT(model=model, language="en"),
            vad=vad,
        )
    raise RuntimeError(f"Unsupported VOICE_STT_PROVIDER: {provider}")


def _build_tts(ctx: JobContext):
    provider = os.getenv("VOICE_TTS_PROVIDER", "piper").lower()
    if provider == "openai":
        return openai.TTS(
            model="tts-1",
            voice=os.getenv("OPENAI_TTS_VOICE", "nova"),
        )
    if provider == "piper":
        voice = ctx.proc.userdata.get("piper_voice")
        if voice is None:
            voice = load_piper_voice(
                os.getenv("PIPER_MODEL_PATH"),
                os.getenv("PIPER_CONFIG_PATH") or None,
            )
        return LocalPiperTTS(voice=voice)
    raise RuntimeError(f"Unsupported VOICE_TTS_PROVIDER: {provider}")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
