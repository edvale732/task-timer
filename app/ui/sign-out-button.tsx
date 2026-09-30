"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignOut() {
    setIsSigningOut(true);
    setErrorMessage("");

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setErrorMessage(result.error.message || "Unable to sign out. Please try again.");
        setIsSigningOut(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="rounded-md border border-border-strong px-4 py-2 text-sm font-semibold text-foreground transition hover:border-text-subtle hover:bg-surface-hover disabled:cursor-wait disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Log out"}
      </button>
      {errorMessage && <p role="alert" className="text-sm text-error">{errorMessage}</p>}
    </>
  );
}