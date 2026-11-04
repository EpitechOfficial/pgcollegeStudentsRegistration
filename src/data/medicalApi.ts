import { apiUrl } from './api'
import { restoreSession } from './auth'

export class MedicalApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}
export function medicalObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid medical response from the server.')
  return value as Record<string, unknown>
}
export async function medicalRequest(path: 'medical' | 'medical/passport', signal: AbortSignal, method = 'GET', body?: FormData | Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const multipart = body instanceof FormData
  const response = await fetch(apiUrl(path), {
    method, signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
  })
  let payload: Record<string, unknown>
  try { payload = medicalObject(await response.json()) }
  catch { throw new MedicalApiError('The server returned an invalid response. Please try again.', response.status) }
  if (!response.ok || payload.success !== true) {
    throw new MedicalApiError(typeof payload.message === 'string' ? payload.message : 'Unable to complete this request. Please try again.', response.status)
  }
  return payload
}
