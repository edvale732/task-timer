import type { TaskRingProps } from "@/app/lib/types";

export default function TaskRing({ progress, active, size = 112 }: TaskRingProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const isComplete = progress >= 1;
  const ringProgress = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - ringProgress);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${Math.round(progress * 100)} percent complete`}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" role="img">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--progress-track)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={isComplete ? "var(--reward)" : active ? "var(--success)" : "var(--action)"}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="7"
          className="transition-[stroke-dashoffset,stroke] duration-300 ease-linear"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold text-white"
        style={{ fontSize: size * 0.16 }}
      >
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}
