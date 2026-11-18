import { apiUrl } from './api'
import { isDemoSession, restoreSession } from './auth'

export type ApplicationDocumentAccess = {
  granted: boolean
  paymentStatus: 'unpaid' | 'pending' | 'paid'
  expiresAt: string | null
  expired: boolean
  amount: number | null
  currency: string
  message: string
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function bool(value: unknown): boolean {
  if (value === true || value === 1) return true
  return ['true', 'yes', '1', 'paid', 'active', 'granted'].includes(text(value).toLowerCase())
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  const payload = await response.json().catch(() => ({}))
  return object(payload)
}

function authorization() {
  const token = restoreSession()
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  return { Accept: 'application/json', Authorization: `Bearer ${token}` }
}

/** Live access check. The backend owns payment confirmation and expiry. */
export async function loadApplicationDocumentAccess(signal: AbortSignal): Promise<ApplicationDocumentAccess> {
  if (isDemoSession()) return { granted: true, paymentStatus: 'paid', expiresAt: null, expired: false, amount: null, currency: 'NGN', message: '' }
  const response = await fetch(apiUrl('documents/access'), {
    headers: authorization(),
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  })
  const payload = await responseJson(response)
  if (!response.ok || payload.success !== true) throw new Error(text(payload.message) || 'Unable to verify document access.')
  const access = object(payload.data)
  if (!Object.keys(access).length) throw new Error('Application Documents payment access has not been configured for this account.')

  const rawStatus = text(access.payment_status ?? access.status).toLowerCase()
  const paymentStatus: ApplicationDocumentAccess['paymentStatus'] =
    ['paid', 'successful', 'success', 'confirmed'].includes(rawStatus) || bool(access.payment_confirmed)
      ? 'paid'
      : ['pending', 'processing', 'initiated'].includes(rawStatus)
        ? 'pending'
        : 'unpaid'
  const expiresAt = text(access.access_expires_at ?? access.expires_at) || null
  const expiry = expiresAt ? Date.parse(expiresAt) : Number.NaN
  const expired = bool(access.expired) || (Number.isFinite(expiry) && expiry <= Date.now())
  const backendGranted = bool(access.access_granted ?? access.can_access)
  const numericAmount = Number(access.amount)
  return {
    granted: backendGranted && paymentStatus === 'paid' && !expired,
    paymentStatus,
    expiresAt,
    expired,
    amount: Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : null,
    currency: text(access.currency) || 'NGN',
    message: text(access.message),
  }
}

/** Creates or returns the pending document-access invoice. */
export async function initiateApplicationDocumentPayment(signal: AbortSignal): Promise<string> {
  const response = await fetch(apiUrl('documents/access'), {
    method: 'POST',
    headers: { ...authorization(), 'Content-Type': 'application/json' },
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  })
  const payload = await responseJson(response)
  const nested = object(payload.data)
  const data = Object.keys(nested).length ? nested : payload
  if (!response.ok || payload.success !== true) throw new Error(text(payload.message) || 'Unable to initiate the document-access payment.')
  const paymentLink = text(data.payment_url ?? data.payment_link ?? data.authorization_url ?? data.url)
  if (!paymentLink) throw new Error('The payment provider link was not returned.')
  const url = new URL(paymentLink)
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('The payment provider returned an invalid link.')
  return url.href
}
