# Voice Setup

ClusterCat voice uses LiveKit for call transport, Fireworks as the configured hosted model provider, local Whisper for STT, and local Piper for TTS.

## Required `.env`

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

LLM_PROVIDER=fireworks
FIREWORKS_API_KEY=
FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1
FIREWORKS_MODEL=accounts/fireworks/models/glm-5

VOICE_STT_PROVIDER=whisper
WHISPER_MODEL_SIZE=base

VOICE_TTS_PROVIDER=piper
PIPER_MODEL_PATH=F:\path\to\voice.onnx
PIPER_CONFIG_PATH=F:\path\to\voice.onnx.json
```

`PIPER_CONFIG_PATH` is optional when the config JSON sits next to the ONNX model using Piper's expected filename.

## Run

```powershell
cd F:\ClusterCat\ClusterCat
py api\voice\agent.py dev
```

First run downloads the Whisper model. Piper does not auto-download voices; download a Piper voice model and set `PIPER_MODEL_PATH`.
