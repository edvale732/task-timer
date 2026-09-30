import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/app/lib/auth";
import { getTotalFocusedSeconds } from "@/app/lib/queries";
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
        <h1 className="text-3xl font-semibold tracking-tight text-white">Profile</h1>
        <p className="mt-3 text-[#a5a5a5]">No signed-in account was found.</p>
        <Link href="/" className="mt-5 inline-flex rounded-md bg-[#d1d1d1] px-4 py-2 text-sm font-semibold text-[#1b1b1b] transition hover:bg-white">
          Go to sign in
        </Link>
      </section>
    );
  }

  const { name, email, createdAt } = session.user;
  const totalFocusedSeconds = await getTotalFocusedSeconds(session.user.id);
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
        <h1 className="text-3xl font-semibold tracking-tight text-white">Profile</h1>
      </div>
      <div className="divide-y divide-[#383838] rounded-xl border border-[#383838] bg-[#242424]">
        <dl className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[#909090]">Name</dt>
            <dd className="mt-2 break-words text-[#ededed]">{name || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[#909090]">Email</dt>
            <dd className="mt-2 break-words text-[#ededed]">{email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[#909090]">Member since</dt>
            <dd className="mt-2 text-[#ededed]">{memberSince}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[#909090]">Total time focused</dt>
            <dd className="mt-2 text-[#ededed]">{totalFocusedTime}</dd>
          </div>
        </dl>
        <div className="flex flex-col items-start gap-3 p-6">
          <SignOutButton />
        </div>
      </div>
    </section>
  );
}