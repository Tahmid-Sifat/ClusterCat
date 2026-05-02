"use client";

import { Activity, Mic, PhoneCall, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createLocalTracks, Room } from "livekit-client";
import type { ReactNode } from "react";
import type { ChatResponse, VoiceSessionResponse } from "@/lib/types";
import { createVoiceSession } from "@/lib/api";

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
  const roomRef = useRef<Room | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  async function startVoiceCall() {
    setConnectionError(null);
    setSessionState("connecting");

    try {
      const session = await createVoiceSession();
      setVoiceSession(session);

      const room = new Room();
      await room.connect(session.url, session.token);

      roomRef.current = room;

      room.on("disconnected", () => {
        setSessionState("ended");
      });

      room.on("participantConnected", () => {
        setSessionState("connected");
      });

      room.on("trackSubscribed", (track) => {
        if (track.kind === "audio") {
          const mediaElement = track.attach();
          mediaElement.autoplay = true;
          mediaElement.controls = false;
          if (audioContainerRef.current) {
            audioContainerRef.current.appendChild(mediaElement);
          }
          setRemoteSpeakers((count) => count + 1);
        }
      });

      room.on("trackUnsubscribed", (track) => {
        if (track.kind === "audio") {
          track.detach().forEach((el) => el.remove());
          setRemoteSpeakers((count) => Math.max(0, count - 1));
        }
      });

      const localTracks = await createLocalTracks({ audio: true, video: false });
      if (localTracks.length > 0) {
        await room.localParticipant.publishTrack(localTracks[0]);
      }

      setSessionState("connected");
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
    setSessionState("ended");
  }

  const statusText =
    sessionState === "connected"
      ? "Connected to live voice room"
      : sessionState === "connecting"
      ? "Connecting..."
      : sessionState === "failed"
      ? "Connection failed"
      : sessionState === "ended"
      ? "Call ended"
      : "Ready to start real-time voice";

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#d8cec2] bg-[#fffdf9] shadow-[0_18px_45px_rgba(63,52,42,0.10)] transition hover:border-[#9a7a61] hover:shadow-[0_22px_55px_rgba(63,52,42,0.14)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#7c5236]" />
      <div className="grid gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">LiveKit voice receptionist</p>
            <h2 className="mt-1 text-xl font-semibold text-[#332a22]">Talk to ClusterCat in real time</h2>
            <p className="mt-1 text-sm text-[#7a6b5e]">Connect a live voice room to the backend voice worker and stream audio instead of using chat fallback.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 shadow-sm">
            <span className={`h-2 w-2 rounded-full ${sessionState === "connected" ? "bg-green-600 animate-pulse" : "bg-slate-400"}`} />
            {statusText}
          </span>
        </div>

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

          <div className="flex h-24 items-center justify-center gap-1 rounded-lg border border-[#d8cec2] bg-[#fffdf9] px-4 shadow-sm">
            {Array.from({ length: 34 }).map((_, index) => (
              <span
                className={`w-1 rounded-full bg-[#7c5236]/80 ${sessionState === "connecting" ? "animate-pulse" : ""}`}
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

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="rounded-lg border border-[#d8cec2] bg-[#fffdf9] p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 text-[#9a7a61]" size={18} />
              <div>
                <p className="text-sm font-semibold text-[#332a22]">Real-time voice demo</p>
                <p className="mt-1 text-sm leading-6 text-[#7a6b5e]">Open a LiveKit room, publish your microphone audio, and receive the backend voice agent in real time.</p>
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
            {sessionState === "connected" ? (
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#cbb7a4] bg-white px-5 text-sm font-semibold text-[#332a22] shadow-sm transition hover:border-[#7c5236] hover:bg-[#f3efe7]"
                onClick={stopVoiceCall}
                type="button"
              >
                End call
              </button>
            ) : null}
          </div>
        </div>

        {connectionError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{connectionError}</div>
        ) : null}

        <div ref={audioContainerRef} className="hidden" />
        {voiceSession ? (
          <div className="rounded-lg border border-[#d8cec2] bg-[#fffdf9] p-3 text-sm text-[#7a6b5e]">
            <p>Room: <span className="font-mono text-[#332a22]">{voiceSession.room}</span></p>
            <p>Identity: <span className="font-mono text-[#332a22]">{voiceSession.identity}</span></p>
            <p>Expires: <span className="font-mono text-[#332a22]">{new Date(voiceSession.expires_at).toLocaleString()}</span></p>
            <p>Remote speakers: {remoteSpeakers}</p>
          </div>
        ) : null}
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
