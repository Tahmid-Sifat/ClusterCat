"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { TriageIndicator } from "./TriageIndicator";

const demo = "Hi, I need to book Bella for a wellness exam. She's been scratching a lot and seems a bit off. She was also at another vet last week and they gave her something but I can't remember what it was. Oh - and I think she might be pregnant.";

export function ChatInterface() {
  const { messages, latest, loading, submit } = useChat();
  const [value, setValue] = useState(demo);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    submit(value);
    setValue("");
  }

  return (
    <div className="grid min-h-[72vh] grid-rows-[1fr_auto] gap-3">
      <div className="space-y-3 overflow-y-auto rounded-md bg-stone-50 p-3">
        {messages.map((message, index) => (
          <div key={index} className={message.role === "owner" ? "ml-auto max-w-[82%] rounded-lg bg-ink px-3 py-2 text-white" : "max-w-[82%] rounded-lg border border-black/10 bg-white px-3 py-2"}>
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="grid gap-2">
        {latest ? <TriageIndicator urgency={latest.urgency_level} step={latest.current_step} /> : null}
        <div className="flex gap-2">
          <input className="min-w-0 flex-1 rounded-md border border-black/15 px-3 py-2" value={value} onChange={(event) => setValue(event.target.value)} />
          <button className="grid h-10 w-10 place-items-center rounded-md bg-coral text-white disabled:opacity-50" disabled={loading} title="Send">
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
