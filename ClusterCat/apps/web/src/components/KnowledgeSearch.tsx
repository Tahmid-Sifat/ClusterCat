"use client";

import { FormEvent, useState } from "react";
import { searchKnowledge } from "@/lib/api";
import type { KnowledgeChunk } from "@/lib/types";

export function KnowledgeSearch() {
  const [query, setQuery] = useState("pregnancy external medication");
  const [results, setResults] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await searchKnowledge(query, ["pregnancy", "medication"]);
      setResults(response.chunks);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]">
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setQuery(event.target.value)}
          value={query}
        />
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_12px_24px_rgba(37,99,235,0.28)] disabled:translate-y-0 disabled:opacity-60" disabled={loading} type="submit">
          Search
        </button>
      </form>
      <div className="grid gap-3">
        {results.map((chunk, index) => (
          <article className="rounded-lg border border-slate-200 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" key={`${chunk.content}-${index}`}>
            <p className="text-sm leading-6 text-slate-700">{chunk.content}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.round(chunk.score * 100)}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">{Math.round(chunk.score * 100)}% match</span>
              {chunk.tags.map((tag) => (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
