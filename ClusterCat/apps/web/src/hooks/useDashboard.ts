"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";
import type { DashboardData } from "@/lib/types";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const dashboard = await getDashboard();
        if (!active) return;
        setData(dashboard);
        setLastUpdated(new Date());
      } finally {
        if (active) setIsLoading(false);
      }
    }

    poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { data, isLoading, lastUpdated };
}
