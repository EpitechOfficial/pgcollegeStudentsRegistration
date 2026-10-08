import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Download, LoaderCircle, Printer, X } from 'lucide-react'
import { buildFinancialClearanceDocument, clearanceTotals, loadFinancialClearance, type FinancialClearance } from '../data/financialClearance'
import { CURRENT_SESSION, formatNaira } from '../data/portal'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-navy/10 disabled:opacity-50'

export default function FinancialClearanceDialog({ onClose, onPayOutstanding }: { onClose: () => void; onPayOutstanding: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const mounted = useRef(false)
  const busy = useRef(false)
  const [records, setRecords] = useState<FinancialClearance[]>([])
  const [source, setSource] = useState<'demo' | 'backend'>('demo')
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<FinancialClearance | null>(null)
  const [ready, setReady] = useState(false)
  const [action, setAction] = useState<'print' | 'download' | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  const html = useMemo(() => selected ? buildFinancialClearanceDocument(selected, source === 'demo') : '', [selected, source])
  const printable = !!selected && clearanceTotals(selected).balance === 0

  useEffect(() => {
    mounted.current = true
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { mounted.current = false; dialog.close(); document.body.style.overflow = overflow }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadFinancialClearance(controller.signal).then((result) => {
      if (!controller.signal.aborted) { setRecords(result.records); setSource(result.source) }
    }).catch(() => {
      if (!controller.signal.aborted) { setError('Unable to load financial clearance. Please try again.'); showToast('error', 'Unable to load financial clearance.') }
    }).finally(() => { if (!controller.signal.aborted) setFetching(false) })
    return () => controller.abort()
  }, [attempt, showToast])

  async function run(next: 'print' | 'download') {
    if (busy.current || !printable || !selected) return
    busy.current = true; setAction(next)
    try {
      await new Promise((resolve) => setTimeout(resolve, 40))
      if (!mounted.current) return
      if (next === 'print') { const frame = previewRef.current?.contentWindow; if (!frame) throw new Error('Preview unavailable'); frame.focus(); frame.print() }
      else {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url; link.download = `financial-clearance-${selected.session.replace(/[^a-zA-Z0-9_-]/g, '-')}.html`; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        showToast('success', 'Financial clearance download started.')
      }
    } catch { if (mounted.current) showToast('error', 'Unable to prepare financial clearance. Please try again.') }
    finally { busy.current = false; if (mounted.current) setAction(null) }
  }

  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="financial-clearance-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex shrink-0 items-center justify-between gap-3 border-b p-5"><div><h2 id="financial-clearance-title" className="text-lg font-bold">Financial Clearance</h2><p className="mt-1 text-xs text-slate-500">{selected ? `${selected.session} · ${printable ? 'Cleared' : 'Form preview'}` : 'Check your session balance and clearance status.'}</p></div><button type="button" onClick={onClose} aria-label="Close financial clearance" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {selected ? <iframe ref={previewRef} onLoad={() => setReady(true)} title="Financial clearance form preview" srcDoc={html} className="min-h-0 w-full flex-1 border-0 bg-slate-50" /> : <div className="min-h-0 flex-1 overflow-y-auto p-5">
      {fetching ? <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-navy"><LoaderCircle className="h-5 w-5 animate-spin" />Loading clearance records…</p> : error ? <div className="space-y-4 text-center"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" className={primary} onClick={() => { setFetching(true); setError(''); setAttempt((value) => value + 1) }}>Retry</button></div> : <>
        {/* {source === 'demo' && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Demo session data. Backend financial clearance is not connected yet.</p>} */}
        {records.length ? <div className="space-y-4">{records.map((record) => {
          const totals = clearanceTotals(record)
          const status = totals.balance > 0 ? 'Outstanding Balance' : 'Fully Paid'
          return <article key={record.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-navy">{record.session} Session</h3><p className="mt-1 text-xs text-slate-500">Application No: <span className="font-semibold text-navy">{record.student.applicationNumber || 'Not provided'}</span></p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === 'Fully Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{status}</span></div><dl className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-3">{[['Total Fees', totals.total], ['Confirmed Payments', totals.paid], ['Outstanding Balance', totals.balance]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-lg font-bold tabular-nums text-navy">{formatNaira(Number(value))}</dd></div>)}</dl><div className="flex flex-wrap items-center justify-end gap-3">{totals.balance > 0 && record.session === CURRENT_SESSION && <button type="button" className={primary} onClick={onPayOutstanding}>Pay Outstanding Fees</button>}<button type="button" className={secondary} onClick={() => { setReady(false); setSelected(record) }}>{totals.balance === 0 ? 'View Financial Clearance' : 'Preview Form'}</button></div></article>
        })}</div> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">No financial clearance records found.</p>}
      </>}
    </div>}
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t p-4">{selected ? <><button type="button" disabled={!!action} className={`${secondary} mr-auto`} onClick={() => { setSelected(null); setReady(false) }}><ArrowLeft className="h-4 w-4" />Back to Sessions</button>{!printable && <p className="text-xs text-slate-500">Print/download available when the outstanding balance is zero.</p>}<button type="button" disabled={!!action || !printable} aria-busy={action === 'download'} className={secondary} onClick={() => void run('download')}>{action === 'download' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{action === 'download' ? 'Preparing…' : 'Download Form'}</button><button type="button" disabled={!!action || !printable || !ready} aria-busy={action === 'print'} className={primary} onClick={() => void run('print')}>{action === 'print' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}{action === 'print' ? 'Preparing…' : 'Print / Save PDF'}</button></> : <button type="button" onClick={onClose} className={primary}>Close</button>}</div>
  </dialog>, document.body)
}
