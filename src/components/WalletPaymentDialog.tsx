import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, CircleCheck, LoaderCircle, Search, Wallet, X } from 'lucide-react'
import { STUDENT, formatNaira } from '../data/portal'
import { lookupWalletInvoice, payWalletInvoice, WALLET_PAYMENT_TYPES, type WalletPaymentType, type WalletInvoice } from '../data/wallet'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
export default function WalletPaymentDialog({ onClose, onDeposit }: { onClose: () => void; onDeposit: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const requestId = useRef('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [paymentType, setPaymentType] = useState<WalletPaymentType>('school-fees')
  const paymentLabel = WALLET_PAYMENT_TYPES.find((item) => item.value === paymentType)!.label
  const [invoice, setInvoice] = useState<WalletInvoice | null>(null)
  const [action, setAction] = useState<'lookup' | 'pay' | null>(null)
  const [reference, setReference] = useState('')
  const { toast, showToast, dismissToast } = useFlashToast()
  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { controllerRef.current?.abort(); dialog.close(); document.body.style.overflow = overflow }
  }, [])
  async function run(next: 'lookup' | 'pay') {
    if (busy.current) return
    const number = invoiceNumber.trim()
    if (!number) { showToast('error', 'Enter an invoice number.'); return }
    if (next === 'pay' && (!invoice || invoice.status === 'paid' || invoice.amountDue <= 0 || invoice.walletBalance < invoice.amountDue)) return
    busy.current = true; setAction(next)
    const controller = new AbortController(); controllerRef.current = controller
    try {
      if (next === 'lookup') {
        const record = await lookupWalletInvoice(number, paymentType, controller.signal)
        if (!controller.signal.aborted) { setInvoice(record); requestId.current = crypto.randomUUID() }
      } else {
        const result = await payWalletInvoice(invoice!.invoiceNumber, paymentType, requestId.current, controller.signal)
        if (!controller.signal.aborted) { setReference(result); showToast('success', `${paymentLabel} payment confirmed.`) }
      }
    } catch (error) { if (!controller.signal.aborted) showToast('error', error instanceof Error ? error.message : 'Unable to complete this request. Please try again.') }
    finally { busy.current = false; if (!controller.signal.aborted) setAction(null) }
  }
  const insufficient = invoice && invoice.walletBalance < invoice.amountDue
  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="wallet-payment-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between border-b p-5"><div><h2 id="wallet-payment-title" className="text-lg font-bold">Make Payment</h2><p className="mt-1 text-xs text-slate-500">Use wallet funds to pay your selected fee.</p></div><button type="button" onClick={onClose} aria-label="Close wallet payment" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {reference ? <div className="space-y-4 p-5 text-center"><CircleCheck className="mx-auto h-12 w-12 text-emerald-600" /><h3 className="font-bold">Payment Successful</h3><p className="text-sm">Invoice {invoice?.invoiceNumber}</p><p className="break-all text-xs text-slate-500">Payment Reference: {reference}</p><button type="button" onClick={onClose} className={primary}>Done</button></div> : <form onSubmit={(event) => { event.preventDefault(); if (!invoice) void run('lookup') }}>
      <div className="space-y-5 p-5"><div className="flex items-center gap-3 rounded-xl bg-navy/5 p-4"><Wallet className="h-6 w-6 shrink-0 text-navy" /><div><p className="text-sm font-semibold text-navy">{STUDENT.name}</p><p className="mt-1 text-xs text-slate-500">{STUDENT.applicationNumber}</p></div></div>{invoice ? <><h3 className="font-semibold text-navy">Review Payment</h3><dl className="space-y-3 rounded-xl border p-4 text-sm">{[['Invoice No', invoice.invoiceNumber], ['Payment Type', paymentLabel], ['Session', invoice.session], ['Amount Due', formatNaira(invoice.amountDue)], ['Wallet Balance', formatNaira(invoice.walletBalance)]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="break-all text-right font-semibold text-navy">{value}</dd></div>)}</dl>{invoice.status === 'paid' || invoice.amountDue === 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">This invoice has no outstanding payment.</p> : insufficient ? <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Insufficient wallet balance. Deposit funds to complete this payment.</p> : <p className="text-xs text-slate-600">Confirm to deduct {formatNaira(invoice.amountDue)} from your wallet for {paymentLabel.toLowerCase()}.</p>}</> : <><div><label htmlFor="wallet-invoice-number" className="text-xs font-semibold">Invoice No</label><input id="wallet-invoice-number" type="text" required maxLength={100} value={invoiceNumber} disabled={!!action} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Enter Invoice Number" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-navy" /></div><div><label htmlFor="wallet-payment-type" className="text-xs font-semibold">Payment Type</label><select id="wallet-payment-type" value={paymentType} disabled={!!action} onChange={(event) => setPaymentType(event.target.value as WalletPaymentType)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">{WALLET_PAYMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      </>}</div>
      <div className="flex flex-wrap justify-end gap-3 border-t p-4">{invoice ? <><button key="edit-invoice" type="button" disabled={!!action} onClick={(event) => { event.preventDefault(); setInvoice(null) }} className="mr-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold disabled:opacity-50"><ArrowLeft className="h-4 w-4" />Change Invoice</button>{insufficient && invoice.status !== 'paid' ? <button type="button" className={primary} onClick={onDeposit}>Deposit Funds</button> : <button type="button" disabled={!!action || invoice.status === 'paid' || invoice.amountDue <= 0} aria-busy={action === 'pay'} className={primary} onClick={() => void run('pay')}>{action === 'pay' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}{action === 'pay' ? 'Paying…' : 'Confirm Payment'}</button>}</> : <button key="lookup-invoice" type="submit" disabled={!!action || !import.meta.env.VITE_WALLET_PAYMENT_URL} aria-busy={action === 'lookup'} className={primary}>{action === 'lookup' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{action === 'lookup' ? 'Checking…' : 'Review Invoice'}</button>}</div>
    </form>}
  </dialog>, document.body)
}
