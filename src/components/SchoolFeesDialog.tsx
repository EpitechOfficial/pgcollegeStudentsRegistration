import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, LoaderCircle, Printer, X } from 'lucide-react'
import { currentSession, currentStudent, SCHOOL_FEE_ITEMS } from '../data/portal'
import { buildFeeDocument, type FeeDocument } from '../data/feeDocument'
import { buildStaffFeeForm, verifyDemoStaffFees, verifyStaffFees, type StaffFeeReview } from '../data/staffFees'
import { generateSchoolFeeInvoice } from '../data/schoolFeeInvoice'
import { isDemoSession } from '../data/auth'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

// Demo verification only. Replace with server verification against staff records.
const invoiceKey = () => `pgc.school-fees.v2.${currentStudent().applicationNumber}.${currentSession()}`
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-navy disabled:active:scale-100'
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 px-4 py-2.5 text-sm font-semibold text-navy transition-all hover:border-navy/30 hover:bg-navy/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

type Invoice = Omit<FeeDocument, 'kind'>

function getInvoice(): Invoice {
  const session = currentSession()
  const saved = localStorage.getItem(invoiceKey())
  if (saved) {
    try {
      const invoice: Invoice = JSON.parse(saved)
      if (typeof invoice.reference === 'string' && typeof invoice.createdAt === 'string' &&
          Number.isFinite(Date.parse(invoice.createdAt)) && invoice.session === session &&
          JSON.stringify(invoice.items) === JSON.stringify(SCHOOL_FEE_ITEMS)) return invoice
    } catch { /* Replace an invalid stored demo invoice. */ }
  }
  const invoice = {
    reference: `623${Math.floor(Math.random() * 900000 + 100000)}`,
    createdAt: new Date().toISOString(),
    session,
    items: SCHOOL_FEE_ITEMS.map((item) => ({ ...item })),
  }
  localStorage.setItem(invoiceKey(), JSON.stringify(invoice))
  return invoice
}

export default function SchoolFeesDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const [status, setStatus] = useState<'student' | 'staff'>('student')
  const [step, setStep] = useState<'status' | 'staff' | 'staff-form' | 'invoice'>('status')
  const [staffReview, setStaffReview] = useState<StaffFeeReview | null>(null)
  const [pfNumber, setPfNumber] = useState('')
  const [error, setError] = useState('')
  const { toast, showToast, dismissToast } = useFlashToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState<'generate' | 'verify' | 'download' | 'print' | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  const busyRef = useRef(false)
  const actionController = useRef<AbortController | null>(null)
  const mountedRef = useRef(false)
  const invoiceHtml = useMemo(() => invoice ? buildFeeDocument({ ...invoice, kind: 'invoice' }) : '', [invoice])
  const staffFormHtml = useMemo(() => staffReview ? buildStaffFeeForm(staffReview) : '', [staffReview])
  const showingDocument = step === 'invoice' || step === 'staff-form'
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
      actionController.current?.abort()
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  async function runAction(action: NonNullable<typeof loading>, work: () => void | Promise<void>, message: string) {
    if (busyRef.current) return
    busyRef.current = true
    setLoading(action)
    setError('')
    try {
      // Simulate the demo API round-trip; yield for local actions so feedback can paint.
      await new Promise((resolve) => setTimeout(resolve, action === 'generate' || action === 'verify' ? 600 : 40))
      if (!mountedRef.current) return
      await work()
    } catch (failure) {
      if (mountedRef.current) setError(failure instanceof Error ? failure.message : message)
    } finally {
      busyRef.current = false
      if (mountedRef.current) setLoading(null)
    }
  }

  async function generateInvoice() {
    if (status === 'staff' && staffReview?.approval_status !== 'approved') {
      setError('Management approval is required before your invoice is available.')
      return
    }
    if (isDemoSession()) {
      try {
        setInvoice(getInvoice())
      } catch {
        throw new Error('Unable to save your invoice. Enable browser storage and try again.')
      }
    } else {
      const controller = new AbortController()
      actionController.current = controller
      setInvoice(await generateSchoolFeeInvoice(controller.signal, status === 'staff' ? staffReview?.staff.pf_number : undefined))
    }
    setPreviewReady(false)
    setError('')
    setStep('invoice')
    showToast('success', 'Your invoice is ready.')
  }

  function proceedToPayment() {
    if (!invoice?.paymentUrl) {
      showToast('error', 'A payment link was not returned for this invoice.')
      return
    }
    window.location.assign(invoice.paymentUrl)
  }

  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose}
      aria-labelledby="school-fees-title"
      className={`school-fees-dialog ${showingDocument ? 'school-fees-dialog--invoice' : ''} fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-2rem)] ${showingDocument ? 'overflow-hidden' : 'max-w-lg overflow-y-auto'} rounded-2xl bg-white p-0 text-[#212529] shadow-2xl backdrop:bg-[#071D36]/60`}>
      <FlashToast toast={toast} onDismiss={dismissToast} />
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-5">
        <h2 id="school-fees-title" className="text-lg font-bold">{step === 'staff-form' ? 'Staff Fee Approval' : step === 'invoice' ? 'School fee invoice' : 'Pay School Fees'}</h2>
        <button type="button" onClick={onClose} aria-label="Close school fee dialog" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <div className={`flex flex-col ${showingDocument ? 'min-h-0 flex-1' : 'gap-5 p-5'}`}>
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
            void runAction('verify', async () => {
              try {
                const controller = new AbortController()
                actionController.current = controller
                const review = isDemoSession() ? verifyDemoStaffFees(pfNumber) : await verifyStaffFees(pfNumber, controller.signal)
                setStaffReview(review)
                setInvoice(null)
                setPreviewReady(false)
                setStep('staff-form')
                showToast('success', review.approval_status === 'approved' ? isDemoSession() ? 'Demo management approval confirmed.' : 'Staff record verified and rebate preview prepared.' : 'Staff details are ready to print for management submission.')
              } catch (error) { setError(error instanceof Error ? error.message : 'Unable to verify your PF number.') }            }, 'Unable to verify your PF number. Please try again.')
          }}>
            <div>
              <label htmlFor="staff-pf" className="text-sm font-semibold">Staff PF Number</label>
              <input id="staff-pf" autoFocus required disabled={!!loading} value={pfNumber} onChange={(event) => { setPfNumber(event.target.value); setError('') }}
                aria-invalid={!!error} aria-describedby={`pf-help${error ? ' school-fees-error' : ''}`}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <p id="pf-help" className="mt-2 text-xs text-slate-500">{isDemoSession() ? 'Use PF12345 to try the demo.' : 'Enter the PF number associated with your staff record.'}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" disabled={!!loading} className={secondaryButtonClass} onClick={() => { setStep('status'); setError('') }}>Back</button>
              <button type="submit" disabled={!!loading} aria-busy={loading === 'verify'} className={buttonClass}>{loading === 'verify' && spinner}{loading === 'verify' ? 'Verifying…' : 'Verify and Continue'}</button>
            </div>
          </form>
        )}
        {step === 'staff-form' && staffReview && (
          <div className="school-fees-invoice-layout">
            
            <div className="school-fees-invoice-preview bg-slate-50 px-3 sm:px-5">
              <iframe ref={previewRef} onLoad={() => setPreviewReady(true)} title="Staff fee approval form preview" srcDoc={staffFormHtml} className="school-fees-invoice-frame w-full border-x border-slate-200 bg-white" />
            </div>
            <div className="school-fees-invoice-footer flex flex-wrap items-center justify-end gap-2 border-t bg-white p-4">
              <button type="button" className={`${secondaryButtonClass} mr-auto`} disabled={!!loading} onClick={() => { setStep('staff'); setPreviewReady(false) }}>Back</button>
              <button type="button" className={secondaryButtonClass} disabled={!!loading || !previewReady} aria-busy={loading === 'print'} onClick={() => void runAction('print', () => { const frame = previewRef.current?.contentWindow; if (!frame) throw new Error('Preview unavailable'); frame.focus(); frame.print() }, 'Unable to print staff details. Please try again.')}>
                {loading === 'print' ? spinner : <Printer className="h-4 w-4" />}Print Staff Details
              </button>
              <button type="button" className={buttonClass} disabled={!!loading || staffReview.approval_status !== 'approved'} title={staffReview.approval_status === 'approved' ? 'Generate staff school fee invoice' : 'Management approval is required before invoice generation'} onClick={() => void runAction('generate', generateInvoice, 'Unable to generate your invoice. Please try again.')}>{loading === 'generate' && spinner}Generate Invoice<ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}        {step === 'invoice' && invoice && (
          <div className="school-fees-invoice-layout">
            <div className="school-fees-invoice-preview bg-slate-50 px-3 sm:px-5">
              <iframe ref={previewRef} onLoad={() => setPreviewReady(true)} title="School fee invoice preview" srcDoc={invoiceHtml} className="school-fees-invoice-frame w-full border-x border-slate-200 bg-white" />
            </div>
            <div className="school-fees-invoice-footer flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              {/* <p className="max-w-xs text-xs text-slate-500">Demo invoice. Online payment is not connected yet.</p> */}
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {/* <button type="button" disabled={!!loading} aria-busy={loading === 'download'} onClick={() => void runAction('download', downloadInvoice, 'Unable to prepare the download. Please try again.')} aria-label={loading === 'download' ? 'Preparing invoice download' : 'Download invoice as HTML'} title="Download invoice as HTML" className={secondaryButtonClass}>{loading === 'download' ? spinner : <Download className="h-4 w-4" />}</button> */}
                <button type="button" disabled={!!loading || !previewReady} aria-busy={loading === 'print'} onClick={() => void runAction('print', () => {
                  const preview = previewRef.current?.contentWindow
                  if (!preview) throw new Error('Invoice preview unavailable')
                  preview.focus()
                  preview.print()
                }, 'Unable to open printing. Please try again.')} className={secondaryButtonClass}>{loading === 'print' ? spinner : <Printer className="h-4 w-4" />}{loading === 'print' ? 'Preparing Print…' : !previewReady ? 'Loading Invoice…' : 'Print Invoice'}</button>
                <button type="button" disabled={!invoice.paymentUrl || !!loading} onClick={proceedToPayment} title={invoice.paymentUrl ? 'Continue to the payment provider' : 'Payment link is unavailable'} className={buttonClass}>Proceed to Payment<ArrowRight className="h-4 w-4 text-gold" /></button>
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
