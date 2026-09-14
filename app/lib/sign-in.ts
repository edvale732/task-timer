import { authClient } from "@/app/lib/auth-client";

export function signIn(email: string, password: string) {
    return authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard/home",
        rememberMe: false,
    });
}

export function signInWithGoogle() {
    return authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard/home",
    });
}