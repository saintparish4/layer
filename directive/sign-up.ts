import { authClient } from "./auth-client";

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name,
    callbackURL: "/dashboard",
  }, {
      onRequest: (ctx) => {
          console.log(ctx);
      },
      onSuccess: (ctx) => {
          console.log(ctx);
      },
      onError: (ctx) => {
          console.log(ctx);
      }
  });
  
  return { data, error };
}
