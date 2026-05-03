"use client";

import { Activity, Mic, PhoneCall, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createLocalTracks, Room } from "livekit-client";
import type { ReactNode } from "react";
import type { ChatResponse, VoiceSessionResponse } from "@/lib/types";
import { createVoiceSession, getVoiceTranscript } from "@/lib/api";
import type { VoiceTranscriptTurn } from "@/lib/api";

interface VoiceReceptionConsoleProps {
  response: ChatResponse | null;
  isLoading: boolean;
}

export function VoiceReceptionConsole({ response, isLoading }: VoiceReceptionConsoleProps) {
  const owner = response?.owner?.name ?? "Incoming caller";
  const pet = response?.pet?.name ?? "Pet profile pending";
  const step = response?.workflow_state.current_step ?? "awaiting_call";
  const activeAgent = response?.active_agent ?? "Reception";
  const status = response?.workflow_state.status ?? "active";

  const [sessionState, setSessionState] = useState<"idle" | "connecting" | "connected" | "failed" | "ended">("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [voiceSession, setVoiceSession] = useState<VoiceSessionResponse | null>(null);
  const [remoteSpeakers, setRemoteSpeakers] = useState(0);
  const [remoteParticipants, setRemoteParticipants] = useState(0);
  const [transcript, setTranscript] = useState<VoiceTranscriptTurn[]>([]);

  const roomRef = useRef<Room | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const attachedAudioTracksRef = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
      clearRemoteAudio(false);
      stopPolling();
    };
  }, []);

  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  function startPolling(roomName: string) {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await getVoiceTranscript(roomName);
        if (data.transcript.length > 0) {
          setTranscript(data.transcript);
        }
      } catch {
        // silently ignore poll errors
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  function trackKey(track: any) {
    return track.sid ?? track.mediaStreamTrack?.id ?? track.id;
  }

  function clearRemoteAudio(updateState = true) {
    audioContainerRef.current?.replaceChildren();
    attachedAudioTracksRef.current.clear();
    if (updateState) setRemoteSpeakers(0);
  }

  async function attachRemoteAudioTrack(track: any) {
    if (track.kind !== "audio") return;
    const key = trackKey(track);
    if (key && attachedAudioTracksRef.current.has(key)) return;

    const mediaElement = track.attach() as HTMLAudioElement;
    mediaElement.autoplay = true;
    mediaElement.controls = false;
    mediaElement.muted = false;
    mediaElement.setAttribute("playsinline", "true");
    if (audioContainerRef.current) audioContainerRef.current.appendChild(mediaElement);
    if (key) {
      attachedAudioTracksRef.current.add(key);
      setRemoteSpeakers(attachedAudioTracksRef.current.size);
    } else {
      setRemoteSpeakers((count) => count + 1);
    }

    try {
      await mediaElement.play();
    } catch (err) {
      console.warn("Browser blocked remote voice playback", err);
      setConnectionError("Connected, but the browser blocked speaker playback. Click Start voice call again and allow microphone/audio.");
    }
  }

  function detachRemoteAudioTrack(track: any) {
    if (track.kind !== "audio") return;
    track.detach().forEach((el: HTMLElement) => el.remove());
    const key = trackKey(track);
    if (key) {
      attachedAudioTracksRef.current.delete(key);
      setRemoteSpeakers(attachedAudioTracksRef.current.size);
    } else {
      setRemoteSpeakers((count) => Math.max(0, count - 1));
    }
  }

  function setupParticipantListeners(participant: any) {
    participant.on("trackSubscribed", (track: any) => void attachRemoteAudioTrack(track));
    participant.on("trackUnsubscribed", (track: any) => detachRemoteAudioTrack(track));

    participant.audioTrackPublications.forEach((publication: any) => {
      publication.on("subscribed", (track: any) => void attachRemoteAudioTrack(track));
      publication.on("unsubscribed", (track: any) => detachRemoteAudioTrack(track));
      if (!publication.isSubscribed) {
        try { publication.setSubscribed(true); } catch { }
      }
      if (publication.track) void attachRemoteAudioTrack(publication.track);
    });
  }

  function registerRoomListeners(room: Room) {
    room.on("disconnected", () => {
      clearRemoteAudio();
      setSessionState("ended");
      stopPolling();
    });

    room.on("participantConnected", (participant: any) => {
      setRemoteParticipants((count) => count + 1);
      setSessionState("connected");
      setupParticipantListeners(participant);
    });

    room.on("participantDisconnected", () => {
      setRemoteParticipants((count) => Math.max(0, count - 1));
    });

    room.on("trackSubscribed", (track: any) => void attachRemoteAudioTrack(track));
    room.on("trackUnsubscribed", (track: any) => detachRemoteAudioTrack(track));
  }

  async function startVoiceCall() {
    setConnectionError(null);
    clearRemoteAudio();
    setTranscript([]);
    setSessionState("connecting");

    try {
      const session = await createVoiceSession();
      setVoiceSession(session);

      const room = new Room();
      registerRoomListeners(room);
      await room.connect(session.url, session.token, { autoSubscribe: true });
      await room.startAudio();

      roomRef.current = room;
      setRemoteParticipants(room.remoteParticipants.size);
      room.remoteParticipants.forEach((participant: any) => setupParticipantListeners(participant));

      const localTracks = await createLocalTracks({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      if (localTracks.length > 0) await room.localParticipant.publishTrack(localTracks[0]);

      setSessionState("connected");
      startPolling(session.room);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectionError(message);
      setSessionState("failed");
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  }

  function stopVoiceCall() {
    roomRef.current?.disconnect();
    roomRef.current = null;
    clearRemoteAudio();
    stopPolling();
    setSessionState("ended");
  }

  const statusText =
    sessionState === "connected" ? "Live — voice connected"
    : sessionState === "connecting" ? "Connecting..."
    : sessionState === "failed" ? "Connection failed"
    : sessionState === "ended" ? "Call ended"
    : "Ready to start real-time voice";

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#d8cec2] bg-[#fffdf9] shadow-[0_18px_45px_rgba(63,52,42,0.10)] transition hover:border-[#9a7a61] hover:shadow-[0_22px_55px_rgba(63,52,42,0.14)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#7c5236]" />
      <div className="grid gap-5 p-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">LiveKit voice receptionist</p>
            <h2 className="mt-1 text-base font-semibold text-[#332a22] sm:text-xl">Talk to ClusterCat in real time</h2>
            <p className="mt-1 text-xs text-[#7a6b5e] sm:text-sm">Live two-way voice with real-time transcript.</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 shadow-sm sm:px-3 sm:py-1.5">
            <span className={`h-2 w-2 rounded-full ${sessionState === "connected" ? "bg-green-600 animate-pulse" : "bg-slate-400"}`} />
            {statusText}
          </span>
        </div>

        {/* Caller info + waveform */}
        <div className="rounded-xl border border-[#d8cec2] bg-[#f7f2ec] p-4 shadow-inner">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-[#cbb7a4] bg-[#fffdf9] text-[#7c5236] shadow-sm">
                <PhoneCall size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#332a22]">{owner}</p>
                <p className="text-sm text-[#7a6b5e]">{pet}</p>
              </div>
            </div>
            <span className="rounded-full border border-[#d8cec2] bg-[#fffdf9] px-3 py-1 font-mono text-xs font-semibold text-[#5c4a3b]">{step}</span>
          </div>

          <div className="flex h-14 items-center justify-center gap-1 rounded-lg border border-[#d8cec2] bg-[#fffdf9] px-4 shadow-sm sm:h-24">
            {Array.from({ length: 34 }).map((_, index) => (
              <span
                className={`w-1 rounded-full bg-[#7c5236]/80 ${sessionState === "connecting" || sessionState === "connected" ? "animate-pulse" : ""}`}
                key={index}
                style={{ height: `${18 + ((index * 13) % 54)}px`, animationDelay: `${index * 35}ms` }}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric icon={<Mic size={16} />} label="Active agent" value={activeAgent} />
            <Metric icon={<Activity size={16} />} label="Workflow status" value={status} />
            <Metric icon={<ShieldAlert size={16} />} label="Safety mode" value={response?.triage_level ?? "monitoring"} />
          </div>
        </div>

        {/* Live transcript */}
        {(sessionState === "connected" || sessionState === "ended" || transcript.length > 0) && (
          <div className="rounded-xl border border-[#d8cec2] bg-[#f7f2ec] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">Live transcript</p>
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1 sm:max-h-80">
              {transcript.length === 0 ? (
                <p className="text-sm text-[#9a8a7d] italic">Waiting for speech…</p>
              ) : (
                transcript.map((turn) => (
                  <div
                    key={turn._id}
                    className={`flex gap-2 ${turn.role === "agent" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        turn.role === "agent"
                          ? "rounded-tr-sm bg-[#7c5236] text-white"
                          : "rounded-tl-sm bg-white text-[#332a22] border border-[#d8cec2]"
                      }`}
                    >
                      <p className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wide ${turn.role === "agent" ? "text-[#e8cbb0]" : "text-[#9a7a61]"}`}>
                        {turn.role === "agent" ? "ClusterCat" : "You"}
                      </p>
                      {turn.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptBottomRef} />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="rounded-lg border border-[#d8cec2] bg-[#fffdf9] p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 text-[#9a7a61]" size={18} />
              <div>
                <p className="text-sm font-semibold text-[#332a22]">Real-time voice</p>
                <p className="mt-1 text-sm leading-6 text-[#7a6b5e]">Speak naturally — the agent listens, responds out loud, and the transcript updates live below.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#7c5236] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,82,54,0.28)] transition hover:-translate-y-0.5 hover:bg-[#68432c] hover:shadow-[0_14px_30px_rgba(124,82,54,0.34)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              disabled={sessionState === "connecting" || sessionState === "connected"}
              onClick={startVoiceCall}
              type="button"
            >
              Start voice call
            </button>
            {sessionState === "connected" && (
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#cbb7a4] bg-white px-5 text-sm font-semibold text-[#332a22] shadow-sm transition hover:border-[#7c5236] hover:bg-[#f3efe7]"
                onClick={stopVoiceCall}
                type="button"
              >
                End call
              </button>
            )}
          </div>
        </div>

        {connectionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{connectionError}</div>
        )}

        <div ref={audioContainerRef} className="sr-only" />

        {voiceSession && (
          <div className="rounded-lg border border-[#d8cec2] bg-[#fffdf9] p-3 text-sm text-[#7a6b5e]">
            <p>Room: <span className="font-mono text-[#332a22]">{voiceSession.room}</span></p>
            <p>Identity: <span className="font-mono text-[#332a22]">{voiceSession.identity}</span></p>
            <p>Expires: <span className="font-mono text-[#332a22]">{new Date(voiceSession.expires_at).toLocaleString()}</span></p>
            <p>Remote participants: {remoteParticipants} · Remote speakers: {remoteSpeakers}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8cec2] bg-[#fffdf9] p-3 shadow-sm transition hover:border-[#9a7a61] hover:shadow-md">
      <div className="mb-2 flex items-center gap-2 text-[#9a7a61]">{icon}<span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div>
      <p className="truncate text-sm font-semibold text-[#332a22]">{value}</p>
    </div>
  );
}
