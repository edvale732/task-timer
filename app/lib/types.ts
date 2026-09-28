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
  spentSeconds: number;
};

export type TaskRingProps = {
  progress: number;
};
