import { authClient } from "@/app/lib/auth-client";

export function signIn(email: string, password: string) {
    return authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
        rememberMe: false,
    });
}

export function signInWithGoogle() {
    return authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
    });
}