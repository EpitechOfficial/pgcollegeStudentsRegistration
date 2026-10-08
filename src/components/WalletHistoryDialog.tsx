import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, LoaderCircle, RefreshCw, X } from 'lucide-react'
import { formatNaira } from '../data/portal'
import { loadWalletHistory, walletTransactionDate, type WalletTransaction } from '../data/walletHistory'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:opacity-50'
const date = (value: string) => new Date(walletTransactionDate(value)).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })
const statusClass = (value: string) => ['successful', 'success', 'completed'].includes(value) ? 'bg-emerald-50 text-emerald-700' : ['failed', 'cancelled'].includes(value) ? 'bg-red-50 text-red-700' : value === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'
export default function WalletHistoryDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [records, setRecords] = useState<WalletTransaction[]>([])
  const [selected, setSelected] = useState<WalletTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const { toast, showToast, dismissToast } = useFlashToast()
  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadWalletHistory(controller.signal).then((data) => { if (!controller.signal.aborted) setRecords(data) })
      .catch(() => { if (!controller.signal.aborted) { setError(true); showToast('error', 'Unable to load wallet history. Please try again.') } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt, showToast])
  const visible = records.filter((record) => (type === 'all' || record.type === type) && (status === 'all' || record.status === status) && [record.refno, record.appno, record.purpose, record.paystack_reference, record.saanapay_reference].some((value) => value?.toLowerCase().includes(search.trim().toLowerCase())))
  function refresh() { setLoading(true); setError(false); setSelected(null); setAttempt((value) => value + 1) }
  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="wallet-history-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between gap-3 border-b p-5"><div><h2 id="wallet-history-title" className="text-lg font-bold">Wallet History</h2><p className="mt-1 text-xs text-slate-500">Deposits and payments from your wallet.</p></div><button type="button" aria-label="Close wallet history" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5">{loading ? <p role="status" className="flex justify-center gap-2 py-12"><LoaderCircle className="h-5 w-5 animate-spin" />Loading transactions…</p> : error ? <div className="text-center"><p role="alert" className="mb-4">Unable to load wallet history.</p><button type="button" className={button} onClick={refresh}>Retry</button></div> : selected ? <><button type="button" className={`${button} mb-5`} onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4" />Back to History</button><dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">{[['Reference', selected.refno], ['Application Number', selected.appno], ['Transaction Type', selected.type], ['Purpose', selected.purpose], ['Amount', formatNaira(selected.amount)], ['Status', selected.status], ['Payment ID', selected.pid], ['Paystack Reference', selected.paystack_reference], ['Saanapay Reference', selected.saanapay_reference], ['Date / Time', date(selected.created_at)]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value || 'Not provided'}</dd></div>)}</dl>{selected.status === 'pending' && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">This transaction is awaiting payment confirmation.</p>}</> : <>
      {/* {!import.meta.env.VITE_WALLET_HISTORY_URL && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Wallet history is not connected yet.</p>} */}
      <div className="mb-5 flex flex-wrap items-end gap-4"><label className="text-xs font-semibold">Type<select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 block rounded-xl border px-3 py-2 text-sm"><option value="all">All Types</option>{[...new Set(records.map((record) => record.type))].sort().map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs font-semibold">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 block rounded-xl border px-3 py-2 text-sm"><option value="all">All Statuses</option>{[...new Set(records.map((record) => record.status))].sort().map((value) => <option key={value}>{value}</option>)}</select></label><label className="min-w-48 flex-1 text-xs font-semibold">Search<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, purpose or application number" className="mt-2 block w-full rounded-xl border px-3 py-2 text-sm" /></label><button type="button" className={button} onClick={refresh}><RefreshCw className="h-4 w-4" />Refresh</button></div>
      <p className="mb-3 text-xs text-slate-500">{visible.length} transactions</p>
      {visible.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[950px] text-left text-xs"><thead className="bg-navy text-white"><tr>{['Reference', 'Application No', 'Type', 'Purpose', 'Amount (₦)', 'Status', 'Date / Time', 'Details'].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y">{visible.map((record) => <tr key={record.id} className="hover:bg-slate-50"><td className="px-4 py-4">{record.refno}</td><td className="px-4 py-4">{record.appno}</td><td className="px-4 py-4 capitalize">{record.type}</td><td className="px-4 py-4">{record.purpose || '—'}</td><td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums">{formatNaira(record.amount)}</td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 font-semibold ${statusClass(record.status)}`}>{record.status}</span></td><td className="whitespace-nowrap px-4 py-4">{date(record.created_at)}</td><td className="px-4 py-4"><button type="button" className="font-semibold text-navy underline underline-offset-4" onClick={() => setSelected(record)}>View Details</button></td></tr>)}</tbody></table></div> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">{records.length ? 'No transactions match these filters.' : 'No wallet transactions found.'}</p>}
    </>}</div>
    <div className="flex justify-end border-t p-4"><button type="button" className={button} onClick={onClose}>Close</button></div>
  </dialog>, document.body)
}
