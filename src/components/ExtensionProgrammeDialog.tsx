import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, X } from 'lucide-react'
import { authenticatedUser } from '../data/auth'
import { loadExtensionProgramme, submitExtensionProgramme, type ExtensionApplication, type ExtensionProgrammeValues } from '../data/extensionProgrammeApi'
import FlashToast from './FlashToast'
import { useFlashToast } from './useFlashToast'

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'inline-flex items-center justify-center rounded-xl border border-navy/20 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5'
const input = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm read-only:bg-slate-50 read-only:text-slate-600'

function initialValues(): ExtensionProgrammeValues {
  const user = authenticatedUser()
  return {
    fullName: user?.nameForForms ?? user?.name ?? '', applicationNumber: user?.numeration ?? '', matric: '',
    email: user?.email ? String(user.email) : '', phone: user?.telephone ? String(user.telephone) : '',
    faculty: user?.programme?.faculty ?? '', department: user?.programme?.department ?? '', degree: user?.programme?.degree ?? '',
    modeOfStudy: user?.programme?.mode_of_study ?? '', session: user?.session ?? '', address: '', sponsor: '', sponsorAddress: '',
    employer: '', employerAddress: '', reason: '', commitment: '', financePlan: '',
  }
}

export default function ExtensionProgrammeDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const mounted = useRef(false)
  const [values, setValues] = useState<ExtensionProgrammeValues>(initialValues)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [sessionsSpent, setSessionsSpent] = useState(0)
  const [maxSessions, setMaxSessions] = useState(0)
  const [application, setApplication] = useState<ExtensionApplication | null>(null)
  const { toast, showToast, dismissToast } = useFlashToast()

  useEffect(() => {
    mounted.current = true
    const dialog = dialogRef.current!
    const overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    return () => { mounted.current = false; dialog.close(); document.body.style.overflow = overflow }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadExtensionProgramme(controller.signal).then((details) => {
      if (controller.signal.aborted) return
      setValues((current) => ({
        ...current,
        ...Object.fromEntries(Object.entries(details.values).filter(([, value]) => value !== '')),
      }))
      setSessionsSpent(details.sessionsSpent); setMaxSessions(details.maxSessions); setApplication(details.existingApplication)
      if (!details.eligible) setError('Your programme is not currently eligible for an extension.')
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load programme extension details.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])

  const change = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }))
  const field = (name: string, label: string, options: { required?: boolean; readOnly?: boolean; type?: string; multiline?: boolean } = {}) => (
    <div className={options.multiline ? 'sm:col-span-2' : ''}>
      <label htmlFor={`extension-${name}`} className="text-xs font-semibold">{label}{options.required && <span className="ml-1 text-red-600">*</span>}</label>
      {options.multiline
        ? <textarea id={`extension-${name}`} required={options.required} readOnly={options.readOnly} rows={3} maxLength={2000} value={values[name] ?? ''} onChange={(event) => change(name, event.target.value)} className={input} />
        : <input id={`extension-${name}`} required={options.required} readOnly={options.readOnly} type={options.type ?? 'text'} value={values[name] ?? ''} onChange={(event) => change(name, event.target.value)} className={input} />}
    </div>
  )

  async function submit() {
    if (saving || application) return
    const required = ['session', 'address', 'email', 'phone', 'reason', 'commitment', 'financePlan']
    if (required.some((name) => !values[name]?.trim())) { showToast('error', 'Complete all required fields.'); return }
    if (!/^\d{4}\/\d{2,4}$/.test(values.session.trim())) { showToast('error', 'Enter a valid academic session, such as 2026/27.'); return }
    const controller = new AbortController()
    setSaving(true)
    try {
      const result = await submitExtensionProgramme(values, controller.signal)
      if (!mounted.current) return
      setApplication(result.application)
      showToast('success', result.message)
    } catch (failure) {
      if (mounted.current) showToast('error', failure instanceof Error ? failure.message : 'Unable to submit the programme extension application.')
    } finally { if (mounted.current) setSaving(false) }
  }

  const status = String(application?.status ?? 'pending')
  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="extension-title" className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60">
      <FlashToast toast={toast} onDismiss={dismissToast} />
      <div className="flex items-center justify-between border-b p-5"><div><h2 id="extension-title" className="text-lg font-bold">Reactivate Lapsed Registration</h2><p className="mt-1 text-xs text-slate-500">Apply for an extension after exceeding the standard programme duration.</p></div><button type="button" onClick={onClose} aria-label="Close programme extension" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
      {loading ? <p role="status" className="flex items-center justify-center gap-2 p-12 text-sm"><LoaderCircle className="h-5 w-5 animate-spin" />Loading extension details…</p> : error ? <div className="space-y-4 p-8 text-center"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" className={primary} onClick={() => { setError(''); setLoading(true); setAttempt((value) => value + 1) }}>Retry</button></div> :
      <form onSubmit={(event) => { event.preventDefault(); void submit() }} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950 sm:grid-cols-2"><p>Sessions spent: <b>{sessionsSpent}</b></p><p>Maximum sessions: <b>{maxSessions}</b></p></div>
          {application && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-950">Application already submitted</p><p className="mt-1 text-xs text-amber-800">Status: <b className="capitalize">{status}</b>{application.date_approved ? ` · Approved ${application.date_approved}` : ''}</p></div>}
          <fieldset disabled={saving || !!application} className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-bold text-navy">Student and programme details</legend>
            {field('fullName', 'Full Name', { readOnly: true })}{field('applicationNumber', 'Application Number', { readOnly: true })}
            {field('faculty', 'Faculty', { readOnly: true })}{field('department', 'Department', { readOnly: true })}
            {field('degree', 'Degree', { readOnly: true })}{field('modeOfStudy', 'Mode of Study', { readOnly: true })}
            {field('session', 'Current Session', { required: true })}{field('matric', 'Matric Number')}
            {field('email', 'Email Address', { required: true, type: 'email' })}{field('phone', 'Telephone Number', { required: true, type: 'tel' })}
            {field('address', 'Current Address', { required: true, multiline: true })}
            {field('sponsor', 'Sponsor')}{field('sponsorAddress', 'Sponsor Address', { multiline: true })}
            {field('employer', 'Employer')}{field('employerAddress', 'Employer Address', { multiline: true })}
            {field('reason', 'Reason for Programme Extension', { required: true, multiline: true })}
            <div><label htmlFor="extension-commitment" className="text-xs font-semibold">Prepared to complete the programme? <span className="text-red-600">*</span></label><select id="extension-commitment" required value={values.commitment} onChange={(event) => change('commitment', event.target.value)} className={input}><option value="">Select an option</option><option>Yes</option><option>No</option></select></div>
            {field('financePlan', 'How do you intend to finance the programme?', { required: true, multiline: true })}
          </fieldset>
        </div>
        <div className="flex justify-end gap-3 border-t p-4"><button type="button" onClick={onClose} className={secondary}>Close</button>{!application && <button type="submit" disabled={saving} className={primary}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Submitting…' : 'Submit Extension Application'}</button>}</div>
      </form>}
    </dialog>, document.body,
  )
}
