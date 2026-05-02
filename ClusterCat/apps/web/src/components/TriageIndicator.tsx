export function TriageIndicator({ urgency, step }: { urgency: string | null; step: string }) {
  const color = urgency === "emergency" ? "bg-red-100 text-red-800" : urgency === "urgent" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800";
  return <div className={`rounded-md px-3 py-2 text-sm font-medium ${color}`}>Urgency: {urgency ?? "not classified"} | State: {step}</div>;
}
