export function depositAmount(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(Math.round(amount * 100)) ? amount : null
}

export const WALLET_PAYMENT_TYPES = [
  { value: 'school-fees', label: 'School Fee' },
  { value: 'acceptance-fee', label: 'Acceptance Fee' },
  { value: 'application-fee', label: 'Application Fee' },
  { value: 'sundry', label: 'Sundry' },
] as const
export type WalletPaymentType = typeof WALLET_PAYMENT_TYPES[number]['value']
export interface WalletInvoice {
  invoiceNumber: string
  session: string
  amountDue: number
  walletBalance: number
  status: 'unpaid' | 'paid'
}
export async function lookupWalletInvoice(invoiceNumber: string, paymentType: WalletPaymentType, signal: AbortSignal): Promise<WalletInvoice> {
  const endpoint = import.meta.env.VITE_WALLET_PAYMENT_URL
  if (!endpoint) throw new Error('Wallet payment is not connected yet.')
  const url = new URL(endpoint, window.location.origin)
  url.searchParams.set('invoiceNumber', invoiceNumber)
  url.searchParams.set('paymentType', paymentType)
  const response = await fetch(url, { credentials: 'include', signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(response.status === 404 ? 'Invoice not found. Check the invoice number.' : 'Unable to load this invoice. Please try again.')
  const payload = await response.json()
  const record = payload?.data ?? payload
  if (!record || record.invoiceNumber !== invoiceNumber || typeof record.session !== 'string' || !['unpaid', 'paid'].includes(record.status) || !Number.isFinite(record.amountDue) || record.amountDue < 0 || !Number.isFinite(record.walletBalance) || record.walletBalance < 0) throw new Error('Invalid invoice response.')
  return record
}
export async function payWalletInvoice(invoiceNumber: string, paymentType: WalletPaymentType, requestId: string, signal: AbortSignal): Promise<string> {
  const endpoint = import.meta.env.VITE_WALLET_PAYMENT_URL
  if (!endpoint) throw new Error('Wallet payment is not connected yet.')
  const response = await fetch(endpoint, { method: 'POST', credentials: 'include', signal, headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Idempotency-Key': requestId }, body: JSON.stringify({ invoiceNumber, paymentType }) })
  if (!response.ok) throw new Error('Payment could not be confirmed. Check your wallet history before trying again.')
  const payload = await response.json()
  const result = payload?.data ?? payload
  if (result?.status !== 'paid' || typeof result.reference !== 'string' || !result.reference) throw new Error('Payment is not confirmed yet. Check your wallet history before trying again.')
  return result.reference
}

export async function startWalletDeposit(amount: number, requestId: string, signal: AbortSignal): Promise<string> {
  const endpoint = import.meta.env.VITE_WALLET_DEPOSIT_URL
  if (!endpoint) throw new Error('Wallet payment is not connected yet.')
  const response = await fetch(endpoint, {
    method: 'POST', credentials: 'include', signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Idempotency-Key': requestId },
    body: JSON.stringify({ amount, currency: 'NGN' }),
  })
  if (!response.ok) throw new Error('Unable to start your deposit. Please try again.')
  const payload = await response.json()
  const checkoutUrl = payload?.data?.checkoutUrl ?? payload?.checkoutUrl
  if (typeof checkoutUrl !== 'string') throw new Error('Payment link was not returned. Please try again.')
  const url = new URL(checkoutUrl)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid payment link. Please contact support.')
  return url.href
}
