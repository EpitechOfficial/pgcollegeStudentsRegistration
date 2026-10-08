export interface WalletTransaction {
  id: string
  refno: string
  appno: string
  type: string
  purpose: string | null
  amount: number
  status: string
  pid: string | null
  paystack_reference: string | null
  saanapay_reference: string | null
  created_at: string
}
export function walletTransactionDate(value: string): number {
  // Database timestamps without an offset are interpreted in Nigeria time.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}+01:00` : value
  return Date.parse(normalized)
}
export async function loadWalletHistory(signal: AbortSignal): Promise<WalletTransaction[]> {
  const endpoint = import.meta.env.VITE_WALLET_HISTORY_URL
  if (!endpoint) return []
  const response = await fetch(endpoint, { credentials: 'include', signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Unable to load wallet history.')
  const payload = await response.json()
  const records: unknown = Array.isArray(payload) ? payload : payload?.data
  if (!Array.isArray(records)) throw new Error('Invalid wallet history response.')
  return records.map((record) => {
    if (!record || typeof record !== 'object' || !['refno', 'appno', 'type', 'status', 'created_at'].every((key) => typeof record[key] === 'string') || !['string', 'number'].includes(typeof record.id)) throw new Error('Invalid wallet transaction.')
    const amount = typeof record.amount === 'string' && /^\d+(\.\d+)?$/.test(record.amount) ? Number(record.amount) : record.amount
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(walletTransactionDate(record.created_at))) throw new Error('Invalid wallet transaction amount or date.')
    if (!['purpose', 'pid', 'paystack_reference', 'saanapay_reference'].every((key) => record[key] == null || typeof record[key] === 'string' || (key === 'pid' && typeof record[key] === 'number'))) throw new Error('Invalid wallet transaction details.')
    return { ...record, id: String(record.id), amount, type: record.type.toLowerCase(), status: record.status.toLowerCase(), purpose: record.purpose ?? null, pid: record.pid == null ? null : String(record.pid), paystack_reference: record.paystack_reference ?? null, saanapay_reference: record.saanapay_reference ?? null } as WalletTransaction
  }).sort((left, right) => walletTransactionDate(right.created_at) - walletTransactionDate(left.created_at))
}
