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
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Create new task</h1>
      </div>
      <TaskForm />
    </section>
  );
}