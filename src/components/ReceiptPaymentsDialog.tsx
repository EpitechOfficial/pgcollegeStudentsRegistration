import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Download, LoaderCircle, Printer, X } from 'lucide-react'
import { loadPayments, receiptablePayments, type PaymentRecord } from '../data/payments'
import { buildFeeDocument } from '../data/feeDocument'
import { formatNaira } from '../data/portal'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-navy/10 disabled:opacity-50'
const date = (value: string | null) => value ? new Date(value).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not provided'

export default function ReceiptPaymentsDialog({ onClose, history = false }: { onClose: () => void; history?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const mounted = useRef(false)
  const busy = useRef(false)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [source, setSource] = useState<'demo' | 'backend'>('demo')
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [session, setSession] = useState('all')
  const [feeType, setFeeType] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<PaymentRecord | null>(null)
  const [ready, setReady] = useState(false)
  const [action, setAction] = useState<'download' | 'print' | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  const records = useMemo(() => history ? [...payments].sort((left, right) => (right.paidAt ? Date.parse(right.paidAt) : 0) - (left.paidAt ? Date.parse(left.paidAt) : 0)) : receiptablePayments(payments), [payments, history])
  const visible = records.filter((record) => (session === 'all' || record.session === session) && (feeType === 'all' || record.feeType === feeType) && (status === 'all' || record.status === status))
  const html = useMemo(() => selected?.receiptNumber && selected.paidAt ? buildFeeDocument({ kind: 'receipt', reference: selected.receiptNumber, createdAt: selected.paidAt, session: selected.session, items: selected.items, paymentReference: selected.reference, invoiceNumber: selected.invoiceNumber, receiptDetails: { ...selected.receiptDetails, applicationNumber: selected.applicationNumber || selected.receiptDetails?.applicationNumber, cashier: selected.cashier || selected.receiptDetails?.cashier }, demo: source === 'demo' }) : '', [selected, source])

  useEffect(() => {
    mounted.current = true
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { mounted.current = false; dialog.close(); document.body.style.overflow = overflow }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadPayments(controller.signal).then((result) => {
      if (!controller.signal.aborted) { setPayments(result.records); setSource(result.source) }
    }).catch(() => {
      if (!controller.signal.aborted) { setError('Unable to load payments. Please try again.'); showToast('error', 'Unable to load payments.') }
    }).finally(() => { if (!controller.signal.aborted) setFetching(false) })
    return () => controller.abort()
  }, [attempt, showToast])

  async function run(next: 'print' | 'download') {
    if (busy.current || !selected || !html) return
    busy.current = true; setAction(next)
    try {
      await new Promise((resolve) => setTimeout(resolve, 40))
      if (!mounted.current) return
      if (next === 'print') {
        const frame = previewRef.current?.contentWindow
        if (!frame) throw new Error('Receipt unavailable')
        frame.focus(); frame.print()
      } else {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url; link.download = `receipt-${selected.receiptNumber!.replace(/[^a-zA-Z0-9_-]/g, '-')}.html`; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        showToast('success', 'Receipt download started.')
      }
    } catch { if (mounted.current) showToast('error', 'Unable to prepare the receipt. Please try again.') }
    finally { busy.current = false; if (mounted.current) setAction(null) }
  }

  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="receipt-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex shrink-0 items-center justify-between gap-3 border-b p-5"><div><h2 id="receipt-title" className="text-lg font-bold">{selected ? selected.feeType === 'application-fee' ? 'Application Fee Receipt' : selected.feeType === 'acceptance-fee' ? 'Acceptance Fee Receipt' : selected.feeType === 'school-fees' ? 'School Fee Receipt' : 'Payment Receipt' : history ? 'Payment Record' : 'Print Receipt'}</h2><p className="mt-1 text-xs text-slate-500">{selected ? `${selected.receiptNumber} · ${selected.session}` : history ? 'All school fee, application fee and acceptance fee transactions.' : 'Select a successful school fee payment to preview and print its receipt.'}</p></div><button type="button" onClick={onClose} aria-label="Close receipts" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {selected ? <iframe ref={previewRef} onLoad={() => setReady(true)} title="Payment receipt preview" srcDoc={html} className="min-h-0 w-full flex-1 border-0 bg-slate-50" /> : <div className="min-h-0 flex-1 overflow-y-auto p-5">
      {fetching ? <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-navy"><LoaderCircle className="h-5 w-5 animate-spin" />Loading payments…</p> : error ? <div className="space-y-4 text-center"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" className={primary} onClick={() => { setFetching(true); setError(''); setAttempt((value) => value + 1) }}>Retry</button></div> : <>
        {/* {source === 'demo' && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Demo payment records. Backend payments are not connected yet.</p>} */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><label htmlFor="receipt-session" className="text-xs font-semibold">Session</label><select id="receipt-session" value={session} onChange={(event) => setSession(event.target.value)} className="mt-2 block rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="all">All Sessions</option>{[...new Set(records.map((record) => record.session))].sort().reverse().map((value) => <option key={value}>{value}</option>)}</select></div><p className="text-xs text-slate-500">{visible.length} transactions · {formatNaira(visible.filter((record) => record.status === 'successful').reduce((sum, record) => sum + record.amount, 0))}</p></div>
        {history && <div className="mb-4 flex flex-wrap gap-4"><label className="text-xs font-semibold">Fee Type<select value={feeType} onChange={(event) => setFeeType(event.target.value)} className="mt-2 block rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="all">All Fees</option><option value="school-fees">School Fees</option><option value="application-fee">Application Fee</option><option value="acceptance-fee">Acceptance Fee</option><option value="other">Other</option></select></label><label className="text-xs font-semibold">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 block rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="all">All Statuses</option><option value="successful">Successful</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label><p className="self-end py-2 text-xs text-slate-500">Total includes successful payments only.</p></div>}{visible.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-navy text-white"><tr>{['AppNo', 'Amount Paid', 'Session', 'InvoiceNo', 'TellerNo', 'Cashier', 'Mode of Payment', 'Date/time Paid', ...(history ? ['Fee Type', 'Payment Reference', 'Status'] : []), 'Receipt'].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y">{visible.map((record) => <tr key={record.id} className="hover:bg-slate-50">
          <td className="px-4 py-4">{record.applicationNumber || 'Not provided'}</td>
          <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums">{formatNaira(record.amount)}</td>
          <td className="px-4 py-4">{record.session}</td>
          <td className="px-4 py-4">{record.invoiceNumber}</td>
          <td className="px-4 py-4">{record.tellerNumber || '—'}</td>
          <td className="px-4 py-4">{record.cashier || '—'}</td>
          <td className="px-4 py-4">{record.paymentMode || 'Not provided'}</td>
          <td className="whitespace-nowrap px-4 py-4">{date(record.paidAt)}</td>
          <>{history && <><td className="whitespace-nowrap px-4 py-4">{record.feeType.replaceAll('-', ' ')}</td><td className="px-4 py-4">{record.reference}</td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 font-semibold ${record.status === 'successful' ? 'bg-emerald-50 text-emerald-700' : record.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{record.status}</span></td></>}<td className="px-4 py-4">{record.status === 'successful' && record.receiptNumber && record.paidAt ? <button type="button" className={`${secondary} whitespace-nowrap`} onClick={() => { setReady(false); setSelected(record) }}><Printer className="h-4 w-4" />Print Receipt</button> : <span className="text-slate-500">{record.status === 'successful' ? 'Receipt awaiting issuance' : '—'}</span>}</td></>
        </tr>)}</tbody></table></div> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">{history ? 'No payments match these filters.' : 'No successful school fee payments found for this session.'}</p>}
      </>}
    </div>}
    <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t p-4">{selected ? <><button type="button" disabled={!!action} className={`${secondary} mr-auto`} onClick={() => { setSelected(null); setReady(false) }}><ArrowLeft className="h-4 w-4" />Back to Payments</button><button type="button" disabled={!!action} aria-busy={action === 'download'} className={secondary} onClick={() => void run('download')}>{action === 'download' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{action === 'download' ? 'Preparing…' : 'Download Receipt'}</button><button type="button" disabled={!!action || !ready} aria-busy={action === 'print'} className={primary} onClick={() => void run('print')}>{action === 'print' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}{action === 'print' ? 'Preparing…' : 'Print / Save PDF'}</button></> : <button type="button" onClick={onClose} className={primary}>Close</button>}</div>
  </dialog>, document.body)
}
