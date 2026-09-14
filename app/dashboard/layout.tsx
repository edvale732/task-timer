"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const navigation = [
		{ href: "/dashboard/home", label: "Home" },
		{ href: "/dashboard/create", label: "Create" },
		{ href: "/dashboard/profile", label: "Profile" },
	];

	return (
		<div className="min-h-screen bg-[#1b1b1b] text-[#ededed]">
			<header className="border-b border-[#383838] bg-[#242424]">
				<nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Dashboard navigation">
					<Link href="/dashboard/home" className="text-lg font-semibold tracking-tight text-[#f5f5f5]">
						TaskTimer
					</Link>
					<div className="flex items-center gap-2 text-sm font-medium text-[#a5a5a5]">
						{navigation.map((item) => {
							const isActive = pathname === item.href;

							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={isActive ? "page" : undefined}
									className={`rounded-md px-3 py-2 transition-colors ${isActive ? "bg-[#3b3b3b] text-white" : "hover:bg-[#303030] hover:text-white"}`}
								>
									{item.label}
								</Link>
							);
						})}
					</div>
				</nav>
			</header>
			<main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
		</div>
	);
}
