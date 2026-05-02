"use client";

import { useEffect, useState } from "react";
import { KnowledgeSearch } from "@/components/KnowledgeSearch";
import { getKnowledge } from "@/lib/api";
import type { KnowledgeChunk } from "@/lib/types";

export default function AdminPage() {
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);

  useEffect(() => {
    getKnowledge().then(setChunks).catch(() => setChunks([]));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-lg font-semibold">Knowledge Base — Islington Animal Hospital</h1>
        <KnowledgeSearch />
        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          {chunks.map((chunk, index) => (
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={`${chunk.content}-${index}`}>
              <p className="text-sm leading-6 text-slate-700">{chunk.content.slice(0, 120)}{chunk.content.length > 120 ? "..." : ""}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {chunk.tags.map((tag) => (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
