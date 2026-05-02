import { KnowledgeSearch } from "@/components/KnowledgeSearch";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Knowledge Management</h1>
      <KnowledgeSearch />
    </main>
  );
}
