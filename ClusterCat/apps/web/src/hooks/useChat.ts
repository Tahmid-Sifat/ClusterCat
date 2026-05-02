"use client";

import { useState } from "react";
import { sendChat } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";

export function useChat() {
  const [messages, setMessages] = useState<{ role: "owner" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello, Islington Animal Hospital. How can I help today?" }
  ]);
  const [latest, setLatest] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(message: string) {
    setLoading(true);
    setMessages((items) => [...items, { role: "owner", content: message }]);
    try {
      const response = await sendChat(message);
      setLatest(response);
      setMessages((items) => [...items, { role: "assistant", content: response.reply }]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, latest, loading, submit };
}
