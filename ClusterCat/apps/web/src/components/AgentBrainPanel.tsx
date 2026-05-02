"use client";

import { BrainCircuit } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

export function AgentBrainPanel() {
  const dashboard = useDashboard();
  const workflow = dashboard?.workflows?.[0];
  const latestAction = workflow?.agent_actions?.at?.(-1);

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BrainCircuit size={20} className="text-coral" />
        <h2 className="font-semibold">Agent Brain</h2>
      </div>
      <dl className="grid gap-2 text-sm">
        <Row label="Active agent" value={latestAction?.agent ?? "Reception Agent"} />
        <Row label="Workflow state" value={workflow?.current_step ?? "start"} />
        <Row label="Status" value={workflow?.status ?? "ready"} />
        <Row label="Policy chunk" value={workflow?.state?.policy_chunks?.[0]?.content ?? "Waiting for retrieval"} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-black/45">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
