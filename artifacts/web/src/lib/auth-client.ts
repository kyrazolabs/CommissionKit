import { createAuthClient } from "better-auth/react";
import { organization } from "better-auth/plugins";
import { dash } from "@better-auth/infra";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8088",
  plugins: [dash(), organization()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
