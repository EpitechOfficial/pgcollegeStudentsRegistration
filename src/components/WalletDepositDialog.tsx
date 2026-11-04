import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, LoaderCircle, RefreshCw, Wallet, X } from 'lucide-react'
import { currentStudent, formatNaira } from '../data/portal'
import { loadWalletBalance, startWalletDeposit } from '../data/wallet'
import { isDemoSession } from '../data/auth'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'
export default function WalletDepositDialog({ onClose }: { onClose: () => void }) {
  const student = currentStudent()
  const dialog = useRef<HTMLDialogElement>(null)
  const payment = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [amount, setAmount] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [paying, setPaying] = useState(false)
  const { toast, showToast, dismissToast } = useFlashToast()
  useEffect(() => {
    const element = dialog.current!
    const overflow = document.body.style.overflow
    element.showModal(); document.body.style.overflow = 'hidden'
    return () => { payment.current?.abort(); element.close(); document.body.style.overflow = overflow }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadWalletBalance(controller.signal).then(data => { if (!controller.signal.aborted) setBalance(data.balance) })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load wallet balance.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])
  function refresh() { setLoading(true); setError(''); setAttempt(value => value + 1) }
  const depositAmount = Number(amount)
  function reviewDeposit() {
    if (!Number.isFinite(depositAmount) || depositAmount <= 0 || Math.round(depositAmount * 100) !== depositAmount * 100) {
      showToast('error', 'Enter a valid deposit amount.'); return
    }
    setReviewing(true)
  }
  async function deposit() {
    if (busy.current || isDemoSession()) return
    busy.current = true; setPaying(true)
    const controller = new AbortController(); payment.current = controller
    try {
      const result = await startWalletDeposit(depositAmount, controller.signal)
      if (!controller.signal.aborted) window.location.assign(result.paymentLink)
    } catch (failure) {
      if (!controller.signal.aborted) { showToast('error', failure instanceof Error ? failure.message : 'Unable to start deposit.'); setPaying(false); busy.current = false }
    }
  }
  return createPortal(<dialog ref={dialog} onCancel={onClose} aria-labelledby="wallet-deposit-title" className="fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div className="flex items-center justify-between border-b px-4 py-3.5"><h2 id="wallet-deposit-title" className="text-lg font-bold">Wallet Deposit</h2><button onClick={onClose} aria-label="Close wallet deposit" className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    <div className="space-y-3.5 p-4">
      <div className="flex items-center gap-3 rounded-xl bg-navy/5 p-3"><Wallet className="h-6 w-6 shrink-0 text-navy" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{student.name}</p><p className="text-xs text-slate-500">{student.applicationNumber}</p></div><div className="shrink-0 text-right">{loading ? <span role="status" className="inline-flex items-center gap-1 text-xs text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Loading</span> : error ? <button type="button" onClick={refresh} className="text-xs font-semibold text-red-700">Retry</button> : <><p className="text-[10px] text-slate-500">Wallet balance</p><p className="text-base font-bold text-navy">{formatNaira(balance!)}</p><button type="button" disabled={paying} onClick={refresh} className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-navy disabled:opacity-50"><RefreshCw className="h-3 w-3" />Refresh</button></>}</div></div>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {reviewing ? <div className="space-y-2.5 rounded-xl border border-slate-200 p-3.5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-navy">Review Deposit</h3><strong className="text-base text-navy">{formatNaira(depositAmount)}</strong></div><p className="text-xs leading-5 text-slate-600">You'll continue to the payment provider. Any charges will be shown before you pay, and your wallet will be credited after confirmation.</p></div> : <div><label htmlFor="wallet-deposit-amount" className="text-xs font-semibold">Deposit Amount (₦)</label><input id="wallet-deposit-amount" type="number" min="1" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" /><div className="mt-2 flex flex-wrap gap-2">{[10000, 30000, 50000].map(value => <button key={value} type="button" onClick={() => setAmount(String(value))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">{formatNaira(value)}</button>)}</div></div>}
      {isDemoSession() && <p className="text-xs text-amber-800">Deposits are unavailable in demo mode.</p>}
    </div>
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">{reviewing ? <button type="button" disabled={paying} onClick={() => setReviewing(false)} className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold disabled:opacity-50"><ArrowLeft className="h-4 w-4" />Edit Amount</button> : <span />}<button type="button" disabled={paying || isDemoSession()} onClick={() => reviewing ? void deposit() : reviewDeposit()} className={primary}>{paying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{paying ? 'Connecting…' : reviewing ? 'Proceed to Payment' : 'Review Deposit'}</button></div>
  </dialog>, document.body)
}
