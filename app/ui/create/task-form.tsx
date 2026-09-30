"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Form from "next/form";
import { createTask } from "@/app/lib/actions";
import type { CreateTaskState } from "@/app/lib/types";

const fieldClassName = "mt-2 w-full rounded-xl border border-border-strong bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-text-placeholder focus:border-action";
const initialCreateTaskState: CreateTaskState = { message: "" };

function getLocalDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetMinutes, setTargetMinutes] = useState("25");
  const [recurrenceType, setRecurrenceType] = useState<"once" | "recurring">("once");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceUnit, setRecurrenceUnit] = useState("day");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(getLocalDateInputValue);
  const [successMessage, setSuccessMessage] = useState("");
  const [successSeconds, setSuccessSeconds] = useState(0);
  const successTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
      if (successInterval.current) {
        clearInterval(successInterval.current);
      }
    };
  }, []);

  function resetFields() {
    setTitle("");
    setDescription("");
    setTargetMinutes("25");
    setRecurrenceType("once");
    setRecurrenceInterval("1");
    setRecurrenceUnit("day");
    setRecurrenceStartDate(getLocalDateInputValue());
  }

  const [state, formAction, isPending] = useActionState(async (previousState: typeof initialCreateTaskState, formData: FormData) => {
    const nextState = await createTask(previousState, formData);

    if (!nextState.error) {
      resetFields();
      setSuccessMessage(nextState.message);
      setSuccessSeconds(3);
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
      if (successInterval.current) {
        clearInterval(successInterval.current);
      }
      successInterval.current = setInterval(() => {
        setSuccessSeconds((seconds) => Math.max(seconds - 1, 0));
      }, 1000);
      successTimeout.current = setTimeout(() => {
        setSuccessMessage("");
        setSuccessSeconds(0);
        if (successInterval.current) {
          clearInterval(successInterval.current);
          successInterval.current = null;
        }
      }, 3000);
    }

    return nextState;
  }, initialCreateTaskState);

  return (
    <Form action={formAction} className="relative rounded-2xl border border-border bg-surface p-6 shadow-form sm:p-8">
      {state.message && state.error && (
        <p role="status" aria-live="polite" className={`mb-6 rounded-xl border px-4 py-3 text-sm ${state.error ? "border-error-border bg-error-bg text-error-text" : "border-success-border bg-success-bg text-success-text"}`}>
          {state.message}
        </p>
      )}
      <div className="space-y-6">
        <label className="block text-sm font-semibold text-foreground">
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

        <label className="block text-sm font-semibold text-foreground">
          Description <span className="font-normal text-text-subtle">(optional)</span>
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
          <label className="block text-sm font-semibold text-foreground">
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

          <label className="block text-sm font-semibold text-foreground">
            Recurrence
            <select name="recurrence_type" value={recurrenceType} onChange={(event) => setRecurrenceType(event.target.value as "once" | "recurring")} className={`${fieldClassName} h-12`}>
              <option value="once">Does not repeat</option>
              <option value="recurring">Repeats</option>
            </select>
          </label>
        </div>

        {recurrenceType === "once" ? (
          <label className="block text-sm font-semibold text-foreground">
            Task date
            <input required name="recurrence_start_date" type="date" value={recurrenceStartDate} onChange={(event) => setRecurrenceStartDate(event.target.value)} className={`${fieldClassName} h-12`} />
          </label>
        ) : (
          <>
            <div className="grid items-start gap-6 sm:grid-cols-2">
              <label className="grid grid-rows-[1.25rem_3rem] gap-2 text-sm font-semibold text-foreground">
                Repeat every
                <div className="grid h-12 min-w-0 grid-cols-2 gap-3">
                  <input required={recurrenceType === "recurring"} min="1" type="number" name="recurrence_interval" value={recurrenceInterval} onChange={(event) => setRecurrenceInterval(event.target.value)} className={`${fieldClassName} mt-0 h-full min-w-0 flex-1`} />
                  <select name="recurrence_unit" value={recurrenceUnit} onChange={(event) => setRecurrenceUnit(event.target.value)} className={`${fieldClassName} mt-0 h-full min-w-0 flex-1`}>
                    <option value="day">day(s)</option>
                    <option value="week">week(s)</option>
                    <option value="month">month(s)</option>
                  </select>
                </div>
              </label>

              <label className="grid grid-rows-[1.25rem_3rem] gap-2 text-sm font-semibold text-foreground">
                Recurrence start date
                <input required name="recurrence_start_date" type="date" value={recurrenceStartDate} onChange={(event) => setRecurrenceStartDate(event.target.value)} className={`${fieldClassName} mt-0 h-12`} />
              </label>
            </div>
          </>
        )}

      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {successMessage ? (
          <div role="status" aria-live="polite" className={`rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success-text shadow-toast transition-opacity duration-1000 ${successSeconds <= 1 ? "opacity-0" : "opacity-100"}`}>
            {successMessage}
          </div>
        ) : (
          <span aria-hidden="true" />
        )}
        <button type="submit" disabled={isPending} className="rounded-xl bg-action px-5 py-3 font-semibold text-action-foreground transition hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-wait disabled:opacity-60">
          {isPending ? "Creating..." : "Create task"}
        </button>
      </div>
    </Form>
  );
}