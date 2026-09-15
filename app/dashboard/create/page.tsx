import type { Metadata } from "next";
import TaskForm from "./task-form";

export const metadata: Metadata = {
  title: "Create",
  description: "Create a task"
};

export default function Page() {
  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#909090]">New task</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">What needs your attention?</h1>
        <p className="mt-2 text-[#a5a5a5]">Give the task enough detail that your next step is clear.</p>
      </div>
      <TaskForm />
    </section>
  );
}