import { z } from "zod";

const LOGIN_TIMEOUT_MS = 10_000;
const REFRESH_TIMEOUT_MS = 10_000;
const LOGOUT_TIMEOUT_MS = 10_000;
const ME_TIMEOUT_MS = 8_000;

export function getAccessTokenCookieName(): string {
  const value = process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME?.trim();
  if (!value) throw new AuthBackendError(500, "AUTH_ACCESS_TOKEN_COOKIE_NAME non configurata.");
  return value;
}

export function getAccessTokenCookiePath(): string {
  return process.env.AUTH_ACCESS_TOKEN_COOKIE_PATH?.trim() || "/";
}

export function getRefreshTokenCookieName(): string {
  const value = process.env.AUTH_REFRESH_TOKEN_COOKIE_NAME?.trim();
  if (!value) throw new AuthBackendError(500, "AUTH_REFRESH_TOKEN_COOKIE_NAME non configurata.");
  return value;
}

export function getRefreshTokenCookiePath(): string {
  return process.env.AUTH_REFRESH_TOKEN_COOKIE_PATH?.trim() || "/";
}

export const loginInputSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export const registerInputSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(1),
  password: z.string().min(1),
  fullName: z.string().trim().optional(),
  birthDate: z
    .object({
      day: z.string().trim().min(1),
      month: z.string().trim().min(1),
      year: z.string().trim().min(1),
    })
    .optional(),
});

const springTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshExpiresIn: z.number().int().positive(),
  tokenType: z.string().min(1).optional().default("Bearer"),
});

const springMeResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  email: z.string().trim().email().nullable().optional(),
  phoneNumber: z.string().trim().min(1).nullable().optional(),
  username: z.string().trim().min(1).nullable().optional(),
  fullName: z.string().trim().min(1).nullable().optional(),
});

const springRegisterResponseSchema = z.object({
  message: z.string().min(1),
  userId: z.string().trim().min(1),
  username: z.string().trim().min(1),
});

export type SpringTokenResponse = z.infer<typeof springTokenResponseSchema>;
export type SpringMeResponse = z.infer<typeof springMeResponseSchema>;
export type SpringRegisterResponse = z.infer<typeof springRegisterResponseSchema>;

export class AuthBackendError extends Error {
  readonly status: number;
  readonly backendErrorCode: string | null;
  readonly backendMessage: string | null;

  constructor(
    status: number,
    message: string,
    details?: { backendErrorCode?: string | null; backendMessage?: string | null }
  ) {
    super(message);
    this.status = status;
    this.backendErrorCode = details?.backendErrorCode ?? null;
    this.backendMessage = details?.backendMessage ?? null;
  }
}

function extractBackendErrorDetails(payload: unknown): {
  backendErrorCode: string | null;
  backendMessage: string | null;
} {
  if (!payload || typeof payload !== "object") {
    return { backendErrorCode: null, backendMessage: null };
  }

  const record = payload as Record<string, unknown>;
  return {
    backendErrorCode: typeof record.error === "string" ? record.error : null,
    backendMessage: typeof record.message === "string" ? record.message : null,
  };
}

function getSpringApiBaseUrl(): string {
  const value = process.env.SPRING_API_BASE_URL?.trim();
  if (!value) {
    throw new AuthBackendError(503, "SPRING_API_BASE_URL non configurata.");
  }

  return value.replace(/\/+$/, "");
}

export function buildSpringAuthUrl(path: string): string {
  const baseUrl = getSpringApiBaseUrl();
  const qIndex = path.indexOf("?");
  const pathOnly = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const queryString = qIndex >= 0 ? path.slice(qIndex) : "";

  const normalizedPath = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  const parsedBaseUrl = new URL(baseUrl);
  const basePath = parsedBaseUrl.pathname.replace(/\/+$/, "");
  const mergedPath = `${basePath === "/" ? "" : basePath}${normalizedPath}`;

  parsedBaseUrl.pathname = mergedPath.replace(/\/{2,}/g, "/");
  parsedBaseUrl.search = queryString;
  parsedBaseUrl.hash = "";

  return parsedBaseUrl.toString();
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function postSpringJson<TSchema extends z.ZodTypeAny>(input: {
  path: string;
  body: unknown;
  schema: TSchema;
  timeoutMs: number;
  headers?: Record<string, string>;
}): Promise<z.infer<TSchema>> {
  const url = buildSpringAuthUrl(input.path);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...input.headers,
      },
      body: JSON.stringify(input.body),
      signal: AbortSignal.timeout(input.timeoutMs),
    });
  } catch {
    throw new AuthBackendError(503, "Servizio auth non raggiungibile.");
  }

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const details = extractBackendErrorDetails(payload);
    throw new AuthBackendError(response.status, "Chiamata auth fallita.", details);
  }

  const parsed = input.schema.safeParse(payload);
  if (!parsed.success) {
    throw new AuthBackendError(502, "Payload auth non valido.");
  }

  return parsed.data;
}

async function getSpringJson<TSchema extends z.ZodTypeAny>(input: {
  path: string;
  schema: TSchema;
  timeoutMs: number;
  headers?: Record<string, string>;
}): Promise<z.infer<TSchema>> {
  const url = buildSpringAuthUrl(input.path);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        ...input.headers,
      },
      signal: AbortSignal.timeout(input.timeoutMs),
    });
  } catch {
    throw new AuthBackendError(503, "Servizio auth non raggiungibile.");
  }

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const details = extractBackendErrorDetails(payload);
    throw new AuthBackendError(response.status, "Chiamata auth fallita.", details);
  }

  const parsed = input.schema.safeParse(payload);
  if (!parsed.success) {
    throw new AuthBackendError(502, "Payload auth non valido.");
  }

  return parsed.data;
}

export function isAllowedAuthRequestOrigin(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const currentOrigin = requestUrl.origin;
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const hostHeader = request.headers.get("host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const effectiveHost = forwardedHost || hostHeader;
  const effectiveProto = forwardedProto || requestUrl.protocol.replace(":", "");
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  const allowedOrigins = new Set<string>([currentOrigin]);
  if (effectiveHost) {
    allowedOrigins.add(`${effectiveProto}://${effectiveHost}`);
  }

  if (originHeader) {
    return allowedOrigins.has(originHeader);
  }

  if (refererHeader) {
    try {
      return allowedOrigins.has(new URL(refererHeader).origin);
    } catch {
      return false;
    }
  }

  return true;
}

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  const normalizedToken = token.trim();
  return normalizedToken.length > 0 ? normalizedToken : null;
}

export async function loginWithSpring(input: z.infer<typeof loginInputSchema>): Promise<SpringTokenResponse> {
  return await postSpringJson({
    path: "/api/public/auth/login",
    body: input,
    schema: springTokenResponseSchema,
    timeoutMs: LOGIN_TIMEOUT_MS,
  });
}

export async function registerWithSpring(
  input: z.infer<typeof registerInputSchema>
): Promise<SpringRegisterResponse> {
  return await postSpringJson({
    path: "/api/public/auth/register",
    body: input,
    schema: springRegisterResponseSchema,
    timeoutMs: LOGIN_TIMEOUT_MS,
  });
}

export async function refreshWithSpring(refreshToken: string): Promise<SpringTokenResponse> {
  return await postSpringJson({
    path: "/api/public/auth/refresh",
    body: { refreshToken },
    schema: springTokenResponseSchema,
    timeoutMs: REFRESH_TIMEOUT_MS,
  });
}

export async function meWithSpring(accessToken: string): Promise<SpringMeResponse> {
  return await getSpringJson({
    path: "/api/priv/auth/me",
    schema: springMeResponseSchema,
    timeoutMs: ME_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function logoutWithSpring(input: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  const url = buildSpringAuthUrl("/api/priv/auth/logout");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: input.refreshToken }),
      signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS),
    });
  } catch {
    throw new AuthBackendError(503, "Logout remoto non raggiungibile.");
  }

  if (!response.ok) {
    throw new AuthBackendError(response.status, "Logout remoto fallito.");
  }
}

