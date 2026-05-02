from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from livekit import rtc
from livekit.agents import APIConnectOptions, tts
from livekit.agents.utils.audio import AudioByteStream
from piper import PiperVoice


class LocalPiperTTS(tts.TTS):
    def __init__(self, voice: PiperVoice):
        self._voice = voice
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=voice.config.sample_rate,
            num_channels=1,
        )

    def synthesize(
        self,
        text: str,
        *,
        conn_options: APIConnectOptions | None = None,
    ) -> tts.ChunkedStream:
        return PiperChunkedStream(tts=self, input_text=text, conn_options=conn_options)


class PiperChunkedStream(tts.ChunkedStream):
    async def _run(self) -> None:
        request_id = str(uuid4())
        emitter = tts.SynthesizedAudioEmitter(event_ch=self._event_ch, request_id=request_id)
        byte_stream = AudioByteStream(
            sample_rate=self._tts.sample_rate,
            num_channels=self._tts.num_channels,
        )

        voice = self._tts._voice
        for chunk in voice.synthesize(self._input_text):
            for frame in byte_stream.push(chunk.audio_int16_bytes):
                emitter.push(frame)

        for frame in byte_stream.flush():
            emitter.push(frame)

        emitter.flush()


def load_piper_voice(model_path: str | None, config_path: str | None = None) -> PiperVoice:
    if not model_path:
        raise RuntimeError(
            "PIPER_MODEL_PATH is required for local Piper TTS. "
            "Download a Piper .onnx voice model and set PIPER_MODEL_PATH in api/.env."
        )

    model = Path(model_path)
    if not model.exists():
        raise RuntimeError(f"Piper model file does not exist: {model}")

    config = Path(config_path) if config_path else None
    if config and not config.exists():
        raise RuntimeError(f"Piper config file does not exist: {config}")

    return PiperVoice.load(model, config_path=config)
