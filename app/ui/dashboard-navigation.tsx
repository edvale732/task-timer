"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardNavigationProps = {
	coinBalance: number | null;
};

const navigation = [
	{ href: "/dashboard/calendar/day", label: "Calendar" },
	{ href: "/dashboard/create", label: "Create" },
	{ href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardNavigation({ coinBalance }: DashboardNavigationProps) {
	const pathname = usePathname();

	return (
		<nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4" aria-label="Dashboard navigation">
			<Link href="/dashboard/calendar/day" className="text-lg font-semibold tracking-tight text-[#f5f5f5]">
				TaskTimer
			</Link>
			<div className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-[#a5a5a5]">
				{navigation.map((item) => {
					const isActive = item.href === "/dashboard/calendar/day"
						? pathname.startsWith("/dashboard/calendar/")
						: pathname === item.href;

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={isActive ? "page" : undefined}
							className={`rounded-md px-2 py-2 transition-colors sm:px-3 ${isActive ? "bg-[#3b3b3b] text-white" : "hover:bg-[#303030] hover:text-white"}`}
						>
							{item.label}
						</Link>
					);
				})}
				{coinBalance !== null && (
					<div className="ml-1 flex items-center gap-2 border-l border-[#454545] pl-3 text-[#facc15]" aria-label="Coin balance">
						<span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full border border-[#eab308] bg-[#713f12] text-[11px] font-bold text-[#fde68a]">
							C
						</span>
						<span className="font-semibold tabular-nums">{coinBalance.toLocaleString("en-US")}</span>
					</div>
				)}
			</div>
		</nav>
	);
}