"use client";

import { useDashboard } from "@/hooks/useDashboard";

export function StaffHandoffNote() {
  const dashboard = useDashboard();
  const handoff = dashboard?.staff_handoffs?.[0];
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">Staff Handoff</h2>
      <p className="text-sm">{handoff?.note ?? "No handoff generated yet."}</p>
    </section>
  );
}
