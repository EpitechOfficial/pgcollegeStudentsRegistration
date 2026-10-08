import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Download, LoaderCircle, Printer, X } from 'lucide-react'
import { CURRENT_SESSION, SCHOOL_FEE_ITEMS, STUDENT } from '../data/portal'
import { buildFeeDocument, type FeeDocument } from '../data/feeDocument'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

// Demo verification only. Replace with server verification against staff records.
const DEMO_PF_NUMBER = 'PF12345'
const INVOICE_KEY = `pgc.school-fees.v2.${STUDENT.applicationNumber}.${CURRENT_SESSION}`
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-navy disabled:active:scale-100'
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-semibold text-navy transition-all hover:border-navy/30 hover:bg-navy/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

type Invoice = Omit<FeeDocument, 'kind'>

function getInvoice(): Invoice {
  const saved = localStorage.getItem(INVOICE_KEY)
  if (saved) {
    try {
      const invoice: Invoice = JSON.parse(saved)
      if (typeof invoice.reference === 'string' && typeof invoice.createdAt === 'string' &&
          Number.isFinite(Date.parse(invoice.createdAt)) && invoice.session === CURRENT_SESSION &&
          JSON.stringify(invoice.items) === JSON.stringify(SCHOOL_FEE_ITEMS)) return invoice
    } catch { /* Replace an invalid stored demo invoice. */ }
  }
  const invoice = {
    reference: `623${Math.floor(Math.random() * 900000 + 100000)}`,
    createdAt: new Date().toISOString(),
    session: CURRENT_SESSION,
    items: SCHOOL_FEE_ITEMS.map((item) => ({ ...item })),
  }
  localStorage.setItem(INVOICE_KEY, JSON.stringify(invoice))
  return invoice
}

export default function SchoolFeesDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const [status, setStatus] = useState<'student' | 'staff'>('student')
  const [step, setStep] = useState<'status' | 'staff' | 'invoice'>('status')
  const [pfNumber, setPfNumber] = useState('')
  const [error, setError] = useState('')
  const { toast, showToast, dismissToast } = useFlashToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState<'generate' | 'verify' | 'download' | 'print' | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  const busyRef = useRef(false)
  const mountedRef = useRef(false)
  const invoiceHtml = useMemo(() => invoice ? buildFeeDocument({ ...invoice, kind: 'invoice' }) : '', [invoice])
  const spinner = <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />

  useEffect(() => {
    if (error) showToast('error', error)
  }, [error, showToast])

  useEffect(() => {
    mountedRef.current = true
    const dialog = dialogRef.current!
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      mountedRef.current = false
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  async function runAction(action: NonNullable<typeof loading>, work: () => void, message: string) {
    if (busyRef.current) return
    busyRef.current = true
    setLoading(action)
    setError('')
    try {
      // Simulate the demo API round-trip; yield for local actions so feedback can paint.
      await new Promise((resolve) => setTimeout(resolve, action === 'generate' || action === 'verify' ? 600 : 40))
      if (!mountedRef.current) return
      work()
    } catch {
      if (mountedRef.current) setError(message)
    } finally {
      busyRef.current = false
      if (mountedRef.current) setLoading(null)
    }
  }

  function generateInvoice() {
    try {
      setInvoice(getInvoice())
      setPreviewReady(false)
      setError('')
      setStep('invoice')
      showToast('success', status === 'staff' ? 'Demo PF verification passed. Your invoice is ready.' : 'Your invoice is ready.')
    } catch {
      setError('Unable to save your invoice. Enable browser storage and try again.')
    }
  }

  function downloadInvoice() {
    if (!invoice) return
    const content = buildFeeDocument({ ...invoice, kind: 'invoice' })
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoice.reference}.html`
    link.click()
    showToast('success', 'Invoice download started.')
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose}
      aria-labelledby="school-fees-title"
      className={`school-fees-dialog ${step === 'invoice' ? 'school-fees-dialog--invoice' : ''} fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-2rem)] ${step === 'invoice' ? 'overflow-hidden' : 'max-w-lg overflow-y-auto'} rounded-2xl bg-white p-0 text-[#212529] shadow-2xl backdrop:bg-[#071D36]/60`}>
      <FlashToast toast={toast} onDismiss={dismissToast} />
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-5">
        <h2 id="school-fees-title" className="text-lg font-bold">{step === 'invoice' ? 'School fee invoice' : 'Pay School Fees'}</h2>
        <button type="button" onClick={onClose} aria-label="Close school fee dialog" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <div className={`flex flex-col ${step === 'invoice' ? 'min-h-0 flex-1' : 'gap-5 p-5'}`}>
        {/* {step !== 'invoice' && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Demo preview. Staff verification and online payment are not connected yet.</p>} */}
        {step === 'status' && (
          <form onSubmit={(event) => { event.preventDefault(); if (busyRef.current) return; setError(''); if (status === 'staff') setStep('staff'); else void runAction('generate', generateInvoice, 'Unable to generate your invoice. Please try again.') }} className="flex flex-col gap-5">
            <fieldset disabled={!!loading}>
              <legend className="mb-3 text-sm font-semibold">Are you also a staff member?</legend>
              <div className="flex flex-col gap-3">
              {(['student', 'staff'] as const).map((choice) => (
                <label key={choice} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${status === choice ? 'border-[#0A2B4F] bg-slate-50' : 'border-slate-200'}`}>
                  <input type="radio" name="fee-status" value={choice} checked={status === choice} onChange={() => setStatus(choice)} className="h-4 w-4 shrink-0 accent-[#0A2B4F]" />
                  {choice === 'student' ? 'No, I am a student' : 'Yes, I am a staff member'}
                </label>
              ))}
              </div>
            </fieldset>
            <button className={buttonClass} type="submit" disabled={!!loading} aria-busy={loading === 'generate'}>{loading === 'generate' && spinner}{loading === 'generate' ? 'Generating Invoice…' : 'Continue'}</button>
          </form>
        )}
        {step === 'staff' && (
          <form className="flex flex-col gap-4" onSubmit={(event) => {
            event.preventDefault()
            void runAction('verify', () => {
            if (pfNumber.trim().toUpperCase() !== DEMO_PF_NUMBER) {
              setError('PF number not found in the demo staff records. Check the number and try again.')
              return
            }
            generateInvoice()
            }, 'Unable to verify your PF number. Please try again.')
          }}>
            <div>
              <label htmlFor="staff-pf" className="text-sm font-semibold">Staff PF Number</label>
              <input id="staff-pf" autoFocus required disabled={!!loading} value={pfNumber} onChange={(event) => { setPfNumber(event.target.value); setError('') }}
                aria-invalid={!!error} aria-describedby={`pf-help${error ? ' school-fees-error' : ''}`}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <p id="pf-help" className="mt-2 text-xs text-slate-500">Use PF12345 to try the demo staff flow. Staff fees remain unchanged in this preview.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" disabled={!!loading} className={secondaryButtonClass} onClick={() => { setStep('status'); setError('') }}>Back</button>
              <button type="submit" disabled={!!loading} aria-busy={loading === 'verify'} className={buttonClass}>{loading === 'verify' && spinner}{loading === 'verify' ? 'Verifying…' : 'Verify and Continue'}</button>
            </div>
          </form>
        )}
        {step === 'invoice' && invoice && (
          <div className="school-fees-invoice-layout">
            <div className="school-fees-invoice-preview bg-slate-50 px-3 sm:px-5">
              <iframe ref={previewRef} onLoad={() => setPreviewReady(true)} title="School fee invoice preview" srcDoc={invoiceHtml} className="school-fees-invoice-frame w-full border-x border-slate-200 bg-white" />
            </div>
            <div className="school-fees-invoice-footer flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              {/* <p className="max-w-xs text-xs text-slate-500">Demo invoice. Online payment is not connected yet.</p> */}
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button type="button" disabled={!!loading} aria-busy={loading === 'download'} onClick={() => void runAction('download', downloadInvoice, 'Unable to prepare the download. Please try again.')} aria-label={loading === 'download' ? 'Preparing invoice download' : 'Download invoice as HTML'} title="Download invoice as HTML" className={secondaryButtonClass}>{loading === 'download' ? spinner : <Download className="h-4 w-4" />}</button>
                <button type="button" disabled={!!loading || !previewReady} aria-busy={loading === 'print'} onClick={() => void runAction('print', () => {
                  const preview = previewRef.current?.contentWindow
                  if (!preview) throw new Error('Invoice preview unavailable')
                  preview.focus()
                  preview.print()
                }, 'Unable to open printing. Please try again.')} className={secondaryButtonClass}>{loading === 'print' ? spinner : <Printer className="h-4 w-4" />}{loading === 'print' ? 'Preparing Print…' : !previewReady ? 'Loading Invoice…' : 'Print Invoice'}</button>
                <button type="button" disabled className={buttonClass}>Proceed to Payment<ArrowRight className="h-4 w-4 text-gold" /></button>
              </div>
            </div>
          </div>
        )}
        {error && <p id="school-fees-error" role="alert" className="text-sm text-red-700">{error}</p>}
        <span role="status" aria-live="polite" className="sr-only">{loading === 'generate' ? 'Generating invoice' : loading === 'verify' ? 'Verifying staff PF number' : loading === 'download' ? 'Preparing invoice download' : loading === 'print' ? 'Preparing invoice for printing' : ''}</span>
      </div>
    </dialog>,
    document.body,
  )
}
