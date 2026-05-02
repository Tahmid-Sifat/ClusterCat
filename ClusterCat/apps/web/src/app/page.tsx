import { AgentBrainPanel } from "@/components/AgentBrainPanel";
import { AgenticChecklist } from "@/components/AgenticChecklist";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
            <div>
              <h1 className="text-2xl font-semibold">ClusterCat</h1>
              <p className="text-sm text-black/60">Islington Animal Hospital front desk</p>
            </div>
            <a className="text-sm font-medium text-coral" href="/dashboard">Staff dashboard</a>
          </div>
          <ChatInterface />
        </section>
        <aside className="grid gap-4">
          <AgentBrainPanel />
          <AgenticChecklist />
        </aside>
      </div>
    </main>
  );
}
