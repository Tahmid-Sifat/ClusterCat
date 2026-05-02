"use client";

import { useMemo, useState } from "react";
import { sendChat } from "@/lib/api";
import type { ChatResponse, Message, WorkflowState } from "@/lib/types";

export function useChat() {
  const conversationId = useMemo(() => createId(), []);
  const [messages, setMessages] = useState<Message[]>([
    { id: createId(), role: "agent", text: "Hello, Islington Animal Hospital. How can I help today?", timestamp: new Date().toISOString() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setMessages((items) => [...items, { id: createId(), role: "user", text: trimmed, timestamp: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const response = await sendChat({
        message: trimmed,
        conversation_id: conversationId,
        session_state: currentResponse?.workflow_state ?? {}
      });
      setCurrentResponse(response);
      setMessages((items) => [...items, { id: createId(), role: "agent", text: response.response, timestamp: new Date().toISOString() }]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to reach ClusterCat";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return { messages, isLoading, currentResponse, error, conversationId, sendMessage };
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type UseChatReturn = ReturnType<typeof useChat>;
export type SessionState = WorkflowState | Record<string, never>;
