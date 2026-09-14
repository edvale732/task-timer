"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { signIn, signInWithGoogle } from "@/app/lib/sign-in";
import { signUp } from "@/app/lib/sign-up";

export default function Login() {
  const router = useRouter();
  const session = authClient.useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRedirecting = Boolean(session.data?.user);

  useEffect(() => {
    if (session.data?.user) {
      router.replace("/dashboard/home");
    }
  }, [router, session.data?.user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const result = mode === "sign-in"
      ? await signIn(email, password)
      : await signUp(email, password, name);

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error.message || "Something went wrong. Please try again.");
    }
  }

  async function handleGoogleSignIn() {
    setMessage("");
    setIsSubmitting(true);

    const result = await signInWithGoogle();

    if (result.error) {
      setIsSubmitting(false);
      setMessage(result.error.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1b1b1b] px-6 py-12 text-[#ededed]">
      <section className="relative w-full max-w-md rounded-[2rem] bg-[#242424] p-8 text-[#ededed] shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:p-12">
        <Link href="/" aria-label="Go to home" className="absolute right-8 top-8 transition-opacity hover:opacity-70 sm:right-12 sm:top-12">
          <Image src="/home.png" alt="" width={24} height={24} style={{ width: "24px", height: "24px" }} />
        </Link>
        {isRedirecting ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center" role="status" aria-live="polite">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#454545] border-t-[#d1d1d1]" aria-hidden="true" />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Taking you to your dashboard</h1>
            <p className="mt-2 text-[#a5a5a5]">You&apos;re already signed in.</p>
          </div>
        ) : (
          <>
            <div className="mb-10 flex gap-6 border-b border-[#454545]">
              {(["sign-in", "sign-up"] as const).map((item) => (
                <button key={item} onClick={() => { setMode(item); setMessage(""); }} className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${mode === item ? "border-[#d1d1d1] text-white" : "border-transparent text-[#909090]"}`}>
                  {item === "sign-in" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{mode === "sign-in" ? "Good to see you." : "Start your logbook."}</h1>
            <p className="mt-2 text-[#a5a5a5]">{mode === "sign-in" ? "Enter your details to continue." : "Set up your account in a few seconds."}</p>
            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-2 gap-5">
              {mode === "sign-up" && <label className="block text-sm font-semibold">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#555555] bg-[#1b1b1b] px-4 py-3 font-normal outline-none transition focus:border-[#d1d1d1]" /></label>}
              <label className={`block text-sm font-semibold ${mode === "sign-in" ? "col-span-2" : ""}`}>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#555555] bg-[#1b1b1b] px-4 py-3 font-normal outline-none transition focus:border-[#d1d1d1]" /></label>
              <label className="col-span-2 block text-sm font-semibold">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#555555] bg-[#1b1b1b] px-4 py-3 font-normal outline-none transition focus:border-[#d1d1d1]" /></label>
              <button disabled={isSubmitting} className="col-span-2 w-full rounded-xl bg-[#d1d1d1] px-5 py-3 font-semibold text-[#1b1b1b] transition hover:bg-white disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}</button>
            </form>
            {mode === "sign-in" ? <div className="mt-6 h-[82px]">
              <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#909090]"><span className="h-px flex-1 bg-[#454545]" />or<span className="h-px flex-1 bg-[#454545]" /></div>
              <button type="button" onClick={handleGoogleSignIn} disabled={isSubmitting} className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-[#555555] px-5 py-3 font-semibold text-[#ededed] transition hover:border-[#909090] hover:bg-[#303030] disabled:cursor-wait disabled:opacity-60"><Image src="/google-g.png" alt="" width={34} height={34} />Continue with Google</button>
            </div> : <div aria-hidden="true" className="mt-6 h-[82px]" />}
            {message && <p role="status" className="mt-4 text-sm text-[#b8b8b8]">{message}</p>}
          </>
        )}
      </section>
    </main>
  );
}