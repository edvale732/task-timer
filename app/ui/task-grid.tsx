"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getActiveSession, startTask, stopTask } from "@/app/lib/actions";
import { formatDuration } from "@/app/lib/functions";
import type { TodaysTask } from "@/app/lib/types";
import TaskRing from "@/app/ui/task-ring";

type TaskGridProps = {
  initialTasks: TodaysTask[];
};

type BroadcastMessage =
  | { type: "start"; taskId: string; startedAt: string; stoppedTaskId: string | null; stoppedSessionSeconds: number | null }
  | { type: "stop"; taskId: string; completedSeconds: number };

const POLL_INTERVAL_MS = 15_000;

function elapsedSince(startedAt: string, now: number) {
  return Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
}

export default function TaskGrid({ initialTasks }: TaskGridProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const channelRef = useRef<BroadcastChannel | null>(null);

  const hasRunningTask = tasks.some((task) => task.isRunning);

  // Tick every second only while a task is actively running, to avoid unnecessary re-renders.
  useEffect(() => {
    if (!hasRunningTask) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasRunningTask]);

  useEffect(() => {
    const channel = new BroadcastChannel("task-timer");
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data;

      setTasks((prev) =>
        prev.map((task) => {
          if (message.type === "start") {
            if (task.id === message.taskId) {
              return { ...task, isRunning: true, startedAt: message.startedAt };
            }
            if (message.stoppedTaskId && task.id === message.stoppedTaskId) {
              return {
                ...task,
                isRunning: false,
                startedAt: null,
                completedSeconds: task.completedSeconds + (message.stoppedSessionSeconds ?? 0),
              };
            }
            return task;
          }

          if (task.id === message.taskId) {
            return { ...task, isRunning: false, startedAt: null, completedSeconds: message.completedSeconds };
          }
          return task;
        }),
      );
    };

    return () => channel.close();
  }, []);

  // Reconcile running state periodically (e.g. from another tab/device), without touching completedSeconds.
  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return;

      const snapshot = await getActiveSession();
      setTasks((prev) =>
        prev.map((task) => {
          const isRunning = task.id === snapshot.taskId;
          if (task.isRunning === isRunning && task.startedAt === snapshot.startedAt) return task;
          return { ...task, isRunning, startedAt: isRunning ? snapshot.startedAt : null };
        }),
      );
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleStart = (taskId: string) => {
    setError(null);
    const previouslyRunning = tasks.find((task) => task.isRunning);
    const optimisticStartedAt = new Date(now).toISOString();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) return { ...task, isRunning: true, startedAt: optimisticStartedAt };
        if (task.isRunning) {
          return {
            ...task,
            isRunning: false,
            startedAt: null,
            completedSeconds: task.completedSeconds + elapsedSince(task.startedAt as string, now),
          };
        }
        return task;
      }),
    );

    startTransition(async () => {
      const result = await startTask(taskId);

      if ("error" in result) {
        setError(result.error);
        setTasks(initialTasks);
        return;
      }

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) return { ...task, startedAt: result.startedAt };
          if (result.stoppedTaskId && task.id === result.stoppedTaskId) {
            const baseCompletedSeconds = previouslyRunning?.id === task.id ? previouslyRunning.completedSeconds : task.completedSeconds;
            return { ...task, completedSeconds: baseCompletedSeconds + (result.stoppedSessionSeconds ?? 0) };
          }
          return task;
        }),
      );

      channelRef.current?.postMessage({
        type: "start",
        taskId,
        startedAt: result.startedAt,
        stoppedTaskId: result.stoppedTaskId,
        stoppedSessionSeconds: result.stoppedSessionSeconds,
      } satisfies BroadcastMessage);
    });
  };

  const handleStop = (taskId: string) => {
    setError(null);
    const task = tasks.find((t) => t.id === taskId);
    const baseCompletedSeconds = task?.completedSeconds ?? 0;
    const optimisticCompletedSeconds = task?.startedAt ? baseCompletedSeconds + elapsedSince(task.startedAt, now) : baseCompletedSeconds;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, isRunning: false, startedAt: null, completedSeconds: optimisticCompletedSeconds } : t,
      ),
    );

    startTransition(async () => {
      const result = await stopTask(taskId);

      if ("error" in result) {
        setError(result.error);
        setTasks(initialTasks);
        return;
      }

      const completedSeconds = baseCompletedSeconds + result.sessionSeconds;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completedSeconds } : t)));

      channelRef.current?.postMessage({
        type: "stop",
        taskId,
        completedSeconds,
      } satisfies BroadcastMessage);
    });
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => {
          const liveSeconds = task.isRunning && task.startedAt
            ? task.completedSeconds + elapsedSince(task.startedAt, now)
            : task.completedSeconds;
          const targetSeconds = task.targetMinutes * 60;
          const progress = Math.min(liveSeconds / targetSeconds, 1);

          return (
            <article key={task.id} className="flex items-center gap-5 rounded-2xl border border-[#383838] bg-[#242424] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.18)]">
              <TaskRing progress={progress} active={task.isRunning} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-white">{task.title}</h2>
                <p className="mt-2 text-sm text-[#a5a5a5]">
                  {formatDuration(liveSeconds)} / {formatDuration(targetSeconds)}
                </p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => (task.isRunning ? handleStop(task.id) : handleStart(task.id))}
                  className="mt-3 rounded-lg border border-[#4a4a4a] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {task.isRunning ? "Stop" : "Start"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
