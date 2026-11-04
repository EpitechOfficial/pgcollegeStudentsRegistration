import { apiUrl } from './api'
import { isDemoSession, restoreSession } from './auth'

export class WalletError extends Error {
  status: number
  details: Record<string, unknown>
  constructor(message: string, status = 0, details: Record<string, unknown> = {}) { super(message); this.status = status; this.details = details }
}
export function walletObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid wallet response.')
  return value as Record<string, unknown>
}
export function walletAmount(value: unknown): number {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') throw new Error('Invalid wallet amount.')
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid wallet amount.')
  return amount
}
export async function walletRequest(path: string, signal: AbortSignal, body?: Record<string, unknown>) {
  if (isDemoSession()) throw new Error('Wallet transactions are unavailable in demo mode.')
  const token = restoreSession()
  if (!token) throw new Error('Please sign in again.')
  let response: Response
  try {
    response = await fetch(apiUrl(path), { method: body ? 'POST' : 'GET', signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]), headers: { Accept: 'application/json', Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  } catch (error) {
    if (signal.aborted) throw error
    throw new WalletError(body && path === 'wallet/pay' ? 'Payment could not be confirmed. Check wallet history before trying again.' : 'Unable to connect to your wallet. Please try again.')
  }
  let payload: Record<string, unknown>
  try { payload = walletObject(await response.json()) } catch { throw new WalletError(path === 'wallet/pay' ? 'Payment could not be confirmed. Check wallet history before trying again.' : 'Invalid wallet response.', response.status) }
  if (!response.ok || payload.success !== true) throw new WalletError(typeof payload.message === 'string' ? payload.message : 'Unable to complete this wallet request.', response.status, payload.data && typeof payload.data === 'object' ? payload.data as Record<string, unknown> : {})
  return walletObject(payload.data)
}
export async function loadWalletBalance(signal: AbortSignal) {
  if (isDemoSession()) return { balance: 0, currency: 'NGN' }
  const data = await walletRequest('wallet', signal)
  return { balance: walletAmount(data.balance), currency: typeof data.currency === 'string' ? data.currency : 'NGN' }
}
export const WALLET_PAYMENT_TYPES = [
  { value: 1, label: 'School Fee' },
  { value: 2, label: 'Acceptance Fee' },
  { value: 3, label: 'Application Fee' },
  { value: 4, label: 'Sundry' },
] as const
export type WalletPaymentType = typeof WALLET_PAYMENT_TYPES[number]['value']
export interface WalletPaymentResult { reference: string; invoiceNumber: string; amountPaid: number; balance: number }
export async function payWalletInvoice(invoiceNumber: string, paymentType: WalletPaymentType, signal: AbortSignal): Promise<WalletPaymentResult> {
  const number = invoiceNumber.trim()
  if (!number) throw new Error('Enter an invoice number.')
  if (!WALLET_PAYMENT_TYPES.some((type) => type.value === paymentType)) throw new Error('Select a valid payment type.')
  const data = await walletRequest('wallet/pay', signal, { invoiceno: number, pay_type: paymentType })
  if (typeof data.refno !== 'string' || !data.refno || data.invoiceno !== invoiceNumber.trim()) throw new Error('Payment could not be confirmed. Check wallet history before trying again.')
  return { reference: data.refno, invoiceNumber: data.invoiceno, amountPaid: walletAmount(data.amount_paid), balance: walletAmount(data.balance) }
}
export interface WalletDepositResult { reference: string; amount: number; paymentLink: string; instructions: string }
export async function startWalletDeposit(amount: number, signal: AbortSignal): Promise<WalletDepositResult> {
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) throw new Error('Enter a valid deposit amount.')
  const data = await walletRequest('wallet/initiate-deposit', signal, { amount })
  if (typeof data.refno !== 'string' || !data.refno) throw new Error('Deposit reference was not returned.')
  if (typeof data.payment_link !== 'string') throw new Error('Payment link was not returned.')
  const url = new URL(data.payment_link)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid payment link. Please contact support.')
  const returnedAmount = walletAmount(data.amount)
  if (returnedAmount !== amount) throw new Error('The payment provider returned a different deposit amount. Please try again.')
  url.searchParams.set('ref', data.refno)
  return { reference: data.refno, amount: returnedAmount, paymentLink: url.href, instructions: typeof data.instructions === 'string' ? data.instructions : '' }
}
