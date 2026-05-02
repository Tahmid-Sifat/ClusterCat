"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";
import type { Dashboard } from "@/lib/types";

export function useDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      const data = await getDashboard();
      if (active) setDashboard(data);
    }
    poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return dashboard;
}
