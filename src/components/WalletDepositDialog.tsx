import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, LoaderCircle, Wallet, X } from 'lucide-react'
import { STUDENT, formatNaira } from '../data/portal'
import { depositAmount, startWalletDeposit } from '../data/wallet'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
export default function WalletDepositDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const requestId = useRef('')
  const [amountInput, setAmountInput] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [paying, setPaying] = useState(false)
  const amount = depositAmount(amountInput)
  const { toast, showToast, dismissToast } = useFlashToast()
  useEffect(() => {
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { controllerRef.current?.abort(); dialog.close(); document.body.style.overflow = overflow }
  }, [])
  async function pay() {
    if (busy.current || amount === null) return
    busy.current = true; setPaying(true)
    const controller = new AbortController(); controllerRef.current = controller
    try {
      const url = await startWalletDeposit(amount, requestId.current, controller.signal)
      if (!controller.signal.aborted) window.location.assign(url)
    } catch (error) {
      if (!controller.signal.aborted) { showToast('error', error instanceof Error ? error.message : 'Unable to start your deposit. Please try again.'); setPaying(false); busy.current = false }
    }
  }
  return createPortal(<dialog ref={dialogRef} onCancel={onClose} aria-labelledby="wallet-deposit-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between border-b p-5"><div><h2 id="wallet-deposit-title" className="text-lg font-bold">{reviewing ? 'Review Deposit' : 'Wallet Deposit'}</h2><p className="mt-1 text-xs text-slate-500">Add funds to your student wallet.</p></div><button type="button" onClick={onClose} aria-label="Close wallet deposit" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    <form onSubmit={(event) => { event.preventDefault(); if (amount === null) { showToast('error', 'Enter an amount greater than zero, with at most two decimal places.'); return } requestId.current = crypto.randomUUID(); setReviewing(true) }}>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-3 rounded-xl bg-navy/5 p-4"><Wallet className="h-6 w-6 text-navy" /><div><p className="text-sm font-semibold text-navy">{STUDENT.name}</p><p className="mt-1 text-xs text-slate-500">{STUDENT.applicationNumber}</p></div></div>
        {reviewing ? <><dl className="space-y-3 rounded-xl border p-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Deposit Amount</dt><dd className="text-xl font-bold tabular-nums text-navy">{formatNaira(amount!)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Currency</dt><dd className="font-semibold">NGN</dd></div></dl><p className="text-xs leading-5 text-slate-600">You’ll continue to the payment provider. Any payment charges will be shown before you pay. Your wallet will be credited after payment is confirmed.</p></> : <><div><label htmlFor="wallet-deposit-amount" className="text-xs font-semibold">Deposit Amount (₦)</label><input id="wallet-deposit-amount" type="text" inputMode="decimal" required autoComplete="off" value={amountInput} onChange={(event) => setAmountInput(event.target.value)} placeholder="Enter amount" aria-describedby="wallet-deposit-help" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm focus:border-navy" /><p id="wallet-deposit-help" className="mt-2 text-xs text-slate-500">Enter the amount you want to add to your wallet.</p></div><div className="flex flex-wrap gap-2">{[5000, 10000, 20000, 50000,100000].map((value) => <button key={value} type="button" onClick={() => setAmountInput(String(value))} className="rounded-lg border border-navy/20 bg-navy/5 px-3 py-2 text-xs font-semibold text-navy hover:bg-navy/10">{formatNaira(value)}</button>)}</div></>}
        {/* {!import.meta.env.VITE_WALLET_DEPOSIT_URL && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Wallet payment is not connected yet. You can review a deposit, but payment is unavailable.</p>} */}
      </div>
      <div className="flex justify-end gap-3 border-t p-4">{reviewing ? <><button key="edit-amount" type="button" disabled={paying} onClick={(event) => { event.preventDefault(); setReviewing(false) }} className="mr-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold disabled:opacity-50"><ArrowLeft className="h-4 w-4" />Edit Amount</button><button type="button" disabled={paying || !import.meta.env.VITE_WALLET_DEPOSIT_URL} aria-busy={paying} className={primary} onClick={() => void pay()}>{paying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{paying ? 'Connecting…' : 'Proceed to Payment'}</button></> : <button key="review-deposit" type="submit" className={primary}>Review Deposit<ArrowRight className="h-4 w-4" /></button>}</div>
    </form>
  </dialog>, document.body)
}
