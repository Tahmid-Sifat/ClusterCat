"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";

export function PendingTasksPanel() {
  const { data } = useDashboard();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const pending = (data?.pending_workflows ?? []).filter((workflow) => workflow.status !== "completed");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Pending Tasks</h2>
      {pending.length === 0 ? <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">All workflows up to date ✓</div> : null}
      <div className="space-y-2">
        {pending.map((workflow) => (
          <div className="flex animate-[fadeIn_220ms_ease-out] items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" key={workflow._id}>
            <Clock className="text-amber-600" size={17} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">Awaiting vet approval — {workflow.workflow_type}</p>
              <p className="text-xs text-slate-500">flagged {relativeTime(workflow.updated_at, now)} ago</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{workflow.workflow_type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function relativeTime(value: string, now: Date): string {
  const diff = Math.max(0, now.getTime() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "less than a minute";
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}
