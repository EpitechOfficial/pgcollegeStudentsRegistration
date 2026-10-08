import type { Credentials } from '../types'

export async function requestPasswordReset(email: string, applicationNumber: string, signal: AbortSignal): Promise<void> {
  const endpoint = import.meta.env.VITE_PASSWORD_RESET_URL
  if (!endpoint) throw new Error('Password recovery is not connected yet. Please contact the Information Unit.')
  const response = await fetch(endpoint, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim(), ...(applicationNumber.trim() ? { applicationNumber: applicationNumber.trim() } : {}) }),
  })
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many requests. Please try again later.' : 'Unable to request a password reset. Please try again.')
}

/**
 * Demo credential for the mock sign-in flow. Replace with the real
 * authentication endpoint call when wiring to the live API.
 */
const VALID_CREDENTIALS = {
  matric: 'PG123',
  password: 'pg@123',
}

export type AuthError =
  | { kind: 'invalid'; message: string }
  | { kind: 'network'; message: string }

const STORAGE_KEY = 'pgc.portal.auth'
const REMEMBER_KEY = 'pgc.portal.remember'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function signIn(credentials: Credentials): Promise<void> {
  // Simulated network round-trip — swap for the real API call.
  await delay(900)

  // Fail loudly in a way the UI can present; never throw raw errors.
  if (
    credentials.matric.trim().toUpperCase() !== VALID_CREDENTIALS.matric ||
    credentials.password !== VALID_CREDENTIALS.password
  ) {
    const error: AuthError = {
      kind: 'invalid',
      message: 'Incorrect matriculation number or password. Please try again.',
    }
    throw error
  }

  const record = JSON.stringify({ matric: credentials.matric, at: Date.now() })
  if (credentials.remember) {
    localStorage.setItem(STORAGE_KEY, record)
    localStorage.setItem(REMEMBER_KEY, '1')
  } else {
    sessionStorage.setItem(STORAGE_KEY, record)
    localStorage.removeItem(REMEMBER_KEY)
  }
}

export function restoreSession(): string | null {
  return (
    sessionStorage.getItem(STORAGE_KEY) ??
    (localStorage.getItem(REMEMBER_KEY) ? localStorage.getItem(STORAGE_KEY) : null)
  )
}

export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(REMEMBER_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

export function rememberedMatric(): string {
  return localStorage.getItem(STORAGE_KEY)
    ? (JSON.parse(localStorage.getItem(STORAGE_KEY) as string)?.matric ?? '')
    : ''
}
