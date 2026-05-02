"use client";

import { useEffect, useRef, useState } from "react";
import type { TriageLevel } from "@/lib/types";

export function TriageIndicator({ level, compact = false }: { level: TriageLevel | null; compact?: boolean }) {
  const previous = useRef<TriageLevel | null>(null);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const order: Record<TriageLevel, number> = { routine: 1, urgent: 2, emergency: 3 };
    if (level && previous.current && order[level] > order[previous.current]) {
      setBounce(true);
      const timer = window.setTimeout(() => setBounce(false), 650);
      previous.current = level;
      return () => window.clearTimeout(timer);
    }
    previous.current = level;
  }, [level]);

  if (!level) return null;

  if (level === "routine") {
    return <span className={`inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 ${bounce ? "animate-bounce" : ""}`}>● Routine</span>;
  }

  if (level === "urgent") {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 ${bounce ? "animate-bounce" : ""}`}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-600" />
        {compact ? "Urgent" : "⚠ Urgent"}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 shadow-[0_0_0_3px_rgba(220,38,38,0.12)] ${bounce ? "animate-bounce" : "animate-pulse"}`}>
      {compact ? "Emergency" : "🚨 Emergency"}
    </span>
  );
}
