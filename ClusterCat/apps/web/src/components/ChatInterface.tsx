"use client";

import { MessageSquare, Mic, MicOff, Send, Stethoscope } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/types";

const demoMessage =
  "Hi, I need to book Bella for a wellness exam. She's been scratching a lot and seems a bit off. She was also at another vet last week and they gave her something but I can't remember what it was. Oh - and I think she might be pregnant.";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
}

export function ChatInterface({ messages, isLoading, error, onSendMessage }: ChatInterfaceProps) {
  const [value, setValue] = useState(demoMessage);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechSupported(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const transcriptText = finalTranscript.trim() || interimTranscript.trim();
      if (transcriptText) {
        setValue(transcriptText);
      }

      if (finalTranscript.trim()) {
        submit(finalTranscript.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognition.stop();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);
  }, []);

  function submit(override?: string) {
    const text = override ? override.trim() : value.trim();
    if (!text || isLoading) return;
    onSendMessage(text);
    setValue("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function toggleListening() {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setSpeechSupported(true);
      setValue("");
    } catch {
      setIsListening(false);
    }
  }

  return (
    <section className="grid min-h-[420px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-[#d8cec2] bg-[#fffdf9] shadow-[0_14px_34px_rgba(63,52,42,0.09)] transition hover:border-[#9a7a61] hover:shadow-[0_18px_42px_rgba(63,52,42,0.12)]">
      <div className="flex items-center justify-between border-b border-[#d8cec2] bg-[#fffdf9] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#d8cec2] bg-[#f4ede6] text-[#7c5236]">
            <MessageSquare size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#332a22]">Live Transcript & Chat Fallback</h2>
            <p className="text-xs text-[#7a6b5e]">Used when voice is unavailable or for demo replay.</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 space-y-4 overflow-y-auto bg-[#f7f2ec] p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            ClusterCat is thinking...
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-[#d8cec2] bg-[#fffdf9] p-3">
        {error ? <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbb7a4] bg-white px-4 text-sm font-semibold text-[#332a22] shadow-sm transition hover:border-[#7c5236] hover:bg-[#f3efe7] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!speechSupported}
            onClick={toggleListening}
            type="button"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            {isListening ? "Listening..." : speechSupported ? "Talk" : "Voice not supported"}
          </button>
          <input
            className="min-w-0 flex-1 rounded-lg border border-[#cbb7a4] bg-white px-3 py-2 text-sm text-[#332a22] shadow-sm outline-none transition hover:border-[#9a7a61] focus:border-[#7c5236] focus:ring-2 focus:ring-[#d8c5b6]"
            disabled={isLoading}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type Sarah's message..."
            value={value}
          />
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#7c5236] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(124,82,54,0.24)] transition hover:-translate-y-0.5 hover:bg-[#68432c] hover:shadow-[0_12px_24px_rgba(124,82,54,0.30)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            disabled={isLoading || !value.trim()}
            type="submit"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex animate-[fadeIn_220ms_ease-out] ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] ${isUser ? "text-right" : "text-left"}`}>
        <div className="flex items-start gap-2">
          {!isUser ? (
            <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f4ede6] text-[#7c5236]">
              <Stethoscope size={15} />
            </span>
          ) : null}
          <div className={isUser ? "rounded-2xl rounded-br-sm bg-[#7c5236] px-4 py-2 text-sm text-white shadow-md transition hover:bg-[#68432c]" : "rounded-2xl rounded-bl-sm border border-[#d8cec2] bg-[#fffdf9] px-4 py-2 text-sm text-[#332a22] shadow-sm transition hover:border-[#9a7a61] hover:shadow-md"}>
            {message.text}
          </div>
        </div>
        <time className="mt-1 block text-xs text-slate-400">{formatTime(message.timestamp)}</time>
      </div>
    </div>
  );
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
