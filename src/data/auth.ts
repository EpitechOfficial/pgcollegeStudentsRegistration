import type { Credentials } from "../types";
import { apiUrl } from "./api";

export type AuthError = {
  kind: "invalid" | "network" | "server" | "storage";
  message: string;
};
export interface AuthUser {
  numeration: string;
  name: string;
  nameForForms?: string;
  surname?: string;
  other_names?: string;
  email?: string | null;
  telephone?: string | number | null;
  nationality?: string | null;
  session?: string | null;
  programme?: {
    faculty?: string | null;
    department?: string | null;
    degree?: string | null;
    degree_type?: string | null;
    mode_of_study?: string | null;
    field_of_interest?: string | null;
    program_type?: string | null;
  } | null;
  financial_summary?: Record<string, unknown> | null;
  admission_status?: Record<string, unknown> | null;
  lapse_status?: {
    payment_lapse?: boolean;
    session_lapse?: boolean;
  } | null;
  [key: string]: unknown;
}
interface Session {
  mode?: 'demo' | 'backend';
  token: string;
  user: AuthUser;
  expiresAt: number;
}
const STORAGE_KEY = "pgc.portal.auth";
const REMEMBER_KEY = "pgc.portal.remember";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false');
const DEMO_TOKEN = 'demo-session';
let sessionValidation: { token: string; promise: Promise<boolean> } | null = null;
function normalizeUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const numeration = typeof record.numeration === "string" ? record.numeration.trim() : "";
  const apiName = [record.other_names, record.surname]
    .filter((part): part is string => typeof part === "string" && !!part.trim())
    .map((part) => part.trim())
    .join(" ");

  const apiNameForForms = [record.surname, record.other_names]
    .filter((part): part is string => typeof part === "string" && !!part.trim())
    .map((part) => part.trim())
    .join(" ");

  const name = apiName || (typeof record.name === "string" ? record.name.trim() : "");
  const nameForForms = apiNameForForms || (typeof record.nameForForms === "string" ? record.nameForForms.trim() : "");

  if (!numeration) return null;
  return { ...record, numeration, name: name || numeration, nameForForms } as AuthUser;
}
function responseUser(payload: Record<string, unknown>): AuthUser | null {
  const data = payload.data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    return normalizeUser(payload.user ?? record.user ?? record.data ?? data);
  }
  return normalizeUser(payload.user ?? payload);
}
function clearSession() {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(REMEMBER_KEY);
    } catch {
      /* Storage may be unavailable. */
    }
  }
}
function readSession(): Session | null {
  try {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (
      typeof record.token !== "string" ||
      !record.token.trim() ||
      !normalizeUser(record.user) ||
      !Number.isFinite(record.expiresAt) ||
      record.expiresAt <= Date.now() ||
      (record.mode === 'demo' && (!DEMO_ENABLED || record.token !== DEMO_TOKEN)) ||
      (record.token === DEMO_TOKEN && record.mode !== 'demo')
    ) {
      clearSession();
      return null;
    }
    return record;
  } catch {
    clearSession();
    return null;
  }
}
export function restoreSession(): string | null {
  return readSession()?.token ?? null;
}
export function authenticatedUser(): AuthUser | null {
  return readSession()?.user ?? null;
}
export function isDemoSession(): boolean {
  return readSession()?.mode === 'demo';
}
export function rememberedMatric(): string {
  return readSession()?.user.numeration ?? "";
}
async function json(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json();
  } catch {
    throw {
      kind: "server",
      message: "The server returned an unexpected response. Please try again.",
    } satisfies AuthError;
  }
}
function responseError(response: Response, payload?: Record<string, unknown>): AuthError {
  const message = typeof payload?.message === "string" && payload.message.trim()
    ? payload.message.trim()
    : undefined;
  if ([401, 403, 422].includes(response.status))
    return {
      kind: "invalid",
      message: message ?? "Incorrect application or matriculation number or password.",
    };
  if (response.status === 429)
    return {
      kind: "server",
      message: message ?? "Too many sign-in attempts. Please wait and try again.",
    };
  return {
    kind: "server",
    message: message ?? "Sign-in is currently unavailable. Please try again later.",
  };
}
export async function signIn(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<void> {
  if (DEMO_ENABLED && credentials.matric.trim().toUpperCase() === 'PG123' && credentials.password === 'pg@123') {
    signal?.throwIfAborted();
    clearSession();
    try {
      const storage = credentials.remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'demo', token: DEMO_TOKEN, user: { numeration: 'PG123', name: 'Alake Emmanuel' }, expiresAt: Date.now() + THIRTY_DAYS } satisfies Session));
    } catch {
      clearSession();
      throw { kind: 'storage', message: 'Your browser could not save the session. Allow site storage and try again.' } satisfies AuthError;
    }
    return;
  }
  let response: Response;
  try {
    response = await fetch(apiUrl("auth/login"), {
      method: "POST",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numeration: credentials.matric.trim(),
        password: credentials.password,
      }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw {
      kind: "network",
      message:
        "Unable to connect. Check your internet connection and try again.",
    } satisfies AuthError;
  }
  if (!response.ok) {
    let errorPayload: Record<string, unknown> | undefined;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object") errorPayload = body as Record<string, unknown>;
    } catch { /* Use the status-based message when the error body is not JSON. */ }
    throw responseError(response, errorPayload);
  }
  const payload = await json(response);
  if (payload.success === false)
    throw {
      kind: "invalid",
      message: typeof payload.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : "Incorrect application or matriculation number or password.",
    } satisfies AuthError;
  const data = payload.data && typeof payload.data === "object"
    ? payload.data as Record<string, unknown>
    : null;
  const token = payload.token ?? data?.token;
  const user = responseUser(payload);
  if (typeof token !== "string" || !token.trim() || !user)
    throw {
      kind: "server",
      message:
        "The server returned an incomplete sign-in response. Please try again.",
    } satisfies AuthError;
  signal?.throwIfAborted();
  clearSession();
  try {
    const storage = credentials.remember ? localStorage : sessionStorage;
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token,
        user,
        expiresAt: Date.now() + THIRTY_DAYS,
      } satisfies Session),
    );
  } catch {
    clearSession();
    throw {
      kind: "storage",
      message:
        "Your browser could not save the session. Allow site storage and try again.",
    } satisfies AuthError;
  }
}
async function verifySession(session: Session): Promise<boolean> {
  let response: Response;
  try {
    response = await fetch(apiUrl("auth/user"), {
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.token}`,
      },
    });
  } catch {
    throw new Error(
      "Unable to verify your session. Check your connection and retry.",
    );
  }
  if (response.status === 401 || response.status === 403) {
    if (restoreSession() === session.token) clearSession();
    return false;
  }
  if (!response.ok)
    throw new Error("Unable to verify your session. Please try again.");
  const payload = await json(response);
  const user = responseUser(payload);
  if (!user) throw new Error("The server returned an invalid user profile.");
  if (restoreSession() !== session.token) return false;
  const storage = sessionStorage.getItem(STORAGE_KEY)
    ? sessionStorage
    : localStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...session, user }));
  return true;
}

export function validateSession(): Promise<boolean> {
  const session = readSession();
  if (!session) return Promise.resolve(false);
  if (session.mode === 'demo') return Promise.resolve(true);
  if (sessionValidation?.token === session.token) return sessionValidation.promise;

  const promise = verifySession(session).catch(() => {
    if (restoreSession() === session.token) clearSession();
    return false;
  }).finally(() => {
    if (sessionValidation?.promise === promise) sessionValidation = null;
  });
  sessionValidation = { token: session.token, promise };
  return promise;
}
/** Accept a shared-login token only after the registration backend confirms it. */
export async function acceptSharedLogin(token: string, signal: AbortSignal): Promise<void> {
  clearSession();
  const response = await fetch(apiUrl('auth/user'), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  const payload = await json(response);
  if (response.status === 401) throw new Error('Your login was accepted, but the registration portal could not verify the session. Please contact the Information Unit if this continues.');
  if (!response.ok || payload.success !== true) throw responseError(response, payload);
  const user = responseUser(payload);
  if (!user) throw new Error('The registration backend returned an invalid user profile.');
  signal.throwIfAborted();
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'backend', token, user, expiresAt: Date.now() + 24 * 60 * 60 * 1000 } satisfies Session));
  } catch {
    clearSession();
    throw new Error('Your browser could not save the session. Allow site storage and sign in again.');
  }
}

export async function signOut(): Promise<boolean> {
  const session = readSession();
  const token = session?.mode === 'demo' ? null : session?.token;
  clearSession();
  if (!token) return true;
  try {
    const response = await fetch(apiUrl('auth/logout'), {
      method: 'POST', keepalive: true, signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    return response.ok || response.status === 401;
  } catch { return false; }
}
export async function requestPasswordReset(
  email: string,
  applicationNumber: string,
  signal: AbortSignal,
): Promise<void> {
  const endpoint = import.meta.env.VITE_PASSWORD_RESET_URL || apiUrl('auth/forgot-password');
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST', signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email.trim(), ...(applicationNumber.trim() ? { applicationNumber: applicationNumber.trim() } : {}) }),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('Unable to connect. Check your internet connection and try again.');
  }
  if (response.status === 429) throw new Error('Too many requests. Please wait before requesting another reset.');
  if (response.status === 422) throw new Error('Check your email address and application number, then try again.');
  if (!response.ok) throw new Error('Unable to request a password reset. Please try again later.');
  if (response.status === 204) return;
  let payload: { success?: boolean };
  try { payload = await response.json(); }
  catch { throw new Error('The server returned an unexpected response. Please try again later.'); }
  if (!payload || payload.success === false) throw new Error('Unable to request a password reset. Please try again later.');
}
