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
  targetMinutes: number;
  completedSeconds: number;
  isRunning: boolean;
  startedAt: string | null;
};

export type ActiveSessionSnapshot = {
  taskId: string | null;
  startedAt: string | null;
};

export type StartTaskResult =
  | { error: string }
  | { startedAt: string; stoppedTaskId: string | null; stoppedSessionSeconds: number | null };

export type StopTaskResult =
  | { error: string }
  | { sessionSeconds: number };

export type TaskRingProps = {
  progress: number;
  active?: boolean;
};
