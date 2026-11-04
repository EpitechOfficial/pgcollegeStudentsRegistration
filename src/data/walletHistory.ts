import { isDemoSession } from './auth'
import { currentStudent } from './portal'
import { walletRequest, walletObject, walletAmount } from './wallet'
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
export interface WalletHistoryFilters { page?: number; type?: string; status?: string; search?: string }
export async function loadWalletHistory(signal: AbortSignal, filters: WalletHistoryFilters = {}) {
  if (isDemoSession()) return { records: [] as WalletTransaction[], balance: 0, total: 0, currentPage: 1, lastPage: 1 }
  const query = new URLSearchParams({ page: String(filters.page || 1), per_page: '20' })
  for (const key of ['type', 'status', 'search'] as const) if (filters[key] && filters[key] !== 'all') query.set(key, filters[key]!.trim())
  const data = await walletRequest('wallet/history?' + query, signal)
  if (!Array.isArray(data.transactions)) throw new Error('Invalid wallet history response.')
  const records = data.transactions.map(value => {
    const record = walletObject(value)
    if (!['refno', 'type', 'status', 'created_at'].every(key => typeof record[key] === 'string') || !['number', 'string'].includes(typeof record.id)) throw new Error('Invalid wallet transaction.')
    if (!Number.isFinite(walletTransactionDate(record.created_at as string))) throw new Error('Invalid transaction date.')
    return {
      id: String(record.id), refno: String(record.refno), appno: typeof record.appno === 'string' ? record.appno : currentStudent().applicationNumber,
      type: String(record.type), status: String(record.status), created_at: String(record.created_at), amount: walletAmount(record.amount),
      purpose: typeof record.purpose === 'string' ? record.purpose : null,
      pid: record.pid == null ? null : String(record.pid),
      paystack_reference: typeof record.paystack_reference === 'string' ? record.paystack_reference : null,
      saanapay_reference: typeof record.saanapay_reference === 'string' ? record.saanapay_reference : null,
    }
  })
  const currentPage = Number(data.current_page), lastPage = Number(data.last_page), total = Number(data.total)
  if (![currentPage, lastPage, total].every(Number.isInteger) || currentPage < 1 || lastPage < 1 || total < 0) throw new Error('Invalid wallet history pagination.')
  return { records, balance: walletAmount(data.balance), total, currentPage, lastPage }
}
