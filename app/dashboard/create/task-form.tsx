"use client";

import { useActionState, useState } from "react";
import Form from "next/form";
import { createTask } from "@/app/lib/actions";

const fieldClassName = "mt-2 w-full rounded-xl border border-[#555555] bg-[#1b1b1b] px-4 py-3 text-[#ededed] outline-none transition placeholder:text-[#707070] focus:border-[#d1d1d1]";
const initialCreateTaskState: { message: string; error?: boolean } = { message: "" };

export default function TaskForm() {
  const [state, formAction, isPending] = useActionState(createTask, initialCreateTaskState);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetMinutes, setTargetMinutes] = useState("25");
  const [recurrenceType, setRecurrenceType] = useState<"once" | "recurring">("once");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceUnit, setRecurrenceUnit] = useState("day");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <Form action={formAction} className="rounded-2xl border border-[#383838] bg-[#242424] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:p-8">
      <div className="space-y-6">
        <label className="block text-sm font-semibold text-[#ededed]">
          Task name
          <input
            required
            autoFocus
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Outline the project brief"
            className={fieldClassName}
          />
        </label>

        <label className="block text-sm font-semibold text-[#ededed]">
          Description <span className="font-normal text-[#909090]">(optional)</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add context, links, or a useful first step"
            rows={4}
            className={`${fieldClassName} resize-y`}
          />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#ededed]">
            Target minutes
            <input
              required
              min="1"
              type="number"
              name="target_minutes"
              value={targetMinutes}
              onChange={(event) => setTargetMinutes(event.target.value)}
              className={`${fieldClassName} h-12`}
            />
          </label>

          <label className="block text-sm font-semibold text-[#ededed]">
            Recurrence
            <select name="recurrence_type" value={recurrenceType} onChange={(event) => setRecurrenceType(event.target.value as "once" | "recurring")} className={`${fieldClassName} h-12`}>
              <option value="once">Does not repeat</option>
              <option value="recurring">Repeats</option>
            </select>
          </label>
        </div>

        {recurrenceType === "recurring" && (
          <>
            <div className="grid items-start gap-6 sm:grid-cols-2">
              <label className="grid grid-rows-[1.25rem_3rem] gap-2 text-sm font-semibold text-[#ededed]">
                Repeat every
                <div className="grid h-12 min-w-0 grid-cols-2 gap-3">
                  <input required={recurrenceType === "recurring"} min="1" type="number" name="recurrence_interval" value={recurrenceInterval} onChange={(event) => setRecurrenceInterval(event.target.value)} className={`${fieldClassName} mt-0 h-full min-w-0 flex-1`} />
                  <select name="recurrence_unit" value={recurrenceUnit} onChange={(event) => setRecurrenceUnit(event.target.value)} className={`${fieldClassName} mt-0 h-full min-w-0 flex-1`}>
                    <option value="day">day(s)</option>
                    <option value="week">week(s)</option>
                    <option value="month">month(s)</option>
                    <option value="year">year(s)</option>
                  </select>
                </div>
              </label>

              <label className="grid grid-rows-[1.25rem_3rem] gap-2 text-sm font-semibold text-[#ededed]">
                Recurrence start date
                <input required name="recurrence_start_date" type="date" value={recurrenceStartDate} onChange={(event) => setRecurrenceStartDate(event.target.value)} className={`${fieldClassName} mt-0 h-12`} />
              </label>
            </div>
          </>
        )}

      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-[#383838] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" aria-live="polite" className={`text-sm ${state.error ? "text-[#d99a9a]" : "text-[#b8b8b8]"}`}>{state.message}</p>
        <button type="submit" disabled={isPending} className="rounded-xl bg-[#d1d1d1] px-5 py-3 font-semibold text-[#1b1b1b] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#d1d1d1] focus:ring-offset-2 focus:ring-offset-[#242424] disabled:cursor-wait disabled:opacity-60">
          {isPending ? "Creating..." : "Create task"}
        </button>
      </div>
    </Form>
  );
}