import { signIn, signUp } from "~/auth/client";

export async function signInWithGoogle(callbackURL?: string) {
  await signIn.social({
    provider: "google",
    callbackURL: callbackURL || "/workspace",
    errorCallbackURL: "/login",
    newUserCallbackURL: callbackURL || "/onboarding",
  });
}

export async function signInWithEmail({
  email,
  password,
  callbackURL,
}: {
  email: string;
  password: string;
  callbackURL: string;
}) {
  return await signIn.email({ email, password, callbackURL });
}

export async function signUpWithEmail({
  email,
  password,
  name,
  callbackURL,
}: {
  email: string;
  password: string;
  name: string;
  callbackURL: string;
}) {
  return await signUp.email({
    email,
    password,
    name,
    callbackURL: callbackURL || "/onboarding",
  });
}
