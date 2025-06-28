import { authClient } from "./auth-client";

export async function signIn(email: string, password: string) {
  const { data, error } = await authClient.signIn.email(
    {
      email,
      password,
      callbackURL: "/dashboard",
      rememberMe: true,
    },
    {
      onRequest: (ctx) => {
        console.log("Request:", ctx);
      },
      onSuccess: (ctx) => {
        console.log("Success:", ctx.response);
      },
      onError: (ctx) => {
        console.log("Error:", ctx.error);
      },
    }
  );
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
    errorCallbackURL: "/login",
    newUserCallbackURL: "/welcome",
    disableRedirect: true,
  });
  return { data, error };
}
