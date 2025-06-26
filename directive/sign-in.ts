import { authClient } from "./auth-client";

export async function signIn(email: string, password: string) {
    const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
        rememberMe: true,
    }, {
        onRequest: (ctx) => {
            console.log(ctx);
        },
        onSuccess: (ctx) => {
            console.log(ctx);
        },
    });

    return { data, error };
}