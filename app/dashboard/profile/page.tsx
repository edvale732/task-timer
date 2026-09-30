import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/app/lib/auth";
import { getCoinBalance, getCoinTransactions, getTotalFocusedSeconds, recordTodaysCoinTransactions } from "@/app/lib/queries";
import SignOutButton from "@/app/ui/sign-out-button";

export const metadata: Metadata = {
  title: "Profile",
  description: "User profile and settings"
};
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-3 text-text-muted">No signed-in account was found.</p>
        <Link href="/" className="mt-5 inline-flex rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-foreground transition hover:bg-action-hover">
          Go to sign in
        </Link>
      </section>
    );
  }

  const { name, email, createdAt } = session.user;
  await recordTodaysCoinTransactions(session.user.id);
  const [totalFocusedSeconds, coinBalance, coinTransactions] = await Promise.all([
    getTotalFocusedSeconds(session.user.id),
    getCoinBalance(session.user.id),
    getCoinTransactions(session.user.id),
  ]);
  const totalFocusedHours = Math.floor(totalFocusedSeconds / 3600);
  const totalFocusedMinutes = Math.floor((totalFocusedSeconds % 3600) / 60);
  const totalFocusedTime = totalFocusedHours > 0
    ? `${totalFocusedHours}h ${totalFocusedMinutes}m`
    : `${totalFocusedMinutes}m`;
  const memberSince = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(createdAt);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Profile</h1>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        <dl className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-text-subtle">Name</dt>
            <dd className="mt-2 break-words text-foreground">{name || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-subtle">Email</dt>
            <dd className="mt-2 break-words text-foreground">{email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-subtle">Member since</dt>
            <dd className="mt-2 text-foreground">{memberSince}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-subtle">Total time focused</dt>
            <dd className="mt-2 text-foreground">{totalFocusedTime}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-subtle">Coins</dt>
            <dd className="mt-2 text-foreground">{coinBalance.toLocaleString("en-US")}</dd>
          </div>
        </dl>
        <div className="flex flex-col items-start gap-3 p-6">
          <SignOutButton />
        </div>
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">Coin transaction history</h2>
        {coinTransactions.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No coin transactions yet.</p>
        ) : (
          <ol className="mt-4 divide-y divide-border border-y border-border">
            {coinTransactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{transaction.taskTitle}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(`${transaction.completedOn}T00:00:00Z`))}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-foreground">+{transaction.amount} coins</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}