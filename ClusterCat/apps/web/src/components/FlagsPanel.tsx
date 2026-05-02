"use client";

import type { ReactNode } from "react";
import { useDashboard } from "@/hooks/useDashboard";

export function FlagsPanel() {
  const dashboard = useDashboard();
  return (
    <Panel title="Flags">
      <pre className="text-xs">{JSON.stringify(dashboard?.medication_flags ?? [], null, 2)}</pre>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm"><h2 className="mb-2 font-semibold">{title}</h2>{children}</section>;
}
