"use client";

import { useState } from "react";
import { isTaskDueOnDate } from "@/app/lib/functions";
import type { CalendarTask } from "@/app/lib/types";

type CalendarViewProps = {
  tasks: CalendarTask[];
  view: "week" | "month";
};

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  return start;
}

function getCalendarDays(anchor: Date, view: CalendarViewProps["view"]) {
  if (view === "week") {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      return date;
    });
  }

  const firstOfMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const daysInMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(firstOfMonth);
    date.setUTCDate(firstOfMonth.getUTCDate() + index);
    return date;
  });
}

function shiftPeriod(date: Date, view: CalendarViewProps["view"], amount: number) {
  const shifted = new Date(date);
  if (view === "week") {
    shifted.setUTCDate(shifted.getUTCDate() + amount * 7);
  } else {
    shifted.setUTCMonth(shifted.getUTCMonth() + amount);
  }
  return shifted;
}

function formatPeriodTitle(days: Date[], view: CalendarViewProps["view"]) {
  if (view === "month") return monthFormatter.format(days[15]);

  const start = days[0];
  const end = days[days.length - 1];
  return start.getUTCMonth() === end.getUTCMonth()
    ? `${monthFormatter.format(start)} (${dateFormatter.format(start)} - ${dateFormatter.format(end)})`
    : `${dateFormatter.format(start)} - ${dateFormatter.format(end)}, ${end.getUTCFullYear()}`;
}

export default function CalendarView({ tasks, view }: CalendarViewProps) {
  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  });
  const days = getCalendarDays(anchor, view);
  const todayKey = dateKey(new Date());
  const monthKey = `${anchor.getUTCFullYear()}-${anchor.getUTCMonth()}`;

  return (
    <section aria-label={`${view} task calendar`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#909090]">Schedule</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {formatPeriodTitle(days, view)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor((current) => shiftPeriod(current, view, -1))}
            className="rounded-lg border border-[#4a4a4a] px-3 py-2 text-sm font-medium text-[#ededed] transition-colors hover:bg-[#333333]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setAnchor(() => {
              const now = new Date();
              return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
            })}
            className="rounded-lg border border-[#4a4a4a] px-3 py-2 text-sm font-medium text-[#ededed] transition-colors hover:bg-[#333333]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setAnchor((current) => shiftPeriod(current, view, 1))}
            className="rounded-lg border border-[#4a4a4a] px-3 py-2 text-sm font-medium text-[#ededed] transition-colors hover:bg-[#333333]"
          >
            Next
          </button>
        </div>
      </div>

      <div className={`grid overflow-hidden rounded-2xl border border-[#383838] bg-[#242424] ${view === "week" ? "grid-cols-7" : "grid-cols-7"}`}>
        {days.map((day, index) => {
          const key = dateKey(day);
          const isToday = key === todayKey;
          const isCurrentMonth = view === "week" || `${day.getUTCFullYear()}-${day.getUTCMonth()}` === monthKey;
          const dueTasks = tasks.filter((task) => isTaskDueOnDate(task, day));

          return (
            <div
              key={key}
              style={view === "month" && index === 0 ? { gridColumnStart: ((day.getUTCDay() + 6) % 7) + 1 } : undefined}
              className={`min-h-36 border-b border-r border-[#383838] p-3 last:border-r-0 ${view === "month" && !isCurrentMonth ? "bg-[#1e1e1e] text-[#666666]" : ""} ${isToday ? "bg-[#2c302d]" : ""}`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-[0.12em] ${isToday ? "text-[#b9d8bd]" : "text-[#909090]"}`}>
                    {dayFormatter.format(day)}
                  </p>
                  <p className={`mt-1 text-lg font-semibold ${isToday ? "text-white" : "text-[#d5d5d5]"}`}>
                    {day.getUTCDate()}
                  </p>
                </div>
                {isToday && <span className="rounded-full bg-[#49654e] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d9f0dc]">Today</span>}
              </div>
              <div className="space-y-2">
                {dueTasks.map((task) => (
                  <div key={task.id} className="border-l-2 border-[#b9d8bd] pl-2">
                    <p className="truncate text-sm font-medium text-[#ededed]" title={task.title}>{task.title}</p>
                    <p className="mt-0.5 text-xs text-[#909090]">
                      {task.recurrenceType === "once" ? "One-time" : "Repeating"}
                    </p>
                  </div>
                ))}
                {dueTasks.length === 0 && (
                  <p className="text-xs text-[#666666]">No tasks due</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
