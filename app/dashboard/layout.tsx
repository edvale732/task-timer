import { headers } from "next/headers";
import type { ReactNode } from "react";
import { auth } from "@/app/lib/auth";
import { getCoinBalance, recordTodaysCoinTransactions } from "@/app/lib/queries";
import DashboardNavigation from "@/app/ui/dashboard-navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
	const session = await auth.api.getSession({ headers: await headers() });
	let coinBalance: number | null = null;

	if (session?.user) {
		await recordTodaysCoinTransactions(session.user.id);
		coinBalance = await getCoinBalance(session.user.id);
	}

	return (
		<div className="min-h-screen bg-[#1b1b1b] text-[#ededed]">
			<header className="border-b border-[#383838] bg-[#242424]">
				<DashboardNavigation coinBalance={coinBalance} />
			</header>
			<main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
		</div>
	);
}
