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

export function isTaskDueOnDate(
  task: {
    recurrenceType: "once" | "recurring";
    recurrenceInterval: number | null;
    recurrenceUnit: "day" | "week" | "month" | null;
    recurrenceStartDate: string;
    monthlyOverflowBehavior: "last_day_of_month" | "skip" | null;
  },
  date: Date,
) {
  const [year, month, day] = task.recurrenceStartDate.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day));
  const targetDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (targetDate < startDate) return false;
  if (task.recurrenceType === "once") return targetDate.getTime() === startDate.getTime();
  if (!task.recurrenceInterval || !task.recurrenceUnit) return false;

  const daysSinceStart = Math.floor((targetDate.getTime() - startDate.getTime()) / 86_400_000);
  if (task.recurrenceUnit === "day") return daysSinceStart % task.recurrenceInterval === 0;
  if (task.recurrenceUnit === "week") return daysSinceStart % (task.recurrenceInterval * 7) === 0;

  const monthsSinceStart =
    (targetDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    targetDate.getUTCMonth() -
    startDate.getUTCMonth();
  if (monthsSinceStart % task.recurrenceInterval !== 0) return false;

  const lastDayOfTargetMonth = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth() + 1, 0)).getUTCDate();
  return targetDate.getUTCDate() === day ||
    (task.monthlyOverflowBehavior === "last_day_of_month" && day > lastDayOfTargetMonth && targetDate.getUTCDate() === lastDayOfTargetMonth);
}
