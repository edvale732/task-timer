import { authClient } from "@/app/lib/auth-client";

export function signUp(email: string, password: string, name: string) {
  return authClient.signUp.email({
    email,
    password,
    name,
    callbackURL: "/dashboard",
  });
}