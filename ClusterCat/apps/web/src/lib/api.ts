import type { ChatResponse, Dashboard } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function sendChat(message: string, phone = "+44 7700 900001"): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, phone, channel: "chat" })
  });
  if (!response.ok) throw new Error("Chat request failed");
  return response.json();
}

export async function getDashboard(): Promise<Dashboard> {
  const response = await fetch(`${API_BASE}/api/dashboard`, { cache: "no-store" });
  if (!response.ok) throw new Error("Dashboard request failed");
  return response.json();
}

export async function searchKnowledge(q: string, intent = "faq") {
  const response = await fetch(`${API_BASE}/api/knowledge?q=${encodeURIComponent(q)}&intent=${encodeURIComponent(intent)}`);
  if (!response.ok) throw new Error("Knowledge search failed");
  return response.json();
}
