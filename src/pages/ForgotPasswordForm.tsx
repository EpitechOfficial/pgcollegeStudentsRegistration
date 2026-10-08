import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, LoaderCircle, Mail } from 'lucide-react'

import FlashToast from '../components/FlashToast'
import { useFlashToast } from '../components/useFlashToast'
import { requestPasswordReset } from '../data/auth'
import { COLLEGE } from '../data/portal'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [applicationNumber, setApplicationNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const busy = useRef(false)
  const controllerRef = useRef<AbortController | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()
  useEffect(() => () => controllerRef.current?.abort(), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    if (!email.trim()) { showToast('error', 'Enter your email address.'); return }
    busy.current = true; setSubmitting(true)
    const controller = new AbortController(); controllerRef.current = controller
    try {
      await requestPasswordReset(email, applicationNumber, controller.signal)
      if (!controller.signal.aborted) { setSent(true); showToast('success', 'Password reset request received.') }
    } catch (error) { if (!controller.signal.aborted) showToast('error', error instanceof Error ? error.message : 'Unable to request a password reset.') }
    finally { busy.current = false; if (!controller.signal.aborted) setSubmitting(false) }
  }
  return <section aria-label="Password recovery" className="mx-4 flex flex-col justify-center rounded-[32px] bg-white p-6 shadow-2xl sm:mx-0 sm:rounded-none sm:bg-transparent sm:p-0 sm:px-8 sm:py-8 sm:shadow-none lg:px-12">
    <FlashToast toast={toast} onDismiss={dismissToast} />
    <div>
      <div className="mb-6 text-center"><div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center"><img src="/brand/pgc-logo.png" alt="University Crest" className="h-full w-full object-contain drop-shadow-sm" /></div><h1 className="text-2xl font-bold tracking-tight text-[#0a2b4f] sm:text-3xl">{sent ? 'Check your email' : 'Forgot Password?'}</h1>{!sent && <p className="mt-2 text-sm leading-6 text-[#495057]">Enter your registered email address to reset your password.</p>}</div>
      {sent ? <div role="status" className="space-y-4 text-center"><CircleCheck className="mx-auto h-10 w-10 text-emerald-600" /><p className="text-sm leading-6 text-slate-600">If an account matches the details you provided, password reset instructions will be sent to your registered email address. Check your inbox and spam folder.</p></div> : <>
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="reset-email" className="text-xs font-semibold">Email Address <span className="text-red-600">*</span></label><input id="reset-email" name="email" type="email" required autoComplete="email" maxLength={254} value={email} disabled={submitting} onChange={(event) => setEmail(event.target.value)} placeholder="Enter Email Address" className="mt-2 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#FFBB00] focus:outline-none disabled:opacity-60" /></div>
          <div><label htmlFor="reset-application" className="text-xs font-semibold">Application Number <span className="font-normal text-slate-500">(optional)</span></label><input id="reset-application" name="applicationNumber" type="text" maxLength={100} value={applicationNumber} disabled={submitting} onChange={(event) => setApplicationNumber(event.target.value)} placeholder="Enter Application Number" className="mt-2 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#FFBB00] focus:outline-none disabled:opacity-60" /></div>
          <button type="submit" disabled={submitting} aria-busy={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-50">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{submitting ? 'Sending…' : 'Send Reset Instructions'}</button>
        </form>
      </>}
      <div className="mt-5 text-center"><Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-navy hover:underline"><ArrowLeft className="h-4 w-4" />Back to Sign In</Link></div>
      <p className="mt-8 text-center text-xs text-[#495057]">Need assistance? <a href={`mailto:${COLLEGE.email}`} className="font-medium text-navy hover:underline">Contact Help Desk</a></p>
    </div>
  </section>
}
