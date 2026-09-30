"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getActiveSession, startTask, stopTask } from "@/app/lib/actions";
import { formatDuration, formatNextDueDate, formatRecurrence } from "@/app/lib/functions";
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
  const [completionToasts, setCompletionToasts] = useState<{ id: string; title: string; coins: number }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tasksRef = useRef(tasks);
  // Tasks that already reached their target before/without us observing the crossing live (e.g. on page load).
  const notifiedRef = useRef(
    new Set(initialTasks.filter((task) => task.completedSeconds >= task.targetMinutes * 60).map((task) => task.id)),
  );

  const hasRunningTask = tasks.some((task) => task.isRunning);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    Notification.requestPermission();
  }, []);

  // Tick every second only while a task is actively running, to avoid unnecessary re-renders.
  useEffect(() => {
    if (!hasRunningTask) return;

    const interval = setInterval(() => {
      const nowMs = Date.now();
      setNow(nowMs);

      for (const task of tasksRef.current) {
        if (!task.isRunning || !task.startedAt || notifiedRef.current.has(task.id)) continue;

        const liveSeconds = task.completedSeconds + elapsedSince(task.startedAt, nowMs);
        if (liveSeconds < task.targetMinutes * 60) continue;

        notifiedRef.current.add(task.id);

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Target reached", { body: `"${task.title}" is complete! You earned ${task.targetMinutes} coins.` });
        }

        setCompletionToasts((prev) => [...prev, { id: task.id, title: task.title, coins: task.targetMinutes }]);
        setTimeout(() => {
          setCompletionToasts((prev) => prev.filter((toast) => toast.id !== task.id));
        }, 6000);
      }
    }, 1000);

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

  useEffect(() => {
    if (!focusedTaskId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusedTaskId(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedTaskId]);

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
            completedSeconds: task.completedSeconds + (task.startedAt ? elapsedSince(task.startedAt, now) : 0),
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

  const focusedTask = tasks.find((task) => task.id === focusedTaskId) ?? null;
  const focusedLiveSeconds = focusedTask
    ? focusedTask.isRunning && focusedTask.startedAt
      ? focusedTask.completedSeconds + elapsedSince(focusedTask.startedAt, now)
      : focusedTask.completedSeconds
    : 0;
  const focusedTargetSeconds = focusedTask ? focusedTask.targetMinutes * 60 : 0;
  const focusedProgress = focusedTargetSeconds > 0 ? focusedLiveSeconds / focusedTargetSeconds : 0;

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {completionToasts.length > 0 && (
        <div className="mb-4 space-y-2">
          {completionToasts.map((toast) => (
            <p key={toast.id} className="rounded-lg border border-amber-700 bg-amber-950/40 px-4 py-2 text-sm text-amber-300">
              🎉 &ldquo;{toast.title}&rdquo; is complete! You earned {toast.coins} {toast.coins === 1 ? "coin" : "coins"}.
            </p>
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => {
          const liveSeconds = task.isRunning && task.startedAt
            ? task.completedSeconds + elapsedSince(task.startedAt, now)
            : task.completedSeconds;
          const targetSeconds = task.targetMinutes * 60;
          const progress = targetSeconds > 0 ? liveSeconds / targetSeconds : 0;

          return (
            <article
              key={task.id}
              onClick={() => setFocusedTaskId(task.id)}
              className="flex cursor-pointer items-center gap-5 rounded-2xl border border-[#383838] bg-[#242424] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.18)] transition-colors hover:border-[#5a5a5a]"
            >
              <TaskRing progress={progress} active={task.isRunning} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-white">{task.title}</h2>
                <p className="mt-1 text-xs text-[#909090]">
                  {formatRecurrence(task.recurrenceType, task.recurrenceInterval, task.recurrenceUnit)}
                </p>
                <p className="mt-1 text-xs text-[#909090]">
                  {formatNextDueDate(task.recurrenceStartDate, task.recurrenceType, task.recurrenceInterval, task.recurrenceUnit, task.monthlyOverflowBehavior)}
                </p>
                <p className="mt-2 text-sm text-[#a5a5a5]">
                  {formatDuration(liveSeconds)} / {formatDuration(targetSeconds)}
                </p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (task.isRunning) {
                      handleStop(task.id);
                    } else {
                      handleStart(task.id);
                    }
                  }}
                  className="mt-3 rounded-lg border border-[#4a4a4a] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {task.isRunning ? "Stop" : "Start"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {focusedTask && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/90 px-6 py-10 backdrop-blur-sm"
          onClick={() => setFocusedTaskId(null)}
        >
          <button
            type="button"
            onClick={() => setFocusedTaskId(null)}
            className="absolute right-6 top-6 rounded-lg border border-[#4a4a4a] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#333333]"
          >
            Close
          </button>
          <div className="flex max-w-lg flex-col items-center gap-6 text-center" onClick={(event) => event.stopPropagation()}>
            <TaskRing progress={focusedProgress} active={focusedTask.isRunning} size={280} />
            <div>
              <h2 className="text-3xl font-semibold text-white">{focusedTask.title}</h2>
              {focusedTask.description && <p className="mt-3 text-base text-[#c5c5c5]">{focusedTask.description}</p>}
              <p className="mt-3 text-sm text-[#909090]">
                {formatRecurrence(focusedTask.recurrenceType, focusedTask.recurrenceInterval, focusedTask.recurrenceUnit)}
              </p>
              <p className="mt-1 text-sm text-[#909090]">
                {formatNextDueDate(focusedTask.recurrenceStartDate, focusedTask.recurrenceType, focusedTask.recurrenceInterval, focusedTask.recurrenceUnit, focusedTask.monthlyOverflowBehavior)}
              </p>
              <p className="mt-4 text-lg text-[#a5a5a5]">
                {formatDuration(focusedLiveSeconds)} / {formatDuration(focusedTargetSeconds)}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => (focusedTask.isRunning ? handleStop(focusedTask.id) : handleStart(focusedTask.id))}
              className="rounded-lg border border-[#4a4a4a] px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {focusedTask.isRunning ? "Stop" : "Start"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
