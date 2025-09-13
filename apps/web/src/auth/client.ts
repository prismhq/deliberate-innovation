import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export type Session = typeof authClient.$Infer.Session;
export const { signIn, signOut, useSession, signUp } = authClient;
