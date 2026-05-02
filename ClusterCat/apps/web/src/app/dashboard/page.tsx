import { FlagsPanel } from "@/components/FlagsPanel";
import { MongoRecordsPanel } from "@/components/MongoRecordsPanel";
import { PendingTasksPanel } from "@/components/PendingTasksPanel";
import { StaffHandoffNote } from "@/components/StaffHandoffNote";
import { TranscriptPanel } from "@/components/TranscriptPanel";

export default function DashboardPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-2">
      <div className="lg:col-span-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
        <a className="text-sm font-medium text-coral" href="/">Chat demo</a>
      </div>
      <PendingTasksPanel />
      <FlagsPanel />
      <StaffHandoffNote />
      <TranscriptPanel />
      <div className="lg:col-span-2">
        <MongoRecordsPanel />
      </div>
    </main>
  );
}
