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
    <main className="h-screen overflow-hidden bg-[#f3f0eb] p-4 text-[#332a22]">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <header className="mb-4 flex shrink-0 items-center justify-between rounded-xl border border-[#d8cec2] bg-[#fffdf9] px-4 py-3 shadow-[0_12px_30px_rgba(63,52,42,0.08)]">
          <div>
            <h1 className="text-lg font-semibold">Staff Dashboard - Islington Animal Hospital</h1>
            <p className="text-sm text-[#7a6b5e]">Live operational view for the front desk team</p>
          </div>
          <p className="text-sm text-[#7a6b5e]">Updated {lastUpdated ? secondsAgo(lastUpdated) : "never"}</p>
        </header>

        <section className="mb-4 grid shrink-0 gap-3 md:grid-cols-4">
          <Stat label="Conversations Today" value={data?.stats.total_conversations_today ?? 0} />
          <Stat label="Pending Workflows" value={data?.stats.pending_workflows ?? 0} />
          <Stat label="Appointments Today" value={data?.stats.appointments_today ?? 0} />
          <Stat label="Escalations Today" value={data?.stats.escalations_today ?? 0} />
        </section>

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3">
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
    <div className="rounded-xl border border-[#d8cec2] bg-[#fffdf9] p-4 shadow-[0_12px_30px_rgba(63,52,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#9a7a61] hover:shadow-[0_16px_36px_rgba(63,52,42,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7a6d]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#332a22]">{value}</p>
    </div>
  );
}

function secondsAgo(date: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  return `${seconds}s ago`;
}
