import { apiUrl } from './api'
import { restoreSession, isDemoSession } from './auth'
import { SCHOOL_FEE_SCHEDULE } from './portal'

export function paymentObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid payment response.')
  return value as Record<string, unknown>
}
export function paymentAmount(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') throw new Error('Invalid payment amount.')
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid payment amount.')
  return amount
}
export async function paymentsRequest(path: string, signal: AbortSignal): Promise<unknown> {
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  const response = await fetch(apiUrl(`payments/${path}`), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  })
  let payload: Record<string, unknown>
  try { payload = paymentObject(await response.json()) }
  catch { throw new Error('The server returned an invalid payment response. Please try again.') }
  if (!response.ok || payload.success !== true) throw new Error(typeof payload.message === 'string' ? payload.message : 'Unable to load payment information.')
  return payload.data
}
export interface FeeSchedule {
  faculty: string; department: string; degree: string; modeOfStudy: string; studentType: string; session: string
  degreeCategory: string; currency: string; total: number; items: { description: string; amount: number }[]; demo: boolean
}
export async function loadFeeSchedule(signal: AbortSignal): Promise<FeeSchedule> {
  if (isDemoSession()) return { ...SCHOOL_FEE_SCHEDULE, degreeCategory: '', currency: 'NGN', total: SCHOOL_FEE_SCHEDULE.items.reduce((sum, item) => sum + item.amount, 0), demo: true }
  const data = paymentObject(await paymentsRequest('schedule', signal))
  if (!Array.isArray(data.fee_items)) throw new Error('Invalid fee schedule.')
  const text = (key: string) => typeof data[key] === 'string' ? data[key] as string : ''
  return {
    session: text('session'), faculty: text('faculty'), department: text('department'), degree: text('degree'),
    modeOfStudy: text('mode_of_study'), studentType: text('type'), degreeCategory: text('degree_category'), currency: text('currency') || 'NGN',
    total: paymentAmount(data.total_amount), demo: false,
    items: data.fee_items.map(value => { const item = paymentObject(value); if (typeof item.description !== 'string') throw new Error('Invalid fee description.'); return { description: item.description, amount: paymentAmount(item.amount) } }),
  }
}

export async function loadClearanceSummary(signal: AbortSignal) {
  const data = paymentObject(await paymentsRequest('financial-clearance', signal))
  if (typeof data.session !== 'string' || typeof data.application_number !== 'string' || typeof data.status !== 'string') throw new Error('Invalid financial clearance summary.')
  return { session: data.session, applicationNumber: data.application_number, total: paymentAmount(data.total_fees), paid: paymentAmount(data.confirmed_payments), balance: paymentAmount(data.outstanding_balance), status: data.status }
}
