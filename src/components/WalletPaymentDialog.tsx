import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, CircleCheck, LoaderCircle, Wallet, X } from 'lucide-react'
import { currentStudent, formatNaira } from '../data/portal'
import { loadWalletBalance, payWalletInvoice, WALLET_PAYMENT_TYPES, type WalletPaymentResult, type WalletPaymentType } from '../data/wallet'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'

export default function WalletPaymentDialog({ onClose, onDeposit }: { onClose: () => void; onDeposit: () => void }) {
  const student = currentStudent()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [paymentType, setPaymentType] = useState<WalletPaymentType>(WALLET_PAYMENT_TYPES[0].value)
  const [reviewing, setReviewing] = useState(false)
  const [paying, setPaying] = useState(false)
  const [result, setResult] = useState<WalletPaymentResult | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  const paymentLabel = WALLET_PAYMENT_TYPES.find(item => item.value === paymentType)?.label ?? paymentType

  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    const controller = new AbortController()
    void loadWalletBalance(controller.signal).then(data => { if (!controller.signal.aborted) setBalance(data.balance) }).catch(() => {})
    return () => { controller.abort(); controllerRef.current?.abort(); dialog.close(); document.body.style.overflow = overflow }
  }, [])

  function reviewPayment() {
    if (!invoiceNumber.trim()) { showToast('error', 'Enter an invoice number.'); return }
    setReviewing(true)
  }

  async function confirmPayment() {
    if (busy.current) return
    busy.current = true; setPaying(true)
    const controller = new AbortController(); controllerRef.current = controller
    try {
      const payment = await payWalletInvoice(invoiceNumber, paymentType, controller.signal)
      if (!controller.signal.aborted) { setResult(payment); setBalance(payment.balance); showToast('success', `${paymentLabel} payment confirmed.`) }
    } catch (error) {
      if (!controller.signal.aborted) showToast('error', error instanceof Error ? error.message : 'Unable to complete this payment.')
    } finally {
      busy.current = false
      if (!controller.signal.aborted) setPaying(false)
    }
  }

  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="wallet-payment-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between border-b p-5"><div><h2 id="wallet-payment-title" className="text-lg font-bold">Make Payment</h2><p className="mt-1 text-xs text-slate-500">Use your wallet balance to pay an invoice.</p></div><button type="button" onClick={onClose} aria-label="Close wallet payment" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {result ? <div className="space-y-4 p-5 text-center"><CircleCheck className="mx-auto h-12 w-12 text-emerald-600" /><h3 className="font-bold">Payment Successful</h3><dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Invoice No</dt><dd className="font-semibold">{result.invoiceNumber}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Amount Paid</dt><dd className="font-semibold">{formatNaira(result.amountPaid)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Wallet Balance</dt><dd className="font-semibold">{formatNaira(result.balance)}</dd></div></dl><p className="break-all text-xs text-slate-500">Payment Reference: {result.reference}</p><button type="button" onClick={onClose} className={primary}>Done</button></div> : <form onSubmit={(event) => { event.preventDefault(); reviewing ? void confirmPayment() : reviewPayment() }}>
      <div className="space-y-5 p-5"><div className="flex items-center gap-3 rounded-xl bg-navy/5 p-4"><Wallet className="h-6 w-6 shrink-0 text-navy" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{student.name}</p><p className="mt-1 text-xs text-slate-500">{student.applicationNumber}</p></div>{balance !== null && <div className="text-right"><p className="text-[10px] text-slate-500">Balance</p><p className="text-sm font-bold text-navy">{formatNaira(balance)}</p></div>}</div>
        {reviewing ? <><h3 className="font-semibold text-navy">Review Payment</h3><dl className="space-y-3 rounded-xl border p-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Invoice No</dt><dd className="break-all text-right font-semibold text-navy">{invoiceNumber.trim()}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Payment Type</dt><dd className="font-semibold text-navy">{paymentLabel}</dd></div></dl></> : <><div><label htmlFor="wallet-invoice-number" className="text-xs font-semibold">Invoice No</label><input id="wallet-invoice-number" type="text" required maxLength={100} value={invoiceNumber} onChange={event => setInvoiceNumber(event.target.value)} placeholder="Enter Invoice Number" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" /></div><div><label htmlFor="wallet-payment-type" className="text-xs font-semibold">Payment Type</label><select id="wallet-payment-type" value={paymentType} onChange={event => setPaymentType(Number(event.target.value) as WalletPaymentType)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">{WALLET_PAYMENT_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></>}
      </div>
      <div className="flex justify-end gap-3 border-t p-4">{reviewing && <button type="button" disabled={paying} onClick={() => setReviewing(false)} className="mr-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold disabled:opacity-50"><ArrowLeft className="h-4 w-4" />Edit</button>}{reviewing && balance === 0 && <button type="button" disabled={paying} onClick={onDeposit} className="rounded-xl border px-4 py-2.5 text-xs font-semibold text-navy">Deposit Funds</button>}<button type="submit" disabled={paying} aria-busy={paying} className={primary}>{paying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}{paying ? 'Paying…' : reviewing ? 'Confirm Payment' : 'Review Payment'}</button></div>
    </form>}
  </dialog>, document.body)
}
