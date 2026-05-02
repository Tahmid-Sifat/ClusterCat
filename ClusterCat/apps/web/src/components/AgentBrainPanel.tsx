"use client";

import { BrainCircuit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AgentName, ChatResponse, RetrievedPolicy } from "@/lib/types";
import { TriageIndicator } from "./TriageIndicator";

const agents: AgentName[] = ["Reception", "Triage", "Scheduler", "Pet Memory", "Policy Retrieval", "Escalation"];

export function AgentBrainPanel({ response }: { response: ChatResponse | null }) {
  const [showMore, setShowMore] = useState(false);
  const [flash, setFlash] = useState(false);
  const signature = useMemo(() => JSON.stringify(response), [response]);

  useEffect(() => {
    if (!response) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 550);
    return () => window.clearTimeout(timer);
  }, [signature, response]);

  const activeAgent = response?.active_agent ?? "Reception";
  const currentStep = response?.workflow_state.current_step ?? "start";
  const nextAction = response?.next_action ?? "Ready to identify the owner and pet";

  return (
    <section className={`rounded-xl border bg-[#fffdf9] p-4 shadow-[0_14px_34px_rgba(63,52,42,0.09)] transition duration-200 hover:border-[#9a7a61] hover:shadow-[0_18px_42px_rgba(63,52,42,0.12)] ${flash ? "border-[#7c5236] shadow-[0_0_0_3px_rgba(124,82,54,0.18),0_18px_42px_rgba(63,52,42,0.12)]" : "border-[#d8cec2]"}`}>
      <div className="mb-4 flex items-center gap-2">
        <BrainCircuit size={19} className="text-[#7c5236]" />
        <h2 className="text-sm font-semibold text-[#332a22]">Agent Brain</h2>
      </div>

      <div className="space-y-4">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">Active Agent</p>
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <span
                key={agent}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ease-in-out ${
                  agent === activeAgent ? "border-[#332a22] bg-[#332a22] text-white shadow-md" : "border-[#d8cec2] bg-[#fffdf9] text-[#7a6b5e] hover:border-[#9a7a61] hover:text-[#7c5236]"
                }`}
              >
                {agent}
              </span>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">Current Step</p>
          <span className="inline-flex rounded-md border border-[#d8cec2] bg-[#f7f2ec] px-2.5 py-1 font-mono text-xs font-semibold text-[#332a22]">{currentStep}</span>
          <p className="mt-2 text-sm text-[#7a6b5e]">{nextAction}</p>
        </section>

        {response?.triage_level ? (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">Triage Level</p>
            <TriageIndicator level={response.triage_level} compact />
          </section>
        ) : null}

        {response?.retrieved_policy ? <PolicyCard policy={response.retrieved_policy} showMore={showMore} onToggle={() => setShowMore((value) => !value)} /> : null}

        <p className="border-t border-[#d8cec2] pt-3 text-sm text-[#7a6b5e]">Next: {nextAction}</p>
      </div>
    </section>
  );
}

function PolicyCard({ policy, showMore, onToggle }: { policy: RetrievedPolicy; showMore: boolean; onToggle: () => void }) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">Retrieved Policy</p>
      <div className="rounded-lg border border-yellow-200 bg-[#fefce8] p-3 shadow-sm transition hover:border-amber-300 hover:shadow-md">
        <p className={`text-sm leading-6 text-slate-800 ${showMore ? "" : "line-clamp-3"}`}>{policy.content}</p>
        {policy.content.length > 120 ? (
          <button className="mt-1 text-xs font-semibold text-[#7c5236]" onClick={onToggle} type="button">
            {showMore ? "Show less" : "Show more"}
          </button>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">{Math.round(policy.score * 100)}% match</span>
          {policy.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
