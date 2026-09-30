import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { getTodaysTasks, recordTodaysCoinTransactions } from "@/app/lib/queries";
import TaskGrid from "@/app/ui/task-grid";


export const metadata: Metadata = {
  title: "Home",
  description: "Home of Task Timer"
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    await recordTodaysCoinTransactions(session.user.id);
  }
  const tasks = session?.user ? await getTodaysTasks(session.user.id) : [];

  return (
    <section>
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-subtle">Today</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">Your focus, in circles.</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="hidden text-right text-sm text-text-subtle sm:block">{tasks.length} {tasks.length === 1 ? "task" : "tasks"} on the docket</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-control bg-surface px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground">Nothing scheduled today</h2>
          <p className="mt-2 text-text-muted">Create a task and it will appear here when it is due.</p>
        </div>
      ) : (
        <TaskGrid initialTasks={tasks} />
      )}
    </section>
  );
}