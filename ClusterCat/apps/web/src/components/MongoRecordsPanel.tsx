"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatResponse } from "@/lib/types";

type Tab = "Owner" | "Pet" | "Workflow" | "Appointment";

const tabs: Tab[] = ["Owner", "Pet", "Workflow", "Appointment"];

export function MongoRecordsPanel({ response }: { response: ChatResponse | null }) {
  const [active, setActive] = useState<Tab>("Workflow");
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const previous = useRef<string>("");
  const signature = JSON.stringify(response);

  useEffect(() => {
    if (!response) return;
    const before = previous.current ? JSON.parse(previous.current) as ChatResponse : null;
    const next = new Set<string>();
    if (before) {
      compare("owner.name", before.owner?.name, response.owner?.name, next);
      compare("pet.name", before.pet?.name, response.pet?.name, next);
      compare("workflow.current_step", before.workflow_state.current_step, response.workflow_state.current_step, next);
      compare("workflow.pregnancy_flag", before.workflow_state.pregnancy_flag, response.workflow_state.pregnancy_flag, next);
      compare("workflow.external_medication_flag", before.workflow_state.external_medication_flag, response.workflow_state.external_medication_flag, next);
      compare("appointment.status", before.appointment?.status, response.appointment?.status, next);
    }
    previous.current = signature;
    if (next.size > 0) {
      setChanged(next);
      const timer = window.setTimeout(() => setChanged(new Set()), 800);
      return () => window.clearTimeout(timer);
    }
  }, [response, signature]);

  return (
    <section className="rounded-xl border border-[#d8cec2] bg-[#fffdf9] p-4 shadow-[0_14px_34px_rgba(63,52,42,0.09)] transition hover:border-[#9a7a61] hover:shadow-[0_18px_42px_rgba(63,52,42,0.12)]">
      <h2 className="mb-4 text-sm font-semibold text-[#332a22]">MongoDB Records</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            className={`rounded-md border px-3 py-1.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active === tab ? "border-[#7c5236] bg-[#f4ede6] text-[#7c5236]" : "border-[#d8cec2] bg-[#fffdf9] text-[#7a6b5e] hover:border-[#9a7a61] hover:text-[#7c5236]"}`}
            key={tab}
            onClick={() => setActive(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {active === "Owner" ? <OwnerTab response={response} changed={changed} /> : null}
      {active === "Pet" ? <PetTab response={response} changed={changed} /> : null}
      {active === "Workflow" ? <WorkflowTab response={response} changed={changed} /> : null}
      {active === "Appointment" ? <AppointmentTab response={response} changed={changed} /> : null}
    </section>
  );
}

function OwnerTab({ response, changed }: PanelProps) {
  if (!response?.owner) return <Empty label="Owner record appears after identification." />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Field label="Name" value={response.owner.name} highlight={changed.has("owner.name")} />
      <Field label="Phone" value={response.owner.phone} />
      <Field label="Email" value={response.owner.email} />
    </div>
  );
}

function PetTab({ response, changed }: PanelProps) {
  if (!response?.pet) return <Empty label="Pet record appears after pet memory lookup." />;
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Name" value={response.pet.name} highlight={changed.has("pet.name")} />
        <Field label="Breed" value={response.pet.breed} />
        <Field label="Age" value={String(response.pet.age)} />
        <Field label="Weight" value={response.pet.weight ? `${response.pet.weight} kg` : "Unknown"} />
      </div>
      <TagRow label="Allergies" tags={response.pet.allergies} tone="red" />
      <TagRow label="Medications" tags={response.pet.current_medications} tone="amber" />
      <TagRow label="Past diagnoses" tags={response.pet.previous_diagnoses} tone="slate" />
    </div>
  );
}

function WorkflowTab({ response, changed }: PanelProps) {
  if (!response) return <Empty label="Workflow document appears after the first message." />;
  return (
    <div className="space-y-4">
      <span className={`inline-flex rounded-md border border-slate-200 px-3 py-1.5 font-mono text-xs font-semibold text-slate-900 transition-colors ${changed.has("workflow.current_step") ? "bg-yellow-100" : "bg-slate-50"}`}>
        {response.workflow_state.current_step}
      </span>
      <div className="flex flex-wrap gap-2">
        <BooleanBadge active={response.workflow_state.pregnancy_flag} highlight={changed.has("workflow.pregnancy_flag")} label="Pregnancy Flag" />
        <BooleanBadge active={response.workflow_state.external_medication_flag} highlight={changed.has("workflow.external_medication_flag")} label="Medication Flag" />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Missing info</p>
        {response.workflow_state.missing_info.length > 0 ? (
          <ul className="space-y-1 text-sm text-slate-600">
            {response.workflow_state.missing_info.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No missing information.</p>
        )}
      </div>
    </div>
  );
}

function AppointmentTab({ response, changed }: PanelProps) {
  if (!response?.appointment) return <Empty label="Appointment record appears after slot confirmation." />;
  const confirmed = response.appointment.status === "confirmed";
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Field label="Service" value={response.appointment.service_name} />
      <Field label="Staff" value={response.appointment.staff_name} />
      <Field label="Slot" value={response.appointment.slot} />
      <Field label="Calendly" value={response.appointment.calendly_url ? "linked" : "not linked"} />
      <div className={`rounded-md p-2 transition-colors ${changed.has("appointment.status") ? "bg-yellow-100" : "bg-white"}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
        <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${confirmed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{response.appointment.status}</span>
      </div>
    </div>
  );
}

interface PanelProps {
  response: ChatResponse | null;
  changed: Set<string>;
}

function Field({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md p-2 transition-colors duration-[800ms] ${highlight ? "bg-yellow-100" : "bg-white"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function TagRow({ label, tags, tone }: { label: string; tags: string[]; tone: "red" | "amber" | "slate" }) {
  const color = tone === "red" ? "bg-red-100 text-red-700" : tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? tags.map((tag) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`} key={tag}>{tag}</span>) : <span className="text-sm text-slate-400">None recorded</span>}
      </div>
    </div>
  );
}

function BooleanBadge({ active, label, highlight }: { active: boolean; label: string; highlight: boolean }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${active ? "border-amber-200 bg-amber-100 text-amber-700" : "border-slate-200 bg-white text-slate-400"} ${highlight ? "ring-2 ring-yellow-200" : ""}`}>{label}: {active ? "true" : "false"}</span>;
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">{label}</div>;
}

function compare(key: string, before: unknown, after: unknown, changed: Set<string>) {
  if (JSON.stringify(before) !== JSON.stringify(after)) changed.add(key);
}
