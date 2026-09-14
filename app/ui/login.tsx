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
      router.replace("/dashboard");
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
    <main className="flex min-h-screen items-center justify-center bg-[#071a33] px-6 py-12 text-[#f7fbff]">
      <section className="relative w-full max-w-md rounded-[2rem] bg-[#f7fbff] p-8 text-[#071a33] shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-12">
        <Link href="/" aria-label="Go to home" className="absolute right-8 top-8 transition-opacity hover:opacity-70 sm:right-12 sm:top-12">
          <Image src="/home.png" alt="" width={24} height={24} style={{ width: "24px", height: "24px" }} />
        </Link>
        {isRedirecting ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center" role="status" aria-live="polite">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#d3e1f2] border-t-[#2f80ed]" aria-hidden="true" />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Taking you to your dashboard</h1>
            <p className="mt-2 text-[#55708f]">You&apos;re already signed in.</p>
          </div>
        ) : (
          <>
            <div className="mb-10 flex gap-6 border-b border-[#d3e1f2]">
              {(["sign-in", "sign-up"] as const).map((item) => (
                <button key={item} onClick={() => { setMode(item); setMessage(""); }} className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${mode === item ? "border-[#2f80ed] text-[#1f6fd1]" : "border-transparent text-[#7892ae]"}`}>
                  {item === "sign-in" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{mode === "sign-in" ? "Good to see you." : "Start your logbook."}</h1>
            <p className="mt-2 text-[#55708f]">{mode === "sign-in" ? "Enter your details to continue." : "Set up your account in a few seconds."}</p>
            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-2 gap-5">
              {mode === "sign-up" && <label className="block text-sm font-semibold">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#9db8d3] bg-transparent px-4 py-3 font-normal outline-none transition focus:border-[#2f80ed]" /></label>}
              <label className={`block text-sm font-semibold ${mode === "sign-in" ? "col-span-2" : ""}`}>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#9db8d3] bg-transparent px-4 py-3 font-normal outline-none transition focus:border-[#2f80ed]" /></label>
              <label className="col-span-2 block text-sm font-semibold">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#9db8d3] bg-transparent px-4 py-3 font-normal outline-none transition focus:border-[#2f80ed]" /></label>
              <button disabled={isSubmitting} className="col-span-2 w-full rounded-xl bg-[#2f80ed] px-5 py-3 font-semibold text-white transition hover:bg-[#1f6fd1] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}</button>
            </form>
            {mode === "sign-in" ? <div className="mt-6 h-[82px]">
              <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#7892ae]"><span className="h-px flex-1 bg-[#d3e1f2]" />or<span className="h-px flex-1 bg-[#d3e1f2]" /></div>
              <button type="button" onClick={handleGoogleSignIn} disabled={isSubmitting} className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-[#9db8d3] px-5 py-3 font-semibold text-[#071a33] transition hover:border-[#071a33] hover:bg-[#eaf3fc] disabled:cursor-wait disabled:opacity-60"><Image src="/google-g.png" alt="" width={34} height={34} />Continue with Google</button>
            </div> : <div aria-hidden="true" className="mt-6 h-[82px]" />}
            {message && <p role="status" className="mt-4 text-sm text-[#55708f]">{message}</p>}
          </>
        )}
      </section>
    </main>
  );
}