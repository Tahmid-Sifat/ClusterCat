"use client";

import { useDashboard } from "@/hooks/useDashboard";

export function PendingTasksPanel() {
  const dashboard = useDashboard();
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">Pending Tasks</h2>
      {(dashboard?.workflows ?? []).map((workflow) => (
        <div key={workflow._id} className="mb-2 rounded-md bg-mint p-3 text-sm">
          <strong>{workflow.current_step}</strong>
          <p>{workflow.status}</p>
        </div>
      ))}
    </section>
  );
}
