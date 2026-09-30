export type CreateTaskState = {
  message: string;
  error?: boolean;
};

export type CreateTaskInput = {
  userId: string;
  title: string;
  description: string | null;
  targetMinutes: number;
  recurrenceType: "once" | "recurring";
  recurrenceInterval: number | null;
  recurrenceUnit: string | null;
  recurrenceStartDate: string;
};

export type TodaysTask = {
  id: string;
  title: string;
  description: string | null;
  targetMinutes: number;
  recurrenceType: "once" | "recurring";
  recurrenceInterval: number | null;
  recurrenceUnit: "day" | "week" | "month" | null;
  recurrenceStartDate: string;
  monthlyOverflowBehavior: "last_day_of_month" | "skip" | null;
  completedSeconds: number;
  isRunning: boolean;
  startedAt: string | null;
};

export type CalendarTask = {
  id: string;
  title: string;
  recurrenceType: "once" | "recurring";
  recurrenceInterval: number | null;
  recurrenceUnit: "day" | "week" | "month" | null;
  recurrenceStartDate: string;
  monthlyOverflowBehavior: "last_day_of_month" | "skip" | null;
};

export type ActiveSessionSnapshot = {
  taskId: string | null;
  startedAt: string | null;
};

export type CoinTransaction = {
  id: string;
  taskTitle: string;
  amount: number;
  completedOn: string;
};

export type StartTaskResult =
  | { error: string }
  | { startedAt: string; stoppedTaskId: string | null; stoppedSessionSeconds: number | null; stoppedTaskCoinsAwarded: number };

export type StopTaskResult =
  | { error: string }
  | { sessionSeconds: number; coinsAwarded: number };

export type AwardTaskCoinsResult =
  | { error: string }
  | { coinsAwarded: number };

export type TaskRingProps = {
  progress: number;
  active?: boolean;
  size?: number;
};
