"use client";

import { FormEvent, useState } from "react";
import { searchKnowledge } from "@/lib/api";

export function KnowledgeSearch() {
  const [query, setQuery] = useState("pregnancy external medication");
  const [results, setResults] = useState<any[]>([]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setResults(await searchKnowledge(query, "admin"));
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input className="min-w-0 flex-1 rounded-md border border-black/15 px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="rounded-md bg-ink px-3 py-2 text-white">Search</button>
      </form>
      <pre className="rounded-md bg-stone-50 p-3 text-xs">{JSON.stringify(results, null, 2)}</pre>
    </section>
  );
}
