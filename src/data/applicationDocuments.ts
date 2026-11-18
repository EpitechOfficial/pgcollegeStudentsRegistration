import { restoreSession } from './auth'

export const APPLICATION_API_BASE_URL = (
  import.meta.env.VITE_APPLICATION_API_BASE_URL ||
  'https://app.pgcollege.ui.edu.ng/applicationbackend/api'
).replace(/\/+$/, '')

export type ApplicationDocumentData = {
  auth: Record<string, unknown>
  biodata: Record<string, unknown>
  education: unknown[]
  olevel: unknown[]
  employment: unknown[]
  publications: unknown[]
  referees: unknown[]
  sponsors: unknown[]
  documents: unknown[]
}

const endpoints = {
  auth: 'auth/user',
  biodata: 'biodata',
  education: 'education',
  olevel: 'olevel',
  employment: 'employment',
  publications: 'publications',
  referees: 'referees',
  sponsors: 'sponsors',
  documents: 'documents',
} as const

function unwrap(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const record = payload as Record<string, unknown>
  return record.data ?? record
}

function list(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, unknown>
  for (const key of keys) if (Array.isArray(record[key])) return record[key]
  return Object.values(record)
}

async function request(path: string, signal?: AbortSignal, method = 'GET') {
  const token = restoreSession()
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`${APPLICATION_API_BASE_URL}/${path}`, {
    method,
    signal,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok || payload.success === false) {
    throw new Error(typeof payload.message === 'string' ? payload.message : 'Unable to load application documents.')
  }
  return payload
}

export type ApplicationApplicant = {
  numeration: string
  surname: string
  firstname: string
  otherNames: string
  passportPhotoUrl: string | null
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function string(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function safeImageUrl(value: unknown): string | null {
  const source = string(value)
  if (!source) return null
  try {
    const url = new URL(source, window.location.origin)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}

/** Applicant identity and passport from the shared application session. */
export async function loadApplicationApplicant(signal?: AbortSignal): Promise<ApplicationApplicant> {
  const auth = object(unwrap(await request('auth/user', signal)))
  const applicant = object(auth.applicant)
  return {
    numeration: string(applicant.numeration),
    surname: string(applicant.surname),
    firstname: string(applicant.firstname),
    otherNames: string(applicant.other_names),
    passportPhotoUrl: safeImageUrl(applicant.passport_photo_url),
  }
}

export async function loadApplicationDocuments(signal?: AbortSignal): Promise<ApplicationDocumentData> {
  const results = await Promise.allSettled(
    Object.values(endpoints).map((path) => request(path, signal)),
  )
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  if (results.every((result) => result.status === 'rejected')) {
    const first = results[0]
    throw first.status === 'rejected' && first.reason instanceof Error
      ? first.reason
      : new Error('Unable to load application documents.')
  }
  const value = (index: number) => results[index]?.status === 'fulfilled' ? unwrap(results[index].value) : {}
  const auth = value(0) as Record<string, unknown>
  const applicant = object(auth.applicant)
  const biodata = value(1) as Record<string, unknown>
  const passportPhotoUrl = string(applicant.passport_photo_url)
  return {
    auth,
    // The application profile is the authoritative passport source. Existing
    // print templates read it from biodata, so expose it there consistently.
    biodata: passportPhotoUrl
      ? { ...biodata, passport_photo_url: passportPhotoUrl }
      : biodata,
    education: list(value(2), ['education', 'records']),
    olevel: list(value(3), ['olevel', 'olevel_records', 'records']),
    employment: list(value(4), ['employment', 'records']),
    publications: list(value(5), ['publications', 'records']),
    referees: list(value(6), ['referees', 'records']),
    sponsors: list(value(7), ['sponsors', 'records']),
    documents: list(value(8), ['documents', 'records']),
  }
}

export async function generateApplicationAcceptanceInvoice() {
  const payload = await request('payment/generate-acceptance-invoice', undefined, 'POST')
  return { data: payload }
}
