"use client";

import { CalendarCheck, ExternalLink, Link2 } from "lucide-react";
import { calendlyUrl } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";

export function CalendlySchedulingPanel({ response }: { response: ChatResponse | null }) {
  const appointment = response?.appointment;
  const blocked = Boolean(response?.workflow_state.pregnancy_flag || response?.workflow_state.external_medication_flag);
  const url = appointment?.calendly_url ?? calendlyUrl();

  return (
    <section className="rounded-xl border border-[#d8cec2] bg-[#fffdf9] p-4 shadow-[0_16px_40px_rgba(63,52,42,0.10)] transition hover:-translate-y-0.5 hover:border-[#9a7a61] hover:shadow-[0_20px_48px_rgba(63,52,42,0.14)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#d8cec2] bg-[#f4ede6] text-[#7c5236]">
            <CalendarCheck size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#332a22]">Calendly Calendar Sync</h2>
            <p className="text-xs text-[#7a6b5e]">Appointment handoff from voice workflow to clinic calendar.</p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${blocked ? "border-amber-200 bg-amber-100 text-amber-800" : "border-green-200 bg-green-100 text-green-700"}`}>
          {blocked ? "Vet approval first" : "Ready to schedule"}
        </span>
      </div>

      <div className="rounded-lg border border-[#d8cec2] bg-[#f7f2ec] p-3">
        <div className="grid gap-2 text-sm">
          <Row label="Service" value={appointment?.service_name ?? "Wellness Exam"} />
          <Row label="Staff calendar" value={appointment?.staff_name ?? "Dr. Priya Mehta"} />
          <Row label="Calendar status" value={appointment?.status ?? "pending_vet_approval"} />
        </div>
      </div>

      <a
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7c5236] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,82,54,0.28)] transition hover:-translate-y-0.5 hover:bg-[#68432c] hover:shadow-[0_14px_30px_rgba(124,82,54,0.34)]"
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        <Link2 size={16} />
        Open Calendly booking
        <ExternalLink size={14} />
      </a>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#e4dbd0] pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">{label}</span>
      <span className="truncate text-right font-medium text-[#332a22]">{value}</span>
    </div>
  );
}
