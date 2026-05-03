"use client";

import { AgentBrainPanel } from "@/components/AgentBrainPanel";
import { AgenticChecklist } from "@/components/AgenticChecklist";
import { FlagsPanel } from "@/components/FlagsPanel";
import { MongoRecordsPanel } from "@/components/MongoRecordsPanel";
import { PendingTasksPanel } from "@/components/PendingTasksPanel";
import { StaffHandoffNote } from "@/components/StaffHandoffNote";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { data, lastUpdated } = useDashboard();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f0eb] p-2 text-[#332a22] sm:p-4 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-[#d8cec2] bg-[#fffdf9] px-3 py-2 shadow-[0_12px_30px_rgba(63,52,42,0.08)] sm:mb-4 sm:px-4 sm:py-3">
          <div>
            <h1 className="text-base font-semibold sm:text-lg">Staff Dashboard - Islington Animal Hospital</h1>
            <p className="text-xs text-[#7a6b5e] sm:text-sm">Live operational view for the front desk team</p>
          </div>
          <p className="text-xs text-[#7a6b5e] sm:text-sm">Updated {lastUpdated ? secondsAgo(lastUpdated) : "never"}</p>
        </header>

        <section className="mb-3 grid shrink-0 grid-cols-2 gap-2 sm:mb-4 sm:gap-3 md:grid-cols-4">
          <Stat label="Conversations Today" value={data?.stats.total_conversations_today ?? 0} />
          <Stat label="Pending Workflows" value={data?.stats.pending_workflows ?? 0} />
          <Stat label="Appointments Today" value={data?.stats.appointments_today ?? 0} />
          <Stat label="Escalations Today" value={data?.stats.escalations_today ?? 0} />
        </section>

        <section className="grid min-h-0 flex-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="min-h-0 space-y-4 overflow-y-auto">
            <AgentBrainPanel response={null} />
            <MongoRecordsPanel response={null} />
          </div>
          <div className="min-h-0 space-y-4 overflow-y-auto">
            <PendingTasksPanel />
            <FlagsPanel response={null} />
          </div>
          <div className="min-h-0 space-y-4 overflow-y-auto">
            <AgenticChecklist response={null} />
            <StaffHandoffNote note={null} />
            <TranscriptPanel />
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#d8cec2] bg-[#fffdf9] p-3 shadow-[0_12px_30px_rgba(63,52,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#9a7a61] hover:shadow-[0_16px_36px_rgba(63,52,42,0.12)] sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#332a22] sm:mt-2 sm:text-2xl">{value}</p>
    </div>
  );
}

function secondsAgo(date: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  return `${seconds}s ago`;
}
