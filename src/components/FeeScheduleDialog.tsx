import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, Printer, Receipt, X } from 'lucide-react'
import { COLLEGE, SCHOOL_FEE_SCHEDULE, formatNaira } from '../data/portal'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

export default function FeeScheduleDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const printingRef = useRef(false)
  const [printing, setPrinting] = useState(false)
  const [printDocument, setPrintDocument] = useState<{ id: number; html: string } | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  const schedule = SCHOOL_FEE_SCHEDULE
  const brandUrl = new URL(`${import.meta.env.BASE_URL}brand/`, window.location.origin)
  const total = schedule.items.reduce((sum, item) => sum + item.amount, 0)
  const details = [
    ['Faculty', schedule.faculty], ['Department', schedule.department],
    ['Mode of Study', schedule.modeOfStudy], ['Degree', schedule.degree],
    ['Type', schedule.studentType], ['Session', schedule.session],
  ]

  useEffect(() => {
    const dialog = dialogRef.current!
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = previousOverflow }
  }, [])

  function preparePrint() {
    if (printingRef.current || !contentRef.current) return
    printingRef.current = true
    setPrinting(true)
    setPrintDocument({ id: Date.now(), html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Schedule of Fees</title><style>
      *{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}
      @page{size:A4;margin:12mm}body{margin:0;color:#212529;font:12px/1.4 Arial,sans-serif}
      h1{color:#0A2B4F;font-size:20px;margin:0 0 16px}dl{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#f2f6fa;border:1px solid #e5e7eb;padding:14px;margin:0 0 16px}
      .schedule-letterhead{display:grid;grid-template-columns:70px minmax(0,1fr) 70px;gap:16px;align-items:center;text-align:center;border-bottom:2px solid #0A2B4F;padding-bottom:16px;margin-bottom:18px;break-inside:avoid}.schedule-letterhead img{width:70px;height:70px;object-fit:contain}.schedule-letterhead h3{font-size:18px;color:#0A2B4F;margin:0}.schedule-letterhead p{margin:4px 0;color:#0A2B4F;font-size:13px}.schedule-letterhead h4{font-size:14px;margin:10px 0 0;color:#0A2B4F}
      dt{color:#64748b;font-size:10px;text-transform:uppercase}dd{margin:4px 0 0;font-weight:bold}table{border-collapse:collapse;width:100%}caption{margin-bottom:8px;text-align:left;color:#64748b}th,td{padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:left}td,thead th:last-child{text-align:right;white-space:nowrap}tbody th{font-weight:normal}thead{display:table-header-group;background:#0A2B4F;color:white}tfoot{display:table-row-group;background:#f2f6fa;color:#0A2B4F;font-weight:bold}tr{break-inside:avoid}p{margin-top:14px;font-size:11px;color:#64748b}
      </style></head><body>${contentRef.current.innerHTML}</body></html>` })
  }

  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="fee-schedule-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
      <FlashToast toast={toast} onDismiss={dismissToast} />
      {printDocument && <iframe key={printDocument.id} title="Printable fee schedule" aria-hidden="true" tabIndex={-1} srcDoc={printDocument.html} className="pointer-events-none fixed -left-[10000px] top-0 h-px w-[794px] border-0" onLoad={(event) => {
        if (!printingRef.current) return
        try {
          const frame = event.currentTarget.contentWindow
          if (!frame) throw new Error('Print document unavailable')
          frame.focus()
          frame.print()
        } catch { showToast('error', 'Unable to open printing. Please try again.') }
        finally { printingRef.current = false; setPrinting(false) }
      }} />}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5 text-navy"><Receipt className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 id="fee-schedule-title" className="text-lg font-bold">Schedule of Fees</h2><p className="mt-1 text-xs text-slate-500">School fee breakdown for your programme.</p></div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close schedule of fees" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <header className="schedule-letterhead mb-5 grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-3 border-b-2 border-navy pb-4 text-center sm:grid-cols-[70px_minmax(0,1fr)_70px] sm:gap-4">
          <img src={new URL('pgc-logo.png', brandUrl).href} alt="Postgraduate College logo" className="h-12 w-12 object-contain sm:h-[70px] sm:w-[70px]" />
          <div><h3 className="text-sm font-bold text-navy sm:text-lg">{COLLEGE.shortName}</h3><p className="mt-1 text-xs font-semibold text-navy sm:text-sm">{COLLEGE.university}</p><h4 className="mt-3 text-xs font-bold uppercase tracking-wide text-navy sm:text-sm">Schedule of Fees</h4></div>
          <img src={new URL('ui-logo.png', brandUrl).href} alt="University of Ibadan logo" className="h-12 w-12 object-contain sm:h-[70px] sm:w-[70px]" />
        </header>
        <dl className="mb-5 grid grid-cols-2 gap-4 rounded-xl border border-navy/10 bg-navy/5 p-4 sm:grid-cols-3">
          {details.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-2xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-navy">{value}</dd></div>)}
        </dl>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <caption className="sr-only">School fees for {schedule.department}, {schedule.degree}, {schedule.session}</caption>
            <thead className="bg-navy text-white"><tr><th scope="col" className="px-4 py-3 text-left font-semibold">Fee</th><th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold">Amount (₦)</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.items.map((item, index) => <tr key={item.description} className={`${index % 2 ? 'bg-slate-50/70' : 'bg-white'} transition-colors hover:bg-navy/5`}><th scope="row" className="px-4 py-3 text-left text-xs font-medium leading-relaxed text-slate-700">{item.description}</th><td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums text-ink">{item.amount.toLocaleString('en-NG')}</td></tr>)}
            </tbody>
            <tfoot className="border-t border-navy/10 bg-navy/5 text-navy"><tr><th scope="row" className="px-4 py-4 text-left font-bold">TOTAL</th><td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums">{total.toLocaleString('en-NG')}</td></tr></tfoot>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">This schedule lists the full session charges. Check your payment record for payments already made. Currently shown from demo portal data.</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 sm:px-5">
        <div><p className="text-2xs text-slate-500">Total session fees</p><p className="text-lg font-bold tabular-nums text-navy">{formatNaira(total)}</p></div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={preparePrint} disabled={printing} aria-busy={printing} className="inline-flex items-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/10 disabled:cursor-not-allowed disabled:opacity-50">{printing ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Printer aria-hidden="true" className="h-4 w-4" />}{printing ? 'Preparing…' : 'Print / Save PDF'}</button>
          <button type="button" onClick={onClose} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-700 active:scale-95">Close</button>
        </div>
      </div>
    </dialog>, document.body,
  )
}
