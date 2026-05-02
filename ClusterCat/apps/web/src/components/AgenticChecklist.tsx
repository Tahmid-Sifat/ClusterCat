"use client";

import { CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

export function AgenticChecklist() {
  const dashboard = useDashboard();
  const workflow = dashboard?.workflows?.[0];
  const checks = [
    ["Persistent workflow", Boolean(workflow)],
    ["Emergency-first guard", workflow?.current_step !== undefined],
    ["Multi-agent actions logged", (workflow?.agent_actions?.length ?? 0) > 2],
    ["Vector policy retrieval", (dashboard?.retrieval_feedback?.length ?? 0) > 0],
    ["Pregnancy protocol flag", Boolean(workflow?.state?.pregnancy_flag)],
    ["External medication flag", Boolean(workflow?.state?.external_medication_flag)]
  ];

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Why This Is Agentic</h2>
      <div className="grid gap-2">
        {checks.map(([label, done]) => (
          <div key={String(label)} className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={18} className={done ? "text-emerald-600" : "text-black/20"} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
