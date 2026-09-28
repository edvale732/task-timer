import type { TaskRingProps } from "@/app/lib/types";

export default function TaskRing({ progress }: TaskRingProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative h-28 w-28 shrink-0" aria-label={`${Math.round(progress * 100)} percent complete`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" role="img">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#3b3b3b" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#d1d1d1"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="7"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}
