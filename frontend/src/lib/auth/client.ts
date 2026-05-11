"use client";

import { loginAction, refreshAction } from "@/lib/auth/actions";

type LoginInput = {
  email: string;
  password: string;
};

type SignInResult = {
  error?: string;
  redirectTo?: string;
};

export const signIn = {
  async email(input: LoginInput): Promise<SignInResult> {
    const result = await loginAction({ identifier: input.email, password: input.password, redirect: "/" });
    if (!result.success) return { error: result.error };
    return { redirectTo: result.data.redirectTo };
  },
};

export async function refreshAccessToken(): Promise<boolean> {
  const result = await refreshAction();
  return result.success;
}
