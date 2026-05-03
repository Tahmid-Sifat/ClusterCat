"use client";

import type { Message } from "@/lib/types";

export function TranscriptPanel({ messages = [] }: { messages?: Message[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Transcript</h2>
      <div className="max-h-48 space-y-2 overflow-y-auto text-sm sm:max-h-80">
        {messages.length === 0 ? <p className="text-slate-500">No transcript available on this page.</p> : null}
        {messages.map((message) => (
          <p className="rounded-md bg-slate-50 p-2 text-slate-600" key={message.id}>
            <span className="font-mono text-xs text-slate-400">{formatTime(message.timestamp)}</span> <span className="font-semibold text-slate-900">{message.role}:</span> {message.text}
          </p>
        ))}
      </div>
    </section>
  );
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}
