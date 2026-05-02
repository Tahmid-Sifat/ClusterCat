"use client";

import { useDashboard } from "@/hooks/useDashboard";

export function TranscriptPanel() {
  const dashboard = useDashboard();
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">Recent Agent Actions</h2>
      <div className="grid gap-2 text-sm">
        {(dashboard?.workflows?.[0]?.agent_actions ?? []).map((action: any, index: number) => (
          <div key={index} className="rounded-md border border-black/10 p-2">
            <strong>{action.agent}</strong>: {action.detail}
          </div>
        ))}
      </div>
    </section>
  );
}
