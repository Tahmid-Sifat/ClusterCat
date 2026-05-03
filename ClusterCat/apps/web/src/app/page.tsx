"use client";

import { AgentBrainPanel } from "@/components/AgentBrainPanel";
import { AgenticChecklist } from "@/components/AgenticChecklist";
import { CalendlySchedulingPanel } from "@/components/CalendlySchedulingPanel";
import { ChatInterface } from "@/components/ChatInterface";
import { FlagsPanel } from "@/components/FlagsPanel";
import { StaffHandoffNote } from "@/components/StaffHandoffNote";
import { TriageIndicator } from "@/components/TriageIndicator";
import { VoiceReceptionConsole } from "@/components/VoiceReceptionConsole";
import { useChat } from "@/hooks/useChat";

export default function Home() {
  const chat = useChat();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f0eb] text-[#332a22] lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-7xl flex-col p-2 sm:p-4">
        <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-[#d8cec2] bg-[#fffdf9] px-3 py-2 shadow-[0_12px_30px_rgba(63,52,42,0.08)] sm:mb-4 sm:px-4 sm:py-3">
          <div>
            <h1 className="text-base font-semibold text-[#332a22] sm:text-lg">Islington Animal Hospital</h1>
            <p className="text-xs text-[#7a6b5e] sm:text-sm">ClusterCat voice AI receptionist and operations agent</p>
          </div>
          <a className="rounded-md border border-[#d8cec2] bg-[#fffdf9] px-3 py-1.5 text-xs font-semibold text-[#7c5236] shadow-sm transition hover:-translate-y-0.5 hover:border-[#9a7a61] hover:bg-[#f4ede6] hover:shadow-md sm:px-3 sm:py-2 sm:text-sm" href="/dashboard">
            View Dashboard
          </a>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 sm:gap-4 lg:grid-cols-[58fr_42fr]">
          <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <VoiceReceptionConsole response={chat.currentResponse} isLoading={chat.isLoading} />
            <ChatInterface messages={chat.messages} isLoading={chat.isLoading} error={chat.error} onSendMessage={chat.sendMessage} />
          </div>

          <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <AgentBrainPanel response={chat.currentResponse} />
            {chat.currentResponse?.triage_level ? <TriageIndicator level={chat.currentResponse.triage_level} /> : null}
            <CalendlySchedulingPanel response={chat.currentResponse} />
            <FlagsPanel response={chat.currentResponse} />
            <AgenticChecklist response={chat.currentResponse} />
            <StaffHandoffNote note={chat.currentResponse?.handoff_note ?? null} />
          </aside>
        </div>
      </div>
    </main>
  );
}
