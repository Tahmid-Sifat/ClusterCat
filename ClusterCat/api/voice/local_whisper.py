from __future__ import annotations

import tempfile
import wave
from pathlib import Path
from uuid import uuid4

from faster_whisper import WhisperModel
from livekit import rtc
from livekit.agents import APIConnectOptions, stt
from livekit.agents.utils import AudioBuffer


class LocalWhisperSTT(stt.STT):
    def __init__(self, model: WhisperModel, language: str = "en"):
        super().__init__(capabilities=stt.STTCapabilities(streaming=False, interim_results=False))
        self._model = model
        self._language = language

    async def _recognize_impl(
        self,
        buffer: AudioBuffer,
        *,
        language: str | None,
        conn_options: APIConnectOptions,
    ) -> stt.SpeechEvent:
        wav_path = _buffer_to_wav(buffer)
        try:
            segments, _info = self._model.transcribe(
                str(wav_path),
                language=language or self._language,
                vad_filter=True,
                beam_size=1,
            )
            text = " ".join(segment.text.strip() for segment in segments).strip()
        finally:
            wav_path.unlink(missing_ok=True)

        return stt.SpeechEvent(
            type=stt.SpeechEventType.FINAL_TRANSCRIPT,
            request_id=str(uuid4()),
            alternatives=[
                stt.SpeechData(
                    language=language or self._language,
                    text=text,
                    confidence=1.0 if text else 0.0,
                )
            ],
        )


def load_whisper_model(model_size: str) -> WhisperModel:
    return WhisperModel(model_size, device="cpu", compute_type="int8")


def _buffer_to_wav(buffer: AudioBuffer) -> Path:
    frames = buffer if isinstance(buffer, list) else [buffer]
    if not frames:
        raise ValueError("Cannot transcribe empty audio buffer")

    sample_rate = frames[0].sample_rate
    num_channels = frames[0].num_channels
    path = Path(tempfile.gettempdir()) / f"clustercat-stt-{uuid4()}.wav"
    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(num_channels)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for frame in frames:
            if frame.sample_rate != sample_rate:
                raise ValueError("Mixed sample rates are not supported in one Whisper buffer")
            wav_file.writeframes(bytes(frame.data))
    return path
