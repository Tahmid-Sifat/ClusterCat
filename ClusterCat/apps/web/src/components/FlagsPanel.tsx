"use client";

import { Check, Pill, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { ChatResponse } from "@/lib/types";

export function FlagsPanel({ response }: { response: ChatResponse | null }) {
  const pregnancy = Boolean(response?.workflow_state.pregnancy_flag);
  const medication = Boolean(response?.workflow_state.external_medication_flag);
  const medicationName = response?.pet?.current_medications.find((item) => item.toLowerCase().includes("apoquel")) ?? response?.pet?.current_medications[0] ?? "Unknown medication from external clinic";

  return (
    <section className="rounded-xl border border-[#d8cec2] bg-[#fffdf9] p-4 shadow-[0_14px_34px_rgba(63,52,42,0.09)] transition hover:border-[#9a7a61] hover:shadow-[0_18px_42px_rgba(63,52,42,0.12)]">
      <h2 className="mb-4 text-sm font-semibold text-[#332a22]">Active Flags</h2>
      {!pregnancy && !medication ? (
        <div className="flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-500">
          <Check size={16} />
          No active flags
        </div>
      ) : null}

      <div className="space-y-3">
        {pregnancy ? (
          <FlagCard
            body="No appointment can be confirmed until Dr. Priya approves."
            icon={<TriangleAlert size={18} />}
            title="Pregnancy Protocol Active"
            status="Awaiting Vet Approval"
          />
        ) : null}
        {medication ? (
          <FlagCard
            body={medicationName}
            icon={<Pill size={18} />}
            title="External Prescription Flagged"
            status="Pending Verification"
          />
        ) : null}
      </div>
    </section>
  );
}

function FlagCard({ icon, title, body, status }: { icon: ReactNode; title: string; body: string; status: string }) {
  return (
    <div className="animate-[slideInRight_260ms_ease-out] rounded-lg border border-slate-200 border-l-4 border-l-amber-500 bg-white p-3 shadow-sm transition hover:border-amber-200 hover:shadow-md">
      <div className="flex gap-3">
        <span className="mt-0.5 text-amber-600">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{status}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{body}</p>
        </div>
      </div>
    </div>
  );
}
