export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatRecurrence(
  recurrenceType: "once" | "recurring",
  recurrenceInterval: number | null,
  recurrenceUnit: "day" | "week" | "month" | null,
) {
  if (recurrenceType === "once" || !recurrenceInterval || !recurrenceUnit) {
    return "Does not repeat";
  }

  const unit = recurrenceInterval === 1 ? recurrenceUnit : `${recurrenceUnit}s`;
  return `Repeats every ${recurrenceInterval} ${unit}`;
}

export function formatNextDueDate(
  recurrenceStartDate: string | Date,
  recurrenceType: "once" | "recurring",
  recurrenceInterval: number | null,
  recurrenceUnit: "day" | "week" | "month" | null,
  monthlyOverflowBehavior: "last_day_of_month" | "skip" | null,
) {
  const [year, month, day] = recurrenceStartDate instanceof Date
    ? [recurrenceStartDate.getUTCFullYear(), recurrenceStartDate.getUTCMonth() + 1, recurrenceStartDate.getUTCDate()]
    : recurrenceStartDate.split("-").map(Number);
  const dueDate = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  if (recurrenceType === "recurring" && recurrenceInterval && recurrenceUnit) {
    while (dueDate < todayUtc) {
      if (recurrenceUnit === "day") {
        dueDate.setUTCDate(dueDate.getUTCDate() + recurrenceInterval);
      } else if (recurrenceUnit === "week") {
        dueDate.setUTCDate(dueDate.getUTCDate() + recurrenceInterval * 7);
      } else {
        const targetMonth = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth() + recurrenceInterval, 1));
        const lastDay = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0)).getUTCDate();
        const targetDay = Math.min(day, lastDay);

        if (day > lastDay && monthlyOverflowBehavior === "skip") {
          dueDate.setUTCFullYear(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), 1);
          continue;
        }

        dueDate.setUTCFullYear(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), targetDay);
      }
    }
  }

  return `Next due ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dueDate)}`;
}
