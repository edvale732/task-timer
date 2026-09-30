"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

const views = [
  { href: "/dashboard/calendar/day", label: "Day" },
  { href: "/dashboard/calendar/week", label: "Week" },
  { href: "/dashboard/calendar/month", label: "Month" },
];

export default function CalendarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Schedule views" className="inline-flex rounded-xl border border-[#383838] bg-[#242424] p-1">
          {views.map((view) => {
            const isActive = pathname === view.href;

            return (
              <Link
                key={view.href}
                href={view.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive ? "bg-[#d1d1d1] text-[#1b1b1b]" : "text-[#a5a5a5] hover:bg-[#333333] hover:text-white"}`}
              >
                {view.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/dashboard/create"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#d1d1d1] px-4 py-2 text-sm font-semibold text-[#1b1b1b] transition hover:bg-white"
        >
          <Plus className="size-4" aria-hidden="true" />
          Create task
        </Link>
      </div>
      {children}
    </>
  );
}
