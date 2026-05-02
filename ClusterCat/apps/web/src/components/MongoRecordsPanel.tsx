"use client";

import { useDashboard } from "@/hooks/useDashboard";

export function MongoRecordsPanel() {
  const dashboard = useDashboard();
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">MongoDB Records</h2>
      <pre className="max-h-[420px] overflow-auto rounded-md bg-ink p-3 text-xs text-white">{JSON.stringify(dashboard, null, 2)}</pre>
    </section>
  );
}
