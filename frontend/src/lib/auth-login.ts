export interface LoginInput {
  identifier: string;
  password: string;
  redirectTo: string;
}

export interface LoginUser {
  id: number;
  email: string | null;
  username: string | null;
  full_name: string | null;
  password_hash: string;
}

export interface LoginDependencies {
  findByCredentials: (identifier: string) => Promise<LoginUser | null>;
  comparePassword: (plain: string, hash: string) => Promise<boolean>;
  updateLastLogin: (userId: number) => Promise<void>;
}

export type LoginAttemptResult =
  | { ok: false; status: 400 | 401; error: string }
  | {
      ok: true;
      user: Omit<LoginUser, 'password_hash'>;
      redirectTo: string;
    };

export function sanitizeRedirect(redirect: unknown): string {
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }
  return redirect;
}

export function parseLoginInput(body: unknown): LoginInput {
  const payload = (body ?? {}) as Record<string, unknown>;
  const identifier = typeof payload.identifier === 'string'
    ? payload.identifier
    : typeof payload.email === 'string'
      ? payload.email
      : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const redirectTo = sanitizeRedirect(payload.redirect);

  return {
    identifier,
    password,
    redirectTo,
  };
}

export async function attemptLogin(
  input: LoginInput,
  deps: LoginDependencies
): Promise<LoginAttemptResult> {
  if (!input.identifier.trim() || !input.password) {
    return {
      ok: false,
      status: 400,
      error: 'Identificatore e password sono obbligatori',
    };
  }

  const user = await deps.findByCredentials(input.identifier);
  if (!user) {
    return {
      ok: false,
      status: 401,
      error: 'Credenziali non valide',
    };
  }

  const isPasswordValid = await deps.comparePassword(input.password, user.password_hash);
  if (!isPasswordValid) {
    return {
      ok: false,
      status: 401,
      error: 'Credenziali non valide',
    };
  }

  await deps.updateLastLogin(user.id);

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
    },
    redirectTo: input.redirectTo,
  };
}
