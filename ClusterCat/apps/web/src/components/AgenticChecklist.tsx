"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AgentName, ChatResponse } from "@/lib/types";

const items = [
  "Workflow saved in MongoDB across session interruption",
  "Agent resumed from saved state",
  "Multiple specialist agents collaborated",
  "Triage agent pre-empted the booking workflow",
  "Pregnancy flag triggered specialist protocol retrieval",
  "External medication flag recorded and passed to vet",
  "Retrieval adapted across policy, memory, and availability",
  "Staff received a structured handoff note"
];

export function AgenticChecklist({ response }: { response: ChatResponse | null }) {
  const [triggered, setTriggered] = useState<Set<number>>(new Set());
  const [justTriggered, setJustTriggered] = useState<Set<number>>(new Set());
  const seenAgents = useRef<Set<AgentName>>(new Set());
  const lastPendingStep = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    const next = new Set(triggered);
    const newly = new Set<number>();
    const activeAgent = response.active_agent;
    const step = response.workflow_state.current_step;

    seenAgents.current.add(activeAgent);

    mark(0, response.workflow_state.status === "pending", next, newly);
    mark(1, Boolean(lastPendingStep.current && lastPendingStep.current !== step), next, newly);
    mark(2, seenAgents.current.size >= 3, next, newly);
    mark(3, activeAgent === "Triage", next, newly);
    mark(4, response.workflow_state.pregnancy_flag, next, newly);
    mark(5, response.workflow_state.external_medication_flag, next, newly);
    mark(6, Boolean(response.retrieved_policy && seenAgents.current.has("Policy Retrieval") && seenAgents.current.has("Pet Memory")), next, newly);
    mark(7, response.handoff_note !== null, next, newly);

    if (response.workflow_state.status === "pending") lastPendingStep.current = step;

    if (newly.size > 0) {
      setTriggered(next);
      setJustTriggered(newly);
      const timer = window.setTimeout(() => setJustTriggered(new Set()), 450);
      return () => window.clearTimeout(timer);
    }
  }, [response, triggered]);

  return (
    <section className="rounded-xl border border-[#d8cec2] bg-[#fffdf9] p-4 shadow-[0_14px_34px_rgba(63,52,42,0.09)] transition hover:border-[#9a7a61] hover:shadow-[0_18px_42px_rgba(63,52,42,0.12)]">
      <h2 className="mb-4 text-sm font-semibold text-[#332a22]">Why This Is Agentic</h2>
      <div className="space-y-3">
        {items.map((item, index) => {
          const done = triggered.has(index);
          const pulse = justTriggered.has(index);
          return (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-transparent p-1.5 text-sm transition hover:border-[#d8cec2] hover:bg-[#f7f2ec]">
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all duration-[400ms] ${
                  done ? "border-green-600 bg-green-600 text-white" : "border-slate-300 bg-white text-transparent"
                } ${pulse ? "scale-105" : "scale-100"}`}
              >
                <Check size={13} />
              </span>
              <span className={`transition-colors duration-[400ms] ${done ? "font-medium text-slate-900" : "text-slate-400"}`}>{item}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function mark(index: number, condition: boolean, next: Set<number>, newly: Set<number>) {
  if (condition && !next.has(index)) {
    next.add(index);
    newly.add(index);
  }
}
