import { authClient } from "./auth-client";

export async function signUp(email: string, password: string, name: string, image: string) {
    const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        image,
        callbackURL: "/dashboard"
    }, {
        onRequest: (ctx) => {
            console.log("Request:", ctx);
        },
        onSuccess: (ctx) => {
            console.log("Success:", ctx.response);
        },
        onError: (ctx) => {
            console.log("Error:", ctx.error);
        }
    });
    return { data, error };
}