import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { formatDuration } from "@/app/lib/functions";
import { getTodaysTasks } from "@/app/lib/queries";
import TaskRing from "@/app/ui/task-ring";

export const metadata: Metadata = {
  title: "Home",
  description: "Home of Task Timer"
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const tasks = session?.user ? await getTodaysTasks(session.user.id) : [];

  return (
    <section>
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#909090]">Today</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Your focus, in circles.</h1>
        </div>
        <p className="hidden text-right text-sm text-[#909090] sm:block">{tasks.length} {tasks.length === 1 ? "task" : "tasks"} on the docket</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4a4a4a] bg-[#242424] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-white">Nothing scheduled today</h2>
          <p className="mt-2 text-[#a5a5a5]">Create a task and it will appear here when it is due.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => {
            const targetSeconds = task.targetMinutes * 60;
            const progress = Math.min(task.spentSeconds / targetSeconds, 1);

            return (
              <article key={task.id} className="flex items-center gap-5 rounded-2xl border border-[#383838] bg-[#242424] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.18)]">
                <TaskRing progress={progress} />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-white">{task.title}</h2>
                  <p className="mt-2 text-sm text-[#a5a5a5]">
                    {formatDuration(task.spentSeconds)} / {formatDuration(task.targetMinutes * 60)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}